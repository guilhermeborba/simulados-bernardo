/// <reference types="jest" />
import React from 'react';
import { StyleSheet } from 'react-native';
import { cleanup, render, screen } from '@testing-library/react-native';
import { tokens } from '../../src/generated/tokens';
import { Copy, Loading, Screen } from '../../src/ui';
const palette = Object.fromEntries(Object.entries(tokens.color.light).map(([key,value])=>[key,value.value]));
jest.mock('expo-router',()=>({router:{push:jest.fn(),replace:jest.fn(),back:jest.fn(),canGoBack:()=>false},usePathname:()=>'/'}));
jest.mock('../../src/session-context',()=>({useSession:()=>({session:{status:'authenticated',generation:1,user:{id:'test-user',name:'Pessoa de teste',role:'STUDENT'}}})}));
jest.mock('../../src/theme',()=>{const source=require('../../src/generated/tokens').tokens;return{tokens:source,useTheme:()=>({colors:Object.fromEntries(Object.entries(source.color.light).map(([key,value]:[string,any])=>[key,value.value])),tokens:source,theme:'light',timer:true})};});
jest.mock('react-native-safe-area-context',()=>{const{View}=require('react-native');return{SafeAreaView:({children,...props}:any)=><View testID="safe-area" {...props}>{children}</View>};});
jest.mock('react-native-svg',()=>({SvgXml:()=>null}));
afterEach(cleanup);
test('phone shell has exactly four accessible navigation tabs and a dark status safe area',async()=>{
 await render(<Screen title="Eu"><Copy>Conteúdo</Copy></Screen>);
 expect(screen.getAllByRole('tab').map(item=>item.props.accessibilityLabel)).toEqual(['Início','Simulados','Ranking','Eu']);
 expect(StyleSheet.flatten(screen.getAllByTestId('safe-area')[0].props.style).backgroundColor).toBe(palette.head);
});
test('flow screens hide tab navigation while preserving the fixed footer action',async()=>{
 await render(<Screen title="Questão" flow footer={<Copy>Ação fixa</Copy>}><Copy>Enunciado</Copy></Screen>);
 expect(screen.queryAllByRole('tab')).toHaveLength(0);
 expect(screen.getByText('Ação fixa')).toBeTruthy();
 expect(screen.getByLabelText('Voltar')).toBeTruthy();
});
test('loading uses static skeletons with no busy spinner',async()=>{
 await render(<Loading/>);
 expect(screen.getByRole('progressbar').props.accessibilityLabel).toBe('Carregando');
 expect(screen.queryByText('ActivityIndicator')).toBeNull();
});

test.each([[768,72],[1440,240]])('wide shell at %i uses the %i px side navigation',async(width,expected)=>{
 const native=require('react-native');
 const dimensions=jest.spyOn(native,'useWindowDimensions').mockReturnValue({width,height:1024,scale:1,fontScale:2});
 try {
  await render(<Screen title="Simulados"><Copy>Conteúdo ampliado</Copy></Screen>);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(StyleSheet.flatten(screen.getAllByTestId('safe-area')[1].props.style).width).toBe(expected);
 } finally { dimensions.mockRestore(); }
});
