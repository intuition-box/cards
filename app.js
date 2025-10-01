const EMPTY_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5ErkJggg==';

const THEMES = ["erudit","abeille","sphere","relic"];
const BG_INDEXES = ["1","2","3","4","5"];
const RARITIES = ["common","rare","epic","legendary","ancient","mystic"];
const card      = document.getElementById("card");
const bgImg     = document.getElementById("bgImg");
const faceImg   = document.getElementById("faceImg");
const wmImg     = document.getElementById("wmImg");
const wmImg2    = null;
const frameImg  = document.getElementById("frameImg");
const glare     = document.querySelector(".glare");
const avatarImg = document.getElementById("avatarImg");
const avatarPanel = document.getElementById("avatarPanel");
const infoPanel   = document.getElementById("infoPanel");
const infoGrid    = document.getElementById("infoGrid");

const bgInput     = document.getElementById("bgInput");
const faceInput   = document.getElementById("faceInput");
const wmInput     = document.getElementById("wmInput");
const frameInput  = document.getElementById("frameInput");
const avatarInput = document.getElementById("avatarInput");

const blendSelect = document.getElementById("blend");
const forceInput  = document.getElementById("force");

function getShowToggleFor(target){
  return document.querySelector(`.show-toggle[data-target="${target}"]`);
}
function isTargetShown(target){
  const cb = getShowToggleFor(target);
  return cb ? !!cb.checked : true;
}

let damp = forceInput ? +forceInput.value : 16;
const urls = [];

function setBlend(mode) {
  if (!wmImg) return;
  wmImg.style.mixBlendMode = mode;
}

