// Font self-hosted (subset latin, OFL) agar build tidak bergantung pada fonts.gstatic.com
// Catatan: next/font/local mewajibkan nilai literal, jadi tidak boleh memakai helper/template.
import localFont from 'next/font/local';

export const poppins = localFont({
  src: [
    { path: './Poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './Poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './Poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './Poppins-700.woff2', weight: '700', style: 'normal' }
  ],
  display: 'swap'
});

export const inter = localFont({
  src: [
    { path: './Inter-400.woff2', weight: '400', style: 'normal' },
    { path: './Inter-500.woff2', weight: '500', style: 'normal' },
    { path: './Inter-600.woff2', weight: '600', style: 'normal' },
    { path: './Inter-700.woff2', weight: '700', style: 'normal' }
  ],
  display: 'swap'
});

export const roboto = localFont({
  src: [
    { path: './Roboto-300.woff2', weight: '300', style: 'normal' },
    { path: './Roboto-400.woff2', weight: '400', style: 'normal' },
    { path: './Roboto-500.woff2', weight: '500', style: 'normal' },
    { path: './Roboto-700.woff2', weight: '700', style: 'normal' }
  ],
  display: 'swap'
});

export const publicSans = localFont({
  src: [
    { path: './Public_Sans-400.woff2', weight: '400', style: 'normal' },
    { path: './Public_Sans-500.woff2', weight: '500', style: 'normal' },
    { path: './Public_Sans-600.woff2', weight: '600', style: 'normal' },
    { path: './Public_Sans-700.woff2', weight: '700', style: 'normal' }
  ],
  display: 'swap'
});
