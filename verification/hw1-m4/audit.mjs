import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url);
function resolveModule(name) {
  for(const base of [process.env.QA_NODE_MODULES,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)) {
    try { return require.resolve(path.join(base,name)); } catch {}
  }
  return require.resolve(name);
}
const lighthousePath=resolveModule('lighthouse');
const {default:lighthouse}=await import(pathToFileURL(lighthousePath));
const {default:desktopConfig}=await import(pathToFileURL(path.join(path.dirname(lighthousePath),'config/desktop-config.js')));
const chromeLauncher=await import(pathToFileURL(resolveModule('chrome-launcher')));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const phase=process.argv[2]||'after';
if(!['before','after'].includes(phase)) throw new Error('Expected before or after');
const output=path.join(root,'verification/hw1-m4');fs.mkdirSync(output,{recursive:true});
const headerRules=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8')).headers;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {
    if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    for(const rule of headerRules) {
      if(new RegExp('^'+rule.source+'$').test(new URL(req.url,'http://localhost').pathname)) for(const h of rule.headers) res.setHeader(h.key,h.value);
    }
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(5510,'127.0.0.1',r));
const chrome=await chromeLauncher.launch({chromePath:process.env.CHROMIUM_PATH||undefined,chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const results=[];
try {
  for(const profile of ['mobile','desktop']) {
    console.error(`Running ${phase} Lighthouse ${profile} with enforced response headers`);
    const flags={port:chrome.port,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']};
    const result=await lighthouse('http://127.0.0.1:5510/',flags,profile==='desktop'?desktopConfig:undefined);
    if(result.lhr.runtimeError) throw new Error(JSON.stringify(result.lhr.runtimeError));
    fs.writeFileSync(path.join(output,`${phase}-${profile}.json`),JSON.stringify(result.lhr,null,2)+'\n');
    const entry={profile,fetchTime:result.lhr.fetchTime,requestedUrl:result.lhr.requestedUrl,finalDisplayedUrl:result.lhr.finalDisplayedUrl,lighthouseVersion:result.lhr.lighthouseVersion,environment:result.lhr.environment,configSettings:result.lhr.configSettings,score:Object.fromEntries(Object.entries(result.lhr.categories).map(([id,c])=>[id,Math.round(c.score*100)])),rawScores:Object.fromEntries(Object.entries(result.lhr.categories).map(([id,c])=>[id,c.score])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(id=>[id,result.lhr.audits[id].numericValue])),findings:Object.values(result.lhr.audits).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,score:a.score,scoreDisplayMode:a.scoreDisplayMode,displayValue:a.displayValue,details:a.details})),warnings:result.lhr.runWarnings};
    results.push(entry);console.log(JSON.stringify({phase,profile,scores:entry.score,metrics:entry.metrics}));
  }
  const summary={date:new Date().toISOString(),phase,baselineCommit:'e24f36a',tester:'Assistant local Lighthouse lab runs; no student Lighthouse run recorded',headers:headerRules,results,allCategories100:results.every(r=>Object.values(r.rawScores).every(score=>score===1))};
  fs.writeFileSync(path.join(output,`${phase}-summary.json`),JSON.stringify(summary,null,2)+'\n');
  if(phase==='after'&&!summary.allCategories100) process.exitCode=1;
} finally {await chrome.kill();server.close();}
