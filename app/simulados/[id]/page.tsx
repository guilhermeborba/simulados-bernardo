import SimulationDetail from '@/components/giz/SimulationDetail';
export const metadata = { title: 'Detalhe do simulado' };
export default function DetailPage({ params }: { params: { id: string } }) { return <SimulationDetail id={params.id} />; }
