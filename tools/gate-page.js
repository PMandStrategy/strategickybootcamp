#!/usr/bin/env node
/*
 * gate-page.js — vytvoří zaheslovanou podstránku v resources/ z libovolného samostatného HTML.
 *
 * Do repa jde jen zašifrovaný blob (AES-256-GCM, klíč z hesla přes PBKDF2-SHA256, 600 000 iterací).
 * Stránka se odemkne heslem přímo v prohlížeči (Web Crypto API), nic se neposílá na server.
 * Heslo se nikdy nezapisuje do repa – skript ho čte ze souboru mimo repo (--pass-file); pokud soubor
 * neexistuje, vygeneruje náhodné heslo a uloží ho tam.
 *
 * Použití (Node 18+, bez npm závislostí):
 *   node tools/gate-page.js --in "C:/cesta/k/obsahu.html" --out resources/nazev.html \
 *        --title "Název stránky" --pass-file "C:/mimo/repo/HESLO.txt" \
 *        [--lead "Jedna věta pod nadpisem"] [--about "Text odstavce O dokumentu"] [--date "11. 10. 2026"]
 *
 * Zdrojové HTML (plaintext) do repa NEPATŘÍ – commituje se jen výstup v resources/.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const inPath = arg('in');
const outPath = arg('out');
const title = arg('title', 'Interní dokument');
const lead = arg('lead', 'Stránka je určena jednomu příjemci. Odemkněte ji heslem, které jste dostali samostatně.');
const about = arg('about', 'Interní pracovní dokument analytické divize Strategického bootcampu — jen pro adresáta, prosíme nešířit.');
const dateTxt = arg('date', new Date().toLocaleDateString('cs-CZ'));
const passFile = arg('pass-file');
if (!inPath || !outPath || !passFile) {
  console.error('Chybí --in, --out nebo --pass-file. Viz hlavička skriptu.');
  process.exit(1);
}

// heslo: načíst, nebo vygenerovat (4×4 znaky bez zaměnitelných znaků, ~80 bitů)
let pass;
if (fs.existsSync(passFile)) {
  pass = fs.readFileSync(passFile, 'utf8').trim();
} else {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const grp = () => Array.from(crypto.randomBytes(4)).map(b => alphabet[b % alphabet.length]).join('');
  pass = [grp(), grp(), grp(), grp()].join('-');
  fs.mkdirSync(path.dirname(passFile), { recursive: true });
  fs.writeFileSync(passFile, pass + '\n', 'utf8');
  console.log('Vygenerováno nové heslo, uloženo do', passFile);
}

const ITER = 600000;
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(Buffer.from(pass, 'utf8'), salt, ITER, 32, 'sha256');
const plain = fs.readFileSync(inPath);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
const payload = { v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: salt.toString('base64'), iv: iv.toString('base64'), data: enc.toString('base64') };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>${esc(title)} | Strategický bootcamp</title>
<link rel="icon" type="image/png" sizes="32x32" href="../images/favicon-32x32.png">
<style>
:root{
  --ink:#14171B; --ink2:#4A525C; --line:#DDE4EA; --paper:#FFFFFF; --wash:#F3F7FA;
  --or:#F49A5F; --or-d:#C86F2C; --bl:#3BA5DD; --bl-d:#1C7CAC;
  --serif: Georgia, "Times New Roman", serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --bar: 68px;
}
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{margin:0;background:var(--paper);color:var(--ink);font:18px/1.62 var(--serif);-webkit-text-size-adjust:100%}
a{color:var(--bl-d)}
:focus-visible{outline:3px solid var(--bl);outline-offset:2px}
h1,h2{font-family:var(--sans);letter-spacing:-.015em;line-height:1.15;margin:0}
p{margin:0 0 1em}
.top{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top,0px)}
.top-in{height:var(--bar);max-width:1180px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:16px;font-family:var(--sans);font-size:14px}
.brand{display:flex;align-items:center;flex:none;text-decoration:none}
.brand img{display:block;height:48px;width:auto}
.spacer{flex:1}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:2px;background:var(--wash)}
.seg button{font:inherit;font-size:13px;border:0;background:none;padding:5px 12px;border-radius:999px;color:var(--ink2);cursor:pointer}
.seg button:hover{color:var(--ink)}
.gate{min-height:calc(100vh - var(--bar));display:flex;align-items:center;justify-content:center;padding:48px 20px;background:var(--wash)}
.card{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:34px 32px;max-width:560px;width:100%;box-shadow:0 8px 36px rgba(20,23,27,.08)}
.marker{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--or-d);margin:0 0 14px;display:flex;align-items:center;gap:10px}
.marker::before{content:"";width:28px;height:2px;background:currentColor}
.card h1{font-size:clamp(26px,3.4vw,34px);margin-bottom:14px}
.card p.lead{color:var(--ink2);font-size:16.5px}
.row{display:flex;gap:10px;margin-top:18px}
.row input{flex:1;font:inherit;font-family:var(--sans);font-size:16px;padding:11px 14px;border:1px solid var(--line);border-radius:8px;min-width:0}
.btn{font-family:var(--sans);font-weight:700;font-size:15px;background:var(--or);color:var(--ink);border:0;border-radius:8px;padding:11px 18px;cursor:pointer}
.btn[disabled]{opacity:.6;cursor:wait}
.err{color:#B3261E;font-family:var(--sans);font-size:14px;margin:12px 0 0;min-height:1.4em}
.hint{font-family:var(--sans);font-size:13px;color:var(--ink2);margin:16px 0 0}
#viewer{display:none;height:calc(100vh - var(--bar));height:calc(100svh - var(--bar))}
#viewer iframe{display:block;width:100%;height:100%;border:0}
footer{background:var(--ink);color:#D6DCE2;padding:48px 20px calc(40px + env(safe-area-inset-bottom,0px));font-size:16px}
footer .wrap{max-width:780px;margin:0 auto}
footer a{color:#8FCDF0}
.about{font-size:14.5px;color:#A8B1BA}
.fnav{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center;margin-top:26px;font-family:var(--sans);font-size:14px}
.footer-logo{display:block;width:240px;max-width:70%;height:auto;margin:40px 0 0}
.copy{display:flex;align-items:center;gap:10px;margin:22px 0 0;font-family:var(--sans);font-size:13.5px;color:#A8B1BA}
footer .footer-linkedin{color:#A8B1BA;display:inline-flex}
footer .footer-linkedin:hover{color:#fff}
@media (max-width:720px){:root{--bar:60px}.brand img{height:40px}.footer-logo{width:200px}.card{padding:26px 20px}.row{flex-direction:column}}
</style>
</head>
<body>

<div class="top">
  <div class="top-in">
    <a class="brand" href="https://strategickybootcamp.cz/" aria-label="Strategický bootcamp, analytická divize">
      <img src="../images/logo-analyticka-divize.png" alt="Strategický bootcamp – Analytická divize" width="127" height="48"></a>
    <div class="spacer"></div>
    <div class="seg" id="lockseg" hidden><button type="button" id="lock">Zamknout</button></div>
  </div>
</div>

<main>
<section class="gate" id="gate">
  <form class="card" id="form" autocomplete="off">
    <p class="marker">Analytická divize · interní podklad</p>
    <h1>${esc(title)}</h1>
    <p class="lead">${esc(lead)}</p>
    <div class="row">
      <input type="password" id="pass" placeholder="Heslo" aria-label="Heslo" autocomplete="off" spellcheck="false" required>
      <button class="btn" type="submit" id="go">Odemknout</button>
    </div>
    <p class="err" id="err" role="alert"></p>
    <p class="hint">Obsah je v této stránce uložen zašifrovaně a dešifruje se jen ve vašem prohlížeči. Heslo se nikam neodesílá a neukládá. Stav podkladu: ${esc(dateTxt)}.</p>
  </form>
</section>
<section id="viewer"><iframe id="frame" title="${esc(title)}"></iframe></section>
</main>

<footer>
  <div class="wrap">
    <div class="about">
      <p><strong>O dokumentu.</strong> ${esc(about)}</p>
      <p>Autor: Mira Vlach (<a href="https://www.mira-vlach.cz/" target="_blank" rel="noopener">www.mira-vlach.cz</a>, zakladatel Strategického bootcampu)</p>
    </div>
    <nav class="fnav" aria-label="Odkazy">
      <a href="https://strategickybootcamp.cz/">Zpět na strategickybootcamp.cz</a>
      <a href="https://strategickybootcamp.cz/thinktank">Thinktank</a>
    </nav>
    <img src="../images/logo-analyticka-divize-inverse.png" alt="Strategický bootcamp – Analytická divize" class="footer-logo" width="558" height="214">
    <p class="copy">© 2026 Strategický bootcamp
      <a href="https://www.linkedin.com/company/strategicky-bootcamp/" target="_blank" rel="noopener" class="footer-linkedin" aria-label="Strategický bootcamp na LinkedIn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
    </p>
  </div>
</footer>

<script id="payload" type="application/json">${JSON.stringify(payload)}</script>
<script>
(function(){
  var P = JSON.parse(document.getElementById('payload').textContent);
  var form = document.getElementById('form'), inp = document.getElementById('pass'), err = document.getElementById('err'), go = document.getElementById('go');
  var gate = document.getElementById('gate'), viewer = document.getElementById('viewer'), frame = document.getElementById('frame');
  var lockseg = document.getElementById('lockseg'), lock = document.getElementById('lock');
  function b64(s){ var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  if (!window.crypto || !crypto.subtle) { err.textContent = 'Tento prohlížeč nepodporuje Web Crypto API (vyžaduje HTTPS a moderní prohlížeč).'; }
  form.addEventListener('submit', function(e){
    e.preventDefault(); err.textContent = ''; go.disabled = true; go.textContent = 'Odemykám…';
    var enc = new TextEncoder();
    crypto.subtle.importKey('raw', enc.encode(inp.value), 'PBKDF2', false, ['deriveKey'])
      .then(function(km){ return crypto.subtle.deriveKey({name:'PBKDF2', salt:b64(P.salt), iterations:P.iter, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['decrypt']); })
      .then(function(key){ return crypto.subtle.decrypt({name:'AES-GCM', iv:b64(P.iv)}, key, b64(P.data)); })
      .then(function(buf){
        var html = new TextDecoder().decode(buf);
        frame.srcdoc = html; gate.style.display = 'none'; viewer.style.display = 'block'; lockseg.hidden = false; inp.value = '';
        window.scrollTo(0, 0);
      })
      .catch(function(){ err.textContent = 'Nesprávné heslo.'; inp.select(); })
      .then(function(){ go.disabled = false; go.textContent = 'Odemknout'; });
  });
  lock.addEventListener('click', function(){ frame.srcdoc = ''; viewer.style.display = 'none'; gate.style.display = 'flex'; lockseg.hidden = true; inp.focus(); });
})();
</script>
</body>
</html>
`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log('Zapsáno', outPath, '(' + Math.round(html.length / 1024) + ' kB), šifrovaný obsah', Math.round(plain.length / 1024), 'kB, PBKDF2 iterací', ITER);
