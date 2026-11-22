import { mkdir, rm, copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { join } from "node:path";
const root=process.cwd(), out=join(root,"dist"), cache=join(root,".build-assets");
const revision="8efdf5cd91b32584f4077aa0e8ecaf48f7651bef";
const modelFiles=["words.txt","wrong-word.onnx","wrong-word-vocab.txt","wrong-word-confusions.txt"];
async function download(url,path){const r=await fetch(url);if(!r.ok)throw new Error(`Download failed ${r.status}: ${url}`);await mkdir(join(path,".."),{recursive:true});await writeFile(path,new Uint8Array(await r.arrayBuffer()));}
async function copyDir(from,to){await mkdir(to,{recursive:true});for(const e of await readdir(from,{withFileTypes:true})){const a=join(from,e.name),b=join(to,e.name);if(e.isDirectory())await copyDir(a,b);else await copyFile(a,b);}}
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const en=join(cache,"tinyfix"),fa=join(cache,"shekar");await mkdir(en,{recursive:true});await mkdir(fa,{recursive:true});
for(const f of modelFiles){const p=join(en,f);try{await readFile(p)}catch{await download(`https://huggingface.co/paperweight/tinyfix/resolve/${revision}/${f}`,p);}}
const csvPath=join(fa,"vocab.csv");try{await readFile(csvPath)}catch{await download("https://raw.githubusercontent.com/amirivojdan/shekar/v1.8.0/shekar/data/files/vocab.csv",csvPath);}
const csv=await readFile(csvPath,"utf8");const rows=csv.split(/\r?\n/).filter(Boolean).map(line=>{const [word,count]=line.split(",");return [word,Number(count||1)];}).filter(([w,c])=>w&&Number.isFinite(c));
if(rows.length<1000)throw new Error("Shekar vocabulary download incomplete.");
await mkdir(join(out,"models/tinyfix"),{recursive:true});await mkdir(join(out,"models/shekar"),{recursive:true});
for(const f of modelFiles)await copyFile(join(en,f),join(out,"models/tinyfix",f));
await writeFile(join(out,"models/shekar/fa-vocab.json"),JSON.stringify(rows));
await copyFile("manifest.json",join(out,"manifest.json"));for(const d of ["popup","options"])await copyDir(d,join(out,d));await copyDir("src",join(out,"src"));
await mkdir(join(out,"wasm"),{recursive:true});for(const f of await readdir(join(root,"node_modules/onnxruntime-web/dist")))if(f.endsWith(".wasm"))await copyFile(join(root,"node_modules/onnxruntime-web/dist",f),join(out,"wasm",f));
await build({entryPoints:["src/background.js"],outfile:join(out,"src/background.js"),bundle:true,format:"esm",platform:"browser",target:"chrome120"});
await build({entryPoints:["src/content.js"],outfile:join(out,"src/content.js"),bundle:true,format:"iife",platform:"browser",target:"chrome120"});
console.log("Built TalentGrammar extension in dist/");
