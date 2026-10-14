function origin(raw: string): string {
  const value = new URL(raw);
  if (
    !["https:", "http:"].includes(value.protocol) ||
    value.username ||
    value.password ||
    value.pathname !== "/" ||
    value.search ||
    value.hash
  )
    throw new Error("Origem de ambiente inválida.");
  if (!__DEV__ && value.protocol !== "https:")
    throw new Error("A versão distribuída exige HTTPS.");
  return value.origin;
}
export const environment = {
  apiOrigin: origin(
    process.env.EXPO_PUBLIC_API_URL ?? "https://api.example.invalid",
  ),
  webOrigin: origin(
    process.env.EXPO_PUBLIC_WEB_ORIGIN ?? "https://web.example.invalid",
  ),
};
