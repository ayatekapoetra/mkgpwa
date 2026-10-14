// Tailwind/Radix components consume HSL channels; MUI palettes use hex/RGBA.
function rgbChannels(color) {
  if (color === 'white') return [255, 255, 255, 1];
  if (color === 'black') return [0, 0, 0, 1];
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16)).concat(1);
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/);
  if (!rgb) throw new Error(`Unsupported theme color: ${color}`);
  const values = rgb[1].split(',').map(Number);
  return [values[0], values[1], values[2], values[3] ?? 1];
}

export function colorToHsl(color, background = '#ffffff') {
  const [red, green, blue, opacity] = rgbChannels(color);
  const base = rgbChannels(background);
  const [r, g, b] = [red, green, blue].map((channel, index) => (channel * opacity + base[index] * (1 - opacity)) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const round = value => Math.round(value * 100) / 100;
  return `${round(hue)} ${round(saturation * 100)}% ${round(lightness * 100)}%`;
}

export function themeCssVariables(theme) {
  const { palette } = theme;
  const paper = palette.background.paper;
  const hsl = color => colorToHsl(color, paper);
  return {
    '--background': hsl(palette.background.default),
    '--foreground': colorToHsl(palette.text.primary, palette.background.default),
    '--card': hsl(paper),
    '--card-foreground': hsl(palette.text.primary),
    '--popover': hsl(paper),
    '--popover-foreground': hsl(palette.text.primary),
    '--primary': hsl(palette.primary.main),
    '--primary-foreground': hsl(palette.primary.contrastText),
    '--secondary': hsl(palette.secondary.lighter),
    '--secondary-foreground': hsl(palette.text.primary),
    '--muted': hsl(palette.action.hover),
    '--muted-foreground': hsl(palette.text.secondary),
    '--accent': hsl(palette.primary.lighter),
    '--accent-foreground': colorToHsl(palette.text.primary, palette.primary.lighter),
    '--destructive': hsl(palette.error.main),
    '--warning': hsl(palette.warning.main),
    '--success': hsl(palette.success.main),
    '--destructive-foreground': hsl(palette.error.contrastText),
    '--border': hsl(palette.divider),
    '--input': hsl(palette.divider),
    '--ring': hsl(palette.primary.main),
    '--radius': `${theme.shape.borderRadius}px`
  };
}
