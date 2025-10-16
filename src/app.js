// Constants
const DEBUG = false;
const EMPTY_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5ErkJggg==';
const THEMES = ["erudit", "abeille", "sphere", "relic"];
const BG_INDEXES = ["1", "2", "3", "4", "5"];
const RARITIES = ["common", "rare", "epic", "legendary", "ancient", "mystic"];
const STORAGE_KEY = 'trustcard_favorites';
const TRANSFORM_STORAGE_KEY = 'trustcard_transforms';
const INFO_STORAGE_KEY = 'trustcard.infoRows.v1';

// DOM refs
const $ = (id) => document.getElementById(id);
const card = $("card");
const bgImg = $("bgImg");
const faceImg = $("faceImg");
const wmImg = $("wmImg");
const wm2Img = $("wm2Img");
const frameImg = $("frameImg");
const glare = document.querySelector(".glare");
const avatarImg = $("avatarImg");
const avatarPanel = $("avatarPanel");
const infoPanel = $("infoPanel");
const infoGrid = $("infoGrid");

// Inputs
const bgInput = $("bgInput");
const faceInput = $("faceInput");
const wmInput = $("wmInput");
const wm2Input = $("wm2Input");
const frameInput = $("frameInput");
const avatarInput = $("avatarInput");
const blendSelect = $("blend");
const forceInput = $("force");

// Transform inputs
const transformTargetSel = $("transformTarget");
const transformScale = $("transformScale");
const transformOffsetX = $("transformOffsetX");
const transformOffsetY = $("transformOffsetY");
const transformOpacity = $("transformOpacity");
const transformBrightness = $("transformBrightness");
const transformReset = $("transformReset");

const transformScaleValue = $("transformScaleValue");
const transformOffsetXValue = $("transformOffsetXValue");
const transformOffsetYValue = $("transformOffsetYValue");
const transformOpacityValue = $("transformOpacityValue");
const transformBrightnessValue = $("transformBrightnessValue");

// Side rails
const leftRailContent = $("leftRailContent");
const closeLeftRail = $("closeLeftRail");
const dropsRail = document.querySelector('.drops-rail');

// Thumbs container
const allThumbsContainer = $("allThumbs");

// State
let wmOverlayImg = null;
let damp = forceInput ? +forceInput.value : 16;
const urls = [];

