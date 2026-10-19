import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gizTokens } from '../lib/gizTokens.generated';
function luminance(hex: string) {
  const values = hex.slice(1).match(/../g)!.map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
function contrast(a: string, b: string) { const values = [luminance(a),luminance(b)].sort((a,b) => b-a); return (values[0]+.05)/(values[1]+.05); }
test('reading text meets 4.5:1 in every shipped light and dark surface', () => {
  const pairs = [['ink','bg'],['ink','surface'],['muted','bg'],['muted','surface'],['on-primary','primary'],['on-primary','hl'],['info','bg'],['info','surface'],['ok-ink','ok-bg'],['ink','err-bg'],['ink','hl-bg'],['head-ink','head'],['head-muted','head']] as const;
  for (const mode of ['light','dark'] as const) for (const [foreground,background] of pairs) {
    assert.ok(contrast(gizTokens.color[mode][foreground].value,gizTokens.color[mode][background].value)>=4.5,`${mode}: ${foreground} over ${background}`);
  }
});
