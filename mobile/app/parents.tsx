import { router } from 'expo-router';
import { Badge, Button, Card, Copy, Illustration, Screen } from '../src/ui';
export default function Parents(){return <Screen title="Painel dos pais" flow><Card><Illustration name="em-breve"/><Badge>Em breve</Badge><Copy>O espaço para acompanhar os estudos ainda está em construção.</Copy><Button title="Ver histórico" onPress={()=>router.push('/history')}/></Card></Screen>;}
