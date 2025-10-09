const electronIconMaker = require('electron-icon-maker');

electronIconMaker({
  input: './public/logo.png',
  output: './public'
}, (err) => {
  if (err) {
    console.error('Error generating icons:', err);
  } else {
    console.log('Icons generated successfully!');
  }
});