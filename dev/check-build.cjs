const fs=require('fs'),path=require('path'),vm=require('vm'),root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const config=fs.readFileSync(path.join(root,'src/config.js'),'utf8');
const version=config.match(/VERSION:\s*'([^']+)'/);
if(!version||!html.includes(version[0]))throw Error('Generated HTML version differs from source');
let count=0;for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)){new vm.Script(m[1]);count++;}
if(count<1||!html.includes('const EFFECT_DATA='))throw Error('Missing game scripts or embedded effects');
console.log('Valid generated game: '+version[1]+' ('+count+' scripts)');