function tiltFromEvent(e) {
  const rect = card.getBoundingClientRect();
  const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
  const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
  const rx = ((cy / rect.height) - 0.5) * -damp;
  const ry = ((cx / rect.width)  - 0.5) *  damp;

  card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;

  const mag = Math.min(1, Math.hypot(rx, ry) / (damp * 0.9));
  if (isTargetShown('wm')) {
    wmImg.style.opacity = (0.08 + mag * 0.75).toFixed(3);
    
  }

  const px = ((cx / rect.width) - 0.5) * -12;
  const py = ((cy / rect.height) - 0.5) * -12;
  const wmScale = transformState.wm.scale || 1;
  const wmOffsetY = transformState.wm.y || 0;
  wmImg.style.transform = `translate3d(${px}px, ${py + wmOffsetY}px, 0) scale(${wmScale * 1.03})`;
  

  const angle = Math.atan2(cy - rect.height/2, cx - rect.width/2) * 180/Math.PI + 180;
  glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.40), rgba(255,255,255,0.00) 55%)`;
  glare.style.opacity = 0.25 + mag * 0.25;
}

function tiltLeave() {
  card.style.transform = "";
  if (isTargetShown('wm')) {
    wmImg.style.opacity = "0";
  }
  const wmScale = transformState.wm.scale || 1;
  const wmOffsetY = transformState.wm.y || 0;
  wmImg.style.transform = `translate3d(0,${wmOffsetY}px,0) scale(${wmScale * 1.02})`;
  glare.style.opacity = "0";
}

card.addEventListener("mousemove", tiltFromEvent);
card.addEventListener("mouseleave", tiltLeave);
card.addEventListener("touchmove", tiltFromEvent, { passive: true });
card.addEventListener("touchend", tiltLeave);

if (blendSelect) blendSelect.addEventListener("change", (e) => setBlend(e.target.value));
if (forceInput)  forceInput.addEventListener("input", (e) => { damp = +e.target.value; });
setBlend(blendSelect ? blendSelect.value : 'screen');

document.addEventListener("dragover", (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; });
document.addEventListener("drop", (e) => { e.preventDefault(); });

function makeThumbDraggable(el){
  if (!(el instanceof HTMLImageElement) && !(el.classList?.contains('thumb-empty'))) return;
  el.setAttribute('draggable','true');
  el.addEventListener('dragstart', (e) => {
    if (!e.dataTransfer) return;
    const isEmpty = el.hasAttribute?.('data-empty') || el.classList?.contains('thumb-empty');
    if (isEmpty) {
      e.dataTransfer.setData('application/x-clear-image','1');
      e.dataTransfer.setData('text/plain','clear');
    } else {
      const src = el.src || '';
      e.dataTransfer.setData('text/uri-list', src);
      e.dataTransfer.setData('text/plain', src);
    }
    e.dataTransfer.effectAllowed = 'copyLink';
  });
}

document.querySelectorAll(".thumbs").forEach(group => {
  const targetId = group.dataset.target;
  const targetEl = targetId ? document.getElementById(targetId) : null;
  if (targetEl instanceof HTMLImageElement) {
  group.addEventListener("click", (ev) => {
    const t = ev.target;
      const isEmptyThumb = (t instanceof HTMLElement) && (t.hasAttribute('data-empty') || t.classList.contains('thumb-empty'));
      if (isEmptyThumb) {
        targetEl.src = EMPTY_DATA_URL;
        targetEl.classList.add('is-empty');
      } else if (t instanceof HTMLImageElement) {
    targetEl.src = t.src;
        targetEl.classList.remove('is-empty');
        syncComposerFromImageSrc(targetEl, t.src);
      } else {
        return;
      }
    group.querySelectorAll(".thumb").forEach(img => img.classList.remove("selected"));
      if (t instanceof HTMLElement) t.classList.add("selected");
    });
  }
  group.querySelectorAll(".thumb").forEach(img => {
    img.setAttribute("draggable", "true");
    img.addEventListener("dragstart", (e) => {
      if (!e.dataTransfer) return;
      const isEmpty = img.hasAttribute('data-empty');
      if (isEmpty) {
        e.dataTransfer.setData('application/x-clear-image', '1');
        e.dataTransfer.setData('text/plain', 'clear');
      } else {
        e.dataTransfer.setData("text/uri-list", img.src);
        e.dataTransfer.setData("text/plain", img.src);
      }
      e.dataTransfer.effectAllowed = "copyLink";
    });
    
    let touchStartX, touchStartY, isDragging = false;
    img.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isDragging = false;
    }, { passive: true });
    
    img.addEventListener("touchmove", (e) => {
      if (!touchStartX || !touchStartY) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);
      if (deltaX > 10 || deltaY > 10) {
        isDragging = true;
        const ghost = img.cloneNode(true);
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.opacity = '0.5';
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);
        
        const dragEvent = new DragEvent('dragstart', {
          dataTransfer: new DataTransfer(),
          bubbles: true
        });
        const isEmpty = img.hasAttribute('data-empty');
        if (isEmpty) {
          dragEvent.dataTransfer.setData('application/x-clear-image', '1');
          dragEvent.dataTransfer.setData('text/plain', 'clear');
        } else {
          dragEvent.dataTransfer.setData("text/uri-list", img.src);
          dragEvent.dataTransfer.setData("text/plain", img.src);
        }
        dragEvent.dataTransfer.effectAllowed = "copyLink";
        img.dispatchEvent(dragEvent);
        
        setTimeout(() => document.body.removeChild(ghost), 100);
      }
    }, { passive: true });
    
    img.addEventListener("touchend", (e) => {
      if (!isDragging) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        img.dispatchEvent(clickEvent);
      }
      touchStartX = touchStartY = null;
      isDragging = false;
    }, { passive: true });
  });
});

function appendCatalogThumbs(){
  const container = document.getElementById('imagesThumbs');
  if (!container) return;
  const rarities = ['common','rare','epic','legendary','ancient','mystic'];
  const themes = ['erudit','abeille','sphere','relic'];
  const paths = [];
  rarities.forEach(r => { for (let i=1;i<=5;i++){ paths.push(
    `./assets/catalog/background/${r}/${i}.png`,
    `./assets/catalog/background/${r}/${i}.svg`,
    `./assets/catalog/background/${r}/${r}${i}.png`,
    `./assets/catalog/background/${r}/${r}${i}.svg`,
  ); }});
  themes.forEach(t => rarities.forEach(r => {
    paths.push(
      `./assets/catalog/frame/${t}/${r}.png`, `./assets/catalog/frame/${t}/${r}.svg`,
      `./assets/catalog/face/${t}/${r}.png`,  `./assets/catalog/face/${t}/${r}.svg`,
      `./assets/catalog/watermark/${t}/${r}.png`, `./assets/catalog/watermark/${t}/${r}.svg`,
    );
  }));
  paths.forEach(src => {
    const img = new Image();
    img.onload = () => {
      const el = document.createElement('img');
      el.src = src; el.className = 'thumb'; el.alt = src.split('/').pop();
      container.appendChild(el);
      makeThumbDraggable(el);
    };
    img.onerror = () => {};
    img.src = src;
  });
}

window.addEventListener('load', appendCatalogThumbs);
const thumbsHandle = document.getElementById('thumbsHandle');
const thumbsFlyout = document.getElementById('thumbsFlyout');
thumbsHandle?.addEventListener('click', () => {
  const isClosed = thumbsFlyout?.classList.toggle('closed');
  const expanded = !isClosed;
  thumbsHandle.setAttribute('aria-expanded', String(expanded));
  thumbsFlyout?.setAttribute('aria-hidden', String(!expanded));
});
document.getElementById('closeThumbs')?.addEventListener('click', () => {
  thumbsFlyout?.classList.add('closed');
  thumbsHandle?.setAttribute('aria-expanded', 'false');
  thumbsFlyout?.setAttribute('aria-hidden', 'true');
});

const transformTargetSel = document.getElementById('transformTarget');
const transformScale = document.getElementById('transformScale');
const transformOffsetY = document.getElementById('transformOffsetY');
const transformReset = document.getElementById('transformReset');

const transformState = {
  bg:   { scale: 1, y: 0 },
  face: { scale: 1, y: 0 },
  wm:   { scale: 1, y: 0 },
  frame:{ scale: 1, y: 0 },
};

function applyTransformState(){
  bgImg.style.transform    = `scale(${transformState.bg.scale})`;
  faceImg.style.transform  = `scale(${transformState.face.scale})`;
  frameImg.style.transform = `scale(${transformState.frame.scale})`;
  wmImg.style.transform    = `translate3d(0,${transformState.wm.y}px,0) scale(${(transformState.wm.scale).toFixed(3)})`;
  wmImg.style.setProperty('--wm-scale', transformState.wm.scale);
  wmImg.style.setProperty('--wm-offset-y', `${transformState.wm.y}px`);
}

transformScale?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].scale = +e.target.value;
  applyTransformState();
});
transformOffsetY?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].y = +e.target.value;
  if (target === 'face') faceImg.style.top = `${transformState.face.y}px`;
  if (target === 'wm') applyTransformState();
  if (target === 'bg') bgImg.style.top = `${transformState.bg.y}px`;
  if (target === 'frame') frameImg.style.top = `${transformState.frame.y}px`;
});
transformReset?.addEventListener('click', ()=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target] = { scale:1, y:0 };
  if (transformScale) transformScale.value = '1';
  if (transformOffsetY) transformOffsetY.value = '0';
  if (target === 'face') faceImg.style.top = '0px';
  if (target === 'bg') bgImg.style.top = '0px';
  if (target === 'frame') frameImg.style.top = '0px';
  applyTransformState();
});

applyTransformState();

function fileToEl(input, imgEl){
  const f = input.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  urls.push(url);
  imgEl.src = url;
}
function fileToTarget(file, imgEl){
  if (!file || !file.type?.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  urls.push(url);
  imgEl.src = url;
}
bgInput.addEventListener("change",    () => fileToEl(bgInput, bgImg));
faceInput.addEventListener("change",  () => fileToEl(faceInput, faceImg));
wmInput.addEventListener("change",    () => fileToEl(wmInput, wmImg));
frameInput.addEventListener("change", () => fileToEl(frameInput, frameImg));
avatarInput.addEventListener("change",() => fileToEl(avatarInput, avatarImg));

function setupDropZone(group){
  const targetId = group.dataset.target;
  const targetEl = document.getElementById(targetId);
  if (!(targetEl instanceof HTMLImageElement)) return;

  const enter = (e) => { e.preventDefault(); group.classList.add("dropping"); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; };
  const over  = (e) => { e.preventDefault(); group.classList.add("dropping"); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; };
  const leave = () => { group.classList.remove("dropping"); };
  const drop  = (e) => {
    e.preventDefault();
    group.classList.remove("dropping");
    const file = e.dataTransfer?.files?.[0];
    if (file) fileToTarget(file, targetEl);
  };

  group.addEventListener("dragenter", enter);
  group.addEventListener("dragover",  over);
  group.addEventListener("dragleave", leave);
  group.addEventListener("drop",      drop);
}

document.querySelectorAll('.thumbs[data-target="faceImg"], .thumbs[data-target="wmImg"]').forEach(setupDropZone);

function setupImageDropTarget(imgEl){
  if (!(imgEl instanceof HTMLImageElement)) return;
  imgEl.classList.add("drop-target");
  const enter = (e) => { e.preventDefault(); imgEl.classList.add("dropping"); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; };
  const over  = (e) => { e.preventDefault(); imgEl.classList.add("dropping"); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; };
  const leave = () => { imgEl.classList.remove("dropping"); };
  const drop  = (e) => {
    e.preventDefault();
    imgEl.classList.remove("dropping");
    const dt = e.dataTransfer;
    if (dt?.types?.includes('application/x-clear-image') || dt?.getData('application/x-clear-image') === '1' || dt?.getData('text/plain') === 'clear'){
      imgEl.src = EMPTY_DATA_URL;
      imgEl.classList.add('is-empty');
      return;
    }
    const f = dt?.files?.[0];
    if (f && f.type?.startsWith("image/")) {
      fileToTarget(f, imgEl);
      imgEl.classList.remove('is-empty');
      updateThumbUsageMarkers();
      syncComposerFromImageSrc(imgEl, imgEl.src);
      return;
    }
    const url = dt?.getData("text/uri-list") || dt?.getData("text/plain");
    if (url) {
      imgEl.src = url;
      imgEl.classList.remove('is-empty');
      updateThumbUsageMarkers();
      syncComposerFromImageSrc(imgEl, url);
    }
  };
  imgEl.addEventListener("dragenter", enter);
  imgEl.addEventListener("dragover",  over);
  imgEl.addEventListener("dragleave", leave);
  imgEl.addEventListener("drop",      drop);
}

[bgImg, faceImg, wmImg].forEach(setupImageDropTarget);

function updateThumbUsageMarkers(){
  const thumbs = Array.from(document.querySelectorAll('.thumbs .thumb'));
  const clear = (cls) => thumbs.forEach(t => t.classList.remove(cls));
  clear('used-bg'); clear('used-face'); clear('used-wm');

  const markFor = (imgEl, cls) => {
    const src = imgEl?.src || '';
    if (!src || src.startsWith('data:image')) return;
    const match = thumbs.find(t => t instanceof HTMLImageElement && t.src === src);
    if (match) match.classList.add(cls);
  };

  markFor(bgImg, 'used-bg');
  markFor(faceImg, 'used-face');
  markFor(wmImg, 'used-wm');
  

  document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('has-bg','has-face','has-wm'));
  const setZone = (id, cls, el) => {
    const zone = document.querySelector(`.drop-zone[data-target="${id}"]`);
    if (!zone) return;
    const hasImg = el && el.src && !el.src.startsWith('data:image');
    zone.classList.toggle(cls, !!hasImg);
  };
  setZone('bgImg','has-bg', bgImg);
  setZone('faceImg','has-face', faceImg);
  setZone('wmImg','has-wm', wmImg);
  

}

window.addEventListener('load', updateThumbUsageMarkers);

function parseCatalogPath(src){
  try{
    const url = src || '';
    const mBg = url.match(/catalog\/background\/([^\/]+)\/(?:\1)?(\d+)\.(?:png|svg)/);
    if (mBg) return { category:'background', rarity:mBg[1], index:mBg[2] };
    const mGen = url.match(/catalog\/(frame|face|watermark)\/([^\/]+)\/([^\.]+)\.(?:png|svg)/);
    if (mGen) return { category:mGen[1], theme:mGen[2], rarity:mGen[3] };
  } catch {}
  return null;
}

function syncComposerFromImageSrc(imgEl, src){
  const meta = parseCatalogPath(src);
  if (!meta) return;
  const cat = meta.category;
  const row = document.querySelector(`#composer tbody tr[data-cat="${cat}"]`);
  if (!row) return;
  const themeSel = row.querySelector('select.theme');
  const raritySel = row.querySelector('select.rarity');
  if (cat === 'background'){
    if (themeSel && meta.index) themeSel.value = String(meta.index);
    if (raritySel && meta.rarity) raritySel.value = meta.rarity;
  } else {
    if (themeSel && meta.theme) themeSel.value = meta.theme;
    if (raritySel && meta.rarity) raritySel.value = meta.rarity;
  }
}

