import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Auth from '../src/Auth';
import { useSession } from '../src/session-context';
import { useTheme, tokens } from '../src/theme';
import { periodLabel, schoolYearLabel, subjectOf, trackOfSchoolYear, trackOfTurmas, type GizSubject } from '../src/core/track';
import { STATE_BADGE, simulationStatus, type SimulationState } from '../src/core/catalog';
import { useAnsweredCounts } from '../src/answered';
import { useRemote, type ApiSimulation, type ApiMyAttempt, type ApiMinhaPontuacao, type ApiTurma } from '../src/data';
import { ActionDot, ActionRow, Badge, Button, Card, Copy, Empty, Heading, Loading, Progress, Screen, SecondaryLink, SubjectTile, Tuca, styles } from '../src/ui';
const s=tokens.space;
const byRecent=(a:ApiMyAttempt,b:ApiMyAttempt)=>new Date(b.finishedAt||b.createdAt).getTime()-new Date(a.finishedAt||a.createdAt).getTime();
export default function Home(){
 const{session}=useSession();const{track,ready,selectTrack}=useTheme();const active=session.status==='authenticated';const student=active&&session.user?.role==='STUDENT';
 const sims=useRemote<ApiSimulation[]>(student?'/simulations/available':null);const attempts=useRemote<ApiMyAttempt[]>(student?'/me/attempts':null);const score=useRemote<ApiMinhaPontuacao>(student?'/me/pontuacao':null);const turmas=useRemote<ApiTurma[]>(student?'/me/turmas':null);const inTurma=Boolean(turmas.data?.length);
 useEffect(()=>{if(active&&session.user?.role!=='STUDENT')router.replace('/oversight');else if(student&&ready&&!track&&!turmas.loading){const fromTurma=trackOfTurmas(turmas.data||[]);if(fromTurma)selectTrack(fromTurma);else router.replace('/track');}},[active,student,session.user?.role,ready,track,turmas.loading,turmas.data,selectTrack]);
 const turmaIds=new Set((turmas.data||[]).map(item=>item.id));const fromTurma=(sim:ApiSimulation)=>Boolean(sim.turmaId&&turmaIds.has(sim.turmaId));
 const available=(sims.data?.filter(item=>trackOfSchoolYear(item.schoolYear)===track)||[]).sort((a,b)=>Number(fromTurma(b))-Number(fromTurma(a)));
 const kidsIds=new Set(available.map(item=>item.id));
 const unfinished=(attempts.data||[]).filter(item=>item.status==='IN_PROGRESS'&&kidsIds.has(item.simulationId)).sort(byRecent).slice(0,10);
 const answered=useAnsweredCounts(unfinished.map(item=>item.id));
 if(session.status==='restoring'||session.status==='signing-in'||!ready)return <Screen title="Giz Kids" publicScreen><Loading/></Screen>;
 if(!active)return <Auth/>;
 const continuation=answered&&unfinished.find(item=>answered[item.id]!==0);
 const continuationSim=continuation?available.find(item=>item.id===continuation.simulationId):undefined;
 const latest=(attempts.data||[]).filter(item=>item.status==='FINISHED'||item.finishedAt).sort(byRecent)[0];
 const stateOf=(sim:ApiSimulation)=>simulationStatus(sim.id,attempts.data||[],answered||{}).state;
 const shown=[...available].sort((a,b)=>Number(stateOf(a)!=='new')-Number(stateOf(b)!=='new')).slice(0,3);
 const sharedYear=new Set(shown.map(item=>item.schoolYear)).size===1?shown[0].schoolYear:null;
 const note=[sharedYear===null?null:schoolYearLabel(sharedYear),shown.length&&shown.every(fromTurma)?'Da sua turma':null].filter(Boolean).join(' · ');
 const done=score.data?.simulados??(attempts.data||[]).filter(item=>item.status==='FINISHED'||item.finishedAt).length;const streak=score.data?.diasSeguidos??0;
 return <Screen brand title={`Oi, ${session.user?.name.split(' ')[0]}!`} subtitle="Uma descoberta a cada questão." student>
 {answered===null?<Loading/>:continuation&&continuationSim?<ResumeCard attempt={continuation} simulation={continuationSim} answered={answered[continuation.id]}/>:<Card><Tuca size={96}/><Heading>O que vamos descobrir hoje?</Heading><Copy>Escolha uma disciplina e aprenda uma questão de cada vez.</Copy><Button title="Escolher um simulado" icon="arrow-right" onPress={()=>router.push('/simulations')}/></Card>}
 <View style={local.summaries}>
  <Summary subject="mat" icon="flame" title="Seu caminho" action="Histórico" onPress={()=>router.push('/history')}><Stat value={String(done)} label="concluídos"/>{streak>0&&<Small>{streak} {streak===1?'dia seguido':'dias seguidos'} de estudo</Small>}</Summary>
  {latest&&<Summary subject="geo" icon="check" title="Último resultado" action="Rever" onPress={()=>router.push({pathname:'/result/[id]',params:{id:latest.id}})}><Stat value={`${Math.round(Number(latest.percentage??0))}%`}/><Small>Simulado de {latest.simulation.discipline.name}</Small></Summary>}
 </View>
 <View style={local.sectionHead}><View style={{flexShrink:1}}><Heading>Novos para você</Heading>{note?<Small>{note}</Small>:null}</View><SecondaryLink title="Ver todos" accessibilityLabel="Ver todos os simulados" onPress={()=>router.push('/simulations')}/></View>
 {sims.loading||answered===null?<Loading/>:sims.error?<Empty mascot={false} title="Vamos tentar de novo?" message={sims.error} onRetry={sims.reload}/>:shown.length===0?<Empty mascot={false} title="Nenhum simulado novo por enquanto" message="Os simulados disponíveis para sua conta aparecem aqui."/>:shown.map(sim=><SimulationRow key={sim.id} simulation={sim} state={stateOf(sim)} showYear={sharedYear===null}/>)}
 <LinkCard subject="his" icon="cup" title="Ver ranking da turma" onPress={()=>router.push('/ranking')}/>
 {!inTurma&&<><LinkCard icon="spark" title="Ir para a prática" note="Quizzes rápidos, missões da semana e sua coleção." onPress={()=>router.push('/learning')}/><LinkCard icon="spark" title="Progresso por habilidade" onPress={()=>router.push('/progress')}/></>}
 </Screen>;
}
function Small({children}:{children:ReactNode}){const{colors:c}=useTheme();return <Text style={[styles.small,{color:c.muted}]}>{children}</Text>;}
function Stat({value,label}:{value:string;label?:string}){const{colors:c}=useTheme();return <View style={local.stat}><Text style={[local.statValue,{color:c.ink}]}>{value}</Text>{label&&<Copy>{label}</Copy>}</View>;}
function ResumeCard({attempt,simulation,answered}:{attempt:ApiMyAttempt;simulation:ApiSimulation;answered:number}){
 const{colors:c}=useTheme();
 return <View style={[styles.card,local.resume,{backgroundColor:c.surface,borderColor:c.primary}]}><Text style={[local.eyebrow,{color:c.muted}]}>Continuar de onde parou</Text><Heading>{simulation.discipline.name}</Heading><Small>{[schoolYearLabel(simulation.schoolYear),periodLabel(simulation.bimester,simulation.assessment)].filter(Boolean).join(' · ')}</Small>{answered>0&&<Progress inline value={answered} max={simulation.totalQuestions}/>}<Button title="Continuar simulado" icon="arrow-right" onPress={()=>router.push({pathname:'/simulation/[id]',params:{id:attempt.simulationId,attempt:attempt.id}})}/></View>;
}
function Summary({subject,icon,title,action,onPress,children}:{subject:GizSubject;icon:string;title:string;action:string;onPress:()=>void;children:ReactNode}){
 const{colors:c}=useTheme();
 return <View style={[local.summary,{backgroundColor:c.surface,borderColor:c.line}]}><View style={local.summaryBody}><SubjectTile subject={subject} icon={icon} small/><Heading level={3}>{title}</Heading>{children}</View><ActionRow title={action} onPress={onPress}/></View>;
}
/** The whole row is one target, read as "Geografia, 1º bimestre, AV2, 30 questões, novo". */
function SimulationRow({simulation,state,showYear}:{simulation:ApiSimulation;state:SimulationState;showYear:boolean}){
 const{colors:c}=useTheme();const[tone,label]=STATE_BADGE[state];
 const meta=[showYear?schoolYearLabel(simulation.schoolYear):null,periodLabel(simulation.bimester,simulation.assessment)].filter(Boolean).join(' · ');
 const name=[simulation.discipline.name,...meta.split(' · ').filter(Boolean),`${simulation.totalQuestions} questões`,label.toLocaleLowerCase('pt-BR')].join(', ');
 return <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={()=>router.push({pathname:'/detail/[id]',params:{id:simulation.id}})} style={({pressed})=>[local.row,{minHeight:tokens.layout['simulation-row'],backgroundColor:c.surface,borderColor:pressed?c.ink:c.line}]}>{({pressed})=><><SubjectTile subject={subjectOf(simulation.discipline)}/><View style={local.rowText}><Text numberOfLines={1} style={[styles.subheading,{color:c.ink}]}>{simulation.discipline.name}</Text>{meta?<Small>{meta}</Small>:null}</View><View><Badge tone={tone}>{label}</Badge></View><ActionDot active={pressed}/></>}</Pressable>;
}
function LinkCard({subject=null,icon,title,note,onPress}:{subject?:GizSubject|null;icon:string;title:string;note?:string;onPress:()=>void}){
 const{colors:c}=useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>[local.row,{minHeight:tokens.layout['link-card'],backgroundColor:c.surface,borderColor:pressed?c.ink:c.line}]}>{({pressed})=><><SubjectTile subject={subject} icon={icon} small/><View style={local.rowText}><Text style={[styles.actionText,{color:c.ink}]}>{title}</Text>{note&&<Small>{note}</Small>}</View><ActionDot active={pressed}/></>}</Pressable>;
}
const local=StyleSheet.create({
 resume:{borderWidth:tokens.border.default,padding:s[6]},eyebrow:{fontFamily:'Nunito',fontSize:tokens.type.caption.mobile[0],lineHeight:tokens.type.caption.mobile[1],fontWeight:'800',letterSpacing:tokens.type.caption.mobile[0]*.08,textTransform:'uppercase'},
 summaries:{flexDirection:'row',gap:s[3]},summary:{flex:1,minWidth:0,borderRadius:tokens.radius.lg,borderWidth:tokens.border.thin,overflow:'hidden'},summaryBody:{flex:1,gap:s[2],padding:s[4]},
 stat:{flexDirection:'row',flexWrap:'wrap',alignItems:'baseline',gap:s[2]},statValue:{fontFamily:'Fredoka',fontSize:tokens.type.display.mobile[0],lineHeight:tokens.type.display.mobile[0]+s[1],fontWeight:'700'},
 sectionHead:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:s[3]},
 row:{flexDirection:'row',alignItems:'center',gap:s[3],paddingHorizontal:s[4],paddingVertical:s[3],borderRadius:tokens.radius.lg,borderWidth:tokens.border.thin},rowText:{flex:1,minWidth:0},
});
