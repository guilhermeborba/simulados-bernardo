import { useEffect } from 'react';
import { router } from 'expo-router';
import Auth from '../src/Auth';
import { useSession } from '../src/session-context';
import { useTheme } from '../src/theme';
import { schoolYearLabel, trackOfSchoolYear } from '../src/core/track';
import { useRemote, type ApiSimulation, type ApiMyAttempt, type ApiMinhaPontuacao } from '../src/data';
import { Badge, Button, Card, Copy, Empty, Heading, Loading, Screen, Tuca } from '../src/ui';
export default function Home(){
 const{session}=useSession();const{track,ready}=useTheme();const active=session.status==='authenticated';const student=active&&session.user?.role==='STUDENT';
 const sims=useRemote<ApiSimulation[]>(student?'/simulations/available':null);const attempts=useRemote<ApiMyAttempt[]>(student?'/me/attempts':null);const score=useRemote<ApiMinhaPontuacao>(student?'/me/pontuacao':null);
 useEffect(()=>{if(active&&session.user?.role!=='STUDENT')router.replace('/oversight');else if(student&&ready&&!track)router.replace('/track');},[active,student,session.user?.role,ready,track]);
 if(session.status==='restoring'||session.status==='signing-in'||!ready)return <Screen title="Giz Kids" publicScreen><Loading/></Screen>;
 if(!active)return <Auth/>;
 const available=sims.data?.filter(item=>trackOfSchoolYear(item.schoolYear)===track)||[];
 const kidsIds=new Set(available.map(item=>item.id));
 const continuation=attempts.data?.find(item=>item.status==='IN_PROGRESS'&&kidsIds.has(item.simulationId));
 return <Screen title={`Oi, ${session.user?.name.split(' ')[0]}!`} subtitle="Vamos aprender uma coisa nova?" student><Tuca size={96}/>{score.data&&score.data.diasSeguidos>1&&<Badge>{score.data.diasSeguidos} dias de estudo seguidos</Badge>}
 {continuation&&<Card title="Continuar de onde parou"><Copy>{continuation.simulation.title}</Copy><Button title="Continuar" onPress={()=>router.push({pathname:'/simulation/[id]',params:{id:continuation.simulationId,attempt:continuation.id}})}/></Card>}
 <Heading>Para aprender hoje</Heading>
 {sims.loading?<Loading/>:sims.error?<Empty mascot={false} title="Vamos tentar de novo?" message={sims.error} onRetry={sims.reload}/>:available.length===0?<Empty mascot={false} title="Nenhum simulado novo por enquanto" message="Os simulados disponíveis para sua conta aparecem aqui."/>:available.slice(0,3).map(sim=><Card key={sim.id} title={sim.title}><Copy muted>{schoolYearLabel(sim.schoolYear)} · {sim.bimester}º bimestre · {sim.assessment}</Copy><Copy>{sim.totalQuestions} questões</Copy><Button title="Ver simulado" secondary onPress={()=>router.push({pathname:'/detail/[id]',params:{id:sim.id}})}/></Card>)}
 <Button title="Escolher um simulado" secondary={Boolean(continuation)} onPress={()=>router.push('/simulations')}/>
 {score.data?.melhorSimulado&&<Card title="Seu melhor resultado"><Copy>{score.data.melhorSimulado.titulo}</Copy><Heading>{Math.round(score.data.melhorSimulado.percentage)}% de acertos</Heading></Card>}
 <Card title="Mais formas de praticar"><Copy>Quizzes, missões, XP e revisões continuam disponíveis para sua conta.</Copy><Button title="Práticas e missões" secondary onPress={()=>router.push('/learning')}/><Button title="Progresso por habilidade" secondary onPress={()=>router.push('/progress')}/></Card>
 </Screen>;
}
