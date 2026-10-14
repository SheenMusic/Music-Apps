/* Only read trusted, repository-owned JavaScript configuration; vm is not a security sandbox. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function readConfig(file,name) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error('Invalid configuration binding');
  const absolute = fs.realpathSync(file);
  if (!absolute.startsWith(root+path.sep)) throw new Error('Configuration must be inside this repository');
  const source = fs.readFileSync(absolute,'utf8');
  const context = vm.createContext({console:{log(){},warn(){},error(){}}});
  // These files actually declare const studentData / const courseCatalog.
  // The fixed binding is evaluated in the same script, so lexical declarations work.
  new vm.Script(source+`\n;globalThis.__configResult = typeof ${name} !== 'undefined' ? ${name} : globalThis.${name};`,{filename:absolute})
    .runInContext(context,{timeout:1000});
  if (!context.__configResult || typeof context.__configResult !== 'object') throw new Error(`Missing ${name} configuration`);
  return JSON.parse(JSON.stringify(context.__configResult));
}
export function studentDirectories() {
  return fs.readdirSync(path.join(root,'students'),{withFileTypes:true}).filter(entry=>entry.isDirectory() && entry.name!=='shared')
    .map(entry=>path.join(root,'students',entry.name)).sort();
}
