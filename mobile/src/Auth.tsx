import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ApiError } from './core/session';
import { useSession } from './session-context';
import { useTheme, tokens } from './theme';
import { peekEntryLink, forgetEntryLink } from './navigation/links';
import { Button, Card, Field, Notice, Screen, Tuca } from './ui';
export default function Auth(){
 const{client,session}=useSession();const{selectKids,colors}=useTheme();const[mode,setMode]=useState<'login'|'register'>('login');const[name,setName]=useState('');const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[error,setError]=useState<string>();const[fields,setFields]=useState<Record<string,string|undefined>>({});const[busy,setBusy]=useState(false);const nameRef=useRef<TextInput>(null);const emailRef=useRef<TextInput>(null);const passwordRef=useRef<TextInput>(null);
 async function submit(){
  if(busy)return;const invalid:Record<string,string|undefined>={name:mode==='register'&&name.trim().length<2?'Conte seu nome (pelo menos 2 letras).':undefined,email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?undefined:'Digite um e-mail válido.',password:!password?'Digite sua senha.':mode==='register'&&(password.length<8||new TextEncoder().encode(password).length>72)?'Use pelo menos 8 caracteres e até 72 bytes.':undefined};setFields(invalid);if(invalid.name){nameRef.current?.focus();return;}if(invalid.email){emailRef.current?.focus();return;}if(invalid.password){passwordRef.current?.focus();return;}
  setBusy(true);setError(undefined);const incoming=peekEntryLink().entry;
  try{if(mode==='register'){await client.register({name:name.trim(),email:email.trim(),password,...(incoming?.kind==='invite'?{inviteToken:incoming.token}:{})});if(incoming?.kind==='invite'){selectKids();forgetEntryLink();}}
   else await client.login({email:email.trim(),password});
   setPassword('');if(mode==='login'&&incoming?.kind==='invite')router.replace('/entry');
  }catch(reason){setError(reason instanceof ApiError&&reason.status===401?'E-mail ou senha não conferem.':reason instanceof ApiError&&reason.status===409?'Não foi possível criar a conta com esses dados. Confira e tente de novo.':'Não foi possível conectar. Confira a conexão e tente de novo.');}finally{setBusy(false);}
 }
 return <Screen publicScreen title={mode==='register'?'Crie sua conta':'Bem-vindo de volta'} subtitle="Errou? Apaga e tenta de novo."><View style={{alignItems:'center'}}><Tuca size={120}/></View>
 {session.status==='retry-required'&&<Card title="Vamos reconectar?"><Notice>Não foi possível restaurar a sessão. Conecte-se para continuar.</Notice><Button title="Tentar de novo" secondary onPress={()=>void client.restore().catch(()=>setError('Ainda não foi possível conectar.'))}/></Card>}
 {session.status==='storage-error'&&<Card title="Vamos proteger sua sessão"><Notice>Não foi possível limpar a sessão anterior neste aparelho.</Notice><Button title="Tentar limpar sessão" secondary onPress={()=>void client.logout().catch(()=>setError('A limpeza precisa ser repetida.'))}/></Card>}
 <Card><View style={{flexDirection:'row',gap:tokens.space[2]}}>{(['login','register'] as const).map(item=><Pressable key={item} accessibilityRole="tab" accessibilityState={{selected:mode===item}} onPress={()=>{setMode(item);setFields({});setError(undefined);}} style={{flex:1,minHeight:tokens.size['touch-kids'],justifyContent:'center',alignItems:'center',padding:tokens.space[2],borderRadius:tokens.radius.full,backgroundColor:mode===item?colors.surface:colors.soft,borderWidth:2,borderColor:mode===item?colors.info:colors.line}}><Text style={{color:colors.ink,fontFamily:'Nunito',fontSize:tokens.type.body.mobile[0],fontWeight:'800'}}>{item==='login'?'Entrar':'Criar conta'}</Text></Pressable>)}</View>
 {mode==='register'&&<Field ref={nameRef} label="Seu nome" autoComplete="name" autoCapitalize="words" value={name} onChangeText={setName} error={fields.name} maxLength={120}/>}
 <Field ref={emailRef} label="E-mail" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} error={fields.email} maxLength={254}/>
 <Field ref={passwordRef} label="Senha" autoComplete={mode==='register'?'new-password':'current-password'} secureTextEntry value={password} onChangeText={setPassword} error={fields.password} maxLength={72} onSubmitEditing={()=>void submit()}/>
 {error&&<Notice>{error}</Notice>}
 <Button title={busy?(mode==='register'?'Criando conta…':'Entrando…'):(mode==='register'?'Criar conta':'Entrar')} disabled={busy||session.status==='storage-error'} onPress={()=>void submit()}/>
 <Button title="Esqueci a senha" secondary onPress={()=>router.push('/recovery')}/>
 </Card></Screen>;
}
