import { readEntryLink, receiveEntryLink, readPublicAppPath } from '../src/navigation/links';
import { environment } from '../src/config';
export function redirectSystemPath({path}:{path:string;initial:boolean}) {
 const entry=readEntryLink(path,environment.webOrigin);
 if(entry){receiveEntryLink(entry);return '/entry';}
 return readPublicAppPath(path,environment.appScheme)||'/';
}