const rarityToTint = {
  common:    '#9ea7b3',
  rare:      '#2196f3',
  epic:      '#9c27b0',
  legendary: '#ff9800',
  ancient:   '#795548',
  mystic:    '#e91e63',
};

function buildAssetPathCandidates(category, theme, rarity){
  const candidates = [];
  if (category === 'background' && /^\d+$/.test(String(theme))) {
    const idx = String(theme);
    candidates.push(
      `./assets/catalog/background/${rarity}/${idx}.png`,
      `./assets/catalog/background/${rarity}/${idx}.svg`,
      `./assets/catalog/background/${rarity}/${rarity}${idx}.png`,
      `./assets/catalog/background/${rarity}/${rarity}${idx}.svg`,
    );
    return candidates;
  }
  candidates.push(
    `./assets/catalog/${category}/${theme}/${rarity}.png`,
    `./assets/catalog/${category}/${theme}/${rarity}.svg`,
  );
  return candidates;
}

function applyComposerRow(row){
  const category = row.dataset.cat;
  const theme = row.querySelector('select.theme')?.value;
  const rarity = row.querySelector('select.rarity')?.value;
  const tint = rarityToTint[rarity] || '#ffffff';
  
  // Résoudre et tester les chemins candidats (supporte le nouveau schéma background)
  const candidates = buildAssetPathCandidates(category, theme, rarity);
  
  const tryLoadImage = (urlIdx) => {
    const url = candidates[urlIdx];
    if (!url) return console.warn('No asset found for', category, theme, rarity);
    const img = new Image();
    img.onload = () => {
      if (category === 'background') {
        bgImg.src = url;
        bgImg.classList.remove('is-empty');
      } else if (category === 'frame') {
        frameImg.src = url;
        frameImg.classList.remove('is-empty');
      } else if (category === 'face') {
        faceImg.src = url;
        faceImg.classList.remove('is-empty');
      } else if (category === 'watermark') {
        wmImg.src = url;
        wmImg.classList.remove('is-empty');
        wmImg.style.filter = `brightness(1.12) saturate(1.06) contrast(0.98)`;
      }
      updateThumbUsageMarkers();
    };
    img.onerror = () => {
      tryLoadImage(urlIdx + 1);
    };
    img.src = url;
  };
  
  tryLoadImage(0);
}

