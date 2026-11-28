#!/usr/bin/env node
/**
 * Memeriksa sintaks semua <script> inline di index.html.
 * Dipakai oleh GitHub Actions agar perubahan yang masuk ke branch main
 * tidak merusak halaman yang otomatis di-deploy Cloudflare Pages.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
  (match) => match[1]
);

if (scripts.length === 0) {
  console.error('Tidak ditemukan <script> inline di index.html.');
  process.exit(1);
}

const workDir = mkdtempSync(join(tmpdir(), 'warung-cemara-js-'));
let allValid = true;

scripts.forEach((code, index) => {
  const file = join(workDir, `inline-${index + 1}.js`);
  writeFileSync(file, code, 'utf8');
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log(`OK  inline script #${index + 1}`);
  } catch (error) {
    allValid = false;
    console.error(`GAGAL inline script #${index + 1}`);
    console.error(String(error.stderr || error.message));
  }
});

rmSync(workDir, { recursive: true, force: true });
process.exit(allValid ? 0 : 1);
