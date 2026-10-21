import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
await mkdir(output,{recursive:true});
for(const name of ['index.html','style.css','app.js','trello-core.js','trello.js','review-core.js','timing-core.js','review.js','batch.js','tempo.js','.nojekyll']) await copyFile(path.join(root,name),path.join(output,name));
await cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
console.log('Central COPEL pronta na pasta dist.');
