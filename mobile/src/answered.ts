import { useEffect, useState } from 'react';
import { useSession } from './session-context';
import type { ApiQuestion } from './data';
/** Answers saved in each unfinished attempt (-1 when unreadable); `null` while loading. An attempt without answers is still new. */
export function useAnsweredCounts(ids:string[]){
 const{client,session}=useSession();const key=ids.join(',');const[state,setState]=useState<{key:string;value:Record<string,number>}|null>(null);
 useEffect(()=>{if(!key)return;let active=true;void Promise.all(key.split(',').map(id=>client.request<ApiQuestion[]>(`/attempts/${encodeURIComponent(id)}/questions`).then(qs=>[id,qs.filter(q=>q.answer!==null&&q.answer!==undefined).length] as const,()=>[id,-1] as const))).then(entries=>{if(active)setState({key,value:Object.fromEntries(entries)});});return()=>{active=false;};},[client,key,session.generation]);
 return !key?{}:state?.key===key?state.value:null;
}
