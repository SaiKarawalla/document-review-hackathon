import { spawn } from 'node:child_process';
const children = [spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' })];
let stopping = false;
const stop = () => { if (stopping) return; stopping = true; children.forEach(c => c.kill('SIGTERM')); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
children.forEach(c => c.on('exit', code => { if (!stopping) { stop(); process.exitCode = code ?? 1; } }));
