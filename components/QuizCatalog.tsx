'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import { getAvailableQuizzes, type ApiQuiz } from '@/lib/apiClient';
import { QUIZ_SEGMENTS, quizAudiencePatch, quizSegmentForYear, quizTierForPreferences, quizYearLabel, quizYearPatch, type QuizSegment } from '@/lib/quiz-segments';
import MascoteGuia from './MascoteGuia';
import QuizPreferencesControls from './QuizPreferencesControls';
import QuizNavigation from './QuizNavigation';
import styles from './QuizCatalog.module.css';

interface CatalogState { ownerId: string | null; schoolYear: number | null; quizzes: ApiQuiz[]; loading: boolean; error: boolean }

export default function QuizCatalog() {
  const { user, isLoading: authLoading } = useAuth();
  const { preferences, isLoading: preferencesLoading, isSaving, error: preferencesError, updatePreferences, reload } = useLearningPreferences();
  const [catalog, setCatalog] = useState<CatalogState>({ ownerId: null, schoolYear: null, quizzes: [], loading: true, error: false });
  const [retry, setRetry] = useState(0);
  const [discipline, setDiscipline] = useState('');
  const [topic, setTopic] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);
  const userId = user?.id ?? null;
  const year = preferences.schoolYear;
  const segment = QUIZ_SEGMENTS.find((item) => item.value === preferences.segment);
  const tier = quizTierForPreferences(preferences);
  const preferencesDisabled = preferencesLoading || isSaving;

  useEffect(() => {
    if (!userId || preferencesLoading) return;
    let current = true;
    setCatalog({ ownerId: userId, schoolYear: year, quizzes: [], loading: true, error: false });
    getAvailableQuizzes(year === null ? {} : { schoolYear: year })
      .then((quizzes) => { if (current) setCatalog({ ownerId: userId, schoolYear: year, quizzes, loading: false, error: false }); })
      .catch(() => { if (current) setCatalog({ ownerId: userId, schoolYear: year, quizzes: [], loading: false, error: true }); });
    return () => { current = false; };
  }, [userId, preferencesLoading, year, retry]);

  useEffect(() => { setDiscipline(''); setTopic(''); setVisibleCount(9); }, [userId, preferences.segment, year]);

  const currentCatalog = catalog.ownerId === userId && catalog.schoolYear === year;
  const audienceQuizzes = useMemo(() => currentCatalog ? catalog.quizzes.filter((quiz) => !preferences.segment || quizSegmentForYear(quiz.schoolYear) === preferences.segment) : [], [catalog.quizzes, currentCatalog, preferences.segment]);
  const disciplines = useMemo(() => Array.from(new Map(audienceQuizzes.map((quiz) => [quiz.discipline.slug, quiz.discipline.name])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')), [audienceQuizzes]);
  const topics = useMemo(() => Array.from(new Set(audienceQuizzes.filter((quiz) => !discipline || quiz.discipline.slug === discipline).map((quiz) => quiz.topic).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'pt-BR')), [audienceQuizzes, discipline]);
  const filtered = audienceQuizzes.filter((quiz) => (!discipline || quiz.discipline.slug === discipline) && (!topic || quiz.topic === topic));
  const loading = authLoading || preferencesLoading || !currentCatalog || catalog.loading;
  const saveAudience = (value: QuizSegment | null) => { void updatePreferences(quizAudiencePatch(value)).catch(() => undefined); };

  if (authLoading) return <div className={styles.shell} role="status">Carregando sua conta…</div>;
  if (!user) return <div className={styles.shell}><h1>Quizzes para aprender no seu ritmo</h1><p>Entre na sua conta para explorar os quizzes disponíveis.</p><Link href="/login?returnTo=/quizzes" className={styles.primaryButton}>Entrar</Link></div>;

  return (
    <div className={styles.shell} data-tier={tier} data-reduced-motion={!preferences.motionEnabled || undefined}>
      <QuizNavigation current="catalog" />
      <main className={styles.main}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>PEQUENAS RODADAS, NOVAS DESCOBERTAS</p>
            <h1>{preferences.segment === 'INFANTIL' ? 'Vamos descobrir juntos?' : tier === 'exame' ? 'Uma pausa para aprender.' : 'O que vamos descobrir hoje?'}</h1>
            <p>{preferences.segment === 'INFANTIL' ? 'O Bolinha acompanha você em quizzes com imagens e leitura em voz alta.' : 'Escolha um tema, responda algumas questões e entenda cada resposta. Sem pressa.'}</p>
            <div className={styles.heroBadges}><span>Poucas questões</span><span>Explicação a cada resposta</span><span>No seu ritmo</span></div>
          </div>
          {tier === 'ludico' ? <div className={styles.mascot} aria-hidden="true"><MascoteGuia variant={preferences.segment === 'INFANTIL' ? 'bolinha' : 'capelo'} size={132} /></div> : <div className={styles.heroDrawing} aria-hidden="true"><QuizCardIllustration /></div>}
        </header>

        <section className={styles.audienceSection} aria-labelledby="quiz-audience-heading">
          <div className={styles.sectionHeading}><h2 id="quiz-audience-heading">Escolha sua faixa</h2><p>Esta escolha fica salva na sua conta.</p></div>
          <div className={styles.audienceGrid}>
            <button type="button" className={styles.audienceButton} aria-pressed={preferences.segment === null} disabled={preferencesDisabled} onClick={() => saveAudience(null)}><strong>Todas as faixas</strong><span>Explorar o catálogo</span></button>
            {QUIZ_SEGMENTS.map((item) => <button key={item.value} type="button" className={styles.audienceButton} aria-pressed={preferences.segment === item.value} disabled={preferencesDisabled} onClick={() => saveAudience(item.value)}><strong>{item.label}</strong><span>{item.description}</span></button>)}
          </div>
          <div className={styles.filterRow}>
            <label className={styles.field}>Ano ou idade
              <select aria-label="Ano ou idade" value={year ?? ''} disabled={preferencesDisabled} onChange={(event) => { const value = event.target.value === '' ? null : Number(event.target.value); void updatePreferences(quizYearPatch(value, preferences.segment)).catch(() => undefined); }}>
                <option value="">{segment ? `Todos — ${segment.label}` : 'Todos os anos e idades'}</option>
                {(segment ? segment.years : QUIZ_SEGMENTS.flatMap((item) => [...item.years])).map((item) => <option value={item} key={item}>{quizYearLabel(item)}</option>)}
              </select>
            </label>
            <label className={styles.field}>Disciplina
              <select value={discipline} onChange={(event) => { setDiscipline(event.target.value); setTopic(''); setVisibleCount(9); }}><option value="">Todas as disciplinas</option>{disciplines.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
            </label>
            <label className={styles.field}>Tema
              <select value={topic} onChange={(event) => { setTopic(event.target.value); setVisibleCount(9); }}><option value="">Todos os temas</option>{topics.map((value) => <option value={value} key={value}>{value}</option>)}</select>
            </label>
          </div>
          {isSaving && <p role="status" className={styles.hint}>Salvando sua escolha…</p>}
          {preferencesError && <div className={styles.error} role="alert"><p>{preferencesError}</p><button type="button" className={styles.textButton} disabled={preferencesDisabled} onClick={() => { void reload(); }}>Recarregar preferências</button></div>}
        </section>

        <div className={styles.catalogHeading}><h2>{segment ? `Quizzes · ${segment.label}` : 'Encontre seu próximo quiz'}</h2><QuizPreferencesControls /></div>
        {user.role !== 'STUDENT' && <p className={styles.notice}>Você pode explorar o catálogo. A realização de quizzes e o histórico estão disponíveis para contas de aluno.</p>}
        {loading ? <div className={styles.empty} role="status">Carregando quizzes…</div> : catalog.error ? <div className={styles.empty} role="alert"><h3>Não foi possível carregar os quizzes.</h3><p>Tente novamente para consultar o catálogo.</p><button type="button" className={styles.primaryButton} onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button></div> : filtered.length === 0 ? <div className={styles.empty}><div className={styles.emptyMark} aria-hidden="true">?</div><h3>Ainda não há quizzes disponíveis para esta escolha.</h3><p>Explore outra faixa ou remova os filtros para encontrar um tema.</p>{(discipline || topic) && <button type="button" className={styles.textButton} onClick={() => { setDiscipline(''); setTopic(''); }}>Limpar disciplina e tema</button>}</div> : <>
          <p className={styles.resultCount} aria-live="polite">{filtered.length} {filtered.length === 1 ? 'quiz disponível' : 'quizzes disponíveis'}{year !== null ? ` · ${quizYearLabel(year)}` : ''}</p>
          <div className={styles.cardGrid}>
            {filtered.slice(0, visibleCount).map((quiz, index) => <article key={quiz.id} className={styles.quizCard} data-color={index % 4}>
              <div className={styles.cardTop}><span className={styles.disciplineTag}>{quiz.discipline.name}</span><span className={styles.cardNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
              <p className={styles.yearTag}>{quizYearLabel(quiz.schoolYear)}</p>
              <h3>{quiz.title}</h3>
              {quiz.topic && <p className={styles.cardTopic}>{quiz.topic}</p>}
              <div className={styles.cardDetails}><span>{quiz.totalQuestions} questões</span>{quiz.estimatedDurationMinutes !== null && <span>Cerca de {quiz.estimatedDurationMinutes} min</span>}</div>
              {user.role === 'STUDENT' ? <Link href={`/quiz/${encodeURIComponent(quiz.id)}`} className={styles.cardLink} aria-label={`Começar quiz: ${quiz.title}`}>Começar quiz <span aria-hidden="true">→</span></Link> : <p className={styles.hint}>Disponível para alunos</p>}
            </article>)}
          </div>
          {visibleCount < filtered.length && <div className={styles.more}><button type="button" className={styles.secondaryButton} onClick={() => setVisibleCount((value) => value + 9)}>Mostrar mais quizzes</button></div>}
        </>}
      </main>
    </div>
  );
}

function QuizCardIllustration() {
  return <svg viewBox="0 0 200 170" width="180" height="153"><rect x="25" y="24" width="133" height="132" rx="20" fill="#d8cdf4" transform="rotate(-8 90 90)" /><rect x="44" y="15" width="133" height="132" rx="20" fill="#fff" stroke="#bfb3d2" strokeWidth="2" /><rect x="61" y="36" width="78" height="7" rx="3" fill="#b7a7d2" /><rect x="61" y="52" width="96" height="5" rx="2" fill="#e4dcec" /><rect x="61" y="74" width="94" height="24" rx="8" fill="#e7f2ee" /><circle cx="75" cy="86" r="6" fill="#87bda6" /><path d="m72 86 2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" /><rect x="61" y="105" width="94" height="24" rx="8" fill="#f6eedf" /><circle cx="169" cy="133" r="21" fill="#e5b86f" /><path d="m161 133 5 5 11-11" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>;
}
