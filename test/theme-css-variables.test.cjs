const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createTheme } = require('@mui/material/styles');

const helpers = import(`data:text/javascript;base64,${fs.readFileSync(path.resolve(__dirname, '../src/themes/cssVariables.js')).toString('base64')}`);

test('hex and RGB palette colors produce valid HSL channels', async () => {
  const { colorToHsl } = await helpers;
  assert.equal(colorToHsl('#fff'), '0 0% 100%');
  assert.equal(colorToHsl('#000000'), '0 0% 0%');
  assert.equal(colorToHsl('rgb(255, 0, 0)'), '0 100% 50%');
  assert.equal(colorToHsl('#abc'), '210 25% 73.33%');
});

test('transparent hover/text colors are composited onto their surface rather than becoming black or white', async () => {
  const { colorToHsl } = await helpers;
  assert.equal(colorToHsl('rgba(0, 0, 0, 0.1)', '#ffffff'), '0 0% 90%');
  assert.equal(colorToHsl('rgba(255, 255, 255, 0.1)', '#000000'), '0 0% 10%');
  assert.notEqual(colorToHsl('rgba(255, 255, 255, 0.87)', '#1d2630'), '0 0% 100%');
});

test('semantic CSS tokens follow the active mode and preset palette', async () => {
  const { colorToHsl, themeCssVariables } = await helpers;
  const light = createTheme({ palette: { primary: { main: '#3366ff', lighter: '#d6e4ff' }, secondary: { main: '#5b6b79', lighter: '#f8f9fa' } } });
  const dark = createTheme({ palette: { mode: 'dark', primary: { main: '#305bdd', lighter: '#1c2134' }, secondary: { main: '#dbe0e5', lighter: '#131920' }, background: { paper: '#1d2630', default: '#131920' } } });
  const lightVars = themeCssVariables(light);
  const darkVars = themeCssVariables(dark);
  assert.equal(lightVars['--card'], '0 0% 100%');
  assert.equal(darkVars['--card'], colorToHsl(dark.palette.background.paper));
  assert.notEqual(lightVars['--foreground'], darkVars['--foreground']);
  assert.notEqual(lightVars['--muted'], darkVars['--muted']);
  const alternate = createTheme({ palette: { primary: { main: '#009688', lighter: '#b2dfdb' }, secondary: { main: '#5b6b79', lighter: '#f8f9fa' } } });
  assert.notEqual(lightVars['--primary'], themeCssVariables(alternate)['--primary']);
  assert.ok(Object.values(darkVars).every(value => !value.includes('NaN')));
});
