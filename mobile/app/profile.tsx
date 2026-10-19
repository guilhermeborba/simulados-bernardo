import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import LearningPreferences from '../src/LearningPreferences';
import { useSession } from '../src/session-context';
import { useRemote, type ApiMyAchievements, type ApiMinhaPontuacao, type ApiTurma } from '../src/data';
import { useTheme, tokens } from '../src/theme';
import { TRACK_INFO } from '../src/core/track';
import { Badge, Button, Card, Copy, Empty, Heading, Loading, Progress, Screen, Tuca } from '../src/ui';

export default function Profile() {
 const {session}=useSession();
 const student=session.user?.role==='STUDENT';
 const {colors,timer,setTimer,track}=useTheme();
 const score=useRemote<ApiMinhaPontuacao>(student?'/me/pontuacao':null);
 const collection=useRemote<ApiMyAchievements>(student?'/me/achievements':null);
 const turmas=useRemote<ApiTurma[]>(student?'/me/turmas':null);
 const inTurma=Boolean(turmas.data?.length);
 return <Screen title="Eu" subtitle="Seu caminho de aprendizagem.">
  <Card>
   <View style={{flexDirection:'row',alignItems:'center',gap:tokens.space[4]}}>
    <View style={{borderRadius:tokens.radius.full,backgroundColor:colors.hl,padding:tokens.space[5]}}><Heading>{Array.from(session.user?.name||'?')[0]?.toUpperCase()}</Heading></View>
    <View style={{flex:1}}><Heading>{session.user?.name}</Heading><Copy muted>{student?(track?TRACK_INFO[track].name:'Escolha sua trilha'):'Giz · Acompanhamento'}</Copy></View>
    <Tuca pose="trofeu" size={72}/>
   </View>
   {student&&(score.loading?<Loading/>:score.error?<Empty mascot={false} title="Vamos tentar de novo?" message={score.error} onRetry={score.reload}/>:score.data&&<View style={{gap:tokens.space[2]}}><Copy>{score.data.simulados} simulados concluídos</Copy><Copy>{Math.round(score.data.media)}% de média</Copy><Copy>{score.data.diasSeguidos} {score.data.diasSeguidos===1?'dia':'dias'} de estudo seguidos</Copy></View>)}
  </Card>
  <Card title="Do seu jeito">
   <Copy>Tema claro</Copy><Badge>Tema escuro · Em breve</Badge><Copy muted>O tema escuro do app aguarda verificação em aparelho.</Copy>
   {student?<><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:tokens.space[4]}}><View style={{flex:1}}><Copy>Cronômetro por padrão</Copy></View><Switch accessibilityLabel="Cronômetro por padrão" value={timer} onValueChange={setTimer} trackColor={{false:colors.line,true:colors.primary}} thumbColor={colors['on-primary']}/></View>{!inTurma&&<Button title="Trocar trilha" secondary onPress={()=>router.push('/track')}/>}<Button title="Histórico" secondary onPress={()=>router.push('/history')}/>{!inTurma&&<Button title="Progresso por habilidade" secondary onPress={()=>router.push('/progress')}/>}<Button title="Painel dos pais · Em breve" secondary onPress={()=>router.push('/parents')}/></>:<Button title="Acompanhar alunos" secondary onPress={()=>router.push('/oversight')}/>}
  </Card>
  <LearningPreferences/>
  {student&&<><Heading>Conquistas</Heading>{collection.loading?<Loading/>:collection.error?<Empty mascot={false} title="Suas conquistas estão guardadas" message={collection.error} onRetry={collection.reload}/>:!collection.data?.achievements.length?<Card><Badge>Em breve</Badge><Copy>As conquistas disponíveis para sua conta aparecem aqui.</Copy></Card>:collection.data.achievements.map(item=><Card key={item.id} title={item.title}><Badge>{item.earnedAt?'Conquistada':'A caminho'}</Badge><Copy>{item.description}</Copy>{!item.earnedAt&&<><Copy muted>Faltam {Math.max(0,item.target-item.progress)} para ganhar.</Copy><Progress value={item.progress} max={item.target}/></>}</Card>)}</>}
 </Screen>;
}
