'use strict';
const fs=require('node:fs'),path=require('node:path');
const rootFiles=['.nojekyll','.gitignore','index.html','style.css','scene.js','game.js','teacher.html','teacher.js','server.cjs','README.md','AGENTS.md','deployment.json','다른컴퓨터-이어하기.md'];
const directories=['vendor','docs','tests','handoff','scripts'];
function projectFiles(root){
  const files=[];
  function file(relative){const p=path.resolve(root,relative);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Invalid project path');const s=fs.lstatSync(p);if(!s.isFile())throw Error('Expected regular project file: '+relative);files.push(relative.replaceAll(path.sep,'/'));}
  function walk(relative){for(const e of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){if(e.name.startsWith('.')||e.name==='node_modules'||/\.(zip|key|pem)$/i.test(e.name))continue;const p=path.join(relative,e.name);if(e.isSymbolicLink())throw Error('Symlink is not included in deployment: '+p);if(e.isDirectory())walk(p);else if(e.isFile())file(p);}}
  rootFiles.forEach(file);directories.forEach(walk);return files.sort();
}
module.exports={projectFiles};
