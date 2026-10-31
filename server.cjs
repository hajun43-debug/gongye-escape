// Zero-dependency local preview; bound to this computer only.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT)||4173;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html')}catch(_){res.writeHead(404);return res.end('Not found')}
fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found')}else{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data)}})}).listen(port,'127.0.0.1',()=>console.log(`사라진 장인의 보물: http://127.0.0.1:${port}`));
