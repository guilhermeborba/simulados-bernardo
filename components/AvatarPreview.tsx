import type { ApiAvatarSelection } from '@/lib/apiClient';
import type { QuizSegment } from '@/lib/quiz-segments';
import MascoteGuia from './MascoteGuia';
import styles from './LearningCollection.module.css';

const PALETTES: Record<string, { ink: string; ground: string; accent: string }> = {
  inicio: { ink: '#456782', ground: '#e8f0f6', accent: '#b0ccdf' },
  'primeiro-passo': { ink: '#87642e', ground: '#fff3d9', accent: '#e5bf67' },
  explorador: { ink: '#3c7668', ground: '#e1f2ec', accent: '#8bc1b0' },
  constancia: { ink: '#635487', ground: '#ece7f5', accent: '#b5a4d5' },
  missao: { ink: '#395f92', ground: '#e5edf9', accent: '#8eaddc' },
  horizonte: { ink: '#924b58', ground: '#f9e7eb', accent: '#dca1ad' },
};

export function avatarPresentation(style: ApiAvatarSelection['style'], segment: QuizSegment | null) {
  if (style !== 'AUTO') return style;
  return segment === 'INFANTIL' || segment === 'FUNDAMENTAL_I' ? 'MASCOT' : 'SEAL';
}

export default function AvatarPreview({ selection, segment, itemTitle, compact = false }: {
  selection: ApiAvatarSelection;
  segment: QuizSegment | null;
  itemTitle: string;
  compact?: boolean;
}) {
  const presentation = avatarPresentation(selection.style, segment);
  const mascotName = segment === 'INFANTIL' ? 'Bolinha' : 'Capelo';
  const name = presentation === 'MASCOT' ? mascotName : 'Selo de progresso';
  const palette = PALETTES[selection.itemId] ?? PALETTES.inicio;
  return <div className={styles.previewDrawing} data-compact={compact || undefined} data-presentation={presentation} data-item={selection.itemId} role="img" aria-label={`Prévia da personalização: ${name}, ${itemTitle}`} style={{ backgroundColor: palette.ground }}>
    <div aria-hidden="true" className={styles.previewDecoration}>
      {presentation === 'MASCOT' ? <>
        <div className={styles.mascotDrawing}><MascoteGuia variant={segment === 'INFANTIL' ? 'bolinha' : 'capelo'} size={compact ? 83 : 139} /></div>
        <div className={styles.mascotMedallion}><CollectionMark itemId={selection.itemId} /></div>
      </> : <CollectionMark itemId={selection.itemId} />}
    </div>
  </div>;
}

export function CollectionMark({ itemId }: { itemId: string }) {
  const palette = PALETTES[itemId] ?? PALETTES.inicio;
  return <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false">
    <path d="m60 9 34 14 17 37-17 37-34 14-34-14L9 60l17-37Z" fill={palette.ground} stroke={palette.accent} strokeWidth="3" />
    <circle cx="60" cy="60" r="38" fill={palette.ink} />
    <circle cx="60" cy="60" r="31" fill="none" stroke="#fff" strokeWidth="1" opacity=".35" />
    <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {itemId === 'primeiro-passo' ? <path d="m60 37 6.7 14 15.3 2.2-11 10.7 2.6 15.1L60 72l-13.6 7 2.6-15.1-11-10.7L53.3 51Z" />
        : itemId === 'explorador' ? <><circle cx="60" cy="60" r="22" /><path d="m69 45-3 21-15 9 3-21Z" /><path d="m60 34v3m0 46v3M34 60h3m46 0h3" /></>
        : itemId === 'constancia' ? <><path d="M43 75h10V61h13V47h12" /><path d="m72 41 6 6-6 6" /><circle cx="43" cy="75" r="3" fill="#fff" stroke="none" /></>
        : itemId === 'missao' ? <><path d="m42 59 12 12 25-25" /><path d="M79 65v10a5 5 0 0 1-5 5H44a5 5 0 0 1-5-5V45a5 5 0 0 1 5-5h20" /></>
        : itemId === 'horizonte' ? <><path d="M37 73h46M41 64a19 19 0 0 1 38 0M60 35v8m-25 5 6 5m44-5-6 5" /><path d="M46 82h28" /></>
        : <><path d="M39 44c9-2 15 1 21 5 6-4 12-7 21-5v30c-9-2-15 0-21 4-6-4-12-6-21-4Z" /><path d="M60 49v29" /></>}
    </g>
    <circle cx="60" cy="10" r="4" fill={palette.ink} />
  </svg>;
}
