import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('giz-handoff/tokens/tokens.json', root), 'utf8'));
const output = new URL('mobile/src/generated/', root);
await mkdir(output, { recursive: true });
await writeFile(new URL('tokens.ts', output), '// Generated from giz-handoff/tokens/tokens.json; do not edit.\nexport const tokens = '+JSON.stringify(source,null,2)+' as const;\n');
const assets = {};
for (const folder of ['tuca', 'icones', 'ilustracoes', 'brand']) {
 for (const file of await readdir(new URL(`giz-handoff/assets/${folder}/`, root))) {
  if (file.endsWith('.svg') && !file.startsWith('_')) assets[`${folder}/${file.slice(0,-4)}`] = await readFile(new URL(`giz-handoff/assets/${folder}/${file}`, root), 'utf8');
 }
}
await writeFile(new URL('assets.ts', output), '// Generated from the approved handoff SVG files; do not edit.\nexport const assets: Record<string,string> = '+JSON.stringify(assets,null,2)+';\n');
