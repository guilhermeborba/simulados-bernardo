import test from 'node:test';
import assert from 'node:assert/strict';
import { privateRankingName } from '../privacy';
test('ranking protects surnames and rejects an e-mail supplied as a display name',()=>{
 assert.equal(privateRankingName('Pessoa Nome Sobrenome'),'Pessoa S.');
 assert.equal(privateRankingName('Lia'),'Lia');
 assert.equal(privateRankingName('private@example.test'),'Estudante');
 assert.equal(privateRankingName('  '),'Estudante');
});
