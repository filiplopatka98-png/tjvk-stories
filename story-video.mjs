// story-video.mjs — príbeh JSON → PNG (záverečný obraz) + MP4 1080×1920 (animácia + 5 s statický záver).
// Použitie: node story-video.mjs data/story-*.json   (obal: format "cover" → len PNG)
// Beží v cloude (Chromium + ffmpeg); na Macu/VM sa nespúšťa.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { chromium } from 'playwright';
import { pageHTML } from './stories.mjs';
const OUT = path.resolve('out'); fs.mkdirSync(OUT, { recursive: true });
const DUR = { 'story-zapas': 8, 'story-vysledok': 9 };
const exe = process.env.CHROME || undefined;
const b = await chromium.launch(exe ? { executablePath: exe } : {});
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8')); const base = path.join(OUT, path.basename(f, '.json'));
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(pageHTML(d), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await (await p.$('#poster')).screenshot({ path: base + '.png' });
  const dur = DUR[d.format];
  if (dur) {
    const tmp = fs.mkdtempSync(base + '-f'); const fps = 30;
    for (let i = 0; i < fps * dur; i++) { await p.evaluate((t) => window.R(t), i / fps); await p.screenshot({ path: `${tmp}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${tmp}/f%04d.jpg`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', base + '.mp4']);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(path.basename(f), 'ok'); await p.close();
}
await b.close();
