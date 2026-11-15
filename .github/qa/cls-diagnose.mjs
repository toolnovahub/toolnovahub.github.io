import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const url='http://127.0.0.1:8765/tools/password-generator/';
const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
mkdirSync('qa-diagnostics',{recursive:true});
const tests=[
 {name:'normal1',rate:4,latency:150},{name:'normal2',rate:4,latency:150},
 {name:'delay-tool-script',rate:4,latency:150,delay:800,target:'script.js'},
 {name:'delay-heading-css',rate:4,latency:150,delay:900,target:'heading-polish.css'},
 {name:'delay-mobile-css',rate:4,latency:150,delay:900,target:'mobile-ux.css'},
 {name:'instant1',rate:1,latency:0}
];
const reports=[];
for(const test of tests){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:test.latency,downloadThroughput:1_000_000,uploadThroughput:1_000_000});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:test.rate});
 if(test.target){
  await page.route('**/'+test.target+'*',async route=>{await new Promise(r=>setTimeout(r,test.delay));await route.continue()});
 }
 await page.addInitScript(()=>{
  window.__qa={shifts:[],events:[],snapshots:[]};
  const q=window.__qa;
  function rectOf(s){const el=document.querySelector(s);if(!el)return null;let r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),width:Math.round(r.width)}}
  function snapshot(note){q.snapshots.push({t:Math.round(performance.now()),note,ready:document.readyState,workspace:rectOf('#workspace'),tool:rectOf('#tool-content'),explainer:rectOf('.tool-explainer'),finder:rectOf('.tn-tool-finder'),heading:rectOf('.tool-page-heading'),loadedStyles:[...document.styleSheets].map(x=>x.href?.split('/').pop()).filter(Boolean),children:document.querySelector('#tool-content')?.childElementCount})}
  try{new PerformanceObserver(list=>{for(const x of list.getEntries())q.shifts.push({t:Math.round(x.startTime),value:x.value,hadRecentInput:x.hadRecentInput,sources:(x.sources||[]).map(s=>({selector:s.node?.id?'#'+s.node.id:s.node?.className?.toString()?.slice(0,110),prev:s.previousRect,curr:s.currentRect}))})}).observe({type:'layout-shift',buffered:true})}catch(e){q.events.push({error:String(e)})}
  document.addEventListener('readystatechange',()=>snapshot('readystatechange:'+document.readyState));
  document.addEventListener('DOMContentLoaded',()=>{snapshot('DOMContentLoaded');let el=document.querySelector('#tool-content');if(el)new MutationObserver(()=>snapshot('tool-content DOM mutation')).observe(el,{subtree:true,childList:true});});
  window.addEventListener('load',()=>snapshot('window load'));
  let ticks=0;
  function frame(){ticks++;if(ticks<=95){snapshot('frame '+ticks);requestAnimationFrame(frame)}}
  requestAnimationFrame(frame);
 });
 const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto(url,{waitUntil:'load',timeout:30000});
 await page.waitForTimeout(1800);
 const data=await page.evaluate(()=>{
  const q=window.__qa, rs=performance.getEntriesByType('resource').filter(r=>/(\.css|\bscript\.js)/.test(r.name)).map(r=>({url:r.name.split('/').pop(),start:Math.round(r.startTime),end:Math.round(r.responseEnd),dur:Math.round(r.duration)}));
  const shifts=q.shifts.filter(x=>!x.hadRecentInput);
  return {score:shifts.reduce((a,x)=>a+x.value,0),shifts,events:q.events,snapshots:q.snapshots.filter((s,i,a)=>i===0||i===a.length-1||s.note!=='frame '+(i+1)),resources:rs,final:q.snapshots.at(-1)}
 });
 const full={test,errors:errs,...data};
 reports.push(full);
 console.log('CLS DIAG '+test.name+' score='+data.score.toFixed(5)+' shifts='+data.shifts.length+' loadedCss='+data.final.loadedStyles.join(',')+' resources='+JSON.stringify(data.resources));
 for(const x of data.shifts)console.log('CLS SHIFT '+test.name+' '+JSON.stringify(x));
 const snap=data.snapshots.filter(x=>x.note.includes('mutation')||x.note.includes('readystatechange')||x.note==='window load');
 console.log('CLS EVENTS '+test.name+' '+JSON.stringify(snap).slice(0,7000));
 await context.close();
}
writeFileSync('qa-diagnostics/cls-detail.json',JSON.stringify(reports,null,2));
await browser.close();