function populateBgIndexes(){
  const sel = document.getElementById('bgPickerIndex');
  if (!sel) return;
  sel.innerHTML = '';
  ['1','2','3','4','5'].forEach(v => {
    const opt = document.createElement('option'); opt.value = v; opt.textContent = v; sel.appendChild(opt);
  });
}
function bindPersonalize(){
  populateBgIndexes();
  const bgR = document.getElementById('bgPickerRarity');
  const bgI = document.getElementById('bgPickerIndex');
  const bgBtn = document.getElementById('bgApply');
  bgBtn?.addEventListener('click', () => {
    const fakeRow = { dataset:{ cat:'background' }, querySelector:(q)=> q.includes('rarity')? bgR : q.includes('theme')? bgI : null };
    applyComposerRow(fakeRow);
  });

  const fT = document.getElementById('facePickerTheme');
  const fR = document.getElementById('facePickerRarity');
  const fBtn = document.getElementById('faceApply');
  fBtn?.addEventListener('click', () => {
    const fakeRow = { dataset:{ cat:'face' }, querySelector:(q)=> q.includes('rarity')? fR : q.includes('theme')? fT : null };
    applyComposerRow(fakeRow);
  });

  const wT = document.getElementById('wmPickerTheme');
  const wR = document.getElementById('wmPickerRarity');
  const wBtn = document.getElementById('wmApply');
  wBtn?.addEventListener('click', () => {
    const fakeRow = { dataset:{ cat:'watermark' }, querySelector:(q)=> q.includes('rarity')? wR : q.includes('theme')? wT : null };
    applyComposerRow(fakeRow);
  });

  const frT = document.getElementById('framePickerTheme');
  const frR = document.getElementById('framePickerRarity');
  const frBtn = document.getElementById('frameApply');
  frBtn?.addEventListener('click', () => {
    const fakeRow = { dataset:{ cat:'frame' }, querySelector:(q)=> q.includes('rarity')? frR : q.includes('theme')? frT : null };
    applyComposerRow(fakeRow);
  });
}

