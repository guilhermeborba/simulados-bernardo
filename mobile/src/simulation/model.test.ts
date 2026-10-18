import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiQuestion } from '../../../packages/api-contracts/src';
import { answerIsComplete, authorizedAnswerLines, authorizedCorrectAnswer, equivalentAnswerBodies, isBlankAnswer, makeAnswer, responseFeedback, restoreAnswers, type RunnerSnapshot } from './model';
import { mapApiQuestion } from './questions';

const question:ApiQuestion={id:'q',type:'TRUE_FALSE_MULTIPLE',statement:'Questão',tip:null,funFact:null,points:'1',order:1,options:[{id:'1',optionKey:'one',text:'Item um',groupKey:null,order:1},{id:'2',optionKey:'two',text:'Item dois',groupKey:null,order:2}]};

test('a partly answered compound question cannot be confirmed',()=>{
 const mapped=mapApiQuestion(question);
 assert.equal(answerIsComplete(mapped,{one:'V'}),false);
 assert.equal(answerIsComplete(mapped,{one:'V',two:'invalid'}),false);
 assert.equal(answerIsComplete(mapped,{one:'V',two:'F'}),true);
});

test('timeout discards a partial selection and uses the server blank format',()=>{
 const blank=makeAnswer(mapApiQuestion(question),{one:'V'},true);
 assert.equal(blank.value,-1);
 assert.deepEqual(blank.body,{});
 assert.equal(blank.synced,false);
 assert.equal(isBlankAnswer(blank.value),true);
});

test('persisted answers without correction never become immediate right or wrong feedback',()=>{
 assert.equal(responseFeedback({isCorrect:null,pointsEarned:null}),undefined);
 assert.equal(responseFeedback({isCorrect:false}),undefined);
 assert.equal(responseFeedback({feedback:{isCorrect:'true'}}),undefined);
 assert.deepEqual(responseFeedback({feedback:{isCorrect:true,funFact:'Curiosidade'}}),{isCorrect:true,correctAnswer:undefined,tip:undefined,funFact:'Curiosidade',explanation:undefined});
});

test('a confirmed server blank replaces an unsynchronized partial local answer',()=>{
 const local={answers:{q:{value:{one:'V'},body:{one:'V'},synced:false}}} as unknown as RunnerSnapshot;
 const restored=restoreAnswers([{...question,answer:{}}],local);
 assert.deepEqual(restored.q,{value:-1,body:{},synced:true,feedback:undefined});
});


test('resume prioritizes the authorized server feedback and drops stale feedback for a different body',()=>{
 const feedback={isCorrect:false,correctAnswer:{one:'F',two:'V'},tip:'Observe cada item.'};
 const local={answers:{q:{value:{one:'V',two:'V'},body:{one:'V',two:'V'},synced:true,feedback:{isCorrect:true,correctAnswer:{one:'V',two:'V'}}}}} as unknown as RunnerSnapshot;
 const restored=restoreAnswers([{...question,answer:{one:'V',two:'F'},confirmedAt:'2026-10-17T12:00:00Z',feedback}],local);
 assert.equal(restored.q.synced,true);
 assert.deepEqual(restored.q.feedback?.correctAnswer,{one:'F',two:'V'});
 assert.equal(restored.q.feedback?.isCorrect,false);
 const legacy=restoreAnswers([{...question,answer:{one:'F',two:'F'}}],local);
 assert.equal(legacy.q.feedback,undefined);
});

test('a matching server answer can preserve cached legacy feedback regardless of map key order',()=>{
 const local={answers:{q:{value:{one:'V',two:'F'},body:{one:'V',two:'F'},synced:true,feedback:{isCorrect:true}}}} as unknown as RunnerSnapshot;
 assert.equal(equivalentAnswerBodies({one:'V',two:'F'},{two:'F',one:'V'}),true);
 assert.equal(restoreAnswers([{...question,answer:{two:'F',one:'V'}}],local).q.feedback?.isCorrect,true);
});

test('only scalar answer maps from the API become readable correction lines',()=>{
 assert.equal(authorizedCorrectAnswer([]),undefined);
 assert.equal(authorizedCorrectAnswer({answer:{nested:'A'}}),undefined);
 const mapped=mapApiQuestion(question);
 assert.deepEqual(authorizedAnswerLines(mapped,{one:'F',two:'V'}),['Item um: Falso','Item dois: Verdadeiro']);
 assert.deepEqual(authorizedAnswerLines(null,{answer:'B'}),['Alternativa B']);
});


test('explicitly null API feedback never revives an older correction from local storage',()=>{
 const local={answers:{q:{value:{one:'V',two:'F'},body:{one:'V',two:'F'},synced:true,feedback:{isCorrect:true,correctAnswer:{one:'V',two:'F'}}}}} as unknown as RunnerSnapshot;
 assert.equal(restoreAnswers([{...question,answer:{one:'V',two:'F'},feedback:null}],local).q.feedback,undefined);
 assert.equal(restoreAnswers([{...question,answer:null,feedback:null}],local).q.feedback,undefined);
 const pending={answers:{q:{...local.answers.q,synced:false}}} as unknown as RunnerSnapshot;
 assert.equal(restoreAnswers([{...question,answer:null}],pending).q.feedback,undefined);
});

test('nullable hint fields from the real API keep their explicit redaction',()=>{
 assert.deepEqual(responseFeedback({feedback:{isCorrect:true,correctAnswer:{answer:'B'},tip:null,funFact:null,explanation:null}}),{isCorrect:true,correctAnswer:{answer:'B'},tip:null,funFact:null,explanation:null});
});
