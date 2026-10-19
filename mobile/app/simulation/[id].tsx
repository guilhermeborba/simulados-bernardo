import React, { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, BackHandler, findNodeHandle, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Button, Card, Copy, Heading, Icon, Loading, Notice, Progress, Screen, styles as uiStyles } from '../../src/ui';
import { useTheme, tokens } from '../../src/theme';
import { useSimulation } from '../../src/simulation/useSimulation';
import { answerIsComplete } from '../../src/simulation/model';
import { mapApiQuestion } from '../../src/simulation/questions';
import { Options } from '../../src/simulation/Options';
import { Feedback } from '../../src/simulation/Feedback';

export default function SimulationScreen(){
 const query=useLocalSearchParams<{id:string;attempt?:string;timer?:string}>();
 const id=typeof query.id==='string'?query.id:'';
 const control=useSimulation(id,typeof query.attempt==='string'?query.attempt:undefined,typeof query.timer==='string'?query.timer:undefined);
 const {colors:c}=useTheme();
 const snapshot=control.snapshot;
 const source=snapshot?.questions[snapshot.currentIndex];
 const question=source?mapApiQuestion(source):null;
 const record=question&&snapshot?.answers[question.id];
 const heading=useRef<Text>(null);
 const feedbackHeading=useRef<Text>(null);
 const stay=useRef<View>(null);
 const seconds=snapshot?Math.ceil(snapshot.remainingMs/1000):tokens.tempo['questao-segundos'];
 const value=record?record.value:question&&snapshot?.drafts[question.id];
 const blank=record?.value===-1;
 const funFact=record?.feedback?.funFact!==undefined?record.feedback.funFact:source?.funFact;
 const tip=record?.feedback?.tip!==undefined?record.feedback.tip:source?.tip;
 const title=blank?'O tempo acabou':record?.feedback?.isCorrect===true?'Resposta certa!':record?.feedback?.isCorrect===false?'Quase! Vamos olhar a dica?':'Resposta guardada!';
 useEffect(()=>{if(!question)return;const task=setTimeout(()=>{const handle=findNodeHandle(record?feedbackHeading.current:heading.current);if(handle)AccessibilityInfo.setAccessibilityFocus(handle);},150);return()=>clearTimeout(task);},[question?.id,Boolean(record)]);
 useEffect(()=>{if(control.announcement)AccessibilityInfo.announceForAccessibility(control.announcement);},[control.announcement]);
 useEffect(()=>{if(snapshot?.result)router.replace({pathname:'/result/[id]',params:{id:snapshot.attempt.id}});},[snapshot?.result]);
 useFocusEffect(useCallback(()=>{const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{control.pause(true);return true;});return()=>subscription.remove();},[]));
 async function advance(){if(!snapshot||!question)return;if(!record){control.confirm();return;}if(snapshot.currentIndex===snapshot.questions.length-1){const attempt=await control.finish();if(attempt)router.replace({pathname:'/result/[id]',params:{id:attempt}});}else control.next();}
 async function leave(){if(await control.ensureSaved())router.replace('/');}
 const waitingForFeedback=Boolean(record&&!record.synced&&snapshot?.attempt.immediateFeedback&&!control.offline&&!control.error);
 const footer=question&&snapshot?<View style={{gap:tokens.space[2]}}>{record&&<Copy>{title}</Copy>}<Button title={control.busy||waitingForFeedback?'Enviando…':record?snapshot.currentIndex===snapshot.questions.length-1?'Ver resultado':'Próxima':'Confirmar'} disabled={control.busy||waitingForFeedback||(!record&&!answerIsComplete(question,value))} onPress={()=>void advance()}/></View>:undefined;
 return <Screen title={snapshot?.attempt.simulation?.title??'Seu simulado'} flow student onBack={()=>control.pause(true)} footer={footer}>
  {control.loading?<Loading/>:!snapshot?<Card title="Vamos tentar de novo?"><Notice>{control.error||'Conecte-se para abrir este simulado.'}</Notice><Button title="Tentar de novo" onPress={()=>void control.reload()}/></Card>:!question?<Card title="As questões ainda não chegaram"><Copy>Escolha outro simulado e volte para conferir.</Copy><Button title="Escolher um simulado" onPress={()=>router.replace('/simulations')}/></Card>:<>
   <View style={styles.progressRow}><View style={{flex:1}}><Progress value={Object.keys(snapshot.answers).length} max={snapshot.questions.length}/></View>{snapshot.timerEnabled?<View accessible accessibilityLabel="Tempo da questão" style={styles.timer}><Svg width={56} height={56} viewBox="0 0 56 56" style={{transform:[{rotate:'-90deg'}]}}><Circle cx={28} cy={28} r={24} fill="none" stroke={c.line} strokeWidth={5}/><Circle cx={28} cy={28} r={24} fill="none" stroke={seconds<=10?c.urgent:c.hl} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${seconds/tokens.tempo['questao-segundos']*150.8} 150.8`}/></Svg><Text accessible={false} style={[styles.timerNumber,{color:c.ink}]}>{seconds}</Text></View>:<Copy muted>Sem limite de tempo</Copy>}</View>
   <Card><Copy muted>Questão {snapshot.currentIndex+1} de {snapshot.questions.length}</Copy><Text ref={heading} accessibilityRole="header" style={[styles.statement,{color:c.ink}]}>{question.text}</Text><Options question={question} value={value} locked={Boolean(record)} isCorrect={record?.feedback?.isCorrect} correctAnswer={record?.feedback?.correctAnswer} onChange={control.choose}/>{record&&<View style={{gap:tokens.space[3]}}><Text ref={feedbackHeading} accessible accessibilityRole="header" accessibilityLiveRegion="polite" style={[uiStyles.cardTitle,{color:c.ink}]}>{title}</Text>{record.feedback?<>{record.feedback.isCorrect&&funFact&&<Feedback correct>{funFact}</Feedback>}{!record.feedback.isCorrect&&tip&&<Feedback correct={false}>{tip}</Feedback>}{record.feedback.explanation&&<Copy>{record.feedback.explanation}</Copy>}</>:<Copy>{blank?'Esta questão ficou em branco. ':''}{record.synced?'Você verá a correção e as dicas ao finalizar o simulado.':'Sua resposta está neste aparelho e será enviada quando a conexão voltar.'}</Copy>}</View>}</Card>
   {control.offline&&<Notice>{control.storageOk?'Sem conexão. Seu progresso está salvo neste aparelho.':'Sem conexão. Mantenha esta página aberta para preservar as respostas.'}</Notice>}
   {!control.storageOk&&<Notice>Não foi possível guardar o progresso no aparelho. Conecte-se para sincronizar antes de sair.</Notice>}
   {control.error&&<Notice>{control.error}</Notice>}
   {(control.offline||control.error||Object.values(snapshot.answers).some(answer=>!answer.synced))&&<Button title="Tentar sincronizar" secondary disabled={control.busy} onPress={()=>void control.sync()}/>}
  </>}
  <Modal visible={control.paused} transparent animationType="none" onRequestClose={()=>control.pause(false)} onShow={()=>{const handle=findNodeHandle(stay.current);if(handle)AccessibilityInfo.setAccessibilityFocus(handle);}}><View style={[styles.overlay,{backgroundColor:tokens.color.light.head.value+'88'}]}><ScrollView accessibilityViewIsModal style={[styles.modalScroll,{backgroundColor:c.surface}]} contentContainerStyle={styles.modal}><Heading>Sair do simulado?</Heading><Copy>{control.storageOk?'Seu progresso fica salvo. Você pode continuar de onde parou.':'Vamos sincronizar as respostas antes de sair.'}</Copy>{control.error&&<Notice>{control.error}</Notice>}<Pressable ref={stay} accessibilityRole="button" onPress={()=>control.pause(false)} style={[uiStyles.button,{backgroundColor:c.primary,borderColor:c.primary}]}><Text style={[uiStyles.buttonText,{color:c['on-primary']}]}>Continuar simulado</Text></Pressable><Button title={control.busy?'Guardando…':'Sair e continuar depois'} secondary disabled={control.busy} onPress={()=>void leave()}/></ScrollView></View></Modal>
 </Screen>;
}
const s=tokens.space;
const styles=StyleSheet.create({statement:{fontFamily:'Nunito',fontWeight:'800',fontSize:tokens.type.enunciado.mobile[0],lineHeight:tokens.type.enunciado.mobile[1]},progressRow:{flexDirection:'row',alignItems:'center',gap:s[4]},timer:{width:tokens.size['touch-kids'],height:tokens.size['touch-kids'],alignItems:'center',justifyContent:'center'},timerNumber:{position:'absolute',fontFamily:'Fredoka',fontWeight:'600',fontSize:tokens.type.h3.mobile[0]},overlay:{flex:1,justifyContent:'flex-end'},modalScroll:{flexGrow:0,maxHeight:'90%',borderTopLeftRadius:tokens.radius.xl,borderTopRightRadius:tokens.radius.xl},modal:{padding:s[5],paddingBottom:s[8],gap:s[4],borderTopLeftRadius:tokens.radius.xl,borderTopRightRadius:tokens.radius.xl}});
