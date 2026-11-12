// stories.mjs — príbehy 9:16 (video ~8–9 s + statický záver) a obaly zvýraznených príbehov. TJVK.
// Schválené Filipom 2. 11. 2026: minimum textu (kto hrá, čas/skóre, súper, doma/vonku), „vs“ nie „proti“,
// animácia ~3 s a potom 5 s statický obraz. Reels sa NErobia (pozvánku a výsledok majú príspevky 4:5).
// Bezpečné zóny príbehu: hore 250 px, dole 300 px bez textu. Render: story-video.mjs (len v cloude, potrebuje Chromium + ffmpeg).
import { C, LOGO, FONTS, esc, FIT_SCRIPT } from './poster.mjs';
const OS = "'Oswald',sans-serif", BA = "'Barlow',sans-serif";
const short = (n) => n.replace(/^(OFK|OŠK|TJ|FK|ŠK|MTK|FC|FO|OFC|ŠKF)\s+/i, '');

const STRIPES = `<div id="st" style="position:absolute;inset:-200px;background:repeating-linear-gradient(118deg, transparent 0 78px, rgba(255,255,255,.05) 78px 156px);"></div>`;
const frame = (inner) => `<div id="poster" style="width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.bg};font-family:${BA};">
  ${STRIPES}<div style="position:absolute;left:0;right:0;bottom:0;height:10px;background:${C.gold};z-index:2;"></div>
  <div style="position:relative;z-index:3;height:100%;">${inner}</div></div>`;
const chip = (t) => `<span style="display:inline-block;background:${C.gold};color:${C.bg};font-family:${OS};font-weight:700;font-size:46px;letter-spacing:.06em;text-transform:uppercase;padding:12px 30px;border-radius:12px;">${esc(t)}</span>`;
const logo = (h) => `<img src="${LOGO}" alt="" style="height:${h}px;filter:drop-shadow(0 10px 24px rgba(0,0,0,.4));">`;
// obsah drží pásmo y 250–1620 (mimo lišty profilu hore a poľa na odpoveď dole)
const team = (d) => `<div style="font-family:${OS};font-weight:700;font-size:64px;letter-spacing:.06em;color:${C.gold};text-transform:uppercase;line-height:1;">${esc(d.tim || 'A-mužstvo')}</div>`;
const SP = 'height:100%;padding:260px 90px 330px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;';

