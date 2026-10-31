#!/usr/bin/env node
'use strict';
// Cross-computer deployment: no machine-specific paths or saved credentials are packaged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {projectFiles}=require('./project-files.cjs');
const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'deployment.json'),'utf8'));
function command(exe,args,options={}){return cp.spawnSync(exe,args,{cwd:options.cwd||root,encoding:'utf8',windowsHide:true,env:process.env,maxBuffer:8*1024*1024});}
function run(exe,args,options={}){const r=command(exe,args,options);if(r.error)throw r.error;if(r.status!==0)throw Error(`${path.basename(exe)} ${args[0]} failed: ${(r.stderr||r.stdout).trim()}`);return r.stdout.trim();}
function json(gh,args){return JSON.parse(run(gh,args));}
const sha=b=>crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
  const paths=projectFiles(root),files=paths.map(p=>{const data=fs.readFileSync(path.join(root,p));return{path:p,data,sha:sha(data)}});
  for(const p of paths.filter(p=>/\.(js|cjs)$/.test(p)&&!p.startsWith('vendor/')))run(process.execPath,['--check',path.join(root,p)]);
  if(process.argv.includes('--dry-run')){console.log(JSON.stringify({mode:'dry-run',repository:config.repository,site:config.site,files:files.map(f=>({path:f.path,bytes:f.data.length,sha:f.sha})),credentialsIncluded:false},null,2));return;}
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository)||config.branch!=='main')throw Error('Review deployment.json before deployment.');
  let gh=process.platform==='win32'?'gh.exe':'gh';
  if(command(gh,['--version']).error&&process.platform==='win32'&&process.env.LOCALAPPDATA){const candidate=path.join(process.env.LOCALAPPDATA,'Programs','GitHub CLI','bin','gh.exe');if(fs.existsSync(candidate))gh=candidate;}
  run(gh,['--version']);run('git',['--version']);
  if(path.isAbsolute(gh))process.env.PATH=path.dirname(gh)+path.delimiter+(process.env.PATH||'');
  const auth=command(gh,['auth','status','--hostname','github.com']);if(auth.status!==0)throw Error('Run gh auth login --hostname github.com --git-protocol https --web on this computer, then retry.');
  const account=json(gh,['api','user']),repo=json(gh,['api',`repos/${config.repository}`]);
  if(!repo.permissions?.push)throw Error('The signed-in account cannot push this repository.');
  const stage=path.join(root,'.portable','deploy',crypto.randomUUID());fs.mkdirSync(path.dirname(stage),{recursive:true});
  run('git',['clone','--single-branch','--branch',config.branch,`https://github.com/${config.repository}.git`,stage]);
  run('git',['config','user.name',account.login],{cwd:stage});run('git',['config','user.email',`${account.id}+${account.login}@users.noreply.github.com`],{cwd:stage});
  run('git',['config','core.autocrlf','false'],{cwd:stage});run('git',['config','credential.helper',''],{cwd:stage});run('git',['config','credential.https://github.com.helper','!gh auth git-credential'],{cwd:stage});
  for(const f of files){const target=path.resolve(stage,f.path);if(!target.startsWith(stage+path.sep))throw Error('Invalid target path');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,f.data);}
  run('git',['add','--',...paths],{cwd:stage});
  const changed=run('git',['status','--porcelain'],{cwd:stage});
  if(changed){run('git',['commit','-m',process.env.DEPLOY_MESSAGE||'Update game and portable project handoff'],{cwd:stage});run('git',['push','origin',config.branch],{cwd:stage});console.log('Project changes pushed.');}else console.log('The reviewed project is already up to date.');
  const commit=run('git',['rev-parse','HEAD'],{cwd:stage});
  const remote=json(gh,['api',`repos/${config.repository}/git/trees/${commit}?recursive=1`]);
  for(const f of files)if(!remote.tree.some(e=>e.path===f.path&&e.sha===f.sha&&e.type==='blob'))throw Error('Remote mismatch: '+f.path);
  const endpoint=`repos/${config.repository}/pages`,pagesResult=command(gh,['api',endpoint]);let pages;
  const payload=path.join(stage,'.pages-source.json');fs.writeFileSync(payload,JSON.stringify({build_type:'legacy',source:{branch:config.branch,path:'/'}}));
  if(pagesResult.status===0){pages=JSON.parse(pagesResult.stdout);if(pages.build_type!=='legacy'||pages.source?.branch!==config.branch||pages.source?.path!=='/')throw Error('Pages source differs from main /. Review its settings before changing it.');}
  else if((pagesResult.stderr+pagesResult.stdout).includes('404'))pages=json(gh,['api','--method','POST',endpoint,'--input',payload]);
  else throw Error(pagesResult.stderr||pagesResult.stdout);
  const latestResult=command(gh,['api',endpoint+'/builds/latest']);let latest=latestResult.status===0?JSON.parse(latestResult.stdout):null;
  if(latest?.commit!==commit){const start=command(gh,['api','--method','POST',endpoint+'/builds']);if(start.status!==0&&!start.stderr.includes('409'))throw Error(start.stderr);}
  let previous='',built=false;
  for(let attempt=0;attempt<30;attempt++){
    pages=json(gh,['api',endpoint]);const l=command(gh,['api',endpoint+'/builds/latest']);latest=l.status===0?JSON.parse(l.stdout):null;
    const status=latest?.commit===commit?latest.status:pages.status;
    if(status!==previous){console.log('Pages: '+status);previous=status;}
    if(status==='errored')throw Error('Pages build failed: '+(latest?.error?.message||'Inspect GitHub Actions.'));
    if(status==='built'&&latest?.commit===commit){try{const response=await fetch(config.site);if(response.ok&&(await response.text()).includes('사라진 장인의 보물')){built=true;break;}}catch{}}
    await pause(10000);
  }
  if(!built)throw Error('Deployment is not confirmed yet. Inspect Pages and Actions before retrying.');
  const resources=[];
  for(const p of ['index.html','style.css','scene.js','game.js','vendor/three.min.js']){const response=await fetch(new URL(p,config.site));if(!response.ok)throw Error('HTTP '+response.status+': '+p);const data=Buffer.from(await response.arrayBuffer());if(!data.equals(files.find(f=>f.path===p).data))throw Error('Published resource differs: '+p);resources.push(p);}
  const result={repository:`https://github.com/${config.repository}`,site:config.site,commit,verifiedFiles:files.length,verifiedResources:resources,verifiedAt:new Date().toISOString()};
  fs.mkdirSync(path.join(root,'.portable'),{recursive:true});fs.writeFileSync(path.join(root,'.portable','deploy-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
