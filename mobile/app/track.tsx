import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { GIZ_TRACKS, TRACK_INFO } from '../src/core/track';
import { Button, Card, Copy, Screen, Tuca } from '../src/ui';
export default function Track(){const{track,selectTrack}=useTheme();return <Screen title="Escolha sua trilha" subtitle="Você pode trocar depois, em Eu." flow><Tuca size={120}/>{GIZ_TRACKS.map(item=><Card key={item} title={TRACK_INFO[item].name}><Copy>{TRACK_INFO[item].audience}</Copy><Copy muted>{TRACK_INFO[item].pitch}</Copy><Button title={track===item?'Continuar':`Escolher ${TRACK_INFO[item].name}`} secondary={track!==null&&track!==item} onPress={()=>{selectTrack(item);router.replace('/');}}/></Card>)}</Screen>;}
