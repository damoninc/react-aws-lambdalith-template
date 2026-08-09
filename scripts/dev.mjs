import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['run', 'dev', '--workspace=@starter/web'], { stdio: 'inherit' }),
  spawn(npm, ['run', 'dev', '--workspace=@starter/api'], { stdio: 'inherit' }),
];

function stop(signal = 'SIGTERM') {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

process.on('SIGINT', () => {
  stop('SIGINT');
  process.exit(130);
});
process.on('SIGTERM', () => {
  stop('SIGTERM');
  process.exit(143);
});

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stop();
      process.exit(code);
    }
  });
}
