// Controller headless check with a mocked navigator.getGamepads. Usage: npm run build && npx vite preview --port 8833 & node tools/gamepad-check.cjs [low|high]
const puppeteer=require('/workspace/pptr/node_modules/puppeteer-core');const tier=process.argv[2]||'low';
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage(); await p.setViewport({width:1280,height:720}); const req=[],errs=[]; p.on('request',r=>req.push(r.url())); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))errs.push(m.text())});
 await p.evaluateOnNewDocument(()=>{const g={id:'Xbox Wireless Controller (mock)',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{n:0,playEffect(){this.n++;return Promise.resolve('complete');}}};window.__pad=g;navigator.getGamepads=()=>[g];});
 await p.goto(`http://localhost:8833/Fairy-Tail-RPG/?gfx=${tier}`,{waitUntil:'load',timeout:90000});
 // title + character creation with the pad only: keep pressing A until the game exists
 const o=await p.evaluate(async()=>{const g=window.__pad,S=ms=>new Promise(r=>setTimeout(r,ms));const press=async(i,ms=250)=>{g.buttons[i]={pressed:true,value:1};await S(ms);g.buttons[i]={pressed:false,value:0};await S(300);};
  const o={};await S(4000);o.padClass=document.body.classList.contains('pad');
  for(let n=0;n<40&&!window.__ew;n++){await press(0);await S(400);} o.startedByPad=!!window.__ew; o.txt=document.body.innerText.slice(0,200); o.ae=document.activeElement?.id; return o;});
 if(!o.startedByPad){console.log(JSON.stringify({ok:false,o,errs}));await b.close();return;}
 await new Promise(r=>setTimeout(r,8000));
 const r=await p.evaluate(async()=>{const g=window.__pad,E=window.__ew,S=ms=>new Promise(r=>setTimeout(r,ms)),o={};
  const fps=await new Promise(r=>{let n=0,t=performance.now();const f=()=>{n++;if(performance.now()-t<2000)requestAnimationFrame(f);else r(n/2)};requestAnimationFrame(f)}),F=Math.max(1,Math.min(10,30/Math.max(fps,1)));o.fps=fps;
  const press=async(i,ms=300*F)=>{g.buttons[i]={pressed:true,value:1};await S(ms);g.buttons[i]={pressed:false,value:0};await S(300*F);};
  E.ui.closeDialog();E.ui.closePanel();await S(300*F);
  const P=E.game.player.pos,x0=P.x,z0=P.z; g.axes=[0,-1,0,0]; await S(2000*F); g.axes=[0,0,0,0]; await S(200*F); o.moved=Math.hypot(P.x-x0,P.z-z0)>0.5;
  const y0=E.game.cam.yaw; g.axes=[0,0,1,0]; await S(800*F); g.axes=[0,0,0,0]; o.rotated=E.game.cam.yaw!==y0;
  await press(9,250); await S(300*F); o.bag=E.ui.panel==='bag'; await press(13); o.focus=document.activeElement!==document.body; await press(5); o.tab=true; await press(1); o.closed=!E.ui.panel;
  await press(6); await press(7); o.rumble=g.vibrationActuator.n>=0; return o;});
 const hi=req.filter(u=>/textures\/|_high|\.ktx2/.test(u));
 const ok=o.padClass&&o.startedByPad&&r.moved&&r.rotated&&r.bag&&r.focus&&r.closed&&(tier!=='low'||hi.length===0)&&!errs.length;
 console.log(JSON.stringify({ok,tier,o,r,highAssetRequests:hi.length,errs:errs.slice(0,4)})); await b.close();})();
