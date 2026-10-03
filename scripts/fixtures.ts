import { spawnSync } from 'node:child_process';
const result = spawnSync('.venv/bin/python', ['scripts/fixtures.py'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
