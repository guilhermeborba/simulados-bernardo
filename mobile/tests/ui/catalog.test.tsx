/// <reference types="jest" />
import React from 'react';
import { StyleSheet } from 'react-native';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import Simulations from '../../app/simulations';
import Home from '../../app/index';
let mockAttempts: any[] = [];
let mockTrack: 'kids' | 'escola' | 'tecnico' = 'kids';
const mockPush=jest.fn();
const mockCatalog=[
 {id:'geo-av1',title:'Mapas e caminhos',subtitle:null,schoolYear:3,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'geo',name:'Geografia'}},
 {id:'geo-av2',title:'Mapas da nossa escola',subtitle:null,schoolYear:3,bimester:2,assessment:'AV2',totalQuestions:30,discipline:{id:'geo',name:'Geografia'}},
 {id:'math-av1',title:'Caminhos dos números',subtitle:null,schoolYear:3,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'math',name:'Matemática'}},
 {id:'hist-7',title:'Brasil colonial',subtitle:null,schoolYear:7,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'hist',name:'História'}},
 {id:'bio-2em',title:'Genética',subtitle:null,schoolYear:11,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'bio',name:'Biologia'}},
 {id:'technical',title:'Conteúdo técnico',subtitle:null,schoolYear:0,bimester:0,assessment:'AV1',totalQuestions:30,discipline:{id:'tech',name:'Técnico'}},
];
jest.mock('expo-router',()=>({router:{push:(...args:unknown[])=>mockPush(...args),replace:jest.fn()},usePathname:()=>'/simulations'}));
jest.mock('../../src/session-context',()=>({useSession:()=>({session:{status:'authenticated',generation:1,user:{id:'test-user',name:'Pessoa de teste',role:'STUDENT'}}})}));
jest.mock('../../src/data',()=>({useRemote:(path:string)=>({data:path==='/me/attempts'?mockAttempts:path==='/me/pontuacao'?null:mockCatalog,error:null,loading:false,reload:jest.fn()})}));
jest.mock('../../src/Auth',()=>()=>null);
jest.mock('../../src/theme',()=>{const source=require('../../src/generated/tokens').tokens;return{tokens:source,useTheme:()=>({colors:Object.fromEntries(Object.entries(source.color.light).map(([key,value]:[string,any])=>[key,value.value])),tokens:source,ready:true,track:mockTrack})};});
jest.mock('react-native-safe-area-context',()=>{const{View}=require('react-native');return{SafeAreaView:({children,...props}:any)=><View {...props}>{children}</View>};});
jest.mock('react-native-svg',()=>({SvgXml:()=>null}));
afterEach(()=>{cleanup();mockTrack='kids';});
test.each([[390,'100%'],[768,'50%'],[1440,`${100/3}%`]])('catalog at %i uses cells %s wide with unrestricted text scaling',async(width,expected)=>{
 const native=require('react-native');
 const dimensions=jest.spyOn(native,'useWindowDimensions').mockReturnValue({width,height:1024,scale:1,fontScale:2});
 try {
  await render(<Simulations/>);
  const cells=screen.getAllByTestId('simulation-grid-cell');
  expect(cells).toHaveLength(3);
  expect(StyleSheet.flatten(cells[0].props.style)).toMatchObject({width:expected,minWidth:0});
  expect(screen.queryByText('Conteúdo técnico')).toBeNull();
 } finally { dimensions.mockRestore(); }
});
test('search intersects chips, reset clears both, and the entire card opens its detail',async()=>{
 await render(<Simulations/>);
 await fireEvent.changeText(screen.getByLabelText('Buscar simulados'),'Mapas');
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(2);
 await fireEvent.press(screen.getByRole('button',{name:'AV1'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 await fireEvent.press(screen.getByRole('button',{name:/Mapas e caminhos, 3º ano/}));
 expect(mockPush).toHaveBeenCalledWith({pathname:'/detail/[id]',params:{id:'geo-av1'}});
 expect(screen.queryByRole('button',{name:'Ver simulado'})).toBeNull();
 await fireEvent.press(screen.getByRole('button',{name:'Limpar filtros'}));
 expect(screen.getByLabelText('Buscar simulados').props.value).toBe('');
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(3);
});

test.each([false,true])('home resumes only available Kids simulations (has Kids attempt: %s)',async(hasKids)=>{
 mockAttempts=[{id:'technical-attempt',simulationId:'technical',status:'IN_PROGRESS',simulation:{title:'Em andamento técnico'}},...(hasKids?[{id:'kids-attempt',simulationId:'geo-av1',status:'IN_PROGRESS',simulation:{title:'Mapas e caminhos'}}]:[])];
 await render(<Home/>);
 expect(Boolean(screen.queryByText('Continuar de onde parou'))).toBe(hasKids);
 if(hasKids){
  await fireEvent.press(screen.getByRole('button',{name:'Continuar'}));
  expect(mockPush).toHaveBeenLastCalledWith({pathname:'/simulation/[id]',params:{id:'geo-av1',attempt:'kids-attempt'}});
 }
});

test('Giz Escola lists only Fundamental II and Médio, with year chips by série',async()=>{
 mockTrack='escola';
 await render(<Simulations/>);
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(2);
 expect(screen.queryByText('Mapas e caminhos')).toBeNull();
 await fireEvent.press(screen.getByRole('button',{name:'2ª série'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 expect(screen.getByRole('button',{name:/Genética, 2ª série/})).toBeTruthy();
});
test('Giz Técnico lists the technical course without a year filter',async()=>{
 mockTrack='tecnico';
 await render(<Simulations/>);
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 expect(screen.getByRole('button',{name:/Conteúdo técnico, Curso técnico/})).toBeTruthy();
 expect(screen.queryByText('Ano')).toBeNull();
});
