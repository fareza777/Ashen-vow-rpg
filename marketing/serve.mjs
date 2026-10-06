import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2','.zip':'application/zip','.md':'text/plain; charset=utf-8','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=path.resolve(root,'.'+(name==='/'?'/index.html':name));
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const info=await stat(target);
    if(!info.isFile()){res.writeHead(404);res.end();return;}
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Accept-Ranges':'bytes'};
    if(range){const start=Number(range[1]);const end=Math.min(Number(range[2]||info.size-1),info.size-1);if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${info.size}`});createReadStream(target,{start,end}).pipe(res);}
    else{res.writeHead(200,{...headers,'Content-Length':info.size});createReadStream(target).pipe(res);}
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(4192,'127.0.0.1',()=>console.log('Asset gallery: http://127.0.0.1:4192/'));
