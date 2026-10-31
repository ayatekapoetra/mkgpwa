// Font self-hosted (subset latin, OFL) agar build tidak bergantung pada fonts.gstatic.com
import localFont from 'next/font/local';

const make = (prefix, weights) =>
  weights.map((w) => ({ path: `./${prefix}-${w}.woff2`, weight: String(w), style: 'normal' }));

export const poppins = localFont({ src: make('Poppins', [400, 500, 600, 700]), display: 'swap' });
export const inter = localFont({ src: make('Inter', [400, 500, 600, 700]), display: 'swap' });
export const roboto = localFont({ src: make('Roboto', [300, 400, 500, 700]), display: 'swap' });
export const publicSans = localFont({ src: make('Public_Sans', [400, 500, 600, 700]), display: 'swap' });