const transformState = {
  bg:    { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  face:  { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  wm:    { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  wm2:   { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
};

// Rarity rotation (for presets)
let rarityIndex = 0;
const rarities = RARITIES;

// Caches
const domCache = {
  thumbs: null,
  getThumbs(){ return this.thumbs || (this.thumbs = document.querySelectorAll('#allThumbs .thumb')); },
  clearCache(){ this.thumbs = null; }
};

// Compatibility shims
function checkAndUpdateEruditToggle(){}
function checkAndUpdateKeeperToggle(){}
function applyScholarStyleDefaultForKeeper1(){}

// Utils
const getShowToggleFor = (target) => document.querySelector(`.show-toggle[data-target="${target}"]`);
const isTargetShown = (target) => !!(getShowToggleFor(target)?.checked ?? true);
const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
const setBlend = (mode) => { if (wmImg){ wmImg.style.mixBlendMode = mode; if (wm2Img) wm2Img.style.mixBlendMode = mode; } };

// Tilt / Glare
function tiltFromEvent(e){
  const rect = card.getBoundingClientRect();
  const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
  const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
  const rx = ((cy / rect.height) - 0.5) * -damp;
  const ry = ((cx / rect.width)  - 0.5) *  damp;
  card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  const mag = Math.min(1, Math.hypot(rx, ry) / (damp * 0.9));

  if (isTargetShown('wm')){
    const op = (0.08 + mag * 0.75).toFixed(3);
    wmImg.style.opacity = op; if (wmOverlayImg) wmOverlayImg.style.opacity = op;
  }
  if (isTargetShown('wm2') && wm2Img){ wm2Img.style.opacity = (0.08 + mag * 0.75).toFixed(3); }

  const px = ((cx / rect.width) - 0.5) * -12;
  const py = ((cy / rect.height) - 0.5) * -12;
  const wmScale = transformState.wm.scale || 1; const wmOffsetY = transformState.wm.y || 0;
  wmImg.style.transform = `translate3d(${px}px, ${py + wmOffsetY}px, 0) scale(${wmScale * 1.03})`;
  if (wm2Img){
    const s = transformState.wm2?.scale || 1; const y = transformState.wm2?.y || 0;
    wm2Img.style.transform = `translate3d(${px}px, ${py + y}px, 0) scale(${s * 1.03})`;
  }

  const angle = Math.atan2(cy - rect.height/2, cx - rect.width/2) * 180/Math.PI + 180;
  glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.40), rgba(255,255,255,0.00) 55%)`;
  glare.style.opacity = 0.25 + mag * 0.25;
}
function tiltLeave(){
  card.style.transform = "";
  if (isTargetShown('wm')) wmImg.style.opacity = "0";
  const wmScale = transformState.wm.scale || 1; const wmOffsetY = transformState.wm.y || 0;
  wmImg.style.transform = `translate3d(0,${wmOffsetY}px,0) scale(${wmScale * 1.02})`;
  if (isTargetShown('wm2') && wm2Img) wm2Img.style.opacity = "0";
  if (wm2Img){
    const s = transformState.wm2?.scale || 1; const y = transformState.wm2?.y || 0;
    wm2Img.style.transform = `translate3d(0,${y}px,0) scale(${s * 1.02})`;
  }
  if (wmOverlayImg){
    wmOverlayImg.style.setProperty('--background-x','50%');
    wmOverlayImg.style.setProperty('--background-y','50%');
    wmOverlayImg.style.setProperty('--pointer-x','50%');
    wmOverlayImg.style.setProperty('--pointer-y','50%');
  }
  glare.style.opacity = "0";
}
let rafPending=false, lastPointer=null;
function scheduleTilt(e){
  const r = card.getBoundingClientRect();
  const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
  const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
  lastPointer = { cx, cy };
  if (rafPending) return; rafPending = true;
  requestAnimationFrame(()=>{ rafPending=false; if (!lastPointer) return; tiltFromEvent({ clientX:lastPointer.cx + r.left, clientY:lastPointer.cy + r.top }); });
}
card.addEventListener('mousemove', scheduleTilt);
card.addEventListener('mouseleave', tiltLeave);
card.addEventListener('touchmove', scheduleTilt, { passive:true });
card.addEventListener('touchend', tiltLeave);
if (blendSelect) blendSelect.addEventListener('change', e=> setBlend(e.target.value));
if (forceInput)  forceInput.addEventListener('input',  e=> { damp = +e.target.value; });
setBlend(blendSelect ? blendSelect.value : 'screen');

// File helpers & inputs
function fileToEl(input, imgEl){ const f = input.files?.[0]; if (!f) return; const url = URL.createObjectURL(f); urls.push(url); imgEl.src = url; }
function fileToTarget(file, imgEl){ if (!file || !file.type?.startsWith('image/')) return; const url = URL.createObjectURL(file); urls.push(url); imgEl.src = url; }

bgInput?.addEventListener('change', ()=> fileToEl(bgInput, bgImg));
faceInput?.addEventListener('change', ()=> fileToEl(faceInput, faceImg));
wmInput?.addEventListener('change', ()=> fileToEl(wmInput, wmImg));
wm2Input&&wm2Img && wm2Input.addEventListener('change', ()=> fileToEl(wm2Input, wm2Img));
frameInput?.addEventListener('change', ()=> fileToEl(frameInput, frameImg));
avatarInput?.addEventListener('change',()=> fileToEl(avatarInput, avatarImg));

// Global drag cancel
['dragover','drop'].forEach(evt=> document.addEventListener(evt, e=>{ e.preventDefault(); if (e.type==='dragover' && e.dataTransfer) e.dataTransfer.dropEffect='copy'; }));

// Thumbs (click & draggable)
function makeThumbDraggable(el){
  if (!(el instanceof HTMLImageElement) && !(el.classList?.contains('thumb-empty'))) return;
  el.setAttribute('draggable','true');
  el.addEventListener('dragstart', (e)=>{
    if (!e.dataTransfer) return;
    const isEmpty = el.hasAttribute?.('data-empty') || el.classList?.contains('thumb-empty');
    if (isEmpty){ e.dataTransfer.setData('application/x-clear-image','1'); e.dataTransfer.setData('text/plain','clear'); }
    else { const src = el.src || ''; e.dataTransfer.setData('text/uri-list', src); e.dataTransfer.setData('text/plain', src); }
    e.dataTransfer.effectAllowed = 'copyLink';
  });
}

allThumbsContainer?.addEventListener('click', (ev)=>{
  const t = ev.target; if (!(t instanceof HTMLElement)) return;
  const targetId = t.dataset.target; const targetEl = targetId ? $(targetId) : null; if (!(targetEl instanceof HTMLImageElement)) return;
  const isEmptyThumb = t.hasAttribute('data-empty') || t.classList.contains('thumb-empty');
  if (isEmptyThumb){ targetEl.src = EMPTY_DATA_URL; targetEl.classList.add('is-empty'); }
  else if (t instanceof HTMLImageElement){ targetEl.src = t.src; targetEl.classList.remove('is-empty'); syncComposerFromImageSrc(targetEl, t.src); if (targetId==='wm2Img') ensureShown('wm2'); }
  allThumbsContainer.querySelectorAll('.thumb').forEach(img=> img.classList.remove('selected')); t.classList.add('selected');
});

// Catalog thumbs (lazy + exists)
function appendCatalogThumbs(){
  const rarities = ['common','rare','epic','legendary','ancient','mystic'];
  const themes = ['erudit','abeille','sphere'];
  const bgIndexes = ['1','2','3','4','5'];
  const container = allThumbsContainer; if (!container) return;

  const imageExists = (url)=> new Promise((resolve)=>{ const i = new Image(); i.onload=()=>resolve(true); i.onerror=()=>resolve(false); i.src=url; });
  const addThumb = (opts)=>{
    const el = document.createElement('img');
    el.className='thumb';
    el.dataset.category=opts.category; if (opts.rarity) el.dataset.rarity=opts.rarity; if (opts.target) el.dataset.target=opts.target;
    el.loading='lazy'; el.decoding='async'; el.alt=opts.alt||''; el.src = opts.src; el.onerror = ()=> el.remove();
    container.appendChild(el); makeThumbDraggable(el);
    if (typeof domCache?.clearCache==='function') domCache.clearCache();
  };

  // Backgrounds: try multiple filename patterns and formats (svg/png)
  const addBgIndexed = (r, idx) => {
    const candidates = [
      `./public/assets/catalog/background/${r}/${r}${idx}.svg`,
      `./public/assets/catalog/background/${r}/${r}${idx}.png`,
      `./public/assets/catalog/background/${r}/${r}${idx}.jpg`,
      `./public/assets/catalog/background/${r}/${r}${idx}.jpeg`,
    ];
    addFirstExistingThumb(candidates, { category:'background', rarity:r, target:'bgImg', alt:`bg-${r}-${idx}` });
  };

  const addFirstExistingThumb = async (candidates, base) => {
    for (const src of candidates){
      if (await imageExists(src)) { addThumb({ ...base, src }); break; }
    }
  };

  rarities.filter(r=>r!=='mystic').forEach(r=> bgIndexes.forEach(idx=> addBgIndexed(r, idx)));
  ['mystic1.jpg','mystic4.svg'].forEach((file,i)=> addThumb({ src:`./public/assets/catalog/background/mystic/${file}`, category:'background', rarity:'mystic', target:'bgImg', alt:`bg-mystic-${i+1}`}));
  themes.forEach(t=> rarities.forEach(r=> addThumb({ src:`./public/assets/catalog/watermark/${t}/${r}.svg`, category:'watermark', rarity:r, target:'wmImg', alt:`wm-${t}-${r}`})));
  themes.forEach(t=> rarities.filter(r=> r!=='mystic').forEach(r=>{
    addThumb({ src:`./public/assets/catalog/face/${t}/${r}.svg`, category:'face', rarity:r, target:'faceImg', alt:`face-${t}-${r}` });
    if (t==='erudit') addThumb({ src:`./public/assets/catalog/face/${t}/${r}1.svg`, category:'face', rarity:r, target:'faceImg', alt:`face-${t}-${r}1` });
  }));
  themes.forEach(t=> rarities.forEach(r=> addThumb({ src:`./public/assets/catalog/frame/${t}/${r}.svg`, category:'frame', rarity:r, target:'frameImg', alt:`frame-${t}-${r}`})));

  // Extra backgrounds (added directly under background folders): img11..img14
  const extraIdx = [11,12,13,14];
  const bgExts = ['png','jpg','jpeg','svg','webp'];
  rarities.forEach(r => extraIdx.forEach(n => bgExts.forEach(ext => {
    addThumb({ src:`./public/assets/catalog/background/${r}/img${n}.${ext}`, category:'background', rarity:r, target:'bgImg', alt:`bg-${r}-img${n}` });
  })));

  // Public images (user-provided)
  const PUBLIC_PREFIX = './public/assets/images/';
  const exts = ['png','jpg','jpeg','svg','webp'];
  const max = 50; // reasonable upper bound to avoid too many probes
  for (let i = 1; i <= max; i++) {
    exts.forEach(ext => {
      const name = `img${i}.${ext}`;
      addThumb({ src: PUBLIC_PREFIX + name, category:'face', rarity:'common', target:'faceImg', alt:`face-public-${i}` });
    });
  }
}

// Filters UI
function applyFilter(filter){
  const thumbs = domCache.getThumbs();
  const activeRarity = document.querySelector('.rarity-btn.active')?.dataset.rarity || 'all';
  let visible=0; thumbs.forEach(thumb=>{
    if (thumb.classList.contains('thumb-empty')) return;
    const match = (filter==='all' || thumb.dataset.category===filter) && (activeRarity==='all' || thumb.dataset.rarity===activeRarity);
    thumb.classList.toggle('hidden', !match); if (match) visible++;
  });
  if (DEBUG) console.log('Visible thumbs after filter:', visible);
}
function applyRarityFilter(rarity){
  const thumbs = domCache.getThumbs();
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  let visible=0; thumbs.forEach(thumb=>{
    if (thumb.classList.contains('thumb-empty')) return;
    const match = (activeFilter==='all' || thumb.dataset.category===activeFilter) && (rarity==='all' || thumb.dataset.rarity===rarity);
    thumb.classList.toggle('hidden', !match); if (match) visible++;
  });
  if (DEBUG) console.log('Visible thumbs after rarity filter:', visible);
}
function initializeFilters(){
  document.querySelectorAll('.filter-btn').forEach(btn=> btn.addEventListener('click', ()=>{ document.querySelectorAll('.filter-btn').forEach(b=> b.classList.remove('active')); btn.classList.add('active'); applyFilter(btn.dataset.filter); }));
  document.querySelectorAll('.rarity-btn').forEach(btn=> btn.addEventListener('click', ()=>{ document.querySelectorAll('.rarity-btn').forEach(b=> b.classList.remove('active')); btn.classList.add('active'); applyRarityFilter(btn.dataset.rarity); }));
  applyFilter('all'); applyRarityFilter('all');
}

// Left rail toggle
function updateButtonText(){ const isClosed = leftRailContent?.classList.contains('closed'); if (closeLeftRail) closeLeftRail.textContent = isClosed ? 'Open' : 'Close'; }
closeLeftRail?.addEventListener('click', ()=>{ const isClosed = leftRailContent?.classList.toggle('closed'); leftRailContent?.setAttribute('aria-hidden', String(isClosed)); if (dropsRail) dropsRail.style.display = isClosed ? 'none' : 'block'; updateButtonText(); });
updateButtonText();

// Transform system
function applyTransformState(){
  const set = (el, t)=>{ el.style.transform = `scale(${t.scale}) translate(${t.x}px, ${t.y}px)`; el.style.opacity=t.opacity; el.style.filter=`brightness(${t.brightness})`; };
  set(bgImg, transformState.bg); set(faceImg, transformState.face); set(frameImg, transformState.frame);
  wmImg.style.transform = `translate3d(${transformState.wm.x}px,${transformState.wm.y}px,0) scale(${transformState.wm.scale.toFixed(3)})`;
  wmImg.style.filter = `brightness(${transformState.wm.brightness})`;
  if (wm2Img){ wm2Img.style.transform = `translate3d(${transformState.wm2.x}px,${transformState.wm2.y}px,0) scale(${(transformState.wm2.scale||1).toFixed(3)})`; wm2Img.style.filter = `brightness(${transformState.wm2.brightness})`; wm2Img.style.opacity = transformState.wm2.opacity; }
  if (wmOverlayImg){ Object.assign(wmOverlayImg.style, { transform: wmImg.style.transform }); wmOverlayImg.style.setProperty('--wm-scale', transformState.wm.scale); wmOverlayImg.style.setProperty('--wm-offset-y', `${transformState.wm.y}px`); wmOverlayImg.style.mixBlendMode = wmImg?.style?.mixBlendMode || 'screen'; }
}
function updateValueDisplays(){
  if (transformScaleValue)      transformScaleValue.textContent      = (+transformScale?.value||1).toFixed(1);
  if (transformOffsetXValue)    transformOffsetXValue.textContent    = parseInt(transformOffsetX?.value||0);
  if (transformOffsetYValue)    transformOffsetYValue.textContent    = parseInt(transformOffsetY?.value||0);
  if (transformOpacityValue)    transformOpacityValue.textContent    = (+transformOpacity?.value||1).toFixed(2);
  if (transformBrightnessValue) transformBrightnessValue.textContent = (+transformBrightness?.value||1).toFixed(2);
}
function resetControlsToDefault(){ ['Scale','OffsetX','OffsetY','Opacity','Brightness'].forEach(k=> { const el = $("transform"+k); if (el) el.value = (k==='Opacity'||k==='Brightness')? '1':'0'; }); if (transformScale) transformScale.value='1'; updateValueDisplays(); }

// Bind inputs generically
function bindTransformInput(input, key){ input?.addEventListener('input', (e)=>{ const t = transformTargetSel?.value||'bg'; transformState[t][key] = +e.target.value; applyTransformState(); updateValueDisplays(); debounceAutoSave(); }); }
bindTransformInput(transformScale, 'scale'); bindTransformInput(transformOffsetX,'x'); bindTransformInput(transformOffsetY,'y'); bindTransformInput(transformOpacity,'opacity'); bindTransformInput(transformBrightness,'brightness');
transformReset?.addEventListener('click', ()=>{ const t = transformTargetSel?.value||'bg'; transformState[t] = { scale:1,x:0,y:0,opacity:1,brightness:1 }; resetControlsToDefault(); applyTransformState(); });
transformTargetSel?.addEventListener('change', ()=>{ const t = transformTargetSel.value||'bg'; const s = transformState[t]; if (transformScale) transformScale.value=s.scale; if (transformOffsetX) transformOffsetX.value=s.x; if (transformOffsetY) transformOffsetY.value=s.y; if (transformOpacity) transformOpacity.value=s.opacity; if (transformBrightness) transformBrightness.value=s.brightness; updateValueDisplays(); });

// Storage for transforms (debounced)
let autoSaveTimeout=null; function debounceAutoSave(){ clearTimeout(autoSaveTimeout); autoSaveTimeout = setTimeout(saveTransformToStorage, 1000); }
function saveTransformToStorage(){ try{ localStorage.setItem(TRANSFORM_STORAGE_KEY, JSON.stringify(transformState)); if (DEBUG) console.log('Transform state saved'); }catch(e){ console.error('Save transform error',e); } }
function loadTransformFromStorage(){ try{ const saved = localStorage.getItem(TRANSFORM_STORAGE_KEY); if (!saved) return; const obj = JSON.parse(saved); Object.keys(obj).forEach(k=>{ if (transformState[k]) transformState[k] = { ...transformState[k], ...obj[k] }; }); applyTransformState(); if (DEBUG) console.log('Transform state loaded'); }catch(e){ console.error('Load transform error',e); } }

applyTransformState(); updateValueDisplays();

// ==========================
// Drop zones & image targets (unified)
// ==========================
function setupImageDropTarget(imgEl){
  if (!(imgEl instanceof HTMLImageElement)) return;
  imgEl.classList.add('drop-target');
  const enter=(e)=>{ e.preventDefault(); imgEl.classList.add('dropping'); if (e.dataTransfer) e.dataTransfer.dropEffect='copy'; };
  const over =(e)=>{ e.preventDefault(); imgEl.classList.add('dropping'); if (e.dataTransfer) e.dataTransfer.dropEffect='copy'; };
  const leave=()=> imgEl.classList.remove('dropping');
  const drop =(e)=>{
    e.preventDefault(); imgEl.classList.remove('dropping'); const dt=e.dataTransfer;
    const clear = dt?.types?.includes('application/x-clear-image') || dt?.getData('application/x-clear-image')==='1' || dt?.getData('text/plain')==='clear';
    if (clear){ imgEl.src=EMPTY_DATA_URL; imgEl.classList.add('is-empty'); return; }
    const f=dt?.files?.[0]; if (f && f.type?.startsWith('image/')){ fileToTarget(f,imgEl); imgEl.classList.remove('is-empty'); updateThumbUsageMarkers(); syncComposerFromImageSrc(imgEl,imgEl.src); if (imgEl.id==='wm2Img') ensureShown('wm2'); return; }
    const url = dt?.getData('text/uri-list') || dt?.getData('text/plain'); if (url){ imgEl.src=url; imgEl.classList.remove('is-empty'); updateThumbUsageMarkers(); syncComposerFromImageSrc(imgEl,url); if (imgEl.id==='wm2Img') ensureShown('wm2'); }
  };
  imgEl.addEventListener('dragenter', enter); imgEl.addEventListener('dragover', over); imgEl.addEventListener('dragleave', leave); imgEl.addEventListener('drop', drop);
}
[bgImg, faceImg, wmImg, wm2Img, frameImg].filter(Boolean).forEach(setupImageDropTarget);

function setupDropZone(zone){
  const targetId = zone.dataset.target; const targetEl = targetId ? $(targetId) : null; if (!(targetEl instanceof HTMLImageElement)) return;
  const enter=(e)=>{ e.preventDefault(); zone.classList.add('dropping'); if (e.dataTransfer) e.dataTransfer.dropEffect='copy'; };
  const over =(e)=>{ e.preventDefault(); zone.classList.add('dropping'); if (e.dataTransfer) e.dataTransfer.dropEffect='copy'; };
  const leave=()=> zone.classList.remove('dropping');
  const drop =(e)=>{
    e.preventDefault(); zone.classList.remove('dropping'); const dt=e.dataTransfer;
    const clear = dt?.types?.includes('application/x-clear-image') || dt?.getData('application/x-clear-image')==='1' || dt?.getData('text/plain')==='clear';
    if (clear){ targetEl.src=EMPTY_DATA_URL; targetEl.classList.add('is-empty'); updateThumbUsageMarkers(); return; }
    const f=dt?.files?.[0]; if (f && f.type?.startsWith('image/')){ fileToTarget(f, targetEl); targetEl.classList.remove('is-empty'); updateThumbUsageMarkers(); if (targetId==='faceImg'){ checkAndUpdateKeeperToggle(); applyScholarStyleDefaultForKeeper1(); } if (targetId==='wm2Img') ensureShown('wm2'); return; }
    const url = dt?.getData('text/uri-list') || dt?.getData('text/plain'); if (url){ targetEl.src=url; targetEl.classList.remove('is-empty'); updateThumbUsageMarkers(); if (targetId==='faceImg'){ checkAndUpdateKeeperToggle(); applyScholarStyleDefaultForKeeper1(); } if (targetId==='wm2Img') ensureShown('wm2'); }
  };
  zone.addEventListener('dragenter', enter); zone.addEventListener('dragover', over); zone.addEventListener('dragleave', leave); zone.addEventListener('drop', drop);

  // randomize button per target (except wm2)
  const randBtn = zone.querySelector('.drop-zone-rand');
  if (randBtn){
    const handleRandomize=(e)=>{
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); randBtn.classList.add('spin'); setTimeout(()=> randBtn.classList.remove('spin'), 500);
      if (targetId==='bgImg')       randomizeBg();
      else if (targetId==='faceImg') randomizeFace();
      else if (targetId==='wmImg')   randomizeWm();
      else if (targetId==='frameImg')randomizeFrame();
    };
    randBtn.addEventListener('click', handleRandomize);
    randBtn.addEventListener('mousedown', handleRandomize);
  }
}

document.querySelectorAll('.drop-zone').forEach(setupDropZone);

document.querySelectorAll('.drop-zone-clear').forEach(btn=> btn.addEventListener('click', (e)=>{ e.stopPropagation(); const zone = btn.closest('.drop-zone'); const target = zone.dataset.target; const el = $(target); if (!el) return; el.src = EMPTY_DATA_URL; el.classList.remove('is-empty'); updateThumbUsageMarkers(); }));

function updateThumbUsageMarkers(){
  const thumbs = Array.from(document.querySelectorAll('#allThumbs .thumb'));
  const clear = (cls)=> thumbs.forEach(t=> t.classList.remove(cls));
  clear('used-bg'); clear('used-face'); clear('used-wm'); clear('used-frame');
  const mark=(imgEl, cls)=>{ const src=imgEl?.src||''; if (!src || src.startsWith('data:image')) return; const m = thumbs.find(t=> t instanceof HTMLImageElement && t.src===src); if (m) m.classList.add(cls); };
  mark(bgImg,'used-bg'); mark(faceImg,'used-face'); mark(wmImg,'used-wm'); if (wm2Img) mark(wm2Img,'used-wm'); mark(frameImg,'used-frame');
  document.querySelectorAll('.drop-zone').forEach(z=> z.classList.remove('has-bg','has-face','has-wm','has-wm2','has-frame'));
  const setZone=(id,cls,el)=>{ const z=document.querySelector(`.drop-zone[data-target="${id}"]`); if (!z) return; const has = el && el.src && !el.src.startsWith('data:image'); z.classList.toggle(cls, !!has); };
  setZone('bgImg','has-bg',bgImg); setZone('faceImg','has-face',faceImg); setZone('wmImg','has-wm',wmImg); if (wm2Img) setZone('wm2Img','has-wm2',wm2Img); setZone('frameImg','has-frame',frameImg);
}
function resetDropZonesUI(){ document.querySelectorAll('.drop-zone').forEach(z=> z.classList.remove('has-bg','has-face','has-wm','has-wm2','has-frame')); }

// ==========================
// Parser + overlay sync
// ==========================
function parseCatalogPath(src){ try{
  const url=src||'';
  const mBg = url.match(/catalog\/background\/([^\/]+)\/(?:\1)?(\d+)\.(?:png|svg|jpg|jpeg)/); if (mBg) return { category:'background', rarity:mBg[1], index:mBg[2] };
  const mGen= url.match(/catalog\/(frame|face|watermark)\/([^\/]+)\/([^\.]+)\.(?:png|svg|jpg|jpeg)/); if (mGen) return { category:mGen[1], theme:mGen[2], rarity:mGen[3] };
}catch{} return null; }
function ensureWmOverlay(theme, rarity){}
function syncComposerFromImageSrc(imgEl, src){ const meta = parseCatalogPath(src); if (!meta) return; if (meta.category==='watermark') ensureWmOverlay(meta.theme, meta.rarity); }

// ==========================
// Personalize pickers (BG/Face/WM/Frame)
// ==========================
function buildAssetPathCandidates(category, theme, rarity){
  const list=[];
  if (category==='background' && rarity==='mystic') return ['./public/assets/catalog/background/mystic/mystic1.jpg','./public/assets/catalog/background/mystic/mystic4.svg'];
  if (category==='background' && /^\d+$/.test(String(theme))){ const idx=String(theme); return [
    `./public/assets/catalog/background/${rarity}/${idx}.png`,
    `./public/assets/catalog/background/${rarity}/${idx}.svg`,
    `./public/assets/catalog/background/${rarity}/${idx}.jpg`,
    `./public/assets/catalog/background/${rarity}/${idx}.jpeg`,
    `./public/assets/catalog/background/${rarity}/${rarity}${idx}.png`,
    `./public/assets/catalog/background/${rarity}/${rarity}${idx}.svg`,
    `./public/assets/catalog/background/${rarity}/${rarity}${idx}.jpg`,
    `./public/assets/catalog/background/${rarity}/${rarity}${idx}.jpeg`,
  ]; }
  list.push(`./public/assets/catalog/${category}/${theme}/${rarity}.png`,`./public/assets/catalog/${category}/${theme}/${rarity}.svg`);
  if (category==='face' && String(theme)==='erudit') list.push(`./public/assets/catalog/${category}/${theme}/${rarity}1.png`,`./public/assets/catalog/${category}/${theme}/${rarity}1.svg`);
  return list;
}
function tryLoadRandomImage(candidates, targetImg, onLoad=null, shuffle=false){
  const idxs = candidates.map((_,i)=>i); if (shuffle) for (let i=idxs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idxs[i],idxs[j]]=[idxs[j],idxs[i]]; }
  const tryAt=(p)=>{ if (p>=idxs.length) return; const url=candidates[idxs[p]]; if (!url) return tryAt(p+1); const img=new Image(); img.onload=()=>{ targetImg.src=url; targetImg.classList.remove('is-empty'); onLoad?.(); }; img.onerror=()=> tryAt(p+1); img.src=url; };
  tryAt(0);
}
function applyComposerRow(row){
  const cat=row.dataset.cat; const theme=row.querySelector('select.theme')?.value; const rarity=row.querySelector('select.rarity')?.value; const candidates=buildAssetPathCandidates(cat, theme, rarity);
  const next=(i)=>{ const url=candidates[i]; if (!url) return console.warn('No asset found for',cat,theme,rarity); const img=new Image(); img.onload=()=>{ if (cat==='background'){ bgImg.src=url; bgImg.classList.remove('is-empty'); }
    else if (cat==='frame'){ frameImg.src=url; frameImg.classList.remove('is-empty'); }
    else if (cat==='face'){ faceImg.src=url; faceImg.classList.remove('is-empty'); checkAndUpdateEruditToggle(); }
    else if (cat==='watermark'){ wmImg.src=url; wmImg.classList.remove('is-empty'); wmImg.style.filter = `brightness(1.12) saturate(1.06) contrast(0.98)`; if (wmImg.src.includes('/erudit/')){ transformState.wm.y=98; transformState.wm.brightness=1.81; applyTransformState(); } else if (wmImg.src.includes('/sphere/')){ transformState.wm.y=0; transformState.wm.brightness=1; applyTransformState(); } }
    updateThumbUsageMarkers(); };
    img.onerror=()=> next(i+1); img.src=url; };
  next(0);
}
function populateBgIndexes(){ const sel=$("bgPickerIndex"); if (!sel) return; sel.innerHTML=''; ['1','2','3','4','5'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }); }
function bindPersonalize(){
  populateBgIndexes();
  const bind=(btnId,cat,themeSel,raritySel)=> $(btnId)?.addEventListener('click', ()=>{ const fakeRow={ dataset:{cat}, querySelector:(q)=> q.includes('rarity')? $(raritySel) : q.includes('theme')? $(themeSel) : null }; applyComposerRow(fakeRow); });
  bind('bgApply','background','bgPickerIndex','bgPickerRarity');
  bind('faceApply','face','facePickerTheme','facePickerRarity');
  bind('wmApply','watermark','wmPickerTheme','wmPickerRarity');
  bind('frameApply','frame','framePickerTheme','framePickerRarity');
}
window.addEventListener('load', bindPersonalize);

// ==========================
// Info panel (editable rows)
// ==========================
function renderInfoRows(rows){ if (!infoGrid) return; infoGrid.innerHTML=''; const cols = rows.length>=6?3: rows.length>=3?2:1; infoGrid.classList.toggle('dynamic-2', cols===2); infoGrid.classList.toggle('dynamic-1', cols===1); rows.forEach(({label,value})=>{ const cell=document.createElement('div'); cell.className='info-cell'; const k=document.createElement('span'); k.className='k'; k.textContent=label; const v=document.createElement('span'); v.className='v'; v.textContent=value; cell.append(k,v); infoGrid.appendChild(cell); }); }
function loadInfoRows(){ try{ const raw=localStorage.getItem(INFO_STORAGE_KEY); if (!raw) return [ {label:'Level',value:'42'},{label:'XP',value:'12 340'},{label:'Trust',value:'1 337'},{label:'Faction',value:'Erudit'},{label:'Rarity',value:'Legendary'},{label:'$TRUST',value:'9 950'}, ]; return JSON.parse(raw); }catch{ return []; } }
function saveInfoRows(rows){ localStorage.setItem(INFO_STORAGE_KEY, JSON.stringify(rows)); }
function setupInfoConfig(){ const table=$("infoConfig"); if (!table) return; const tbody=table.querySelector('tbody'); const addBtn=$("addInfoRow"); const clearBtn=$("clearInfoRows"); let rows=loadInfoRows();
  const sync=()=>{ tbody.innerHTML=''; rows.forEach((row,idx)=>{ const tr=document.createElement('tr'); const tdK=document.createElement('td'); const tdV=document.createElement('td'); const tdX=document.createElement('td');
    const inpK=document.createElement('input'); inpK.type='text'; inpK.value=row.label; inpK.className='input-full';
    const inpV=document.createElement('input'); inpV.type='text'; inpV.value=row.value; inpV.className='input-full';
    const del=document.createElement('button'); del.textContent='Delete'; del.className='apply';
    inpK.addEventListener('input', ()=>{ rows[idx].label=inpK.value; saveInfoRows(rows); renderInfoRows(rows); });
    inpV.addEventListener('input', ()=>{ rows[idx].value=inpV.value; saveInfoRows(rows); renderInfoRows(rows); });
    del.addEventListener('click', ()=>{ rows.splice(idx,1); saveInfoRows(rows); sync(); renderInfoRows(rows); });
    tdK.appendChild(inpK); tdV.appendChild(inpV); tdX.appendChild(del); tr.append(tdK,tdV,tdX); tbody.appendChild(tr);
  }); };
  addBtn?.addEventListener('click', ()=>{ rows.push({label:'Label',value:'Value'}); saveInfoRows(rows); sync(); renderInfoRows(rows); });
  clearBtn?.addEventListener('click', ()=>{ rows=[]; saveInfoRows(rows); sync(); renderInfoRows(rows); });
  sync(); renderInfoRows(rows);
}
setupInfoConfig();

// ==========================
// Visibility toggles
// ==========================
function ensureShown(target){ const cb=getShowToggleFor(target); if (cb && !cb.checked){ cb.checked=true; applyComposerVisibility?.(); } }
function applyComposerVisibility(){
  bgImg.classList.toggle('hidden', !isTargetShown('bg'));
  faceImg.classList.toggle('hidden', !isTargetShown('face'));
  wmImg.classList.toggle('hidden', !isTargetShown('wm'));
  if (wm2Img) wm2Img.classList.toggle('hidden', !isTargetShown('wm2'));
  frameImg.classList.toggle('hidden', !isTargetShown('frame'));
  if (avatarPanel) avatarPanel.classList.toggle('hidden', !isTargetShown('avatar'));
  if (infoPanel) infoPanel.classList.toggle('hidden', !isTargetShown('info'));
  if (!isTargetShown('wm')) wmImg.style.opacity='0'; if (wm2Img && !isTargetShown('wm2')) wm2Img.style.opacity='0'; if (wmOverlayImg) wmOverlayImg.classList.toggle('hidden', !isTargetShown('wm'));
}
document.querySelectorAll('.show-toggle').forEach(cb=> cb.addEventListener('change', applyComposerVisibility));
applyComposerVisibility();

// Public info updater
window.updateCardInfo = function(payload={}){ const map={ level:'info-level', xp:'info-xp', trust:'info-trust', faction:'info-faction', rarity:'info-rarity', token:'info-token' }; Object.entries(payload).forEach(([k,v])=>{ const el=$(map[k]); if (el) el.textContent=v; }); };
setTimeout(()=> window.updateCardInfo({ level:"43", xp:"123 456", trust:"99 999", faction:"Erudit" }), 800);

window.addEventListener('beforeunload', ()=> urls.forEach(URL.revokeObjectURL));

// ==========================
// Randomization helpers
// ==========================
function randomizeBg(){ const r=pick(RARITIES); const idx=pick(BG_INDEXES); tryLoadRandomImage(buildAssetPathCandidates('background', idx, r), bgImg); }
function randomizeFrame(){ const t=pick(THEMES); const r=pick(RARITIES); tryLoadRandomImage(buildAssetPathCandidates('frame', t, r), frameImg); }
function randomizeFace(){ const t=pick(THEMES); const r=pick(RARITIES.filter(x=> x!=='mystic')); tryLoadRandomImage(buildAssetPathCandidates('face', t, r), faceImg, ()=>{ checkAndUpdateKeeperToggle(); applyScholarStyleDefaultForKeeper1(); }, true); }
function randomizeWm(){ const t=pick(THEMES); const r=pick(RARITIES); tryLoadRandomImage(buildAssetPathCandidates('watermark', t, r), wmImg, ()=>{ if (wmImg.src.includes('/erudit/')){ transformState.wm.y=98; transformState.wm.brightness=1.81; } else if (wmImg.src.includes('/sphere/')){ transformState.wm.y=0; transformState.wm.brightness=1; } applyTransformState(); }); }

function randomizeAll(){ Object.keys(transformState).forEach(k=> transformState[k] = { scale:1,x:0,y:0,opacity:1,brightness:1 }); applyTransformState(); resetControlsToDefault();
  randomizeBg(); randomizeFrame(); randomizeFace(); randomizeWm(); updateThumbUsageMarkers(); }

$("randomizeBtn")?.addEventListener('click', (e)=>{ e.preventDefault(); randomizeAll(); });

// ==========================
// Favorites (save/load)
// ==========================
function getCurrentComposition(){ return { bgSrc:bgImg.src, faceSrc:faceImg.src, wmSrc:wmImg.src, wm2Src:wm2Img?.src, frameSrc:frameImg.src, avatarSrc:avatarImg.src, timestamp:Date.now() }; }
function loadComposition(comp){ if (comp.bgSrc) bgImg.src=comp.bgSrc; if (comp.faceSrc) faceImg.src=comp.faceSrc; if (comp.wmSrc) wmImg.src=comp.wmSrc; if (comp.wm2Src && wm2Img) wm2Img.src=comp.wm2Src; if (comp.frameSrc) frameImg.src=comp.frameSrc; if (comp.avatarSrc) avatarImg.src=comp.avatarSrc; updateThumbUsageMarkers(); checkAndUpdateKeeperToggle(); if (wmImg.src.includes('/erudit/')){ transformState.wm.y=98; transformState.wm.brightness=1.81; } else if (wmImg.src.includes('/sphere/')){ transformState.wm.y=0; transformState.wm.brightness=1; } applyTransformState(); }
function getFavorites(){ try{ const d=localStorage.getItem(STORAGE_KEY); return d? JSON.parse(d):{}; }catch(e){ console.error('localStorage read',e); return {}; } }
function saveFavorites(f){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); }catch(e){ console.error('localStorage save',e); } }
function saveComposition(name){ if (!name || !name.trim()) return alert('Veuillez entrer un nom pour la composition'); const f=getFavorites(); f[name]=getCurrentComposition(); saveFavorites(f); renderFavorites(); }
function deleteComposition(name){ if (!confirm(`Supprimer "${name}" ?`)) return; const f=getFavorites(); delete f[name]; saveFavorites(f); renderFavorites(); }
function renderFavorites(){
  const c=$("favoritesList"); if (!c) return;
  const f=getFavorites();
  const keys=Object.keys(f);
  if (!keys.length){ c.innerHTML='<div class="favorites-empty">Aucune composition sauvegardée</div>'; return; }
  c.innerHTML='';
  keys.sort().forEach((name,i)=>{
    const comp=f[name];
    const item=document.createElement('div'); item.className='favorite-item';
    const num=document.createElement('span'); num.className='favorite-num'; num.textContent=i+1;
    const title=document.createElement('span'); title.className='favorite-title'; title.textContent = name;
    const load=document.createElement('button'); load.className='load-favorite'; load.textContent='👁'; load.title='Load'; load.onclick=()=> loadComposition(comp);
    const del=document.createElement('button'); del.className='delete-favorite'; del.textContent='✕'; del.title='Delete'; del.onclick=()=> deleteComposition(name);
    item.append(num, title, load, del);
    c.appendChild(item);
  });
}
function initializeSaveButton(){ const btn=$("saveComposition"); if (!btn) return console.error('Save button not found!'); btn.addEventListener('click', ()=>{ const input=$("compositionName"); if (input){ saveComposition(input.value); input.value=''; } }); if (DEBUG) console.log('Save button initialized'); }

// ==========================
// Presets (programmatic generation; EXACT paths preserved by rules)
// ==========================
const THEME_BG_INDEX = { erudit: 4, abeille: 2, sphere: 4 };
const MYSTIC_BG = { erudit:'./public/assets/catalog/background/mystic/mystic4.svg', abeille:'./public/assets/catalog/background/mystic/mystic1.jpg', sphere:'./public/assets/catalog/background/mystic/mystic4.svg' };
function baseTransforms(){ return { bg:{scale:1,x:0,y:0,opacity:1,brightness:1}, face:{scale:1,x:0,y:0,opacity:1,brightness:1}, wm:{scale:1,x:0,y:0,opacity:1,brightness:1}, frame:{scale:1,x:0,y:0,opacity:1,brightness:1} }; }
function makeThemePresets(theme){
  const idx = THEME_BG_INDEX[theme] || 4;
  const mkBg=(r)=> r==='mystic' ? MYSTIC_BG[theme] : `./public/assets/catalog/background/${r}/${r}${idx}.svg`;
  const mkFace=(r)=> `./public/assets/catalog/face/${theme}/${r}.svg`;
  const mkFrame=(r)=> `./public/assets/catalog/frame/${theme}/${r}.svg`;
  const mkWM=(r)=> `./public/assets/catalog/watermark/${theme}/${r}.svg`;
  const out={};
  RARITIES.forEach(r=>{
    const t = baseTransforms();
    if (theme==='erudit'){ t.face.y = -9; t.wm.y = 98; t.wm.brightness = 1.81; if (r==='mystic'){ t.face.scale=2; t.face.y=136; } }
    if (theme==='abeille'){ t.face.scale = 0.7; }
    out[r] = { background: mkBg(r), face: mkFace(r), frame: mkFrame(r), watermark: mkWM(r), transforms: t };
  });
  return out;
}
const eruditPresets = makeThemePresets('erudit');
const beePresets    = makeThemePresets('abeille');
const spherePresets = makeThemePresets('sphere');

function makeErudit2(){
  const out={};
  RARITIES.forEach(r=>{
    const t = baseTransforms(); t.wm.y = -9;
    out[r] = {
      background: '',
      face: `./public/assets/catalog/watermark/sphere/${r}.svg`,
      frame:`./public/assets/catalog/frame/sphere/${r}.svg`,
      watermark:`./public/assets/catalog/face/erudit/${r}.svg`,
      transforms: t
    };
  });
  return out;
}
const erudit2Presets = makeErudit2();

// Rarity label updater
function updateAllPresetButtonLabels(){ const r = rarities[rarityIndex]; const txt = r[0].toUpperCase()+r.slice(1); [ ['eruditBtn'], ['beeBtn'], ['sphereAltBtn'], ['erudit2Btn'] ].forEach(([id])=>{ const b=$(id); if (!b) return; const s=b.querySelector('.preset-desc'); if (s) s.textContent=txt; }); }

// Preset apply helpers
function setPresetAssets(p){ if (!p) return; if (typeof p.background !== 'undefined'){ bgImg.src = p.background || EMPTY_DATA_URL; bgImg.classList.remove('is-empty'); }
  if (p.face){ faceImg.src=p.face; faceImg.classList.remove('is-empty'); }
  if (p.frame){ frameImg.src=p.frame; frameImg.classList.remove('is-empty'); }
  if (p.watermark){ wmImg.src=p.watermark; wmImg.classList.remove('is-empty'); } }
function applyPresetTransforms(p){ if (!p?.transforms) return; Object.keys(p.transforms).forEach(k=>{ if (transformState[k]) transformState[k] = { ...p.transforms[k] }; }); applyTransformState(); resetControlsToDefault(); }
function finalizePresetApply(){ updateThumbUsageMarkers(); updateAllPresetButtonLabels?.(); }

function applyPreset(name){
  const currentRarity = rarities[rarityIndex];
  const table = { erudit: eruditPresets, bee: beePresets, sphere_alt: spherePresets, erudit2: erudit2Presets };
  if (name in table){ const p = table[name][currentRarity]; if (!p) return console.error('Preset not found', name, currentRarity); setPresetAssets(p); applyPresetTransforms(p); finalizePresetApply(); rarityIndex = (rarityIndex + 1) % rarities.length; if (DEBUG) console.log(name,'preset applied:', currentRarity); return; }
  console.error('Preset not found:', name);
}

function initializePresets(){ document.querySelectorAll('.preset-btn').forEach(btn=> btn.addEventListener('click', ()=> applyPreset(btn.dataset.preset))); window.addEventListener('keydown', (e)=>{
  if (e.repeat) return;
  const t = e.target;
  const typing = t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || (t instanceof HTMLElement && t.isContentEditable) || t.tagName==='SELECT');
  if (typing) return;
  const map = { Digit1:'erudit', Digit2:'bee', Digit3:'sphere_alt', Digit4:'erudit2' };
  const p = map[e.code];
  if (p){ e.preventDefault(); applyPreset(p); }
}, { passive:true }); }

// ==========================
// Init
// ==========================
window.addEventListener('load', ()=>{
  if (DEBUG) console.log('Page loaded, initializing...');
  const critical = [ './public/assets/catalog/background/common/common4.svg', './public/assets/catalog/face/erudit/common.svg', './public/assets/catalog/watermark/erudit/common.svg', './public/assets/catalog/frame/erudit/common.svg' ];
  Promise.all(critical.map(src=> new Promise(res=>{ const i=new Image(); i.onload=res; i.onerror=res; i.src=src; }))).then(()=>{
    appendCatalogThumbs(); domCache.clearCache(); requestAnimationFrame(()=>{
      initializeFilters(); initializeSaveButton(); initializePresets(); initGenerator(); updateAllPresetButtonLabels(); applyPreset('erudit'); renderFavorites(); resetDropZonesUI(); if (DEBUG) console.log('All systems initialized');
    });
  });
});

// UI visibility toggles wiring
document.querySelectorAll('.show-toggle').forEach(t=> t.addEventListener('change', ()=> applyComposerVisibility()));

// Save transform button
$("saveTransform")?.addEventListener('click', ()=>{ const t=transformTargetSel?.value||'bg'; const cur={ scale:+(transformScale?.value||1), x:+(transformOffsetX?.value||0), y:+(transformOffsetY?.value||0), opacity:+(transformOpacity?.value||1), brightness:+(transformBrightness?.value||1) }; transformState[t]=cur; saveTransformToStorage(); alert(`Transform values saved for ${t}!`); });

// Expose some for debugging
window.__trustcard__ = { applyPreset, randomizeAll, applyFilter, applyRarityFilter };

// ==========================
// Generator (bulk card previews)
// ==========================
function initGenerator(){
  const openBtn = $("openGenerator");
  const modal = $("genModal");
  const backdrop = $("genBackdrop");
  const closeBtn = $("genClose");
  const resetBtn = $("genReset");
  const grid = $("genGrid");
  const status = $("genStatus");
  const countSel = $("genCount");
  const scrollRoot = $("genScrollRoot");
  const sentinel = $("genSentinel");
  if (!openBtn || !modal || !grid || !status || !sentinel || !countSel) return;

  let planned = +countSel.value || 100;
  let loaded = 0;
  const batch = 12; // 4 rows per chunk (3 per row)
  let io = null;

  function updateStatus(){ status.textContent = `${loaded}/${planned}`; }

  function clearGrid(){ grid.innerHTML=''; loaded=0; updateStatus(); }

  function cloneCard(){
    const src = $("card");
    const node = src.cloneNode(true);
    node.removeAttribute('id');
    node.removeAttribute('data-tilt');
    node.querySelectorAll('[id]').forEach(el=> el.removeAttribute('id'));
    // Enable hover/move interactions for preview effects
    node.style.pointerEvents = 'auto';
    return node;
  }

  function randomizeNodeAssets(node){
    const bg   = node.querySelector('.bg-img');
    const face = node.querySelector('.card-img');
    const wm   = node.querySelector('.wm-img:not(.wm2-img)');
    const wm2  = node.querySelector('.wm2-img');
    const frame= node.querySelector('.frame-img');
    // Reset inline styles for consistency
    ;[bg,face,wm,wm2,frame].forEach(el=>{ if (el) el.removeAttribute('style'); });
    // Ensure elements are visible regardless of main card toggles
    ;[bg,face,wm,frame].forEach(el=>{ if (el) el.classList.remove('hidden'); });
    if (wm2){ wm2.src = EMPTY_DATA_URL; wm2.classList.add('is-empty'); }

    // Local transform state as in randomizeAll (reset to defaults)
    const ts = {
      bg:    { scale:1, x:0, y:0, opacity:1, brightness:1 },
      face:  { scale:1, x:0, y:0, opacity:1, brightness:1 },
      frame: { scale:1, x:0, y:0, opacity:1, brightness:1 },
      wm:    { scale:1, x:0, y:0, opacity:1, brightness:1 },
      wm2:   { scale:1, x:0, y:0, opacity:1, brightness:1 },
    };

    // Background
    const bgR = pick(RARITIES); const bgIdx = pick(BG_INDEXES);
    tryLoadRandomImage(buildAssetPathCandidates('background', bgIdx, bgR), bg);
    // Frame
    const frT = pick(THEMES); const frR = pick(RARITIES);
    tryLoadRandomImage(buildAssetPathCandidates('frame', frT, frR), frame);
    // Face (no mystic)
    const fT = pick(THEMES); const fR = pick(RARITIES.filter(r=> r!=='mystic'));
    tryLoadRandomImage(buildAssetPathCandidates('face', fT, fR), face, null, true);
    // Watermark
    const wT = pick(THEMES); const wR = pick(RARITIES);
    tryLoadRandomImage(buildAssetPathCandidates('watermark', wT, wR), wm, ()=>{
      // match randomizeAll behavior for wm transforms
      if (wT === 'erudit') { ts.wm.y = 98; ts.wm.brightness = 1.81; }
      else if (wT === 'sphere') { ts.wm.y = 0; ts.wm.brightness = 1; }
      applyTransformsToNode(node, ts);
    });

    // Store transforms on node and apply immediately (refined after wm load)
    node.__tcTs = ts;
    applyTransformsToNode(node, ts);
  }

  function applyTransformsToNode(node, ts){
    const bg   = node.querySelector('.bg-img');
    const face = node.querySelector('.card-img');
    const wm   = node.querySelector('.wm-img:not(.wm2-img)');
    const wm2  = node.querySelector('.wm2-img');
    const frame= node.querySelector('.frame-img');
    const set = (el, t)=>{ if (!el || !t) return; el.style.transform = `scale(${t.scale}) translate(${t.x}px, ${t.y}px)`; el.style.opacity = t.opacity; el.style.filter = `brightness(${t.brightness})`; };
    set(bg, ts.bg); set(face, ts.face); set(frame, ts.frame);
    if (wm && ts.wm){ wm.style.transform = `translate3d(${ts.wm.x}px,${ts.wm.y}px,0) scale(${(ts.wm.scale||1).toFixed(3)})`; wm.style.filter = `brightness(${ts.wm.brightness||1})`; }
    if (wm2 && ts.wm2){ wm2.style.transform = `translate3d(${ts.wm2.x}px,${ts.wm2.y}px,0) scale(${(ts.wm2.scale||1).toFixed(3)})`; wm2.style.filter = `brightness(${ts.wm2.brightness||1})`; wm2.style.opacity = ts.wm2.opacity; }
  }

  // Bind tilt/hover effects to a preview card (like main card)
  function bindPreviewTilt(node){
    let rafPending = false; let last = null;
    const wm = node.querySelector('.wm-img:not(.wm2-img)');
    const glare = node.querySelector('.glare');
    const ts = ()=> node.__tcTs || { wm:{ scale:1, y:0 } };

    const scaleStr = 'scale(.72)';

    function applyTilt(cx, cy){
      const rect = node.getBoundingClientRect();
      const rx = ((cy - rect.top) / rect.height - 0.5) * -16;
      const ry = ((cx - rect.left) / rect.width  - 0.5) *  16;
      node.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) ${scaleStr}`;
      const mag = Math.min(1, Math.hypot(rx, ry) / (16 * 0.9));
      if (wm){
        const op = (0.08 + mag * 0.75).toFixed(3);
        wm.style.opacity = op;
        const wms = ts().wm || { scale:1, y:0 };
        wm.style.transform = `translate3d(0, ${wms.y}px, 0) scale(${(wms.scale||1) * 1.02})`;
      }
      if (glare){
        const angle = Math.atan2(cy - (rect.top + rect.height/2), cx - (rect.left + rect.width/2)) * 180/Math.PI + 180;
        glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.40), rgba(255,255,255,0.00) 55%)`;
        glare.style.opacity = 0.25 + mag * 0.25;
      }
    }

    function onMove(e){
      const p = e.touches?.[0] || e;
      last = { x:p.clientX, y:p.clientY };
      if (rafPending) return; rafPending = true;
      requestAnimationFrame(()=>{ rafPending=false; if (!last) return; applyTilt(last.x, last.y); });
    }
    function onLeave(){ node.style.transform = scaleStr; if (wm) wm.style.opacity = '0'; if (glare) glare.style.opacity = '0'; }

    node.addEventListener('mousemove', onMove);
    node.addEventListener('mouseleave', onLeave);
    node.addEventListener('touchmove', onMove, { passive:true });
    node.addEventListener('touchend', onLeave);
  }

  function appendChunk(){
    const frag = document.createDocumentFragment();
    const remain = planned - loaded;
    const take = Math.min(batch, remain);
    for (let i=0;i<take;i++){
      const n = cloneCard();
      randomizeNodeAssets(n);
      bindPreviewTilt(n);
      const wrap = document.createElement('div');
      wrap.className = 'gen-item';
      const fav = document.createElement('button');
      fav.className = 'gen-fav-btn';
      fav.type = 'button';
      fav.textContent = '♡';
      fav.title = 'Add to favorites';
      fav.addEventListener('click', (e)=>{
        e.preventDefault(); e.stopPropagation();
        toggleFavoriteFromNode(n, fav);
      });
      // Pre-mark if this composition already exists in favorites
      const preName = findFavoriteNameForNode(n);
      if (preName){ fav.classList.add('is-active'); fav.textContent = '❤'; fav.title = `In favorites: ${preName}`; fav.dataset.favName = preName; }
      wrap.appendChild(fav);
      wrap.appendChild(n);
      frag.appendChild(wrap);
      loaded++;
    }
    grid.appendChild(frag);
    updateStatus();
    if (loaded >= planned && io){ io.disconnect(); io = null; }
  }

  function addFavoriteFromNode(node){
    const comp = {
      bgSrc:   node.querySelector('.bg-img')?.src,
      faceSrc: node.querySelector('.card-img')?.src,
      wmSrc:   node.querySelector('.wm-img:not(.wm2-img)')?.src,
      wm2Src:  node.querySelector('.wm2-img')?.src,
      frameSrc:node.querySelector('.frame-img')?.src,
      avatarSrc: avatarImg?.src,
      timestamp: Date.now()
    };
    const name = `Gen ${new Date().toLocaleString()}`;
    const favs = getFavorites();
    let finalName = name; let idx = 2;
    while (favs[finalName]) { finalName = `${name} #${idx++}`; }
    favs[finalName] = comp;
    saveFavorites(favs);
    renderFavorites();
    return finalName;
  }

  function normalizeSrc(u){ try{ return new URL(u, location.origin).pathname; }catch{ return u||''; } }
  function getCompSignature(comp){
    return [
      normalizeSrc(comp.bgSrc),
      normalizeSrc(comp.faceSrc),
      normalizeSrc(comp.wmSrc),
      normalizeSrc(comp.wm2Src),
      normalizeSrc(comp.frameSrc),
    ].join('|');
  }
  function getNodeComp(n){
    return {
      bgSrc:   n.querySelector('.bg-img')?.src || '',
      faceSrc: n.querySelector('.card-img')?.src || '',
      wmSrc:   n.querySelector('.wm-img:not(.wm2-img)')?.src || '',
      wm2Src:  n.querySelector('.wm2-img')?.src || '',
      frameSrc:n.querySelector('.frame-img')?.src || '',
    };
  }
  function findFavoriteNameForNode(n){
    const comp = getNodeComp(n);
    const sig = getCompSignature(comp);
    const favs = getFavorites();
    for (const [name, c] of Object.entries(favs)){
      if (getCompSignature(c) === sig) return name;
    }
    return null;
  }
  function toggleFavoriteFromNode(n, btn){
    const favs = getFavorites();
    const existingName = findFavoriteNameForNode(n);
    if (existingName){
      delete favs[existingName];
      saveFavorites(favs);
      renderFavorites();
      if (btn){ btn.classList.remove('is-active'); btn.textContent = '♡'; btn.title = 'Add to favorites'; delete btn.dataset.favName; }
      return { action:'removed', name: existingName };
    } else {
      const savedName = addFavoriteFromNode(n);
      if (btn){ btn.classList.add('is-active'); btn.textContent = '❤'; btn.title = `Added: ${savedName}`; btn.dataset.favName = savedName; }
      return { action:'added', name: savedName };
    }
  }

  function open(){ modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; clearGrid(); appendChunk(); ensureObserver(); }
  function close(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if (io){ io.disconnect(); io=null; } }

  function ensureObserver(){
    if (io) return;
    io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if (e.isIntersecting){ appendChunk(); } });
    }, { root: scrollRoot, rootMargin: '600px' });
    io.observe(sentinel);
  }

  openBtn.addEventListener('click', ()=>{ planned = +countSel.value || 100; updateStatus(); open(); });
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  countSel.addEventListener('change', ()=>{ planned = +countSel.value || 100; updateStatus(); });
  resetBtn?.addEventListener('click', ()=>{ planned = +countSel.value || planned; clearGrid(); appendChunk(); ensureObserver(); });

  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && modal.getAttribute('aria-hidden')==='false') close(); });
}

