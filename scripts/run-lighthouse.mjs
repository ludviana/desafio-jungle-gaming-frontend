import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'lighthouse.config.json'), 'utf8'));
const outputDirectory = path.join(root, config.outputDirectory);
const baseURL = `http://${config.host}:${config.port}`;
const preview = spawn(
  process.execPath,
  [
    path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
    'preview',
    '--host',
    config.host,
    '--port',
    String(config.port),
    '--strictPort',
  ],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
);
let previewOutput = '';
preview.stdout.on('data', (chunk) => (previewOutput += chunk.toString()));
preview.stderr.on('data', (chunk) => (previewOutput += chunk.toString()));

async function waitForPreview() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) throw new Error(previewOutput);
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
    await delay(250);
  }
  throw new Error(`Vite preview did not start at ${baseURL}.\n${previewOutput}`);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function formatMetric(value, metric) {
  if (metric === 'cumulative-layout-shift') return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

try {
  await mkdir(outputDirectory, { recursive: true });
  await waitForPreview();
  const lighthouseCli = path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js');
  const chromePath = chromium.executablePath();
  const results = [];

  for (const page of config.pages) {
    for (const profile of config.profiles) {
      for (let run = 1; run <= config.runs; run += 1) {
        const outputBase = path.join(outputDirectory, `${page.name}-${profile}-run-${run}`);
        const args = [
          lighthouseCli,
          new URL(page.path, baseURL).toString(),
          '--output=html,json',
          `--output-path=${outputBase}`,
          `--only-categories=${Object.keys(config.categories).join(',')}`,
          '--chrome-flags=--headless --no-sandbox',
        ];
        if (profile === 'desktop') args.push('--preset=desktop');

        const runResult = spawnSync(process.execPath, args, {
          cwd: root,
          encoding: 'utf8',
          env: { ...process.env, CHROME_PATH: chromePath },
        });
        if (runResult.status !== 0) {
          throw new Error(runResult.stderr || runResult.stdout || 'Lighthouse failed.');
        }

        const report = JSON.parse(await readFile(`${outputBase}.report.json`, 'utf8'));
        results.push({ page: page.name, profile, run, report });
        console.log(`Completed ${page.name} / ${profile}, run ${run}.`);
      }
    }
  }

  const rows = [];
  for (const page of config.pages) {
    for (const profile of config.profiles) {
      const group = results.filter(
        (result) => result.page === page.name && result.profile === profile,
      );
      for (const [category, target] of Object.entries(config.categories)) {
        const score = median(
          group.map((result) => (result.report.categories[category].score ?? 0) * 100),
        );
        const status = score >= target ? 'OK' : 'Abaixo da meta';
        rows.push(
          `| ${[page.name, profile, category, score.toFixed(0), target, status].join(' | ')} |`,
        );
      }
      for (const metric of config.metrics) {
        const value = median(group.map((result) => result.report.audits[metric].numericValue ?? 0));
        rows.push(
          `| ${page.name} | ${profile} | ${metric} | ${formatMetric(value, metric)} | — | — |`,
        );
      }
    }
  }

  const summary = [
    '# Lighthouse results',
    '',
    `- Runs per page/profile: ${config.runs}`,
    `- Lighthouse: ${
      JSON.parse(await readFile(path.join(root, 'node_modules/lighthouse/package.json'), 'utf8'))
        .version
    }`,
    `- Node: ${process.version}`,
    `- Platform: ${process.platform} ${process.arch}`,
    '- Reports: HTML and JSON files in this directory.',
    '',
    '| Page | Profile | Category / metric | Median | Target | Status |',
    '| --- | --- | --- | ---: | ---: | --- |',
    ...rows,
    '',
  ].join('\n');
  await writeFile(path.join(outputDirectory, 'summary.md'), summary);
  console.log(`Lighthouse summary written to ${path.join(outputDirectory, 'summary.md')}.`);
} finally {
  preview.kill();
}
