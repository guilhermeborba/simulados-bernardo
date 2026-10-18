import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../src/session-context';
import { ThemeProvider, useTheme } from '../src/theme';
import { Loading } from '../src/ui';
function Navigator(){const{colors}=useTheme();const[loaded,error]=useFonts({Fredoka:require('../assets/fonts/Fredoka.ttf'),Nunito:require('../assets/fonts/Nunito.ttf')});if(!loaded&&!error)return <Loading/>;return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.bg},animation:'none'}}/></>;}
export default function Layout(){return <SafeAreaProvider><SessionProvider><ThemeProvider><Navigator/></ThemeProvider></SessionProvider></SafeAreaProvider>;}
