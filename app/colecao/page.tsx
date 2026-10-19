import LearningCollection from '@/components/LearningCollection';
import PracticeShell from '@/components/giz/PracticeShell';

export const metadata = { title: 'Minha coleção — Giz', description: 'Conquistas, itens e personalização que acompanham sua prática.' };

export default function CollectionPage() { return <PracticeShell title="Coleção"><LearningCollection /></PracticeShell>; }
