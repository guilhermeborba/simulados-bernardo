import LearningProgress from '@/components/LearningProgress';
import PracticeShell from '@/components/giz/PracticeShell';

export const metadata = { title: 'Habilidades e revisão — Giz', description: 'Registros de prática por habilidade e revisões orientadas pelas respostas.' };

export default function LearningProgressPage() { return <PracticeShell title="Habilidades"><LearningProgress /></PracticeShell>; }
