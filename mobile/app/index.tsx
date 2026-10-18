import { useEffect } from 'react';
import { router } from 'expo-router';
import Auth from '../src/Auth';
import { useSession } from '../src/session-context';
import { useTheme } from '../src/theme';
import { useRemote, type ApiSimulation, type ApiMyAttempt, type ApiMinhaPontuacao } from '../src/data';
import { Badge, Button, Card, Copy, Empty, Heading, Loading, Screen, Tuca } from '../src/ui';
export default function Home(){
 const{session}=useSession();const{track,ready}=useTheme();const active=session.status==='authenticated';
 const sims=useRemote<ApiSimulation[]>(active?'/simulations/available':null);const attempts=useRemote<ApiMyAttempt[]>(active?'/me/attempts':null);const score=useRemote<ApiMinhaPontuacao>(active?'/me/pontuacao':null);
 useEffect(()=>{if(active&&ready&&!track)router.replace('/track');},[active,ready,track]);
 if(session.status==='restoring'||session.status==='signing-in'||!ready)return <Screen title="Giz Kids" publicScreen><Loading/></Screen>;
 if(!active)return <Auth/>;
 const available=sims.data?.filter(item=>item.schoolYear>0&&item.schoolYear<=5)||[];
 const kidsIds=new Set(available.map(item=>item.id));
 const continuation=attempts.data?.find(item=>item.status==='IN_PROGRESS'&&kidsIds.has(item.simulationId));
 return <Screen title={`Oi, ${session.user?.name.split(' ')[0]}!`} subtitle="Vamos aprender uma coisa nova?" student><Tuca size={96}/>{score.data&&score.data.diasSeguidos>1&&<Badge>{score.data.diasSeguidos} dias de estudo seguidos</Badge>}
 {continuation&&<Card title="Continuar de onde parou"><Copy>{continuation.simulation.title}</Copy><Button title="Continuar" onPress={()=>router.push({pathname:'/simulation/[id]',params:{id:continuation.simulationId,attempt:continuation.id}})}/></Card>}
 <Heading>Para aprender hoje</Heading>
 {sims.loading?<Loading/>:sims.error?<Empty mascot={false} title="Vamos tentar de novo?" message={sims.error} onRetry={sims.reload}/>:available.length===0?<Empty mascot={false} title="Nenhum simulado novo por enquanto" message="Os simulados disponíveis para sua conta aparecem aqui."/>:available.slice(0,3).map(sim=><Card key={sim.id} title={sim.title}><Copy muted>{sim.schoolYear}º ano · {sim.bimester}º bimestre · {sim.assessment}</Copy><Copy>{sim.totalQuestions} questões</Copy><Button title="Ver simulado" secondary onPress={()=>router.push({pathname:'/detail/[id]',params:{id:sim.id}})}/></Card>)}
 <Button title="Escolher um simulado" secondary={Boolean(continuation)} onPress={()=>router.push('/simulations')}/>
 {score.data?.melhorSimulado&&<Card title="Seu melhor resultado"><Copy>{score.data.melhorSimulado.titulo}</Copy><Heading>{Math.round(score.data.melhorSimulado.percentage)}% de acertos</Heading></Card>}
 </Screen>;
}
