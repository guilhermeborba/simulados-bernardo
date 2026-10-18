import type { ApiSkillProgress } from '@/lib/apiClient';
import { quizYearLabel } from '@/lib/quiz-segments';
import styles from './LearningProgress.module.css';

export default function SkillProgressCard({ skill }: { skill: ApiSkillProgress }) {
  return <article className={styles.skill} aria-labelledby={`skill-${skill.code}-${skill.version}`}>
    <p className={styles.skillMeta}>{skill.discipline.name} · {quizYearLabel(skill.schoolYear)}</p><h3 id={`skill-${skill.code}-${skill.version}`}>{skill.title}</h3>
    <span className={styles.status}>{skill.evidence === 'INSUFFICIENT' ? 'Evidência insuficiente' : 'Registros iniciais'}</span>
    <dl className={styles.counts}><div><dt>Primeiras respostas</dt><dd>{skill.firstResponse.correct} / {skill.firstResponse.questions} corretas</dd></div><div><dt>Repetições</dt><dd>{skill.repeat.correct} / {skill.repeat.responses} corretas</dd></div><div><dt>Revisões</dt><dd>{skill.review.correct} / {skill.review.responses} corretas</dd></div></dl>
    <p className={styles.evidence}>{skill.firstResponse.questions} perguntas diferentes com primeira resposta · {skill.review.differentQuestions} perguntas diferentes praticadas em revisão. {skill.evidence === 'INSUFFICIENT' ? 'Ainda precisamos de mais primeiras respostas para reunir registros iniciais.' : 'Os registros mostram esta prática, sem comprovar domínio da habilidade.'}</p>
    {skill.lastPracticedAt && <p className={styles.hint}>Última prática: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(skill.lastPracticedAt))}</p>}
  </article>;
}
