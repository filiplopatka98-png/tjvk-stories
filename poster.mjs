// Generátor plagátov TJ Veľké Kostoľany — port z Claude Design prototypu.
// Dátami riadené, bez proprietárneho runtimu. 1080×1350 (4:5, FB aj IG) — od 2. 11. 2026, predtým 1080×1080.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const LOGO = fs.readFileSync(path.join(__dir, 'logo-b64.txt'), 'utf8').trim();
const FONTS = fs.readFileSync(path.join(__dir, 'fonts-embed.css'), 'utf8');

// ── farby ──
const C = {
  bg: '#193284', gold: '#f9a603', white: '#ffffff',
  grey1: '#cdd6ec', grey2: '#9fb0dc', grey3: '#dce3f3', grey4: '#dcdcf6', label: '#5a5e6b',
};
const OS = "'Oswald',sans-serif";
const BA = "'Barlow',sans-serif";

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Načíta obrázok zo súboru do data: URI. Cesta sa berie relatívne ku koreňu
// generátora (napr. "assets/hraci/virag.jpg"), absolútna cesta funguje tiež.
// Keď súbor nie je, vráti null — volajúci si layout prispôsobí.
// *(Doplnené 21. 9. 2026 — typ `mvp` mal fotku len ako prázdny rámček.)*
function imgURI(rel) {
  if (!rel) return null;
  if (/^data:/.test(rel)) return rel;
  const p = path.isAbsolute(rel) ? rel : path.join(__dir, rel);
  if (!fs.existsSync(p)) return null;
  const ext = path.extname(p).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
}

// Zoznam partnerov sa NEudržiava v kóde. Zdroj pravdy je priečinok assets/sponsors/ —
// kto tam má logo, je oficiálny partner (rozhodol Filip 20. 8. 2026, pravidlo „logo = partner").
// sponsors() číta logá z .opt/manifest.json, ktorý generuje optimize_sponsors.py.
// Starý natvrdo zapísaný zoznam 20 partnerov bol odstránený 20. 8. 2026: nikde sa nepoužíval
// (sponsors() ho nikdy nečítal), mal staré varianty pravopisu a slugy na neexistujúce súbory.

const SPONSOR_DIR = path.join(__dir, 'assets', 'sponsors');
const SPONSOR_OPT = path.join(SPONSOR_DIR, '.opt');

