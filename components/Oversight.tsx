'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, getOversightStudents, getStudentLearningProgress, getStudentSummary, getStudentDisciplineSummary, type ApiOversightStudent, type ApiStudentLearningProgress, type ApiStudentSummary, type ApiStudentDisciplineSummary } from '@/lib/apiClient';
import { QUIZ_SEGMENTS, quizYearLabel } from '@/lib/quiz-segments';
import QuizNavigation from './QuizNavigation';
import SkillProgressCard from './SkillProgressCard';
import styles from './LearningProgress.module.css';

const OVERSIGHT_ROLES = ['GUARDIAN', 'TEACHER', 'ADMIN'];
type StudentRecords = { progress: ApiStudentLearningProgress; summary: ApiStudentSummary; disciplines: ApiStudentDisciplineSummary[] };

export default function Oversight() {
  const { user, isLoading, getSessionGeneration } = useAuth();
  if (isLoading) return <div className={styles.shell}><p role="status">Carregando sua conta…</p></div>;
  if (!user || !OVERSIGHT_ROLES.includes(user.role)) return <div className={styles.shell}><QuizNavigation current="oversight" /><main className={styles.main}><h1>Acompanhamento</h1><p>Esta área está disponível para responsáveis, professores e administradores com acesso aos alunos.</p><Link className={styles.link} href={user ? '/' : '/login?returnTo=/acompanhamento'}>{user ? 'Voltar para o início' : 'Entrar na minha conta'} →</Link></main></div>;
  return <AuthorizedOversight key={`${user.id}:${getSessionGeneration()}`} role={user.role} />;
}

