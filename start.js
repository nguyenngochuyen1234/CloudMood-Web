import { spawn } from 'node:child_process';

const port = Number(process.env.PORT || 4173);

const child = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', String(port)], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
