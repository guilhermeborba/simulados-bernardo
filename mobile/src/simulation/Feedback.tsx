import React from 'react';
import { View } from 'react-native';
import { Copy, Heading, Icon } from '../ui';
import { useTheme, tokens } from '../theme';
export function Feedback({correct,children}:{correct:boolean;children:React.ReactNode}){const{colors:c}=useTheme();return <View style={{padding:tokens.space[4],gap:tokens.space[2],backgroundColor:correct?c['ok-bg']:c['hl-bg'],borderRadius:tokens.radius.md}}><View style={{flexDirection:'row',gap:tokens.space[2],alignItems:'center'}}><Icon name={correct?'spark':'bulb'}/><Heading level={3}>{correct?'Você sabia?':'Dica de Ouro'}</Heading></View><Copy>{children}</Copy></View>;}
