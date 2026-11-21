// PERUDOF 3D - servidor multiplayer (Node.js). Uso: npm i ws && node server.js  -> abra http://localhost:3000
// Mantenha perudof3d.html na mesma pasta. Para internet: hospede (Render, Railway, Fly.io...) e use https/wss.
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000,rooms={};let nid=1;
const srv=http.createServer((q,r)=>fs.readFile(path.join(__dirname,'perudof3d.html'),(e,d)=>{
  if(e){r.writeHead(404);return r.end('perudof3d.html nao encontrado')}
  r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(d)}));
const wss=new WebSocketServer({server:srv,path:'/ws'});
const L='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode=()=>{let c;do{c=Array.from({length:5},()=>L[Math.random()*L.length|0]).join('')}while(rooms[c]);return c};
const send=(w,o)=>{if(w.readyState===1)w.send(JSON.stringify(o))};
const num=(v,a,b)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):0;
const clean=l=>{const o={};if(l&&typeof l==='object')for(const k of Object.keys(l).slice(0,40))if(Number.isFinite(l[k]))o[k]=Math.max(0,Math.min(16777215,l[k]))|0;return o};
const bc=(r,o,ex)=>r.p.forEach(c=>{if(c!==ex)send(c.ws,o)});
const roster=r=>{const o={t:'players',list:[...r.p.values()].map(({id,name,look})=>({id,name,look}))};r.p.forEach(c=>send(c.ws,o))};
wss.on('connection',ws=>{
  const me={ws,id:nid++,name:'Pirata',look:clean(),room:null};
  const leave=()=>{const r=me.room;if(!r)return;r.p.delete(me.id);me.room=null;
    if(!r.p.size)delete rooms[r.code];else roster(r)};
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
    if(m.t==='create'||m.t==='join'){
      leave();let r;
      if(m.t==='create'){const code=newCode();r=rooms[code]={code,max:Math.min(6,Math.max(2,(m.n|0)||4)),p:new Map()}}
      else{r=rooms[String(m.code||'').toUpperCase()];
        if(!r)return send(ws,{t:'err',m:'Sala nao encontrada.'});
        if(r.p.size>=r.max)return send(ws,{t:'err',m:'Sala cheia.'})}
      me.name=String(m.name||'Pirata').slice(0,14);me.look=clean(m.look);me.room=r;r.p.set(me.id,me);
      send(ws,{t:'room',code:r.code,id:me.id,max:r.max});roster(r);return}
    const r=me.room;if(!r)return;
    if(m.t==='pos')bc(r,{t:'pos',id:me.id,x:num(m.x,-9,9),y:num(m.y,0,6),z:num(m.z,-12,12),yaw:num(m.yaw,-7,7),st:String(m.st).slice(0,8),flip:num(m.flip,0,7)},me);
    else if(m.t==='chat')r.p.forEach(c=>send(c.ws,{t:'chat',id:me.id,name:me.name,m:String(m.m||'').slice(0,80)}));
    else if(m.t==='look'){me.name=String(m.name||'Pirata').slice(0,14);me.look=clean(m.look);roster(r)}});
  ws.on('close',leave);ws.on('error',leave)});
srv.listen(PORT,()=>console.log('PERUDOF 3D em http://localhost:'+PORT));