// načítaj optimalizované logá z manifestu (vytvára optimize_sponsors.py)
function loadSponsorLogos() {
  const mf = path.join(SPONSOR_OPT, 'manifest.json');
  if (!fs.existsSync(mf)) return [];
  let list;
  try { list = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch { return []; }
  return list.map(it => {
    const p = path.join(SPONSOR_OPT, it.file);
    if (!fs.existsSync(p)) return null;
    return { ...it, uri: `data:image/png;base64,${fs.readFileSync(p).toString('base64')}` };
  }).filter(Boolean);
}
const SPONSOR_LOGOS = loadSponsorLogos();

// ── zdieľané kúsky ──
function header(labelHtml) {
  return `<div style="display:flex;align-items:center;gap:26px;">
    <img src="${LOGO}" alt="TJ Veľké Kostoľany" style="height:170px;width:auto;filter:drop-shadow(0 6px 18px rgba(0,0,0,.35));">
    <div style="width:2px;height:108px;background:rgba(255,255,255,.22);"></div>
    <div style="font-family:${BA};font-weight:700;font-size:24px;letter-spacing:.32em;text-transform:uppercase;color:${C.gold};line-height:1.5;">${labelHtml}</div>
  </div>`;
}

function pin(text) {
  return `<div style="display:flex;align-items:center;gap:13px;">
    <span style="position:relative;display:inline-block;width:22px;height:29px;flex-shrink:0;">
      <span style="position:absolute;left:4px;top:14px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:13px solid ${C.gold};"></span>
      <span style="position:absolute;left:0;top:0;width:22px;height:22px;border-radius:50%;background:${C.gold};"></span>
      <span style="position:absolute;left:6px;top:6px;width:10px;height:10px;border-radius:50%;background:${C.bg};"></span>
    </span>
    <span style="font-family:${BA};font-weight:700;font-size:24px;letter-spacing:.03em;color:${C.white};white-space:nowrap;">${esc(text)}</span>
  </div>`;
}

function datePill(dateText, timeText) {
  return `<div style="display:inline-flex;align-items:center;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.3);">
    <div style="background:${C.gold};color:${C.bg};font-family:${OS};font-weight:700;font-size:34px;letter-spacing:.04em;padding:18px 28px;text-transform:uppercase;white-space:nowrap;flex-shrink:0;">${esc(dateText)}</div>
    <div style="background:${C.white};color:${C.bg};font-family:${OS};font-weight:700;font-size:34px;padding:18px 30px;white-space:nowrap;flex-shrink:0;">${esc(timeText)}</div>
  </div>`;
}

function goldBand(tag, text) {
  return `<div style="background:${C.gold};border-radius:16px;padding:24px 32px;display:flex;align-items:center;gap:26px;">
    <div style="background:${C.bg};color:${C.gold};font-family:${OS};font-weight:700;font-size:30px;letter-spacing:.02em;text-transform:uppercase;padding:14px 24px;border-radius:10px;white-space:nowrap;flex-shrink:0;">${esc(tag)}</div>
    <div style="font-family:${BA};font-weight:700;font-size:26px;line-height:1.22;color:${C.bg};">${esc(text)}</div>
  </div>`;
}

function sponsors(list) {
  // predvolene = reálne logá z manifestu; inak explicitný zoznam (logá/objekty/text)
  const items = (list && list.length) ? list : SPONSOR_LOGOS;
  const cols = Math.min(9, Math.max(6, Math.ceil(items.length / 2)));
  const tiles = items.map(it => {
    if (it && it.uri) {
      const dark = it.bg === 'dark';
      const tileBg = dark ? C.bg : '#ffffff';
      const border = dark ? '1px solid rgba(255,255,255,.14)' : '1px solid #e2e5ef';
      return `<div style="height:58px;display:flex;align-items:center;justify-content:center;background:${tileBg};border:${border};border-radius:6px;padding:5px 8px;overflow:hidden;"><img src="${it.uri}" alt="${esc(it.name || '')}" style="max-height:100%;max-width:100%;object-fit:contain;"></div>`;
    }
    const name = typeof it === 'string' ? it : (it && it.name) || '';
    return `<div style="height:58px;display:flex;align-items:center;justify-content:center;border:1px solid #e2e5ef;border-radius:6px;padding:0 6px;font-family:${OS};font-weight:600;font-size:12px;letter-spacing:.02em;color:${C.bg};text-transform:uppercase;text-align:center;line-height:1.05;overflow:hidden;">${esc(name)}</div>`;
  }).join('');
  return `<div style="background:${C.white};border-radius:18px;padding:22px 26px;box-shadow:0 12px 30px rgba(0,0,0,.22);font-family:${BA};display:flex;align-items:stretch;gap:18px;">
    <div style="display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <div style="font-family:${OS};font-weight:700;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:${C.bg};writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;">Naši partneri</div>
    </div>
    <div style="width:2px;align-self:stretch;background:#e2e5ef;flex-shrink:0;"></div>
    <div style="flex:1;display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px;align-content:center;">${tiles}</div>
  </div>`;
}

// spoločné pozadie + dekor + ghost
function ghostLayer(type, override) {
  const map = { mvp: '9', strelci: '15', milnik: '65', vitaj: '+1', sezona: '26' };
  const gt = override !== undefined ? override : (map[type] || '');
  if (gt) {
    return `<div style="position:absolute;right:64px;top:60px;font-family:${OS};font-weight:700;font-size:380px;line-height:.8;color:#ffffff;opacity:.09;pointer-events:none;z-index:1;letter-spacing:-.02em;white-space:nowrap;">${esc(gt)}</div>`;
  }
  return `<img src="${LOGO}" alt="" style="position:absolute;right:-180px;bottom:-160px;width:780px;height:auto;filter:brightness(0) invert(1);opacity:.06;pointer-events:none;z-index:0;">`;
}

const PAD = 'position:relative;height:100%;padding:100px 78px 96px;display:flex;flex-direction:column;';

// ── jednotlivé typy ──
function tZapas(d) {
  const away = !!d.vonku;
  const liga = d.liga || ['VIII. liga', 'MAXIMA FASÁDY'];
  const opp = esc(d.opponent || 'ŠK Borovce');
  const place = d.place || (away ? 'Ihrisko súpera' : 'Štadión Michala Podolana');
  const stateLabel = away ? 'Vonkajší zápas' : 'Domáci zápas';
  // Názov súpera sa auto-zmenší (data-fit), aby sa dlhé názvy nevytlačili mimo plagát.
  const oppSpan = `<span data-fit data-fit-max="80" data-fit-min="40" style="display:block;font-family:${OS};font-weight:700;font-size:80px;line-height:1;color:${C.grey1};text-transform:uppercase;white-space:nowrap;overflow:hidden;">${opp}</span>`;
  const usSpan = `<span style="display:block;font-family:${OS};font-weight:700;font-size:104px;line-height:.96;color:${C.white};text-transform:uppercase;">TJ Veľké Kostoľany</span>`;
  const vsSpan = `<span style="font-family:${BA};font-weight:700;font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:${C.grey2};margin:12px 0;">vs.</span>`;
  const teams = away
    ? `${oppSpan}${vsSpan}${usSpan}`
    : `${usSpan}${vsSpan}${oppSpan}`;
  const nadpis = (d.zapasNadpis === undefined ? 'Posledné kolo!' : d.zapasNadpis);
  return `<div style="${PAD}">
    <div style="display:flex;align-items:center;gap:26px;">
      <img src="${LOGO}" alt="TJ Veľké Kostoľany" style="height:150px;width:auto;filter:drop-shadow(0 6px 18px rgba(0,0,0,.35));">
      <div style="width:2px;height:96px;background:rgba(255,255,255,.22);"></div>
      <div style="font-family:${BA};font-weight:700;font-size:22px;letter-spacing:.32em;text-transform:uppercase;color:${C.gold};line-height:1.5;">${esc(liga[0])}<br>${esc(liga[1] || '')}</div>
    </div>
    <div style="margin-top:auto;">
      <div style="font-family:${BA};font-weight:700;font-size:23px;letter-spacing:.32em;text-transform:uppercase;color:${C.gold};margin-bottom:22px;">${stateLabel}</div>
      ${nadpis ? `<div style="font-family:${OS};font-weight:700;font-size:78px;line-height:1;color:${C.gold};text-transform:uppercase;letter-spacing:-.005em;margin-bottom:24px;">${esc(nadpis)}</div>` : ''}
      <div style="display:flex;flex-direction:column;">${teams}</div>
    </div>
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:26px;">
      <div style="display:flex;align-items:center;gap:26px;flex-wrap:wrap;">
        ${datePill(d.date || 'Nedeľa 14. 6. 2026', d.time || 'o 17:00')}
        ${pin(place)}
      </div>
      ${d.showSponsors === false ? '' : `<div style="margin-top:6px;">${sponsors(d.partners)}</div>`}
    </div>
  </div>`;
}

// Súhrn pohybov v kádri — vodorovné pásy (Príchody / Z dorastu / Odchody) cez celú šírku,
// mená v každom páse vedľa seba v mriežke. Veľkosť písma sa dopočíta tak, aby sa obsah zmestil.
function tKader(d) {
  const groups = d.groups || [];
  const GAP = 26;                                       // medzera medzi pásmi
  const AVAIL = d.showSponsors === false ? 840 : 590;    // koľko px zvýši na zoznam

  // `scale` zmenší/zväčší písmo pásu (napr. odchody menšie ako príchody)
  const sc = (g) => (typeof g.scale === 'number' ? g.scale : 1);
  // rovnaký počet stĺpcov vo všetkých pásoch, aby sa mená zvislo zarovnali
  const colsOf = (g) => g.cols || d.cols || Math.min(3, Math.max(1, (g.items || []).length));
  const rowsOf = (g) => Math.ceil((g.items || []).length / colsOf(g));
  const hasNote = (g) => (g.items || []).some((it) => typeof it !== 'string' && it.note);

  const bandH = (g, b) => {
    const n = Math.round(b * sc(g));
    const label = Math.round(n * 0.5) + 16;
    const row = Math.round(n * 1.06) + (hasNote(g) ? Math.round(n * 0.56 * 1.2) + 2 : 0) + 14;
    return label + rowsOf(g) * row;
  };
  const totalH = (b) => groups.reduce((a, g) => a + bandH(g, b), 0) + GAP * Math.max(0, groups.length - 1);

  let base = 56;
  while (base > 18 && totalH(base) > AVAIL) base -= 1;
  // mená vždy na jeden riadok: písmo obmedzí aj šírka stĺpca (Oswald ≈ 0,5 em na znak)
  groups.forEach((g) => {
    const cols = colsOf(g), colW = (924 - 34 * (cols - 1)) / cols;
    const maxLen = Math.max(1, ...(g.items || []).map((it) => (typeof it === 'string' ? it : it.name).length));
    while (base > 18 && Math.round(base * sc(g)) * 0.5 * maxLen > colW) base -= 1;
  });

  const band = (g) => {
    const n = Math.round(base * sc(g));
    const noteSize = Math.round(n * 0.56);
    const cols = colsOf(g);
    const cells = (g.items || []).map((it) => {
      const name = typeof it === 'string' ? it : it.name;
      const note = typeof it === 'string' ? '' : it.note;
      return `<div style="padding:4px 0;">
        <div style="font-family:${OS};font-weight:700;font-size:${n}px;line-height:1.06;color:${C.white};text-transform:uppercase;white-space:nowrap;">${esc(name)}</div>
        ${note ? `<div style="font-family:${BA};font-weight:600;font-size:${noteSize}px;line-height:1.2;color:${C.grey2};margin-top:1px;">${esc(note)}</div>` : ''}
      </div>`;
    }).join('');
    return `<div>
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:8px;">
        <span style="font-family:${BA};font-weight:800;font-size:${Math.round(n * 0.5)}px;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};white-space:nowrap;">${esc(g.label)}</span>
        <span style="flex:1;height:2px;background:rgba(249,166,3,.35);"></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px 34px;">${cells}</div>
    </div>`;
  };

  const t = d.title || ['Káder', '2026/27'];
  const kicker = d.kicker || ['Pohyby', 'v kádri'];
  return `<div style="${PAD}">
    ${header(esc(kicker[0]) + '<br>' + esc(kicker[1] || ''))}
    <div style="margin-top:22px;">
      <div style="font-family:${OS};font-weight:700;font-size:96px;line-height:.98;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(t[0])} <span style="color:${C.gold};">${esc(t[1] || '')}</span></div>
      ${d.subtitle ? `<div style="font-family:${BA};font-weight:700;font-size:24px;letter-spacing:.06em;color:${C.grey1};margin-top:10px;">${esc(d.subtitle)}</div>` : ''}
    </div>
    <div style="flex:1;margin-top:22px;display:flex;flex-direction:column;justify-content:center;gap:${GAP}px;">${groups.map(band).join('')}</div>
    ${d.showSponsors === false ? '' : `<div style="margin-top:12px;">${sponsors(d.partners)}</div>`}
  </div>`;
}

function tVysledok(d) {
  const hl = d.headline || ['Vysoká', 'výhra!'];
  const scorers = d.scorers || 'Ivan Krajčovič <span style="color:'+C.grey2+'">2 góly</span> · Peter Lopatka · Ľubomír Krivošík';
  return `<div style="${PAD}">
    ${header((d.liga && d.liga[0] || 'VIII. liga') + '<br>' + (d.liga && d.liga[1] || 'MAXIMA FASÁDY') + `</div><div style="font-family:${BA};font-weight:700;font-size:20px;letter-spacing:.06em;text-transform:uppercase;color:${C.grey1};margin-top:10px;">` + esc(d.date || 'Nedeľa 14. 6. 2026'))}
    <div style="margin-top:44px;">
      <div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.08;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(hl[0])}<br><span style="color:${C.gold};">${esc(hl[1] || '')}</span></div>
    </div>
    <div style="margin-top:auto;display:flex;align-items:center;gap:42px;">
      <div style="font-family:${OS};font-weight:700;font-size:196px;line-height:.8;color:${C.gold};white-space:nowrap;flex-shrink:0;">${esc(d.score || '4:0')}</div>
      <div style="display:flex;flex-direction:column;min-width:0;flex:1;">
        ${(() => {
          const us = `<span data-fit data-fit-max="62" data-fit-min="32" style="display:block;font-family:${OS};font-weight:700;font-size:62px;line-height:1.02;color:${C.white};text-transform:uppercase;white-space:nowrap;overflow:hidden;">TJ Veľké Kostoľany</span>`;
          const vs = `<span style="font-family:${BA};font-weight:700;font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:${C.grey2};margin:12px 0;">vs.</span>`;
          const opp = `<span data-fit data-fit-max="46" data-fit-min="24" style="display:block;font-family:${OS};font-weight:700;font-size:46px;line-height:1.02;color:${C.grey1};text-transform:uppercase;white-space:nowrap;overflow:hidden;">${esc(d.opponent || 'ŠK Borovce')}</span>`;
          return d.vonku ? opp + vs + us : us + vs + opp;
        })()}
      </div>
    </div>
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:22px;">
      <div style="border-top:2px solid rgba(255,255,255,.18);padding-top:22px;">
        <div style="font-family:${BA};font-weight:700;font-size:22px;letter-spacing:.22em;text-transform:uppercase;color:${C.gold};margin-bottom:12px;">Naši strelci</div>
        <div style="font-family:${BA};font-weight:600;font-size:30px;line-height:1.45;color:${C.grey3};">${scorers}</div>
      </div>
      ${d.showSponsors === false ? '' : `<div style="margin-top:6px;">${sponsors(d.partners)}</div>`}
    </div>
  </div>`;
}

function tProgram(d) {
  const rows = d.rows || [
    { day: 'Nedeľa', time: '17:00', meta: 'VIII. liga · Štadión Michala Podolana', teams: 'TJ Veľké Kostoľany|vs|ŠK Borovce' },
    { day: 'Sobota', time: '17:00', meta: 'Dorast · Ihrisko súpera', teams: 'FK Šulekovo|vs|TJ Veľké Kostoľany' },
  ];
  const rowHtml = rows.map(r => {
    const [a, , b] = r.teams.split('|');
    return `<div style="border-top:2px solid rgba(255,255,255,.18);padding-top:26px;display:flex;gap:30px;align-items:center;">
      <div style="width:200px;flex-shrink:0;">
        <div style="font-family:${BA};font-weight:700;font-size:22px;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};white-space:nowrap;">${esc(r.day)}</div>
        <div style="font-family:${OS};font-weight:700;font-size:84px;line-height:.92;color:${C.white};">${esc(r.time)}</div>
      </div>
      <div style="width:2px;align-self:stretch;background:rgba(255,255,255,.18);"></div>
      <div style="flex:1;">
        <div style="font-family:${BA};font-weight:700;font-size:20px;letter-spacing:.18em;text-transform:uppercase;color:${C.gold};margin-bottom:10px;">${esc(r.meta)}</div>
        <div style="font-family:${OS};font-weight:700;font-size:50px;line-height:1.2;color:${C.white};text-transform:uppercase;">${esc(a)}<br><span style="color:${C.grey2};font-size:34px;">vs</span> <span style="color:${C.grey1};">${esc(b)}</span></div>
      </div>
    </div>`;
  }).join('');
  return `<div style="${PAD}">
    ${header('Program<br>víkendu')}
    <div style="margin-top:36px;"><div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.0;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(d.title || 'Hráme!')}</div></div>
    <div style="flex:1;margin-top:28px;display:flex;flex-direction:column;justify-content:space-evenly;">${rowHtml}</div>
    ${d.showSponsors === false ? '' : `<div style="margin-top:16px;">${sponsors(d.partners)}</div>`}
  </div>`;
}

function tVysledky(d) {
  const rows = d.rows || [
    { label: 'VIII. liga · muži', score: '4:0', teams: 'TJ Veľké Kostoľany|vs|ŠK Borovce', scorers: 'Ivan Krajčovič · Peter Lopatka · Ľubomír Krivošík' },
    { label: 'Dorast · vonku', score: '3:1', teams: 'TJ Veľké Kostoľany|vs|FK Šulekovo', scorers: 'Matúš Krajčovič · Adam Kolarovič · Ľubomír Krivošík' },
  ];
  const rowHtml = rows.map(r => {
    const [a, , b] = r.teams.split('|');
    return `<div style="border-top:2px solid rgba(255,255,255,.18);padding-top:26px;display:flex;gap:30px;align-items:center;">
      <div style="width:236px;flex-shrink:0;">
        <div style="font-family:${BA};font-weight:700;font-size:22px;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};white-space:nowrap;">${esc(r.label)}</div>
        <div style="font-family:${OS};font-weight:700;font-size:100px;line-height:.92;color:${C.gold};">${esc(r.score)}</div>
      </div>
      <div style="width:2px;align-self:stretch;background:rgba(255,255,255,.18);"></div>
      <div style="flex:1;">
        <div style="font-family:${OS};font-weight:700;font-size:50px;line-height:1.2;color:${C.white};text-transform:uppercase;">${esc(a)}<br><span style="color:${C.grey2};font-size:34px;">vs</span> <span style="color:${C.grey1};">${esc(b)}</span></div>
        ${r.scorers ? `<div style="font-family:${BA};font-weight:600;font-size:23px;color:${C.grey3};margin-top:12px;">${esc(r.scorers)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  return `<div style="${PAD}">
    ${header('Výsledky<br>víkendu')}
    <div style="margin-top:36px;"><div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.0;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(d.title || 'Výsledky')}</div></div>
    <div style="flex:1;margin-top:28px;display:flex;flex-direction:column;justify-content:space-evenly;">${rowHtml}</div>
    ${d.showSponsors === false ? '' : `<div style="margin-top:16px;">${sponsors(d.partners)}</div>`}
  </div>`;
}

function tEvent(d) {
  const title = d.title || ['UKONČENIE', 'SEZÓNY', '2025/26'];
  const rows = d.schedule || [
    { time: '19:00', text: 'Zápas rodičov s deťmi + detská diskotéka', gold: true },
    { time: '21:00', text: 'Oldies párty', gold: false },
  ];
  const schedHtml = rows.map((r, i) => `<div style="${i === 0 ? 'padding-right:36px;border-right:1px solid rgba(255,255,255,.16);' : 'padding-left:36px;'}">
      <div style="font-family:${OS};font-weight:700;font-size:50px;color:${r.gold ? C.gold : C.white};">${esc(r.time)}</div>
      <div style="font-family:${BA};font-weight:600;font-size:26px;color:${C.grey4};line-height:1.3;margin-top:4px;">${esc(r.text)}</div>
    </div>`).join('');
  return `<div style="${PAD}">
    ${header(esc(d.kicker0 || 'Spolu uzatvárame') + '<br>' + esc(d.kicker1 || 'sezónu'))}
    <div style="margin-top:44px;">
      <div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.16;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(title[0])}</div>
      <div style="line-height:1.16;white-space:nowrap;">
        <span style="display:inline-block;font-family:${OS};font-weight:700;font-size:124px;line-height:1.16;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;vertical-align:baseline;">${esc(title[1] || '')}</span>
        <span style="display:inline-block;font-family:${OS};font-weight:700;font-size:124px;line-height:1.16;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:3px ${C.gold};vertical-align:baseline;margin-left:22px;">${esc(title[2] || '')}</span>
      </div>
    </div>
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:26px;">
      <div style="display:flex;align-items:center;gap:26px;flex-wrap:wrap;">
        ${datePill(d.date || 'Sobota 20. 6. 2026', d.time || 'od 18:00')}
        ${pin(d.place || 'Štadión Michala Podolana')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:2px solid rgba(255,255,255,.18);padding-top:24px;">${schedHtml}</div>
      ${d.showBand === false ? '' : goldBand(d.bandTag || 'Verejnosť vítaná', d.bandText || 'Otvorený bufet pre všetkých návštevníkov')}
    </div>
  </div>`;
}

function tOznam(d) {
  const title = d.title || ['Zmena', 'termínu'];
  return `<div style="${PAD}">
    ${header(esc(d.kicker0 || 'Oznam') + '<br>' + esc(d.kicker1 || 'klubu'))}
    <div style="margin-top:44px;">
      <div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.16;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(title[0])}<br><span style="color:${C.gold};">${esc(title[1] || '')}</span></div>
    </div>
    <div style="margin-top:56px;max-width:924px;font-family:${BA};font-weight:600;font-size:48px;line-height:1.42;color:${C.grey3};">${esc(d.body || 'Sobotný zápas sa pre nepriaznivé počasie prekladá na nedeľu 14. 6. 2026 o 17:00. Ďakujeme za pochopenie a tešíme sa na vás na štadióne.')}</div>
    <div style="margin-top:auto;display:flex;align-items:center;gap:26px;flex-wrap:wrap;">
      ${d.date ? datePill(d.date, d.time || '') : ''}
      ${d.place ? pin(d.place) : ''}
    </div>
  </div>`;
}

function tMvp(d) {
  const st = d.stats || [{ n: '2', l: 'Góly' }, { n: '1', l: 'Asistencia' }, { n: '90', l: 'Minút', gold: true }];
  const stHtml = st.map((s, i) => `<div style="flex:1;${i > 0 ? 'border-left:1px solid rgba(255,255,255,.16);padding-left:28px;' : ''}">
      <div style="font-family:${OS};font-weight:700;font-size:76px;line-height:.9;color:${s.gold ? C.gold : C.white};">${esc(s.n)}</div>
      <div style="font-family:${BA};font-weight:700;font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:${C.grey2};margin-top:8px;">${esc(s.l)}</div>
    </div>`).join('');
  const nm = (d.name || 'Ivan Krajčovič').split(' ');
  // Fotka hráča: keď je `photo` vyplnené a súbor existuje, vyplní rámček.
  // 🔴 Rámček je na plagáte VŽDY — priestor na fotku k tomuto typu patrí
  // *(rozhodol Filip 21. 9. 2026)*. Bez fotky sa vykreslí prerušovaný
  // placeholder, ktorý je signálom „sem treba dodať fotku"; taký plagát sa
  // nezverejňuje.
  const photo = imgURI(d.photo);
  const photoBox = photo
    ? `<div style="width:400px;height:560px;flex-shrink:0;border-radius:20px;overflow:hidden;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.28);">
         <img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">
       </div>`
    : `<div style="width:400px;height:560px;flex-shrink:0;border-radius:20px;background:rgba(255,255,255,.08);border:2px dashed rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-family:${BA};font-weight:600;font-size:22px;color:${C.grey2};text-align:center;">Foto hráča</div>`;
  return `<div style="${PAD}">
    ${header('Hráč<br>zápasu')}
    <div style="flex:1;margin-top:36px;display:flex;align-items:center;gap:56px;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:24px;">
          <span style="font-family:${OS};font-weight:700;font-size:168px;line-height:.8;color:${C.gold};">${esc(d.number || '9')}</span>
          <div style="font-family:${OS};font-weight:700;font-size:86px;line-height:1.12;color:${C.white};text-transform:uppercase;">${esc(nm[0])}<br>${esc(nm.slice(1).join(' '))}</div>
        </div>
        <div style="font-family:${BA};font-weight:700;font-size:26px;letter-spacing:.08em;text-transform:uppercase;color:${C.grey2};margin-top:24px;">${esc(d.role || 'Útočník · TJ Veľké Kostoľany')}</div>
        <div style="display:flex;gap:0;border-top:2px solid rgba(255,255,255,.18);margin-top:30px;padding-top:24px;">${stHtml}</div>
      </div>
      ${photoBox}
    </div>
    ${goldBand(d.bandTag || 'Gratulujeme', d.bandText || 'Hráč zápasu podľa hlasovania fanúšikov.')}
  </div>`;
}

function tStrelci(d) {
  const list = d.list || [
    { name: 'Tomáš Gula', goals: 15 }, { name: 'Ivan Krajčovič', goals: 11 },
    { name: 'Ľubomír Krivošík', goals: 8 }, { name: 'Matúš Krajčovič', goals: 6 }, { name: 'Adam Kolarovič', goals: 5 },
  ];
  const rows = list.map((p, i) => `<div style="flex:1;display:flex;align-items:center;gap:28px;border-top:${i === 0 ? '2px solid rgba(255,255,255,.18)' : '1px solid rgba(255,255,255,.14)'};">
      <span style="font-family:${OS};font-weight:700;font-size:54px;line-height:1;color:${C.gold};width:56px;flex-shrink:0;">${i + 1}</span>
      <span style="flex:1;font-family:${OS};font-weight:700;font-size:50px;line-height:1;color:${C.white};text-transform:uppercase;">${esc(p.name)}</span>
      <span style="font-family:${OS};font-weight:700;font-size:54px;line-height:1;color:${C.white};white-space:nowrap;">${esc(p.goals)} <span style="font-family:${BA};font-weight:700;font-size:22px;color:${C.grey2};">gólov</span></span>
    </div>`).join('');
  return `<div style="${PAD}">
    ${header('Najlepší<br>strelci')}
    <div style="margin-top:36px;"><div style="font-family:${OS};font-weight:700;font-size:96px;line-height:1.0;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(d.title || 'Strelci sezóny')}</div></div>
    <div style="flex:1;margin-top:28px;display:flex;flex-direction:column;">${rows}</div>
  </div>`;
}

// ROZPIS / ROZLOSOVANIE — zoznam kôl (napr. prvých 5 ligových)
// Skratky dní pre typ `rozpis`. Používajú sa len vtedy, keď riadok nesie deň —
// rozlosovanie jednej súťaže ("1. kolo") deň nemá a ostáva na pôvodnom layoute.
const DAY_ABBR = { po:'Pondelok', ut:'Utorok', st:'Streda', 'št':'Štvrtok', pi:'Piatok', so:'Sobota', ne:'Nedeľa' };

// Z riadku vytiahne kategóriu, deň a čas. Explicitné polia cat/day/time majú prednosť;
// inak sa parsuje `kolo` v tvare "U15 · st 17:00". Keď sa deň nedá určiť, ok=false.
function rozpisParse(r) {
  if (r.cat || r.day || r.time) {
    return { cat: r.cat || '', day: r.day || '', dayShort: (r.dayShort || r.day || '').slice(0, 2), time: r.time || '', ok: !!(r.day) };
  }
  const parts = String(r.kolo || '').split('·').map(s => s.trim());
  const fail = { cat: r.kolo || '', day: '', dayShort: '', time: '', ok: false };
  if (parts.length < 2) return fail;
  const m = parts[1].match(/^([A-Za-zÁ-ž]{2})\s+(.+)$/);
  if (!m) return fail;
  const day = DAY_ABBR[m[1].toLowerCase()];
  if (!day) return fail;
  return { cat: parts[0], day: day, dayShort: m[1], time: m[2], ok: true };
}

// Rozmery riadkov sú v `em` voči základu bloku (100px) — vďaka tomu vie `data-vfit`
// (viď FIT_SCRIPT) zmenšiť celý zoznam naraz, keď je kôl priveľa, a sponzorská stena
// nikdy nevypadne z plagáta. *(Doplnené 14. 9. 2026 — pri 6 riadkoch mládeže utekali
// sponzori mimo plagát.)*
function rozpisBadge(away, small) {
  const fs = small ? '.17em' : '.19em';
  return away
    ? `<span style="font-family:${BA};font-weight:800;font-size:${fs};letter-spacing:.12em;text-transform:uppercase;color:${C.gold};border:2px solid ${C.gold};border-radius:8px;padding:${small ? '.24em .59em' : '.32em .63em'};white-space:nowrap;">Vonku</span>`
    : `<span style="font-family:${BA};font-weight:800;font-size:${fs};letter-spacing:.12em;text-transform:uppercase;color:${C.bg};background:${C.gold};border-radius:8px;padding:${small ? '.29em .65em' : '.42em .74em'};white-space:nowrap;">Doma</span>`;
}

// Pôvodný layout — jeden riadok = jedno kolo. Pre rozlosovanie súťaže (liga-rozpis, rozpis-u11 …).
function rozpisFlat(rows) {
  return rows.map((r, i) => `<div style="flex:1;display:flex;align-items:center;gap:.26em;border-top:${i === 0 ? '2px solid rgba(255,255,255,.18)' : '1px solid rgba(255,255,255,.14)'};">
      <div style="width:1.9em;flex-shrink:0;">
        <div style="font-family:${BA};font-weight:700;font-size:.19em;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};">${esc(r.kolo)}</div>
        <div style="font-family:${OS};font-weight:700;font-size:.52em;line-height:.96;color:${C.white};">${esc(r.date)}</div>
      </div>
      <div style="width:1.2em;flex-shrink:0;display:flex;">${rozpisBadge(r.vonku === true, false)}</div>
      <div style="flex:1;font-family:${OS};font-weight:700;font-size:.46em;line-height:1.02;color:${C.white};text-transform:uppercase;">${esc(r.opp)}</div>
    </div>`).join('');
}

// Kategória ako hlavný údaj riadku (variant A) — pre týždenný program mládeže.
// Deň, dátum a čas idú pod ňu na JEDEN riadok; názov súpera musí zostať jednoriadkový,
// preto je ľavý stĺpec úzky, plaketa menšia a medzery tesnejšie.
function rozpisStacked(rows) {
  return rows.map((r, i) => {
    const p = rozpisParse(r);
    const meta = [p.dayShort ? p.dayShort.toUpperCase() : '', r.date, p.time ? '· ' + p.time : '']
      .filter(Boolean).join(' ');
    return `<div style="flex:1;display:flex;align-items:center;gap:.20em;border-top:${i === 0 ? '2px solid rgba(255,255,255,.18)' : '1px solid rgba(255,255,255,.14)'};">
      <div style="width:2.1em;flex-shrink:0;">
        <div style="font-family:${OS};font-weight:700;font-size:.58em;line-height:1;color:${C.white};text-transform:uppercase;">${esc(p.cat)}</div>
        <div style="font-family:${BA};font-weight:700;font-size:.24em;letter-spacing:.03em;text-transform:uppercase;color:${C.gold};margin-top:.21em;white-space:nowrap;">${esc(meta)}</div>
      </div>
      <div style="width:1em;flex-shrink:0;display:flex;">${rozpisBadge(r.vonku === true, true)}</div>
      <div style="flex:1;font-family:${OS};font-weight:700;font-size:.46em;line-height:1.02;color:${C.white};text-transform:uppercase;white-space:nowrap;">${esc(r.opp)}</div>
    </div>`;
  }).join('');
}

function tRozpis(d) {
  const rows = d.rows || [];
  // Layout s kategóriou navrchu sa zapne, len keď KAŽDÝ riadok nesie deň.
  // Rozlosovanie súťaže ("1. kolo") deň nemá a ostáva na pôvodnom layoute.
  const grouped = rows.length > 0 && rows.every(r => rozpisParse(r).ok);
  const rowHtml = grouped ? rozpisStacked(rows) : rozpisFlat(rows);
  const t = d.title || ['Rozlosovanie', 'jesene'];
  return `<div style="${PAD}">
    <div style="display:flex;align-items:center;gap:26px;">
      <img src="${LOGO}" alt="TJ Veľké Kostoľany" style="height:150px;width:auto;filter:drop-shadow(0 6px 18px rgba(0,0,0,.35));">
      <div style="width:2px;height:96px;background:rgba(255,255,255,.22);"></div>
      <div style="font-family:${BA};font-weight:700;font-size:22px;letter-spacing:.32em;text-transform:uppercase;color:${C.gold};line-height:1.5;">${esc((d.liga||['VIII. liga','MAXIMA FASÁDY'])[0])}<br>${esc((d.liga||['','MAXIMA FASÁDY'])[1]||'')}</div>
    </div>
    <div style="margin-top:24px;">
      <div style="font-family:${OS};font-weight:700;font-size:88px;line-height:.96;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(t[0])} <span style="color:${C.gold};">${esc(t[1]||'')}</span></div>
      <div style="font-family:${BA};font-weight:700;font-size:22px;letter-spacing:.06em;color:${C.grey1};margin-top:10px;">${esc(d.subtitle || 'Naši muži — súper a kde hráme')}</div>
    </div>
    <div data-vfit data-vfit-max="100" data-vfit-min="52" style="flex:1;min-height:0;overflow:hidden;margin-top:20px;display:flex;flex-direction:column;font-size:100px;">${rowHtml}</div>
    ${d.showSponsors === false ? '' : `<div style="flex-shrink:0;margin-top:14px;">${sponsors(d.partners)}</div>`}
  </div>`;
}

function tMilnik(d) {
  return `<div style="${PAD}">
    ${header('Klubový<br>míľnik')}
    <div style="flex:1;margin-top:auto;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-family:${BA};font-weight:700;font-size:28px;letter-spacing:.28em;text-transform:uppercase;color:${C.gold};margin-bottom:10px;">${esc(d.kicker || 'Práve padol')}</div>
      <div style="display:flex;align-items:flex-end;gap:30px;">
        <span style="font-family:${OS};font-weight:700;font-size:240px;line-height:.8;color:${C.gold};">${esc(d.number || '65')}</span>
        <span style="font-family:${OS};font-weight:700;font-size:74px;line-height:1.16;color:${C.white};text-transform:uppercase;">${esc((d.unit || ['gólov', 'sezóny'])[0])}<br>${esc((d.unit || ['gólov', 'sezóny'])[1] || '')}</span>
      </div>
      <div style="font-family:${BA};font-weight:600;font-size:34px;line-height:1.34;color:${C.grey3};margin-top:34px;max-width:880px;">${d.body || 'V sezóne 2025/26 sme strelili <span style="color:'+C.white+';font-weight:800;">65 gólov</span>. Najviac z nich pridal Tomáš Gula.'}</div>
    </div>
    ${goldBand(d.bandTag || 'Míľnik', d.bandText || 'Ďakujeme všetkým strelcom za skvelú sezónu!')}
  </div>`;
}

function tVitaj(d) {
  const nm = (d.name || 'Filip Gregorovič').split(' ');
  return `<div style="${PAD}">
    ${header('Nová<br>posila')}
    <div style="margin-top:36px;"><div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.0;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(d.title0 || 'Vitaj')} <span style="color:${C.gold};">${esc(d.title1 || 'v tíme!')}</span></div></div>
    <div style="flex:1;margin-top:28px;display:flex;align-items:center;gap:48px;">
      <div style="width:380px;height:440px;flex-shrink:0;border-radius:20px;background:rgba(255,255,255,.08);border:2px dashed rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-family:${BA};font-weight:600;font-size:22px;color:${C.grey2};text-align:center;">Foto hráča</div>
      <div style="flex:1;min-width:0;">
        <div style="font-family:${OS};font-weight:700;font-size:72px;line-height:1.1;color:${C.white};text-transform:uppercase;">${esc(nm[0])}<br>${esc(nm.slice(1).join(' '))}</div>
        <div style="font-family:${BA};font-weight:700;font-size:24px;letter-spacing:.08em;text-transform:uppercase;color:${C.grey2};margin-top:18px;">${esc(d.meta || 'Nová posila · z Piešťan')}</div>
        <div style="font-family:${BA};font-weight:600;font-size:26px;line-height:1.4;color:${C.grey3};margin-top:22px;">${esc(d.body || 'Prichádza z Piešťan a posilní náš káder. Veľa šťastia v drese Kostoľian!')}</div>
      </div>
    </div>
  </div>`;
}

function tNabor(d) {
  const rows = d.rows || [
    { k: 'Ročníky', v: 'Deti narodené 2014 – 2019' },
    { k: 'Tréningy', v: 'Utorok & štvrtok · 17:00' },
    { k: 'Kde', v: 'Štadión Michala Podolana' },
  ];
  const rowHtml = rows.map(r => `<div style="display:flex;align-items:center;gap:24px;">
      <div style="font-family:${OS};font-weight:700;font-size:32px;color:${C.bg};background:${C.gold};border-radius:12px;padding:12px 14px;width:184px;text-align:center;flex-shrink:0;text-transform:uppercase;">${esc(r.k)}</div>
      <div style="font-family:${BA};font-weight:700;font-size:42px;color:${C.white};">${esc(r.v)}</div>
    </div>`).join('');
  return `<div style="${PAD}">
    ${header('Nábor<br>mládeže')}
    <div style="margin-top:36px;"><div style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.08;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;">${esc(d.title0 || 'Pridaj sa')}<br><span style="color:${C.gold};">${esc(d.title1 || 'k nám!')}</span></div></div>
    <div style="flex:1;margin-top:28px;display:flex;flex-direction:column;justify-content:center;gap:34px;">${rowHtml}</div>
    ${goldBand(d.bandTag || 'Príď si zahrať', d.bandText || 'Info: 0905 123 456 · prvý tréning zdarma!')}
  </div>`;
}

function tSezona(d) {
  const stats = d.stats || [
    { n: '26', l: 'Odohraných zápasov' }, { n: '14', l: 'Víťazstiev', gold: true }, { n: '65', l: 'Strelených gólov' },
    { n: '46', l: 'Bodov' }, { n: '4.', l: 'Miesto v tabuľke', gold: true }, { n: '39', l: 'Inkasovaných gólov' },
  ];
  const cell = (s, i) => {
    const topBorder = i < 3 ? '2px solid rgba(255,255,255,.18)' : '1px solid rgba(255,255,255,.14)';
    const leftBorder = (i % 3 !== 0) ? 'border-left:1px solid rgba(255,255,255,.14);' : '';
    return `<div style="border-top:${topBorder};${leftBorder}padding:44px 26px;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-family:${OS};font-weight:700;font-size:116px;line-height:.86;color:${s.gold ? C.gold : C.white};">${esc(s.n)}</div>
      <div style="font-family:${BA};font-weight:700;font-size:23px;letter-spacing:.1em;text-transform:uppercase;color:${C.grey2};margin-top:12px;">${esc(s.l)}</div>
    </div>`;
  };
  const t = d.titleParts || ['Sezóna', '2025/26'];
  return `<div style="${PAD}">
    ${header('Sezóna<br>v číslach')}
    <div style="margin-top:36px;"><div style="line-height:1.0;white-space:nowrap;"><span style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.0;letter-spacing:-.01em;color:${C.white};text-transform:uppercase;vertical-align:baseline;">${esc(t[0])}</span><span style="font-family:${OS};font-weight:700;font-size:124px;line-height:1.0;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:3px ${C.gold};text-transform:uppercase;vertical-align:baseline;margin-left:22px;">${esc(t[1] || '')}</span></div></div>
    <div style="margin:auto 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">${stats.map(cell).join('')}</div>
  </div>`;
}


// Tímová fotka k výsledku (4:5). Fotka na šírku (4:3) sa vloží CELÁ do rámu, nič sa neoreže
// — rozhodol Filip 2. 11. 2026 (audit). Bez fotky prerušovaný placeholder = taký plagát sa nezverejňuje.
// Dáta: { type:'fotka', kicker:'Zostava', kicker2:'Nedeľa 1. 11. 2026', title:['Proti','Veselému'], photo:'assets/...jpg', caption:'12. kolo · doma · …' }
function tFotka(d) {
  const photo = imgURI(d.photo);
  const t = d.title || ['Proti', 'súperovi'];
  const img = photo
    ? `<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:contain;display:block;background:#0f1f5c;">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:2px dashed rgba(255,255,255,.28);background:rgba(255,255,255,.08);font-family:${BA};font-weight:600;font-size:24px;color:${C.grey2};text-align:center;">Tímová fotka na šírku (4:3)</div>`;
  return `<div style="${PAD}">
    ${header(esc(d.kicker || 'Zostava') + '<br>' + esc(d.kicker2 || ''))}
    <div style="margin-top:40px;font-family:${OS};font-weight:700;font-size:96px;line-height:1;color:${C.white};text-transform:uppercase;">${esc(t[0])} <span style="color:${C.gold};">${esc(t[1] || '')}</span></div>
    <div style="flex:1;display:flex;align-items:center;margin-top:24px;">
      <div style="width:100%;aspect-ratio:4/3;border:${photo ? '6px solid #fff' : '0'};border-radius:6px;overflow:hidden;box-shadow:${photo ? '0 14px 34px rgba(0,0,0,.35)' : 'none'};">${img}</div>
    </div>
    ${d.caption ? `<div style="margin-top:22px;font-family:${BA};font-weight:600;font-size:24px;color:${C.grey1};">${esc(d.caption)}</div>` : ''}
  </div>`;
}

const RENDERERS = {
  fotka: tFotka,
  zapas: tZapas, vysledok: tVysledok, program: tProgram, vysledky: tVysledky,
  event: tEvent, oznam: tOznam, mvp: tMvp, strelci: tStrelci,
  milnik: tMilnik, vitaj: tVitaj, nabor: tNabor, sezona: tSezona, rozpis: tRozpis,
  kader: tKader,
};

export const POST_TYPES = Object.keys(RENDERERS);

export function buildPoster(d) {
  const type = d.type || 'zapas';
  const fn = RENDERERS[type];
  if (!fn) throw new Error('Neznámy typ postu: ' + type);
  const inner = fn(d);
  return `<div id="poster" style="width:1080px;height:1350px;position:relative;overflow:hidden;background:${C.bg};box-shadow:0 24px 60px rgba(20,20,80,.28);font-family:${BA};">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(118deg, transparent 0 78px, rgba(255,255,255,.045) 78px 156px);"></div>
    ${ghostLayer(type, d.ghost)}
    <div style="position:absolute;top:58px;right:58px;width:64px;height:64px;border-top:6px solid ${C.gold};border-right:6px solid ${C.gold};pointer-events:none;z-index:2;"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:7px;background:${C.gold};pointer-events:none;z-index:2;"></div>
    <div style="position:relative;z-index:3;height:100%;">${inner}</div>
  </div>`;
}

// ── Auto-fit dlhých názvov ────────────────────────────────────────────────
// Každý prvok s `data-fit` sa zmenší, kým sa nezmestí na šírku rodiča.
// Dôvod: názvy súperov sú rôzne dlhé („ŠK Borovce" vs. „TJ Družstevník Dolný
// Lopašov") a pevná veľkosť písma dlhší názov vytlačila mimo plagát.
// *(Doplnené 24. 8. 2026 — pozvánka na zápas v Dolnom Lopašove mala orezaný názov.)*
// Beží až po načítaní webfontov, inak by meral v náhradnom fonte a vyšiel nesprávne.
export const FIT_SCRIPT = `<script>
(function () {
  function fitOne(el) {
    var max = parseFloat(el.dataset.fitMax || window.getComputedStyle(el).fontSize);
    var min = parseFloat(el.dataset.fitMin || '20');
    var size = max, guard = 0;
    el.style.fontSize = size + 'px';
    while (el.scrollWidth > el.clientWidth && size > min && guard++ < 400) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  }
  // Výškový auto-fit: blok s [data-vfit] zmenšuje svoju základnú veľkosť písma,
  // kým sa obsah nezmestí na výšku. Rozmery vnútri musia byť v em.
  // Dôvod: pri 6 a viac riadkoch programu prerástol zoznam plagát a vytlačil
  // sponzorskú stenu mimo plochu. *(Doplnené 14. 9. 2026.)*
  function vfitOne(el) {
    var max = parseFloat(el.dataset.vfitMax || '100');
    var min = parseFloat(el.dataset.vfitMin || '50');
    var size = max, guard = 0;
    el.style.fontSize = size + 'px';
    while (el.scrollHeight > el.clientHeight + 1 && size > min && guard++ < 400) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  }
  function fitAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-vfit]'), vfitOne);
    Array.prototype.forEach.call(document.querySelectorAll('[data-fit]'), fitOne);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  else window.addEventListener('load', fitAll);
})();
<\/script>`;

export function pageHTML(d) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
*{box-sizing:border-box;} html,body{margin:0;padding:0;background:#e7e8ee;}
</style></head><body>${buildPoster(d)}${FIT_SCRIPT}</body></html>`;
}

// zdieľané pre A4 modul
export { C, LOGO, FONTS, esc, sponsors };