window.addEventListener('load', bindPersonalize);

const INFO_STORAGE_KEY = 'trustcard.infoRows.v1';

function renderInfoRows(rows){
  if (!infoGrid) return;
  infoGrid.innerHTML = '';
  const cols = rows.length >= 6 ? 3 : rows.length >= 3 ? 2 : 1;
  infoGrid.classList.toggle('dynamic-2', cols === 2);
  infoGrid.classList.toggle('dynamic-1', cols === 1);
  rows.forEach(({ label, value }) => {
    const cell = document.createElement('div');
    cell.className = 'info-cell';
    const k = document.createElement('span'); k.className = 'k'; k.textContent = label;
    const v = document.createElement('span'); v.className = 'v'; v.textContent = value;
    cell.appendChild(k); cell.appendChild(v);
    infoGrid.appendChild(cell);
  });
}

function loadInfoRows(){
  try{
    const raw = localStorage.getItem(INFO_STORAGE_KEY);
    if (!raw) return [
      { label:'Level', value:'42' },
      { label:'XP', value:'12 340' },
      { label:'Trust', value:'1 337' },
      { label:'Faction', value:'Scholar' },
      { label:'Rarity', value:'Legendary' },
      { label:'$TRUST', value:'9 950' },
    ];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveInfoRows(rows){
  localStorage.setItem(INFO_STORAGE_KEY, JSON.stringify(rows));
}

function setupInfoConfig(){
  const table = document.getElementById('infoConfig');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const addBtn = document.getElementById('addInfoRow');
  const clearBtn = document.getElementById('clearInfoRows');
  let rows = loadInfoRows();
  
  const syncTable = () => {
    tbody.innerHTML = '';
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const tdK = document.createElement('td');
      const tdV = document.createElement('td');
      const tdX = document.createElement('td');
      const inpK = document.createElement('input'); inpK.type = 'text'; inpK.value = row.label; inpK.style.width='100%';
      const inpV = document.createElement('input'); inpV.type = 'text'; inpV.value = row.value; inpV.style.width='100%';
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'apply';
      inpK.addEventListener('input', () => { rows[idx].label = inpK.value; saveInfoRows(rows); renderInfoRows(rows); });
      inpV.addEventListener('input', () => { rows[idx].value = inpV.value; saveInfoRows(rows); renderInfoRows(rows); });
      del.addEventListener('click', () => { rows.splice(idx,1); saveInfoRows(rows); syncTable(); renderInfoRows(rows); });
      tdK.appendChild(inpK); tdV.appendChild(inpV); tdX.appendChild(del);
      tr.appendChild(tdK); tr.appendChild(tdV); tr.appendChild(tdX);
      tbody.appendChild(tr);
    });
  };
  
  addBtn?.addEventListener('click', () => {
    rows.push({ label:'Label', value:'Value' });
    saveInfoRows(rows); syncTable(); renderInfoRows(rows);
  });
  clearBtn?.addEventListener('click', () => {
    rows = []; saveInfoRows(rows); syncTable(); renderInfoRows(rows);
  });
  
  syncTable();
  renderInfoRows(rows);
}

