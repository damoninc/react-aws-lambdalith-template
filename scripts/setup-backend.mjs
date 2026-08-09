#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const frameworks = {
  raw: {
    label: 'Raw Lambda',
    dependencies: {},
    devDependencies: {},
  },
  express: {
    label: 'Express',
    dependencies: {
      '@codegenie/serverless-express': 'latest',
      express: 'latest',
    },
    devDependencies: {
      '@types/express': 'latest',
    },
  },
  fastify: {
    label: 'Fastify',
    dependencies: {
      '@fastify/aws-lambda': 'latest',
      fastify: 'latest',
    },
    devDependencies: {},
  },
  nestjs: {
    label: 'NestJS',
    dependencies: {
      '@codegenie/serverless-express': 'latest',
      '@nestjs/common': 'latest',
      '@nestjs/core': 'latest',
      '@nestjs/platform-express': 'latest',
      'reflect-metadata': 'latest',
      rxjs: 'latest',
    },
    devDependencies: {},
  },
};

const frameworkDependencyNames = new Set(
  Object.values(frameworks).flatMap((framework) => [
    ...Object.keys(framework.dependencies),
    ...Object.keys(framework.devDependencies),
  ]),
);

const args = process.argv.slice(2);
const force = args.includes('--force');
const noInstall = args.includes('--no-install');
const help = args.includes('--help') || args.includes('-h');
const positional = args.filter((arg) => !arg.startsWith('--'));

if (help) {
  console.log(`Usage: node scripts/setup-backend.mjs [framework] [options]\n\nFrameworks:\n  raw\n  express\n  fastify\n  nestjs\n\nOptions:\n  --force       Replace apps/api/src without confirmation\n  --no-install  Do not run npm install\n  -h, --help    Show this help\n`);
  process.exit(0);
}

function normalizeFramework(value) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'nest') return 'nestjs';
  return normalized;
}

async function chooseFramework() {
  const supplied = normalizeFramework(positional[0]);
  if (supplied) {
    if (!(supplied in frameworks)) {
      throw new Error(`Unknown backend framework: ${positional[0]}`);
    }
    return supplied;
  }

  if (!process.stdin.isTTY) {
    throw new Error('Pass a framework when running non-interactively: raw, express, fastify, or nestjs.');
  }

  const rl = createInterface({ input, output });
  try {
    console.log('\nChoose a backend framework:\n');
    const choices = Object.entries(frameworks);
    choices.forEach(([, value], index) => {
      console.log(`  ${index + 1}) ${value.label}`);
    });

    const answer = (await rl.question('\nSelection [1]: ')).trim() || '1';
    const numeric = Number(answer);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= choices.length) {
      return choices[numeric - 1][0];
    }

    const named = normalizeFramework(answer);
    if (named && named in frameworks) return named;

    throw new Error(`Invalid selection: ${answer}`);
  } finally {
    rl.close();
  }
}

async function confirmReplace(srcDir) {
  if (force) return true;

  let entries = [];
  try {
    entries = await readdir(srcDir);
  } catch {
    return true;
  }

  if (entries.length === 0) return true;
  if (!process.stdin.isTTY) {
    throw new Error('apps/api/src is not empty. Re-run with --force to replace it.');
  }

  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question('\nThis will replace apps/api/src. Continue? [y/N] '))
      .trim()
      .toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

function sortRecord(record = {}) {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

async function updateApiPackageJson(frameworkName) {
  const packagePath = path.join(repoRoot, 'apps/api/package.json');
  const raw = await readFile(packagePath, 'utf8');
  const pkg = JSON.parse(raw);
  const selected = frameworks[frameworkName];

  pkg.dependencies ??= {};
  pkg.devDependencies ??= {};

  for (const dependency of frameworkDependencyNames) {
    delete pkg.dependencies[dependency];
    delete pkg.devDependencies[dependency];
  }

  Object.assign(pkg.dependencies, selected.dependencies);
  Object.assign(pkg.devDependencies, selected.devDependencies);

  pkg.dependencies = sortRecord(pkg.dependencies);
  pkg.devDependencies = sortRecord(pkg.devDependencies);

  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function updateTsConfig(frameworkName) {
  if (frameworkName !== 'nestjs') return;

  const tsconfigPath = path.join(repoRoot, 'apps/api/tsconfig.json');
  const raw = await readFile(tsconfigPath, 'utf8');
  const tsconfig = JSON.parse(raw);
  tsconfig.compilerOptions ??= {};
  tsconfig.compilerOptions.experimentalDecorators = true;
  tsconfig.compilerOptions.emitDecoratorMetadata = true;
  await writeFile(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
}

async function updateInfra(frameworkName) {
  if (frameworkName !== 'nestjs') return;

  const stackPath = path.join(repoRoot, 'infra/lib/app-stack.ts');
  let source;
  try {
    source = await readFile(stackPath, 'utf8');
  } catch {
    return;
  }

  if (source.includes('preCompilation: true')) return;

  const updated = source.replace(
    /(bundling:\s*\{\s*\n)(\s*)/,
    '$1$2preCompilation: true,\n$2',
  );

  if (updated === source) {
    console.warn('Could not automatically enable CDK preCompilation for NestJS.');
    return;
  }

  await writeFile(stackPath, updated);
}

function npmInstall() {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(command, ['install'], {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code}`));
    });
  });
}

async function main() {
  const frameworkName = await chooseFramework();
  const selected = frameworks[frameworkName];
  const templateDir = path.join(repoRoot, 'templates/api', frameworkName);
  const apiSrcDir = path.join(repoRoot, 'apps/api/src');

  await readdir(templateDir); // fail early if the template is missing

  if (!(await confirmReplace(apiSrcDir))) {
    console.log('Cancelled.');
    return;
  }

  await rm(apiSrcDir, { recursive: true, force: true });
  await mkdir(apiSrcDir, { recursive: true });
  await cp(templateDir, apiSrcDir, { recursive: true });

  await updateApiPackageJson(frameworkName);
  await updateTsConfig(frameworkName);
  await updateInfra(frameworkName);

  if (!noInstall) {
    console.log(`\nInstalling ${selected.label} dependencies...\n`);
    await npmInstall();
  }

  console.log(`\nBackend configured: ${selected.label}`);
  console.log('Run: npm run dev');
  if (noInstall) console.log('Then run npm install first.');
}

main().catch((error) => {
  console.error(`\nSetup failed: ${error.message}`);
  process.exit(1);
});
