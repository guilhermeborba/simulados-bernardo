import localFont from 'next/font/local';

const jakarta = localFont({ src: '../fonts/plusjakartasans-latin.woff2', weight: '500 700', style: 'normal', variable: '--font-jakarta', display: 'swap' });
const sourceSerif = localFont({ src: '../fonts/sourceserif4-latin.woff2', weight: '400 600', style: 'normal', variable: '--font-serif', display: 'swap' });
const plex = localFont({ src: '../fonts/ibmplexsans-latin.woff2', weight: '400 600', style: 'normal', variable: '--font-plex', display: 'swap' });

export default function QuizzesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${jakarta.variable} ${sourceSerif.variable} ${plex.variable}`}>{children}</div>;
}
