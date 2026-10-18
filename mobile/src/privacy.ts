/** Never display an e-mail address in a child leaderboard, even if the API sends one as a name. */
export function privateRankingName(value: string): string {
 if (!value || value.includes('@')) return 'Estudante';
 const parts=value.trim().split(/\s+/);
 return `${parts[0]||'Estudante'}${parts.length>1?` ${Array.from(parts.at(-1)||'')[0]}.`:''}`;
}
