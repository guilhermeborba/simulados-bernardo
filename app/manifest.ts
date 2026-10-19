import type { MetadataRoute } from 'next';
import { gizTokens } from '@/lib/gizTokens.generated';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Giz Kids', short_name: 'Giz Kids', description: 'Aprenda uma questão de cada vez.',
    start_url: '/', display: 'standalone', lang: 'pt-BR',
    background_color: gizTokens.color.light.bg.value, theme_color: gizTokens.color.light.head.value,
    icons: [192,512].map(size => ({ src: `/giz/brand/png/app-kids-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })),
  };
}
