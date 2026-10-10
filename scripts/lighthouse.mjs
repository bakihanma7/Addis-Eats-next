// Usage (app must already be running on a production build):
//   npm run build && npm start            # terminal 1
//   npm run perf -- before                # terminal 2: label is used for the output folder
// Runs Lighthouse (mobile preset, simulated slow-4G + 4x CPU throttling, which
// is Lighthouse's default) RUNS times per page and prints the MEDIAN of LCP,
// CLS and TBT. Raw reports are saved to perf/<label>/ so the numbers can be checked.
//
// INP: Lighthouse's page-load mode cannot measure INP (it needs real
// interactions). TBT is its lab stand-in; for INP itself use the Chrome DevTools
// Performance panel or the web-vitals library while clicking around.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const label = process.argv[2];
if (!label) { console.error('Usage: npm run perf -- <label>   e.g. before | after'); process.exit(1); }
const BASE = process.env.BASE ?? 'http://localhost:3000';
const RUNS = Number(process.env.RUNS ?? 5);
const PAGES = ['/', '/menu', '/menu/1'];
const dir = `perf/${label}`;
mkdirSync(dir, { recursive: true });

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const rows = [];
for (const page of PAGES) {
  const lcp = [], cls = [], tbt = [], score = [];
  for (let i = 1; i <= RUNS; i++) {
    const out = `${dir}/${page === '/' ? 'home' : page.slice(1).replaceAll('/', '_')}-${i}.json`;
    execFileSync('npx', ['--yes', 'lighthouse@12', BASE + page, '--only-categories=performance',
      '--output=json', `--output-path=${out}`, '--quiet',
      '--chrome-flags=--headless=new --no-sandbox'], { stdio: 'inherit' });
    const a = JSON.parse(readFileSync(out, 'utf8')).audits;
    lcp.push(a['largest-contentful-paint'].numericValue);
    cls.push(a['cumulative-layout-shift'].numericValue);
    tbt.push(a['total-blocking-time'].numericValue);
    score.push(JSON.parse(readFileSync(out, 'utf8')).categories.performance.score * 100);
  }
  rows.push({ page, 'LCP (ms)': Math.round(median(lcp)), CLS: +median(cls).toFixed(3), 'TBT (ms)': Math.round(median(tbt)), 'Perf score': Math.round(median(score)) });
}
console.log(`\nMedian of ${RUNS} runs, mobile, simulated throttling  [${label}]`);
console.table(rows);
