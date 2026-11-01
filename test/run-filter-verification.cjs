// Isolated compilation/tests only. No staging deployment or live API evidence.
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const commands = {
  tests: ['node', ['--test', 'test/use-filter-storage.test.cjs', 'test/pr-filter-regression.test.cjs']],
  inventory: ['node', ['test/filter-inventory.cjs']],
  lint: ['yarn', ['lint']],
  build: ['yarn', ['build']]
};
const name = process.argv[2];
if (!commands[name]) throw new Error('Choose tests, inventory, lint or build');
fs.mkdirSync('evidence', { recursive: true });
const [command, args] = commands[name];
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_APP_API_URL: 'http://127.0.0.1:9', NEXTAUTH_URL: 'http://127.0.0.1:3005' };
const started = new Date().toISOString();
const result = spawnSync(command, args, { env, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
const log = `cwd=${process.cwd()}\ncommand=${command} ${args.join(' ')}\nstarted=${started}\nended=${new Date().toISOString()}\nmode=isolated loopback compilation; NOT staging build/QA\nexit=${result.status}\nsignal=${result.signal || ''}\n${result.stdout || ''}\n${result.stderr || ''}\n${result.error || ''}\n`;
fs.writeFileSync(`evidence/${name}.log`, log);
console.log(log);
process.exit(result.status ?? 1);
