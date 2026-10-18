import Constants from "expo-constants";
import { publicScreenPath } from "../src/navigation/public-path";
import { readEntryLink, receiveEntryLink } from "../src/navigation/links";
import { environment } from "../src/config";
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  const entry = readEntryLink(path, environment.webOrigin);
  if (entry) {
    receiveEntryLink(entry);
    return "/entry";
  }
  // Read the installed variant, keeping development and internal schemes isolated.
  return publicScreenPath(path, Constants.expoConfig?.scheme);
}