setupInfoConfig();

document.getElementById('composer')?.addEventListener('click', (e) => {
  const btn = (e.target instanceof HTMLElement) ? e.target.closest('button') : null;
  if (!(btn instanceof HTMLButtonElement)) return;
  const row = btn.closest('tr');
  if (!row) return;
  
  if (btn.classList.contains('row-rand')) {
    const themeSel = row.querySelector('select.theme');
    const raritySel = row.querySelector('select.rarity');
    const cat = row.dataset.cat;
    
    if (themeSel) {
      const newTheme = (cat === 'background') ? pick(["1","2","3","4","5"]) : pick(THEMES);
      themeSel.value = newTheme;
    }
    if (raritySel) {
      const newRarity = pick(RARITIES);
      raritySel.value = newRarity;
    }
    applyComposerRow(row);
  }
});

document.querySelectorAll('.row-rand').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const row = btn.closest('tr');
    if (!row) return;
    const themeSel = row.querySelector('select.theme');
    const raritySel = row.querySelector('select.rarity');
    const cat = row.dataset.cat;
    if (themeSel) themeSel.value = (cat === 'background') ? pick(["1","2","3","4","5"]) : pick(THEMES);
    if (raritySel) raritySel.value = pick(RARITIES);
    applyComposerRow(row);
  });
});