function AuthorizedOversight({ role }: { role: string }) {
  const { getSessionGeneration } = useAuth();
  const [students, setStudents] = useState<ApiOversightStudent[] | null>(null);
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [records, setRecords] = useState<{ studentId: string; year: number | null; generation: number; data: StudentRecords } | null>(null);
  const [recordsError, setRecordsError] = useState<{ studentId: string; year: number | null; generation: number; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const generation = getSessionGeneration();
  const student = students?.find(item => item.id === studentId);

  useEffect(() => {
    const controller = new AbortController();
    const currentGeneration = getSessionGeneration();
    setStudents(null); setListError(null); setRecords(null); setRecordsError(null);
    void getOversightStudents(controller.signal).then(data => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setStudents(data);
      setStudentId(current => data.some(item => item.id === current) ? current : data[0]?.id ?? '');
    }).catch(cause => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setListError(accessMessage(cause, 'Não foi possível carregar os alunos. Tente novamente.'));
    });
    return () => controller.abort();
  }, [retry, getSessionGeneration]);

  useEffect(() => {
    if (!student) return;
    const controller = new AbortController();
    const currentGeneration = getSessionGeneration();
    const selectedId = student.id;
    setRecords(null); setRecordsError(null);
    void Promise.all([
      getStudentLearningProgress(selectedId, year ?? undefined, controller.signal),
      getStudentSummary(selectedId, controller.signal),
      getStudentDisciplineSummary(selectedId, controller.signal),
    ]).then(([progress, summary, disciplines]) => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setRecords({ studentId: selectedId, year, generation: currentGeneration, data: { progress, summary, disciplines } });
    }).catch(cause => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setRecords(null);
      setRecordsError({ studentId: selectedId, year, generation: currentGeneration, message: accessMessage(cause, 'Não foi possível carregar o acompanhamento. Tente novamente.') });
    });
    return () => controller.abort();
  }, [student, year, getSessionGeneration]);

  const data = student && records?.studentId === student.id && records.year === year && records.generation === generation ? records.data : null;
  const error = student && recordsError?.studentId === student.id && recordsError.year === year && recordsError.generation === generation ? recordsError.message : null;
  const effectiveYear = year ?? data?.progress.schoolYear ?? student?.schoolYear ?? null;
  return <div className={styles.shell}>
    <QuizNavigation current="oversight" />
    <main className={styles.main}>
      <header className={styles.hero}><div className={styles.heroBody}>
        <p className={styles.eyebrow}>Registros para acompanhar a aprendizagem</p><h1>Acompanhamento</h1>
        <p>Consulte o histórico de simulados e os registros de prática por habilidade. São informações separadas para apoiar o acompanhamento de cada aluno.</p>
        <p className={styles.hint}>{role === 'TEACHER' ? 'Você acompanha somente os alunos das turmas atribuídas à sua conta. Os registros exibidos incluem atividades públicas e atividades dessas turmas; conteúdos de outras turmas ficam fora deste acompanhamento.' : role === 'GUARDIAN' ? 'Você acompanha somente os alunos vinculados à sua conta de responsável.' : 'Esta conta administrativa acompanha os alunos ativos autorizados pela plataforma.'}</p>
      </div></header>
      {listError ? <Failure message={listError} reload={() => setRetry(value => value + 1)} /> : !students ? <p className={styles.loading} role="status">Carregando alunos…</p> : students.length === 0 ? <section className={styles.section}><h2>Nenhum aluno disponível</h2><p>{role === 'GUARDIAN' ? 'Solicite à administração o vínculo com o aluno que você acompanha.' : role === 'TEACHER' ? 'Solicite à administração a atribuição das turmas que você acompanha.' : 'Nenhum aluno ativo está disponível para acompanhamento.'}</p><button className={styles.secondary} type="button" onClick={() => setRetry(value => value + 1)}>Atualizar alunos</button></section> : <>
        <div className={styles.controls}>
          <label className={styles.yearField}>Aluno para acompanhar<select value={studentId} onChange={event => { setStudentId(event.target.value); setYear(null); }}><option value="" disabled>Escolha um aluno</option>{students.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className={styles.yearField}>Ano ou idade para as habilidades<select value={effectiveYear ?? ''} onChange={event => setYear(event.target.value === '' ? null : Number(event.target.value))}><option value="">Usar faixa do aluno</option>{QUIZ_SEGMENTS.map(segment => <optgroup key={segment.value} label={segment.label}>{segment.years.map(value => <option key={value} value={value}>{quizYearLabel(value)}</option>)}</optgroup>)}</select></label>
          <button className={styles.secondary} type="button" onClick={() => setRetry(value => value + 1)}>Atualizar acompanhamento</button>
        </div>
        {student && <p className={styles.hint}>{student.name}{student.turmas.length > 0 ? ` · ${student.turmas.map(turma => turma.name).join(' · ')}` : ''}</p>}
        {error ? <Failure message={error} reload={() => setRetry(value => value + 1)} /> : !data ? <p className={styles.loading} role="status">Carregando acompanhamento…</p> : <>
          <section className={styles.section} aria-labelledby="assessment-title"><div className={styles.sectionHeading}><h2 id="assessment-title">Simulados concluídos</h2><p>Resultados das tentativas de simulado acessíveis. Quizzes e revisões ficam fora dessas médias; cada tentativa concluída conta neste histórico.</p></div>
            {data.summary.totalFinishedAttempts === 0 ? <div className={styles.empty}><h3>Ainda não há simulados concluídos disponíveis.</h3><p>Os resultados aparecem quando o aluno conclui um simulado acessível a esta conta.</p></div> : <>
              <dl className={styles.stats}><div><dt>Simulados concluídos</dt><dd>{data.summary.totalFinishedAttempts}</dd></div><div><dt>Média dos simulados</dt><dd>{formatPercentage(data.summary.averagePercentage)}</dd></div><div><dt>Melhor resultado</dt><dd>{formatPercentage(data.summary.bestPercentage)}</dd></div></dl>
              <div className={styles.grid}>{data.disciplines.map(discipline => <article className={styles.skill} key={discipline.disciplineId}><h3>{discipline.discipline}</h3><dl className={styles.counts}><div><dt>Tentativas</dt><dd>{discipline.attempts}</dd></div><div><dt>Média</dt><dd>{formatPercentage(discipline.averagePercentage)}</dd></div><div><dt>Melhor resultado</dt><dd>{formatPercentage(discipline.bestPercentage)}</dd></div></dl></article>)}</div>
              <h3 className={styles.recentHeading}>Simulados recentes</h3><ul className={styles.attemptList}>{data.summary.lastAttempts.map(attempt => <li key={attempt.id}><div><strong>{attempt.simulation.title}</strong><p>{attempt.simulation.discipline.name}{attempt.finishedAt ? ` · ${formatDate(attempt.finishedAt)}` : ''}</p></div><span>{formatPercentage(Number(attempt.percentage ?? 0))}</span></li>)}</ul>
            </>}
          </section>
          <section className={styles.section} aria-labelledby="practice-title"><div className={styles.sectionHeading}><h2 id="practice-title">Prática por habilidade</h2><p>{effectiveYear === null ? 'Selecione um ano ou idade para consultar as habilidades.' : `Registros de prática para ${quizYearLabel(effectiveYear)}.`}</p></div>
            <p className={styles.limits}>Primeiras respostas, repetições e revisões têm contagens separadas. Cinco perguntas diferentes com primeira resposta reúnem registros iniciais, sem comprovar domínio. Repetições não aumentam essa evidência. XP, missões e itens não são avaliação.</p>
            {data.progress.unclassifiedQuestions > 0 && <p className={styles.hint}>{data.progress.unclassifiedQuestions} {data.progress.unclassifiedQuestions === 1 ? 'pergunta praticada ainda não tem' : 'perguntas praticadas ainda não têm'} classificação de habilidade.</p>}
            {data.progress.skills.length === 0 ? <div className={styles.empty}><h3>Ainda não há registros classificados nesta faixa.</h3><span className={styles.status}>Evidência insuficiente</span><p>O histórico não foi associado a habilidades por suposição.</p></div> : <><dl className={styles.stats}><div><dt>Primeiras respostas</dt><dd>{data.progress.skills.reduce((sum, skill) => sum + skill.firstResponse.questions, 0)}</dd></div><div><dt>Repetições</dt><dd>{data.progress.skills.reduce((sum, skill) => sum + skill.repeat.responses, 0)}</dd></div><div><dt>Respostas em revisão</dt><dd>{data.progress.skills.reduce((sum, skill) => sum + skill.review.responses, 0)}</dd></div></dl><div className={styles.grid}>{data.progress.skills.map(skill => <SkillProgressCard key={`${skill.code}:${skill.version}`} skill={skill} />)}</div></>}
          </section>
        </>}
      </>}
      <footer className={styles.footer}><Link href="/" className={styles.link}>Voltar para o início →</Link></footer>
    </main>
  </div>;
}
function Failure({ message, reload }: { message: string; reload: () => void }) {
  return <div className={styles.error} role="alert"><p>{message}</p><button className={styles.secondary} type="button" onClick={reload}>Tentar novamente</button><Link href="/login?returnTo=/acompanhamento">Entrar novamente</Link></div>;
}
function accessMessage(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.status === 401) return 'Sua sessão expirou. Entre novamente para acompanhar os alunos.';
  if (cause instanceof ApiError && [403, 404].includes(cause.status)) return 'Este acompanhamento não está disponível para sua conta. Atualize a lista de alunos ou consulte a administração.';
  return fallback;
}
function formatPercentage(value: number) { return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(value)); }
