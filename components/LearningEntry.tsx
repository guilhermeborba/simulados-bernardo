import Link from 'next/link';
import styles from './LearningEntry.module.css';

export default function LearningEntry() {
  return <section className={styles.entry} aria-labelledby="learning-options-title">
    <div><p className={styles.eyebrow}>Um pouco de prática, todos os dias</p>
      <h2 id="learning-options-title">Como você quer aprender hoje?</h2>
      <p>Escolha uma atividade curta ou continue seus simulados.</p></div>
    <div className={styles.cards}>
      <Link href="/quizzes" className={styles.quiz}><span className={styles.label}>Quiz rápido</span>
        <strong>Uma pergunta de cada vez</strong><span>Confirme sua escolha e aprenda com a explicação.</span><span className={styles.action}>Explorar quizzes →</span></Link>
      <a href="#simulados" className={styles.simulation}><span className={styles.label}>Simulados</span>
        <strong>Pratique para a avaliação</strong><span>Escolha ano, disciplina e avaliação. Confira o resultado ao concluir.</span><span className={styles.action}>Escolher simulado ↓</span></a>
    </div>
    <Link href="/quizzes/historico" className={styles.history}>Continuar um quiz ou consultar meu histórico →</Link>
  </section>;
}
