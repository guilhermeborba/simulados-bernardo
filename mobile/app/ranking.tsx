import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useRemote, type ApiTurma, type ApiRanking, type ApiLinhaDoRanking } from '../src/data';
import { useTheme, tokens } from '../src/theme';
import { privateRankingName } from '../src/privacy';
import { Badge, Button, Card, Copy, Empty, Heading, Loading, Screen, Tuca } from '../src/ui';
export default function Ranking(){const classes=useRemote<ApiTurma[]>('/me/turmas');const[scope,setScope]=useState<'class'|'general'>('class');const[classId,setClass]=useState<string>();useEffect(()=>{if(classes.data?.length&&!classId)setClass(classes.data[0].id);},[classes.data,classId]);const selectedClass=classes.data?.find(item=>item.id===classId)||classes.data?.[0];const ranking=useRemote<ApiRanking>(selectedClass&&scope==='class'?`/me/turmas/${encodeURIComponent(selectedClass.id)}/ranking`:null);const{colors}=useTheme();const lines:ApiLinhaDoRanking[]=ranking.data?[...new Map([...ranking.data.podio,...ranking.data.vizinhanca,...(ranking.data.minhaPosicao?[ranking.data.minhaPosicao]:[])].map(item=>[item.posicao,item])).values()].sort((a,b)=>a.posicao-b.posicao):[];return <Screen title="Ranking" subtitle="Acompanhe o caminho da sua turma." student>
 <View style={{flexDirection:'row',gap:tokens.space[3]}}><View style={{flex:1}}><Button title="Turma" secondary onPress={()=>setScope('class')}/></View><View style={{flex:1}}><Button title="Geral · Em breve" secondary onPress={()=>setScope('general')}/></View></View>
 {scope==='general'?<Card title="Ranking geral"><Badge>Em breve</Badge><Copy>O ranking geral ainda não está disponível.</Copy></Card>:classes.loading?<Loading/>:classes.error?<Empty title="Vamos tentar de novo?" message={classes.error} onRetry={classes.reload}/>:!classes.data?.length?<Empty title="Sua turma aparece aqui" message="Entre por um convite de turma para acompanhar o ranking."/>:<>
 {classes.data.map(item=><Button key={item.id} title={`${item.name}${item.id===selectedClass?.id?' · selecionada':''}`} secondary onPress={()=>setClass(item.id)}/>)}
 {ranking.loading?<Loading/>:ranking.error?<Empty title="Vamos tentar de novo?" message={ranking.error} onRetry={ranking.reload}/>:lines.length===0?<Card><Tuca pose="medalha" size={96}/><Heading>O caminho está começando</Heading><Copy>Quando houver resultados suficientes, o ranking da turma aparece aqui.</Copy>{ranking.data&&ranking.data.faltamParaORanking>0&&<Copy>Faltam {ranking.data.faltamParaORanking} simulados para você entrar no ranking.</Copy>}<Button title="Escolher um simulado" onPress={()=>router.replace('/simulations')}/></Card>:<>
 <Tuca pose="medalha" size={96}/><Copy muted>Classificação pela média dos melhores resultados, conforme a regra da turma.</Copy>
 {ranking.data&&ranking.data.faltamParaORanking>0&&<Card><Copy>Faltam {ranking.data.faltamParaORanking} simulados para você entrar no ranking.</Copy></Card>}
 {lines.map(item=><View key={item.posicao} style={{padding:tokens.space[5],gap:tokens.space[2],borderRadius:tokens.radius.lg,backgroundColor:item.ehVoce?colors['sel-bg']:colors.surface,borderWidth:2,borderColor:item.ehVoce?colors.primary:colors.line}}><Heading>{item.posicao}º · {privateRankingName(item.nome)}{item.ehVoce?' (você)':''}</Heading><Copy>{Math.round(item.media)}% de média · {item.simulados} simulados</Copy></View>)}
 </>}
 </>}
 </Screen>;}
