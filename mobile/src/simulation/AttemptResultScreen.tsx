import React, { useEffect, useRef, useState } from 'react';
import { trackOfSchoolYear } from '../core/track';
import { AccessibilityInfo, findNodeHandle, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Badge, Button, Card, Copy, Heading, Icon, Loading, Notice, Progress, Screen, Tuca, styles as uiStyles } from '../ui';
import { tokens, useTheme } from '../theme';
import { authorizedAnswerLines, authorizedCorrectAnswer, isBlankAnswer } from './model';
import { mapApiQuestion, parseStoredAnswer } from './questions';
import { useAttemptResult } from './useResult';
import { Feedback } from './Feedback';
import { Options } from './Options';

export default function AttemptResultScreen({review=false}:{review?:boolean}){
 const query=useLocalSearchParams<{id:string}>();
 const id=typeof query.id==='string'?query.id:'';
 const resultState=useAttemptResult(id);
 const snapshot=resultState.snapshot;
 const result=snapshot?.result;
 const [filter,setFilter]=useState('all');
 const {colors:c}=useTheme();
 const heading=useRef<Text>(null);
 const questions=[...(result?.questions??[])].sort((a,b)=>a.order-b.order);
 const total=questions.length;
 const correct=questions.filter(question=>question.isCorrect).length;
 const blank=questions.filter(question=>isBlankAnswer(question.answer)).length;
 const wrong=Math.max(0,total-correct-blank);
 const percentage=total?Math.round(correct/total*100):0;
 const message=percentage>=80?{title:'Mandou bem!',detail:`Você acertou ${correct} de ${total}.`}:percentage>=50?{title:'Bom caminho!',detail:'Vamos rever as dicas?'}:{title:'Vale tentar de novo!',detail:'Cada tentativa te deixa mais forte.'};
 const isKids=Boolean(snapshot?.attempt.simulation&&trackOfSchoolYear(snapshot.attempt.simulation.schoolYear)==='kids');
 const times=questions.map(question=>snapshot?.spentMs[question.id]);
 const average=times.length&&times.every(time=>typeof time==='number')?Math.round(times.reduce<number>((sum,time)=>sum+(time??0),0)/total/1000):null;
 const visible=questions.filter(question=>filter==='blank'?isBlankAnswer(question.answer):filter==='wrong'?!question.isCorrect&&!isBlankAnswer(question.answer):true);
 useEffect(()=>{if(!result)return;const timer=setTimeout(()=>{const handle=findNodeHandle(heading.current);if(handle)AccessibilityInfo.setAccessibilityFocus(handle);},150);return()=>clearTimeout(timer);},[result,review]);
 return <Screen title={review?'Revisar respostas':'Seu resultado'} subtitle={snapshot?.attempt.simulation?.title} flow student onBack={()=>review?router.replace({pathname:'/result/[id]',params:{id}}):router.replace('/')}>
  {resultState.loading?<Loading/>:!snapshot||!result?<Card title="Vamos tentar de novo?"><Notice>{resultState.error||'Este resultado ainda não está disponível.'}</Notice><Button title="Tentar de novo" onPress={resultState.reload}/></Card>:<>
   {resultState.offline&&<Notice>Sem conexão. Você está vendo o resultado salvo neste aparelho.</Notice>}
   {review?<>
    <View style={styles.reviewHeading}><View style={{flex:1}}><Text ref={heading} accessibilityRole="header" style={[uiStyles.cardTitle,{color:c.ink}]}>Vamos rever juntos?</Text><Copy muted>Veja suas respostas e relembre as dicas.</Copy></View>{isKids&&<Tuca pose="lupa" size={72}/>}</View>
    <View accessibilityRole="radiogroup" accessibilityLabel="Filtrar respostas" style={styles.filters}>{[{id:'all',label:`Todas (${total})`},{id:'wrong',label:`Erradas (${wrong})`},{id:'blank',label:`Em branco (${blank})`}].map(item=><Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{checked:filter===item.id}} onPress={()=>setFilter(item.id)} style={[styles.filter,{backgroundColor:filter===item.id?c.ink:c.surface,borderColor:c.line}]}><Text style={[styles.filterText,{color:filter===item.id?c.bg:c.ink}]}>{item.label}</Text></Pressable>)}</View>
    {visible.length===0&&<Card title="Nenhuma questão neste filtro"><Button title="Ver todas" secondary onPress={()=>setFilter('all')}/></Card>}
    {visible.map(question=>{
      const index=questions.findIndex(item=>item.id===question.id);
      const source=snapshot.questions.find(item=>item.id===question.id);
      const mapped=source?.options.length?mapApiQuestion(source):null;
      const correctAnswer=question.correctAnswer===undefined?snapshot.answers[question.id]?.feedback?.correctAnswer:authorizedCorrectAnswer(question.correctAnswer);
      const value=mapped?parseStoredAnswer(mapped.type,question.answer):undefined;
      const isBlank=isBlankAnswer(question.answer);
      return <Card key={question.id}><Badge>Questão {index+1} · {question.isCorrect?'✓ Certa':isBlank?'Em branco':'Vamos revisar'}</Badge><Heading>{question.statement}</Heading>{mapped?<Options question={mapped} value={value} locked isCorrect={question.isCorrect} correctAnswer={correctAnswer} review/>:<Copy>Sua resposta: {isBlank?'Em branco':formatAnswer(question.answer)}</Copy>}{isBlank&&<Copy muted>Você deixou esta questão em branco.</Copy>}{!mapped&&correctAnswer&&<View style={{gap:tokens.space[2]}}><Heading level={3}>Resposta certa</Heading>{authorizedAnswerLines(null,correctAnswer).map(line=><Copy key={line}>{line}</Copy>)}</View>}{!question.isCorrect&&!correctAnswer&&<Copy muted>A resposta certa ainda não está disponível. Relembre a Dica de Ouro e tente novamente.</Copy>}{question.isCorrect&&question.funFact&&<Feedback correct>{question.funFact}</Feedback>}{!question.isCorrect&&question.tip&&<Feedback correct={false}>{question.tip}</Feedback>}{question.explanation&&<Copy>{question.explanation}</Copy>}</Card>;
    })}
    <Button title="Voltar ao resultado" secondary onPress={()=>router.replace({pathname:'/result/[id]',params:{id}})}/>
   </>:<>
    <Card><View style={{alignItems:'center',gap:tokens.space[3]}}>{isKids&&<Tuca pose={percentage>=80?'trofeu':'errou-tenta-de-novo'} size={140}/>}<View accessible accessibilityLabel={`${correct} acertos em ${total} questões`} style={styles.ring}><Svg width={160} height={160} viewBox="0 0 160 160" style={{transform:[{rotate:'-90deg'}]}}><Circle cx={80} cy={80} r={68} fill="none" stroke={c.line} strokeWidth={12}/><Circle cx={80} cy={80} r={68} fill="none" stroke={c.ok} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${percentage/100*427.26} 427.26`}/></Svg><View style={styles.ringLabel}><Text accessible={false} style={[styles.score,{color:c.ink}]}>{correct}</Text><Text accessible={false} style={[uiStyles.copy,{color:c.muted}]}>de {total} acertos</Text></View></View><Text ref={heading} accessibilityRole="header" style={[uiStyles.cardTitle,{color:c.ink,textAlign:'center'}]}>{message.title}</Text><Copy muted>{message.detail}</Copy></View><Button title="Revisar respostas" onPress={()=>router.replace({pathname:'/review/[id]',params:{id}})}/><Button title="Refazer simulado" secondary onPress={()=>router.replace({pathname:'/simulation/[id]',params:{id:snapshot.attempt.simulationId,timer:snapshot.timerEnabled?'1':'0'}})}/><Button title="Voltar ao início" secondary onPress={()=>router.replace('/')}/></Card>
    <Card title="Seu caminho neste simulado"><View style={styles.stats}>{[{label:'Certas',value:String(correct),color:c['ok-bg'],icon:'check'},{label:'Erradas',value:String(wrong),color:c['hl-bg'],icon:'bulb'},{label:'Em branco',value:String(blank),color:c.soft,icon:'clock'},{label:'Tempo médio',value:average===null?'—':`${average} s`,color:c.soft,icon:'clock'}].map(item=><View key={item.label} style={[styles.stat,{backgroundColor:item.color}]}><Icon name={item.icon}/><Copy>{item.label}</Copy><Text style={[uiStyles.cardTitle,{color:c.ink}]}>{item.value}</Text></View>)}</View>{average===null&&<Copy muted>O tempo por questão não foi registrado nesta tentativa.</Copy>}</Card>
    <Card title="Por tema">{result.topics === undefined ? <Copy muted>A divisão por tema ainda não está disponível para esta tentativa.</Copy> : <>
      {result.topics.length === 0 ? <Copy muted>As barras aparecem quando as questões têm um tema cadastrado.</Copy> : result.topics.map((topic,index)=><View key={`${topic.theme}:${index}`} style={{gap:tokens.space[2]}}><Heading level={3}>{topic.theme}</Heading><Progress value={topic.correct} max={topic.total}/></View>)}
      {typeof result.unclassifiedQuestions === 'number' && result.unclassifiedQuestions > 0 && <Copy muted>{result.unclassifiedQuestions} {result.unclassifiedQuestions === 1 ? 'questão sem tema cadastrado.' : 'questões sem tema cadastrado.'}</Copy>}
    </>}</Card>
    <Card title="Revisar respostas">{questions.map((question,index)=><View key={question.id} style={styles.resultRow}><Icon name={question.isCorrect?'check':isBlankAnswer(question.answer)?'clock':'bulb'}/><View style={{flex:1}}><Copy>Questão {index+1}</Copy><Copy muted>{question.isCorrect?'Certa':isBlankAnswer(question.answer)?'Em branco':'Vamos revisar'}</Copy></View></View>)}<Button title="Ver todas as respostas" secondary onPress={()=>router.replace({pathname:'/review/[id]',params:{id}})}/></Card>
   </>}
  </>}
 </Screen>;
}
function formatAnswer(answer:unknown){if(!answer||typeof answer!=='object')return String(answer??'Em branco');return Object.entries(answer as Record<string,unknown>).map(([key,value])=>`${key}: ${String(value)}`).join(' · ');}
const s=tokens.space;
const styles=StyleSheet.create({reviewHeading:{flexDirection:'row',alignItems:'center',gap:s[4]},filters:{flexDirection:'row',flexWrap:'wrap',gap:s[2]},filter:{minHeight:tokens.size['touch-kids'],borderWidth:tokens.size['icon-stroke'],borderRadius:tokens.radius.full,padding:s[3],justifyContent:'center'},filterText:{fontFamily:'Nunito',fontWeight:'800',fontSize:tokens.type.body.mobile[0]},ring:{width:s[8]*4,height:s[8]*4,alignItems:'center',justifyContent:'center'},ringLabel:{position:'absolute',alignItems:'center',justifyContent:'center'},score:{fontFamily:'Fredoka',fontSize:tokens.type.display.mobile[0],lineHeight:tokens.type.display.mobile[1],fontWeight:'600'},stats:{flexDirection:'row',flexWrap:'wrap',gap:s[3]},stat:{flexGrow:1,flexBasis:'44%',minWidth:tokens.size['touch-kids']*2,padding:s[4],borderRadius:tokens.radius.md,gap:s[2]},resultRow:{flexDirection:'row',alignItems:'center',gap:s[3],minHeight:tokens.size['touch-kids']}});