// Príbehy: video ~8–9 s — prvky naskočia postupne, potom 5 s statický záver (Filip 2. 11.). PNG = záverečný stav.
const A = (t0, k, html) => `<div data-in="${t0}" data-k="${k}" style="width:100%;display:flex;flex-direction:column;align-items:center;">${html}</div>`;
function order(d) { // poradie gólov pre počítadlo (góly súpera rozptýlené medzi naše)
  const [h, g] = d.score.split(':').map(Number), home = !d.vonku, ours = home ? h : g, opp = home ? g : h, tot = ours + opp, o = [];
  if (d.poradie) return { o: d.poradie.split(''), home }; // skutočné poradie gólov: u = náš, o = súper (Sportnet), 10. 11. 2026
  let left = opp; for (let i = 0; i < tot; i++) { if (left > 0 && (i + 1) / tot >= (opp - left + 1) / (opp + 1)) { o.push('o'); left--; } else o.push('u'); }
  return { o, home };
}
const STORY_ANIM = (cnt) => `<script>
const E=(x)=>1-Math.pow(1-Math.min(Math.max(x,0),1),3);
const B=(x)=>{x=Math.min(Math.max(x,0),1);const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const CNT=${JSON.stringify(cnt || null)};
window.R=function(t){document.getElementById('st').style.transform='translateX('+(-t*24)+'px)';
 document.querySelectorAll('[data-in]').forEach(el=>{const a=+el.dataset.in,k=el.dataset.k,x=E((t-a)/.4);
  el.style.opacity=t<a?0:Math.min(1,(t-a)/.18);
  el.style.transform=k==='slam'?'scale('+(1.7-.7*x)+')':k==='right'?'translateX('+((1-x)*360)+'px)':k==='pop'?'scale('+(t<a?0:B((t-a)/.35))+')':'translateY('+((1-x)*50)+'px)';});
 if(CNT){const el=document.getElementById('sc'),n0=CNT.t0,n1=CNT.t1,L=CNT.o.length;
  const n=t<n0?0:Math.min(L,Math.floor((t-n0)/((n1-n0)/L))+1); let u=0,o=0; for(let k=0;k<n;k++)CNT.o[k]==='u'?u++:o++;
  el.textContent=CNT.home?u+':'+o:o+':'+u;
  const last=n0+(n-1)*((n1-n0)/L),p=n>0?Math.max(0,1-(t-last)/.16):0; el.style.transform='scale('+(1+.07*p)+')';}
};</script>`;
function storyZapas(d) {
  return frame(`<div style="${SP}">
    ${A(.1, 'up', logo(150))}
    ${A(.35, 'up', `<div style="margin-top:34px;">${team(d)}</div>`)}
    ${A(.8, 'slam', `<div style="margin-top:44px;font-family:${OS};font-weight:700;font-size:250px;line-height:.86;color:transparent;-webkit-text-stroke:5px ${C.gold};letter-spacing:.02em;">DNES</div>`)}
    ${A(1.35, 'slam', `<div style="font-family:${OS};font-weight:700;font-size:330px;line-height:.9;color:${C.white};margin-top:10px;">${esc(d.timeOnly)}</div>`)}
    ${A(1.95, 'up', `<div style="margin-top:40px;font-family:${BA};font-weight:700;font-size:52px;letter-spacing:.2em;color:${C.grey2};text-transform:uppercase;">vs</div>`)}
    ${A(2.15, 'right', `<div data-fit data-fit-max="140" data-fit-min="70" style="width:100%;font-family:${OS};font-weight:700;font-size:140px;line-height:1.05;color:${C.white};text-transform:uppercase;white-space:nowrap;overflow:hidden;">${esc(short(d.opponent))}</div>`)}
    ${A(2.7, 'pop', `<div style="margin-top:46px;">${chip(d.vonku ? 'Vonku' : 'Doma')}</div>`)}
  </div>`) + STORY_ANIM(null);
}
function storyVysledok(d) {
  const { o, home } = order(d);
  return frame(`<div style="${SP}">
    ${A(.1, 'up', logo(150))}
    ${A(.35, 'up', `<div style="margin-top:34px;">${team(d)}</div>`)}
    ${A(.7, 'up', `<div style="margin-top:44px;font-family:${BA};font-weight:800;font-size:40px;letter-spacing:.3em;color:${C.grey1};text-transform:uppercase;">Koniec zápasu</div>`)}
    ${A(1.0, 'slam', `<div style="font-family:${OS};font-weight:700;font-size:400px;line-height:.9;color:${C.gold};margin-top:16px;"><span id="sc" style="display:inline-block;">${esc(d.score)}</span></div>`)}
    ${A(3.0, 'up', `<div style="margin-top:30px;font-family:${BA};font-weight:700;font-size:52px;letter-spacing:.2em;color:${C.grey2};text-transform:uppercase;">vs</div>`)}
    ${A(3.2, 'right', `<div data-fit data-fit-max="140" data-fit-min="70" style="width:100%;font-family:${OS};font-weight:700;font-size:140px;line-height:1.05;color:${C.white};text-transform:uppercase;white-space:nowrap;overflow:hidden;">${esc(short(d.opponent))}</div>`)}
    ${A(3.7, 'pop', `<div style="margin-top:46px;">${chip(d.vonku ? 'Vonku' : 'Doma')}</div>`)}
  </div>`) + STORY_ANIM(o.filter(x => x === 'u').length >= o.filter(x => x === 'o').length ? { o, home, t0: 1.2, t1: d.poradie ? 1.2 + 0.42 * o.length : 2.8 } : null); // pri prehre bez počítadla
}

// Obaly zvýraznených príbehov (Program, Výsledky, Mládež, Nábor, Partneri, Kontakt) — ikona v zlatom kruhu, názov sa píše v IG.
const ICONS = {
  program: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  vysledky: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  mladez: '<circle cx="12" cy="12" r="10"/><polygon points="12 7 16.5 10.3 14.8 15.5 9.2 15.5 7.5 10.3"/><line x1="12" y1="7" x2="12" y2="2"/><line x1="16.5" y1="10.3" x2="21.5" y2="8.9"/><line x1="14.8" y1="15.5" x2="17.9" y2="20.1"/><line x1="9.2" y1="15.5" x2="6.1" y2="20.1"/><line x1="7.5" y1="10.3" x2="2.5" y2="8.9"/>',
  nabor: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  partneri: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  kontakt: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
};
function cover(d) {
  return `<div id="poster" style="width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.bg};">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(118deg, transparent 0 78px, rgba(255,255,255,.045) 78px 156px);"></div>
    <div style="position:absolute;left:140px;top:560px;width:800px;height:800px;border-radius:50%;border:22px solid ${C.gold};display:flex;align-items:center;justify-content:center;">
      <svg viewBox="-1 -1 26 26" width="420" height="420" fill="none" stroke="${C.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[d.icon]}</svg>
    </div></div>`;
}


const RR = { 'story-zapas': storyZapas, 'story-vysledok': storyVysledok, cover };
export function pageHTML(d) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
*{box-sizing:border-box;} html,body{margin:0;padding:0;background:#e7e8ee;}</style></head><body>${(RR[d.format] || (() => { throw new Error('Neznámy formát príbehu: ' + d.format); }))(d)}${FIT_SCRIPT}</body></html>`;
}
