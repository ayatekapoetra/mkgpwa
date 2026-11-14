const fs = require('fs');
const parser = require('@babel/parser');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/check-syntax.js <file1> <file2> ...');
  process.exit(1);
}

let hasError = false;

for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    console.log(`[OK] ${file}`);
  } catch (err) {
    console.error(`[ERROR] ${file}: ${err.message}`);
    hasError = true;
  }
}

if (hasError) process.exit(1);
