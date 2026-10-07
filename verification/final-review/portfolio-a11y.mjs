// Final review copy of verification/hw1-m1/audit.mjs; adaptations documented in prepare.py.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
async function serve(root, port=5500) {
 const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.wav':'audio/wav','.json':'application/json'};
 const server=http.createServer((req,res)=>{
  let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!p.startsWith(path.resolve(root)+path.sep)&&p!==path.resolve(root)){res.writeHead(403).end();return;}
  try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);}catch{res.writeHead(404).end('Not found');}
 });
 await new Promise(r=>server.listen(port,'127.0.0.1',r));return server;
}

const require=createRequire(import.meta.url);
function resolveModule(name) {
  for(const base of [process.env.QA_NODE_MODULES,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)) {
    try { return require.resolve(path.join(base,name)); } catch {}
  }
  return require.resolve(name);
}
const {chromium}=require(resolveModule('playwright'));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const phase=process.argv[2]||'after';
if(!['before','after'].includes(phase)) throw new Error('Expected before or after');
fs.mkdirSync(root+'/verification/final-review',{recursive:true});
const server=await serve(root,5500);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const axePath=resolveModule('axe-core');
const axeSource=fs.readFileSync(axePath,'utf8');
const audits=[]; const errors=[];
for(const width of [375,1440]) for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({theme,width,message:e.message}));
  await page.goto('http://127.0.0.1:5500/');
  await page.waitForTimeout(1000);
  await page.evaluate(axeSource);
  for(const state of ['loading','ready','empty','error']) {
    await page.locator(`[data-state="${state}"]`).click();
    const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}));
    const metrics=await page.evaluate(()=>{
      const style=getComputedStyle(document.documentElement);
      const tokens=Object.fromEntries(['bg','surface','surface-soft','ink','muted','accent','focus','button','button-text','line','control-line'].map(k=>[k,style.getPropertyValue('--'+k).trim()]));
      const controls=[...document.querySelectorAll('input,textarea,.theme-toggle,.demo-controls button,.retry-button')].map(e=>{
        let parent=e.parentElement;
        while(parent && getComputedStyle(parent).backgroundColor==='rgba(0, 0, 0, 0)') parent=parent.parentElement;
        return {selector:e.id?'#'+e.id:e.className||e.textContent.trim(),border:getComputedStyle(e).borderTopColor,background:getComputedStyle(e).backgroundColor,outside:parent?getComputedStyle(parent).backgroundColor:'rgb(255, 255, 255)'};
      });
      return {activeState:document.querySelector('.demo-controls [aria-pressed="true"]').dataset.state,h1:document.querySelectorAll('h1').length,divs:document.querySelectorAll('div').length,overflow:document.documentElement.scrollWidth>innerWidth,tokens,controls};
    });
    if(metrics.activeState!==state) throw new Error('State changed during audit: '+state);
    audits.push({theme,width,state,...metrics,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:result.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))});
  }
  if(phase==='after' && process.env.SCREENSHOTS_DIR) {
    fs.mkdirSync(process.env.SCREENSHOTS_DIR,{recursive:true});
    await page.screenshot({path:path.join(process.env.SCREENSHOTS_DIR,`${theme}-${width}.png`),fullPage:true});
  }
  await context.close();
}
function rgb(color) {return color.startsWith('#')?color.slice(1).match(/../g).map(v=>parseInt(v,16)):color.match(/[\d.]+/g).slice(0,3).map(Number);}
function luminance(color) {return rgb(color).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
function ratio(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const contrasts=[];
for(const theme of ['light','dark']) {
  const t=audits.find(a=>a.theme===theme).tokens;
  for(const foreground of ['ink','muted','accent']) for(const background of ['bg','surface','surface-soft']) contrasts.push({theme,foreground,background,ratio:ratio(t[foreground],t[background]),minimum:4.5});
  contrasts.push({theme,foreground:'button-text',background:'button',ratio:ratio(t['button-text'],t.button),minimum:4.5});
  for(const background of ['bg','surface','surface-soft']) contrasts.push({theme,foreground:'focus',background,ratio:ratio(t.focus,t[background]),minimum:3});
}
for(const audit of audits) for(const control of audit.controls) contrasts.push({theme:audit.theme,width:audit.width,state:audit.state,control:control.selector,border:control.border,background:control.background,outside:control.outside,borderVsInside:ratio(control.border,control.background),borderVsOutside:ratio(control.border,control.outside),fillVsOutside:ratio(control.background,control.outside),ratio:Math.max(ratio(control.border,control.outside),ratio(control.background,control.outside)),minimum:3});
const report={date:new Date().toISOString(),phase,url:'http://127.0.0.1:5500/',tester:'Assistant automated checks; no student checks recorded',browser:browser.version(),axeVersion:require(resolveModule('axe-core/package.json')).version,audits,contrasts,errors};
fs.writeFileSync(`${root}/verification/final-review/portfolio-a11y.json`,JSON.stringify(report,null,2)+'\n');
const passed=audits.every(a=>a.violations.length===0&&a.h1===1&&a.divs===0&&!a.overflow)&&contrasts.every(c=>c.ratio>=c.minimum)&&errors.length===0;
if(phase==='after'&&!passed) process.exitCode=1;
console.log(JSON.stringify({phase,passed,configurations:audits.length,violations:[...new Set(audits.flatMap(a=>a.violations.map(v=>v.id)))],failedContrast:contrasts.filter(c=>c.ratio<c.minimum),incomplete:[...new Set(audits.flatMap(a=>a.incomplete.map(v=>v.id)))],errors,structureOK:audits.every(a=>a.h1===1&&a.divs===0&&!a.overflow)},null,2));
await browser.close();server.close();