document.querySelectorAll('#composer select').forEach(select => {
  select.addEventListener('change', (e) => {
    const row = e.target.closest('tr');
    if (row) {
      applyComposerRow(row);
    }
  });
});

document.querySelectorAll('.show-toggle').forEach(toggle => {
  toggle.addEventListener('change', (e) => {
    applyComposerVisibility();
  });
});
document.querySelectorAll('.drop-zone').forEach(zone => {
  const targetId = zone.dataset.target;
  const targetEl = targetId ? document.getElementById(targetId) : null;
  if (!(targetEl instanceof HTMLImageElement)) return;
  const enter = (e) => { e.preventDefault(); zone.classList.add('dropping'); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; };
  const over  = (e) => { e.preventDefault(); zone.classList.add('dropping'); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; };
  const leave = () => { zone.classList.remove('dropping'); };
  const drop  = (e) => {
    e.preventDefault();
    zone.classList.remove('dropping');
    const dt = e.dataTransfer;
    if (dt?.types?.includes('application/x-clear-image') || dt?.getData('application/x-clear-image') === '1' || dt?.getData('text/plain') === 'clear'){
      targetEl.src = EMPTY_DATA_URL;
      targetEl.classList.add('is-empty');
      updateThumbUsageMarkers();
      return;
    }
    const f = dt?.files?.[0];
    if (f && f.type?.startsWith('image/')) { fileToTarget(f, targetEl); targetEl.classList.remove('is-empty'); updateThumbUsageMarkers(); return; }
    const url = dt?.getData('text/uri-list') || dt?.getData('text/plain');
    if (url) { targetEl.src = url; targetEl.classList.remove('is-empty'); updateThumbUsageMarkers(); }
  };
  zone.addEventListener('dragenter', enter);
  zone.addEventListener('dragover',  over);
  zone.addEventListener('dragleave', leave);
  zone.addEventListener('drop',      drop);
});

function applyComposerVisibility(){
  bgImg.classList.toggle("hidden",    !isTargetShown('bg'));
  faceImg.classList.toggle("hidden",  !isTargetShown('face'));
  wmImg.classList.toggle("hidden",    !isTargetShown('wm'));
  frameImg.classList.toggle("hidden", !isTargetShown('frame'));
  avatarPanel?.classList.remove("hidden");
  infoPanel?.classList.remove("hidden");
  if (!isTargetShown('wm')) wmImg.style.opacity = "0";
}
document.querySelectorAll('.show-toggle').forEach(cb => {
  cb.addEventListener('change', applyComposerVisibility);
});
applyComposerVisibility();

window.updateCardInfo = function(payload = {}) {
  const map = {
    level:  "info-level",
    xp:     "info-xp",
    trust:  "info-trust",
    faction:"info-faction",
    rarity: "info-rarity",
    token:  "info-token",
  };
  Object.entries(payload).forEach(([k, v]) => {
    const id = map[k];
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  });
};

setTimeout(() => {
  window.updateCardInfo({ level:"43", xp:"123 456", trust:"99 999", faction:"Erudit" });
}, 800);

window.addEventListener("beforeunload", () => urls.forEach(URL.revokeObjectURL));


function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function randomizeAll(){
  const rows = document.querySelectorAll('#composer tbody tr');
  rows.forEach(row => {
    const themeSel = row.querySelector('select.theme');
    const raritySel = row.querySelector('select.rarity');
    if (themeSel) {
      const cat = row.dataset.cat;
      themeSel.value = (cat === 'background') ? pick(BG_INDEXES) : pick(THEMES);
    }
    if (raritySel) raritySel.value = pick(RARITIES);
    applyComposerRow(row);
  });
  applyTransformState();
  applyComposerVisibility();
}

document.getElementById('randomizeBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); randomizeAll(); });
document.addEventListener('click', (e)=>{
  const btn = (e.target instanceof HTMLElement) ? e.target.closest('#randomizeBtn') : null;
  if (btn) { e.preventDefault(); randomizeAll(); }
});