// ==========================
// Resizable panels: thumbnails (left) and sidebar (right)
// ==========================
// (Sidebar resizing removed)

// ==========================
// Sidebar resizer
// ==========================
// (Sidebar resizing removed)

// === COMPLETE CARD GENERATION (BG + FACE + WM + FRAME) ===
(() => {
  const gallery = document.getElementById('galleryGrid');
  const sentinel = document.getElementById('sentinel');
  const status = document.getElementById('batchStatus');
  if (!gallery || !sentinel || !status) return;

  let totalToRender = 0;
  let rendered = 0;
  const BATCH_SIZE = 8; // 8 per frame = smooth

  const localRarities = [...RARITIES];
  const localThemes = [...THEMES];

  // Build full asset paths for one card
  function randomComposition() {
    const r = pick(localRarities);
    const t = pick(localThemes);
    const bgIndex = pick(BG_INDEXES);

    const background = r === "mystic"
      ? `./public/assets/catalog/background/mystic/mystic4.svg`
      : `./public/assets/catalog/background/${r}/${r}${bgIndex}.svg`;
    const face = `./public/assets/catalog/face/${t}/${r}.svg`;
    const wm = `./public/assets/catalog/watermark/${t}/${r}.svg`;
    const frame = `./public/assets/catalog/frame/${t}/${r}.svg`;

    return { r, t, background, face, wm, frame };
  }

  // Create a DOM <div> for one card
  function makeCard() {
    const { background, face, wm, frame, t, r } = randomComposition();
    const wrapper = document.createElement("div");
    wrapper.className = "mini-card";
    wrapper.title = `${t} - ${r}`;

    const bg = document.createElement("img");
    const f = document.createElement("img");
    const w = document.createElement("img");
    const fr = document.createElement("img");

    Object.assign(bg, { src: background, className: "bg", loading: "lazy", decoding: "async" });
    Object.assign(f, { src: face, className: "face", loading: "lazy", decoding: "async" });
    Object.assign(w, { src: wm, className: "wm", loading: "lazy", decoding: "async" });
    Object.assign(fr, { src: frame, className: "frame", loading: "lazy", decoding: "async" });

    wrapper.append(bg, f, w, fr);
    return wrapper;
  }

  // Render in batches (8 per frame to keep it smooth)
  function renderBatch() {
    if (rendered >= totalToRender) return;
    const end = Math.min(rendered + BATCH_SIZE, totalToRender);
    const frag = document.createDocumentFragment();
    for (let i = rendered; i < end; i++) frag.appendChild(makeCard());
    gallery.appendChild(frag);
    rendered = end;
    status.textContent = `${rendered}/${totalToRender}`;
  }

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) renderBatch();
  }, { rootMargin: "400px" });
  io.observe(sentinel);

  document.querySelectorAll(".batch-controls .btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      totalToRender += parseInt(btn.dataset.count, 10);
      renderBatch();
    });
  });
})();
