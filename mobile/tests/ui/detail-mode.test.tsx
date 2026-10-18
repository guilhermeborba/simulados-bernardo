/// <reference types="jest" />
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react-native';
import Detail from '../../app/detail/[id]';
let mockMode: 'new' | 'immediate' | 'legacy' = 'new';
const mockSimulation = { id:'simulation',title:'Simulado de teste',schoolYear:3,bimester:1,assessment:'AV1',totalQuestions:30 };
jest.mock('expo-router',()=>({router:{push:jest.fn(),replace:jest.fn(),canGoBack:()=>false},useLocalSearchParams:()=>({id:'simulation'}),usePathname:()=>'/detail/simulation'}));
jest.mock('../../src/session-context',()=>({useSession:()=>({session:{status:'authenticated',generation:1,user:{id:'student',role:'STUDENT'}}})}));
jest.mock('../../src/data',()=>({useRemote:(path:string)=>({loading:false,error:null,reload:jest.fn(),data:path==='/me/attempts'?(mockMode==='new'?[]:[{id:'attempt',simulationId:'simulation',status:'IN_PROGRESS'}]):path==='/attempts/attempt'?{id:'attempt',simulationId:'simulation',status:'IN_PROGRESS',immediateFeedback:mockMode==='immediate'}:mockSimulation})}));
jest.mock('../../src/theme',()=>{const source=require('../../src/generated/tokens').tokens;return{tokens:source,useTheme:()=>({colors:Object.fromEntries(Object.entries(source.color.light).map(([key,value]:[string,any])=>[key,value.value])),timer:true,tokens:source})};});
jest.mock('react-native-safe-area-context',()=>{const{View}=require('react-native');return{SafeAreaView:({children,...props}:any)=><View {...props}>{children}</View>};});
jest.mock('react-native-svg',()=>({SvgXml:()=>null}));
afterEach(cleanup);
test.each(['new','immediate'] as const)('detail explains correction after confirming for a %s attempt',async(mode)=>{
 mockMode=mode;await render(<Detail/>);
 expect(screen.getByText(/Confirme cada resposta para ver a correção\./)).toBeTruthy();
 expect(screen.queryByText(/Esta tentativa mantém a correção ao finalizar/)).toBeNull();
});
test('detail preserves the finish-first explanation for a legacy continuation',async()=>{
 mockMode='legacy';await render(<Detail/>);
 expect(screen.getByText(/Esta tentativa mantém a correção ao finalizar/)).toBeTruthy();
 expect(screen.getByRole('button',{name:'Continuar'})).toBeTruthy();
 expect(screen.queryByText(/Confirme cada resposta para ver a correção\./)).toBeNull();
});
