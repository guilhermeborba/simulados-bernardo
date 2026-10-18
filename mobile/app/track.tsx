import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { Badge, Button, Card, Copy, Screen, Tuca } from '../src/ui';
export default function Track(){const{selectKids}=useTheme();return <Screen title="Escolha sua trilha" subtitle="Um jeito de aprender para cada etapa." flow><Tuca size={120}/><Card title="Giz Kids"><Copy>Ensino Fundamental I · 1º ao 5º ano</Copy><Button title="Continuar com Kids" onPress={()=>{selectKids();router.replace('/');}}/></Card><Card title="Giz Escola"><Copy>Ensino Fundamental II e Médio</Copy><Badge>Em breve</Badge></Card><Card title="Giz Técnico"><Copy>Cursos técnicos</Copy><Badge>Em breve</Badge></Card></Screen>;}
