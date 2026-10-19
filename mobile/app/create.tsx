import { router } from 'expo-router';
import { Badge, Button, Card, Copy, Illustration, Screen } from '../src/ui';
export default function Create(){return <Screen title="Monte seu simulado" flow><Card><Illustration name="em-breve"/><Badge>Em breve</Badge><Copy>A criação de simulados personalizados ainda está em construção.</Copy><Button title="Ver simulados" onPress={()=>router.replace('/simulations')}/></Card></Screen>;}
