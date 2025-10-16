const EMPTY_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5ErkJggg==';
const THEMES = ["erudit", "abeille", "sphere", "relic"];
const BG_INDEXES = ["1", "2", "3", "4", "5"];
const RARITIES = ["common", "rare", "epic", "legendary", "ancient", "mystic"];
const STORAGE_KEY = 'trustcard_favorites';
const TRANSFORM_STORAGE_KEY = 'trustcard_transforms';

// DOM Elements - Card
const card = document.getElementById("card");
const bgImg = document.getElementById("bgImg");
const faceImg = document.getElementById("faceImg");
const wmImg = document.getElementById("wmImg");
const wm2Img = document.getElementById("wm2Img");
const frameImg = document.getElementById("frameImg");
const glare = document.querySelector(".glare");
const avatarImg = document.getElementById("avatarImg");
const avatarPanel = document.getElementById("avatarPanel");
const infoPanel = document.getElementById("infoPanel");
const infoGrid = document.getElementById("infoGrid");

// DOM Elements - Inputs
const bgInput = document.getElementById("bgInput");
const faceInput = document.getElementById("faceInput");
const wmInput = document.getElementById("wmInput");
const wm2Input = document.getElementById("wm2Input");
const frameInput = document.getElementById("frameInput");
const avatarInput = document.getElementById("avatarInput");
const blendSelect = document.getElementById("blend");
const forceInput = document.getElementById("force");

// State
let wmOverlayImg = null;
let damp = forceInput ? +forceInput.value : 16;
const urls = [];

// Utility Functions
function getShowToggleFor(target) {
  return document.querySelector(`.show-toggle[data-target="${target}"]`);
}

function isTargetShown(target) {
  const cb = getShowToggleFor(target);
  return cb ? !!cb.checked : true;
}

// Ensure a target is visible (check its toggle and re-apply visibility)
function ensureShown(target){
  const cb = getShowToggleFor(target);
  if (cb && !cb.checked) {
    cb.checked = true;
    applyComposerVisibility?.();
  }
}

function setBlend(mode) {
  if (!wmImg) return;
  wmImg.style.mixBlendMode = mode;
  if (wm2Img) wm2Img.style.mixBlendMode = mode;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
    const op = (0.08 + mag * 0.75).toFixed(3);
    wmImg.style.opacity = op;
    if (wmOverlayImg) wmOverlayImg.style.opacity = op;
    
  }
  if (isTargetShown('wm2') && wm2Img) {
    const op2 = (0.08 + mag * 0.75).toFixed(3);
    wm2Img.style.opacity = op2;
  }

  const px = ((cx / rect.width) - 0.5) * -12;
  const py = ((cy / rect.height) - 0.5) * -12;
  const wmScale = transformState.wm.scale || 1;
  const wmOffsetY = transformState.wm.y || 0;
  wmImg.style.transform = `translate3d(${px}px, ${py + wmOffsetY}px, 0) scale(${wmScale * 1.03})`;
  if (wm2Img) {
    const wm2Scale = transformState.wm2?.scale || 1;
    const wm2OffsetY = transformState.wm2?.y || 0;
    wm2Img.style.transform = `translate3d(${px}px, ${py + wm2OffsetY}px, 0) scale(${wm2Scale * 1.03})`;
  }

  const pointerX = `${(cx / rect.width) * 100}%`;
  const pointerY = `${(cy / rect.height) * 100}%`;
  const bgX = `${((cx / rect.width) * 200 - 50).toFixed(2)}%`;
  const bgY = `${((cy / rect.height) * 200 - 50).toFixed(2)}%`;
  

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
  if (isTargetShown('wm2') && wm2Img) {
    wm2Img.style.opacity = "0";
  }
  if (wm2Img) {
    const wm2Scale = transformState.wm2?.scale || 1;
    const wm2OffsetY = transformState.wm2?.y || 0;
    wm2Img.style.transform = `translate3d(0,${wm2OffsetY}px,0) scale(${wm2Scale * 1.02})`;
  }
  if (wmOverlayImg){
    wmOverlayImg.style.setProperty('--background-x', '50%');
    wmOverlayImg.style.setProperty('--background-y', '50%');
    wmOverlayImg.style.setProperty('--pointer-x', '50%');
    wmOverlayImg.style.setProperty('--pointer-y', '50%');
  }
  glare.style.opacity = "0";
}

let rafPending = false, lastPointer = null;
function scheduleTilt(e){
  const rect = card.getBoundingClientRect();
  const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
  const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
  lastPointer = { cx, cy };
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(()=>{
    rafPending = false;
    if (lastPointer) {
      tiltFromEvent({ clientX: lastPointer.cx + rect.left, clientY: lastPointer.cy + rect.top });
    }
  });
}
card.addEventListener("mousemove", scheduleTilt);
card.addEventListener("mouseleave", tiltLeave);
card.addEventListener("touchmove", scheduleTilt, { passive: true });
card.addEventListener("touchend", tiltLeave);

if (blendSelect) blendSelect.addEventListener("change", (e) => setBlend(e.target.value));
if (forceInput)  forceInput.addEventListener("input", (e) => { damp = +e.target.value; });
setBlend(blendSelect ? blendSelect.value : 'screen');

// File inputs for second watermark
if (wm2Input && wm2Img) wm2Input.addEventListener("change",    () => { fileToEl(wm2Input, wm2Img); ensureShown('wm2'); });

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

// Handle clicks on thumbnails in the main container
const allThumbsContainer = document.getElementById('allThumbs');
if (allThumbsContainer) {
  allThumbsContainer.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    
    const isEmptyThumb = t.hasAttribute('data-empty') || t.classList.contains('thumb-empty');
    const targetId = t.dataset.target;
    const targetEl = targetId ? document.getElementById(targetId) : null;
    
    if (!(targetEl instanceof HTMLImageElement)) return;
    
      if (isEmptyThumb) {
        targetEl.src = EMPTY_DATA_URL;
        targetEl.classList.add('is-empty');
      } else if (t instanceof HTMLImageElement) {
    targetEl.src = t.src;
        targetEl.classList.remove('is-empty');
        syncComposerFromImageSrc(targetEl, t.src);
        if (targetId === 'faceImg') {
          checkAndUpdateEruditToggle();
        }
        if (targetId === 'wm2Img') ensureShown('wm2');
      } else {
        return;
      }
    
    allThumbsContainer.querySelectorAll(".thumb").forEach(img => img.classList.remove("selected"));
    t.classList.add("selected");
  });
}

function appendCatalogThumbs(){
  const rarities = ['common','rare','epic','legendary','ancient','mystic'];
  const themes = ['erudit','abeille','sphere'];
  const bgIndexes = ['1','2','3','4'];
  const container = document.getElementById('allThumbs');
  
  if (!container) return;
  
  rarities.forEach(r => {
    bgIndexes.forEach(idx => {
      const src = `./assets/catalog/background/${r}/${r}${idx}.svg`;
      const el = document.createElement('img');
      el.loading = 'lazy';
      el.decoding = 'async';
      el.src = src;
      el.className = 'thumb';
      el.dataset.category = 'background';
      el.dataset.rarity = r;
      el.dataset.target = 'bgImg';
      el.alt = `bg-${r}-${idx}`;
      container.appendChild(el);
      makeThumbDraggable(el);
    });
  });
  
  const mysticSources = ['./assets/catalog/background/mystic/mystic1.jpg', './assets/catalog/background/mystic/mystic4.svg'];
  mysticSources.forEach((src, i) => {
    const el = document.createElement('img');
    el.loading = 'lazy';
    el.decoding = 'async';
    el.src = src;
    el.className = 'thumb';
    el.dataset.category = 'background';
    el.dataset.rarity = 'mystic';
    el.dataset.target = 'bgImg';
    el.alt = `bg-mystic-${i+1}`;
    container.appendChild(el);
    makeThumbDraggable(el);
  });
  
  themes.forEach(t => rarities.forEach(r => {
    const srcSvg = `./assets/catalog/watermark/${t}/${r}.svg`;
    const el1 = document.createElement('img');
    el1.loading = 'lazy';
    el1.decoding = 'async';
    el1.src = srcSvg;
    el1.className = 'thumb';
    el1.dataset.category = 'watermark';
    el1.dataset.rarity = r;
    el1.dataset.target = 'wmImg';
    el1.alt = `wm-${t}-${r}`;
    container.appendChild(el1);
    makeThumbDraggable(el1);

    const el2 = document.createElement('img');
    el2.loading = 'lazy';
    el2.decoding = 'async';
    el2.src = srcSvg;
    el2.className = 'thumb';
    el2.dataset.category = 'watermark';
    el2.dataset.rarity = r;
    el2.dataset.target = 'wm2Img';
    el2.alt = `wm2-${t}-${r}`;
    container.appendChild(el2);
    makeThumbDraggable(el2);
  }));
  
  themes.forEach(t => rarities.filter(r => r !== 'mystic').forEach(r => {
    const srcSvg = `./assets/catalog/face/${t}/${r}.svg`;
    const el = document.createElement('img');
    el.loading = 'lazy';
    el.decoding = 'async';
    el.src = srcSvg;
    el.className = 'thumb';
    el.dataset.category = 'face';
    el.dataset.rarity = r;
    el.dataset.target = 'faceImg';
    el.alt = `face-${t}-${r}`;
    container.appendChild(el);
    makeThumbDraggable(el);
  }));
  
  themes.forEach(t => rarities.forEach(r => {
    const srcSvg = `./assets/catalog/frame/${t}/${r}.svg`;
    const el = document.createElement('img');
    el.loading = 'lazy';
    el.decoding = 'async';
    el.src = srcSvg;
    el.className = 'thumb';
    el.dataset.category = 'frame';
    el.dataset.rarity = r;
    el.dataset.target = 'frameImg';
    el.alt = `frame-${t}-${r}`;
    container.appendChild(el);
    makeThumbDraggable(el);
  }));
}

function initializeFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const rarityBtns = document.querySelectorAll('.rarity-btn');
  console.log('Found filter buttons:', filterBtns.length);
  console.log('Found rarity buttons:', rarityBtns.length);
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Filter clicked:', btn.dataset.filter);
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      applyFilter(filter);
    });
  });
  
  rarityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Rarity clicked:', btn.dataset.rarity);
      document.querySelectorAll('.rarity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const rarity = btn.dataset.rarity;
      applyRarityFilter(rarity);
    });
  });
  
  applyFilter('all');
  applyRarityFilter('all');
}

// Initialize everything when page loads
window.addEventListener('load', () => {
  console.log('Page loaded, initializing...');
  
  // Load thumbnails first
  appendCatalogThumbs();
  
        setTimeout(() => {
          initializeFilters();
          initializeSaveButton();
          initializePresets();
          applyPreset('scholar');
          renderFavorites();
          resetDropZonesUI();
          console.log('All systems initialized');
        }, 100);
});
const leftRailContent = document.getElementById('leftRailContent');
const closeLeftRail = document.getElementById('closeLeftRail');
const dropsRail = document.querySelector('.drops-rail');

function updateButtonText() {
  const isClosed = leftRailContent?.classList.contains('closed');
  if (closeLeftRail) {
    closeLeftRail.textContent = isClosed ? 'Open' : 'Close';
  }
}

closeLeftRail?.addEventListener('click', () => {
  const isClosed = leftRailContent?.classList.toggle('closed');
  leftRailContent?.setAttribute('aria-hidden', String(isClosed));
  
  if (dropsRail) {
    if (isClosed) {
      dropsRail.style.display = 'none';
    } else {
      dropsRail.style.display = 'block';
    }
  }
  
  updateButtonText();
});

updateButtonText();

// Transform System
const transformTargetSel = document.getElementById('transformTarget');
const transformScale = document.getElementById('transformScale');
const transformOffsetX = document.getElementById('transformOffsetX');
const transformOffsetY = document.getElementById('transformOffsetY');
const transformOpacity = document.getElementById('transformOpacity');
const transformBrightness = document.getElementById('transformBrightness');
const transformReset = document.getElementById('transformReset');

const eruditToggleRow = document.getElementById('eruditToggleRow');
const eruditStyleToggle = document.getElementById('eruditStyleToggle');

const transformScaleValue = document.getElementById('transformScaleValue');
const transformOffsetXValue = document.getElementById('transformOffsetXValue');
const transformOffsetYValue = document.getElementById('transformOffsetYValue');
const transformOpacityValue = document.getElementById('transformOpacityValue');
const transformBrightnessValue = document.getElementById('transformBrightnessValue');

const transformState = {
  bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  wm2: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
  frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
};

let eruditStyleApplied = false;

function applyTransformState() {
  // Apply transforms
  bgImg.style.transform = `scale(${transformState.bg.scale}) translate(${transformState.bg.x}px, ${transformState.bg.y}px)`;
  faceImg.style.transform = `scale(${transformState.face.scale}) translate(${transformState.face.x}px, ${transformState.face.y}px)`;
  frameImg.style.transform = `scale(${transformState.frame.scale}) translate(${transformState.frame.x}px, ${transformState.frame.y}px)`;
  wmImg.style.transform = `translate3d(${transformState.wm.x}px,${transformState.wm.y}px,0) scale(${transformState.wm.scale.toFixed(3)})`;
  if (wm2Img) {
    wm2Img.style.transform = `translate3d(${transformState.wm2.x}px,${transformState.wm2.y}px,0) scale(${(transformState.wm2.scale || 1).toFixed(3)})`;
  }
  
  // Apply watermark properties
  wmImg.style.setProperty('--wm-scale', transformState.wm.scale);
  wmImg.style.setProperty('--wm-offset-y', `${transformState.wm.y}px`);
  
  // Apply opacity and brightness
  bgImg.style.opacity = transformState.bg.opacity;
  bgImg.style.filter = `brightness(${transformState.bg.brightness})`;
  
  faceImg.style.opacity = transformState.face.opacity;
  faceImg.style.filter = `brightness(${transformState.face.brightness})`;
  
  frameImg.style.opacity = transformState.frame.opacity;
  frameImg.style.filter = `brightness(${transformState.frame.brightness})`;
  
  wmImg.style.filter = `brightness(${transformState.wm.brightness})`;
  if (wm2Img) {
    wm2Img.style.filter = `brightness(${transformState.wm2.brightness})`;
    wm2Img.style.opacity = transformState.wm2.opacity;
  }
  
  if (wmOverlayImg) {
    wmOverlayImg.style.transform = wmImg.style.transform;
    wmOverlayImg.style.setProperty('--wm-scale', transformState.wm.scale);
    wmOverlayImg.style.setProperty('--wm-offset-y', `${transformState.wm.y}px`);
    wmOverlayImg.style.mixBlendMode = wmImg?.style?.mixBlendMode || 'screen';
  }
}

function updateValueDisplays() {
  if (transformScaleValue) transformScaleValue.textContent = parseFloat(transformScale?.value || 1).toFixed(1);
  if (transformOffsetXValue) transformOffsetXValue.textContent = parseInt(transformOffsetX?.value || 0);
  if (transformOffsetYValue) transformOffsetYValue.textContent = parseInt(transformOffsetY?.value || 0);
  if (transformOpacityValue) transformOpacityValue.textContent = parseFloat(transformOpacity?.value || 1).toFixed(2);
  if (transformBrightnessValue) transformBrightnessValue.textContent = parseFloat(transformBrightness?.value || 1).toFixed(2);
}

function resetControlsToDefault() {
  if (transformScale) transformScale.value = '1';
  if (transformOffsetX) transformOffsetX.value = '0';
  if (transformOffsetY) transformOffsetY.value = '0';
  if (transformOpacity) transformOpacity.value = '1';
  if (transformBrightness) transformBrightness.value = '1';
  updateValueDisplays();
}

function isEruditFace() {
  return faceImg.src.includes('/face/erudit/');
}

function showEruditToggle() {
  if (eruditToggleRow) {
    eruditToggleRow.style.display = 'flex';
  }
}

function hideEruditToggle() {
  if (eruditToggleRow) {
    eruditToggleRow.style.display = 'none';
  }
}

function applyEruditStyle() {
  if (!isEruditFace()) return;
  
  const isScholarStyle = eruditStyleToggle.checked;
  
  if (isScholarStyle) {
    transformState.face.scale = 1;
    transformState.face.y = 0;
  } else {
    transformState.face.scale = 2;
    transformState.face.y = 136;
  }
  
  eruditStyleApplied = true;
  
  if (wmImg.src.includes('/erudit/')) {
    transformState.wm.y = 98;
    transformState.wm.brightness = 1.81;
  } else if (wmImg.src.includes('/sphere/')) {
    transformState.wm.y = 0;
    transformState.wm.brightness = 1;
  }
  
  applyTransformState();
  updateValueDisplays();
}

function applyDefaultEruditStyle() {
  if (!isEruditFace()) return;
  
  transformState.face.scale = 2;
  transformState.face.y = 136;
  eruditStyleApplied = true;
  
  if (eruditStyleToggle) {
    eruditStyleToggle.checked = false;
  }
  
  if (wmImg.src.includes('/erudit/')) {
    transformState.wm.y = 98;
    transformState.wm.brightness = 1.81;
  }
  
  applyTransformState();
  updateValueDisplays();
}

function checkAndUpdateEruditToggle() {
  if (isEruditFace()) {
    showEruditToggle();
    
    if (eruditStyleToggle) {
      if (eruditStyleApplied) {
        const isCurrentlyScholarStyle = transformState.face.scale === 1 && transformState.face.y === 0;
        const isCurrentlyDefaultStyle = transformState.face.scale === 2 && transformState.face.y === 136;
        
        if (isCurrentlyScholarStyle) {
          eruditStyleToggle.checked = true;
        } else if (isCurrentlyDefaultStyle) {
          eruditStyleToggle.checked = false;
        }
      } else {
        applyDefaultEruditStyle();
        return;
      }
    }
  } else {
    hideEruditToggle();
    eruditStyleApplied = false;
    
    transformState.face.scale = 1;
    transformState.face.y = 0;
    applyTransformState();
  }
}

transformScale?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].scale = +e.target.value;
  applyTransformState();
  updateValueDisplays();
  debounceAutoSave();
});
transformOffsetX?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].x = +e.target.value;
  applyTransformState();
  updateValueDisplays();
  debounceAutoSave();
});

transformOffsetY?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].y = +e.target.value;
  applyTransformState();
  updateValueDisplays();
  debounceAutoSave();
});

transformOpacity?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].opacity = +e.target.value;
  applyTransformState();
  updateValueDisplays();
  debounceAutoSave();
});

transformBrightness?.addEventListener('input', (e)=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target].brightness = +e.target.value;
  applyTransformState();
  updateValueDisplays();
  debounceAutoSave();
});
transformReset?.addEventListener('click', ()=>{
  const target = transformTargetSel?.value || 'bg';
  transformState[target] = { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 };
  if (transformScale) transformScale.value = '1';
  if (transformOffsetX) transformOffsetX.value = '0';
  if (transformOffsetY) transformOffsetY.value = '0';
  if (transformOpacity) transformOpacity.value = '1';
  if (transformBrightness) transformBrightness.value = '1';
  updateValueDisplays();
  applyTransformState();
});

// Erudit toggle event listener
eruditStyleToggle?.addEventListener('change', applyEruditStyle);

// Sync controls when target changes
transformTargetSel?.addEventListener('change', ()=>{
  const target = transformTargetSel.value || 'bg';
  const state = transformState[target];
  
  if (transformScale) transformScale.value = state.scale;
  if (transformOffsetX) transformOffsetX.value = state.x;
  if (transformOffsetY) transformOffsetY.value = state.y;
  if (transformOpacity) transformOpacity.value = state.opacity;
  if (transformBrightness) transformBrightness.value = state.brightness;
  updateValueDisplays();
});

// Save transform button
document.getElementById('saveTransform')?.addEventListener('click', () => {
  const target = transformTargetSel?.value || 'bg';
  const state = transformState[target];
  
  // Get current values from controls
  const currentState = {
    scale: parseFloat(transformScale?.value || 1),
    x: parseFloat(transformOffsetX?.value || 0),
    y: parseFloat(transformOffsetY?.value || 0),
    opacity: parseFloat(transformOpacity?.value || 1),
    brightness: parseFloat(transformBrightness?.value || 1)
  };
  
  // Update transform state
  transformState[target] = currentState;
  
  // Save to localStorage
  saveTransformToStorage();
  
  alert(`Transform values saved for ${target}!`);
});

// Auto-save debounce
let autoSaveTimeout = null;
function debounceAutoSave() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  autoSaveTimeout = setTimeout(() => {
    saveTransformToStorage();
  }, 1000); // Save 1 second after last change
}

// Transform storage functions
function saveTransformToStorage() {
  try {
    localStorage.setItem(TRANSFORM_STORAGE_KEY, JSON.stringify(transformState));
    console.log('Transform state saved to localStorage');
  } catch (error) {
    console.error('Error saving transform state:', error);
  }
}

function loadTransformFromStorage() {
  try {
    const saved = localStorage.getItem(TRANSFORM_STORAGE_KEY);
    if (saved) {
      const savedState = JSON.parse(saved);
      
      // Merge with current state (in case new properties were added)
      Object.keys(savedState).forEach(target => {
        if (transformState[target]) {
          transformState[target] = { ...transformState[target], ...savedState[target] };
        }
      });
      
      // Apply the loaded state
applyTransformState();
      
      
      console.log('Transform state loaded from localStorage');
    }
  } catch (error) {
    console.error('Error loading transform state:', error);
  }
}

applyTransformState();
updateValueDisplays();

// File Management
function fileToEl(input, imgEl) {
  const f = input.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  urls.push(url);
  imgEl.src = url;
}

function fileToTarget(file, imgEl) {
  if (!file || !file.type?.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  urls.push(url);
  imgEl.src = url;
}
bgInput.addEventListener("change",    () => fileToEl(bgInput, bgImg));
faceInput.addEventListener("change",  () => fileToEl(faceInput, faceImg));
wmInput.addEventListener("change",    () => fileToEl(wmInput, wmImg));
if (wm2Input && wm2Img) wm2Input.addEventListener("change", () => fileToEl(wm2Input, wm2Img));
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

// Initialize drop zones
document.querySelectorAll('.drop-zone').forEach(setupDropZone);

document.querySelectorAll('.drop-zone-clear').forEach(clearBtn => {
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering drop zone click
    const dropZone = clearBtn.closest('.drop-zone');
    const target = dropZone.dataset.target;
    clearDropZone(target);
  });
});


function clearDropZone(target) {
  const imgEl = document.getElementById(target);
  if (!imgEl) return;
  
  // Ne pas masquer: juste réinitialiser la source à vide et retirer tout état "is-empty"
  imgEl.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5ErkJggg==';
  imgEl.classList.remove('is-empty');
  
  // Update thumb usage markers
  updateThumbUsageMarkers();
  
  console.log('Cleared drop zone:', target);
}

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
      if (imgEl.id === 'faceImg') {
        checkAndUpdateEruditToggle();
      }
      return;
    }
    const url = dt?.getData("text/uri-list") || dt?.getData("text/plain");
    if (url) {
      imgEl.src = url;
      imgEl.classList.remove('is-empty');
      updateThumbUsageMarkers();
      syncComposerFromImageSrc(imgEl, url);
      if (imgEl.id === 'faceImg') {
        checkAndUpdateEruditToggle();
      }
    }
  };
  imgEl.addEventListener("dragenter", enter);
  imgEl.addEventListener("dragover",  over);
  imgEl.addEventListener("dragleave", leave);
  imgEl.addEventListener("drop",      drop);
}

[bgImg, faceImg, wmImg, wm2Img, frameImg].filter(Boolean).forEach(setupImageDropTarget);

function updateThumbUsageMarkers(){
  const thumbs = Array.from(document.querySelectorAll('.thumbs .thumb'));
  const clear = (cls) => thumbs.forEach(t => t.classList.remove(cls));
  clear('used-bg'); clear('used-face'); clear('used-wm'); clear('used-frame');

  const markFor = (imgEl, cls) => {
    const src = imgEl?.src || '';
    if (!src || src.startsWith('data:image')) return;
    const match = thumbs.find(t => t instanceof HTMLImageElement && t.src === src);
    if (match) match.classList.add(cls);
  };

  markFor(bgImg, 'used-bg');
  markFor(faceImg, 'used-face');
  markFor(wmImg, 'used-wm');
  if (wm2Img) markFor(wm2Img, 'used-wm');
  markFor(frameImg, 'used-frame');
  

  document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('has-bg','has-face','has-wm','has-wm2','has-frame'));
  const setZone = (id, cls, el) => {
    const zone = document.querySelector(`.drop-zone[data-target="${id}"]`);
    if (!zone) return;
    const hasImg = el && el.src && !el.src.startsWith('data:image');
    zone.classList.toggle(cls, !!hasImg);
  };
  setZone('bgImg','has-bg', bgImg);
  setZone('faceImg','has-face', faceImg);
  setZone('wmImg','has-wm', wmImg);
  if (wm2Img) setZone('wm2Img','has-wm2', wm2Img);
  setZone('frameImg','has-frame', frameImg);
  

}

// updateThumbUsageMarkers now called in main load event

// Réinitialise l'état visuel des zones de drop (ne touche pas aux images)
function resetDropZonesUI(){
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.classList.remove('has-bg','has-face','has-wm','has-wm2','has-frame');
  });
}

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
  
  if (cat === 'watermark') {
    ensureWmOverlay(meta.theme, meta.rarity);
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
  
  if (category === 'background' && rarity === 'mystic') {
    candidates.push(
      './assets/catalog/background/mystic/mystic1.jpg',
      './assets/catalog/background/mystic/mystic4.svg'
    );
    return candidates;
  }
  
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
        checkAndUpdateEruditToggle();
      } else if (category === 'watermark') {
        wmImg.src = url;
        wmImg.classList.remove('is-empty');
        wmImg.style.filter = `brightness(1.12) saturate(1.06) contrast(0.98)`;
          // Apply watermark styles based on type
          if (wmImg.src.includes('/erudit/')) {
            transformState.wm.y = 98;
            transformState.wm.brightness = 1.81;
            applyTransformState();
          } else if (wmImg.src.includes('/sphere/')) {
            transformState.wm.y = 0;
            transformState.wm.brightness = 1;
            applyTransformState();
          }
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

// document.getElementById('composer')?.addEventListener('click', (e) => {
//   const btn = (e.target instanceof HTMLElement) ? e.target.closest('button') : null;
//   if (!(btn instanceof HTMLButtonElement)) return;
//   const row = btn.closest('tr');
//   if (!row) return;
//   
//   if (btn.classList.contains('row-rand')) {
//     const themeSel = row.querySelector('select.theme');
//     const raritySel = row.querySelector('select.rarity');
//     const cat = row.dataset.cat;
//     
//     if (themeSel) {
//       const newTheme = (cat === 'background') ? pick(["1","2","3","4","5"]) : pick(THEMES);
//       themeSel.value = newTheme;
//     }
//     if (raritySel) {
//       const newRarity = pick(RARITIES);
//       raritySel.value = newRarity;
//     }
//     applyComposerRow(row);
//   }
// });

// document.querySelectorAll('.row-rand').forEach(btn => {
//   btn.addEventListener('click', (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const row = btn.closest('tr');
//     if (!row) return;
//     const themeSel = row.querySelector('select.theme');
//     const raritySel = row.querySelector('select.rarity');
//     const cat = row.dataset.cat;
//     if (themeSel) themeSel.value = (cat === 'background') ? pick(["1","2","3","4","5"]) : pick(THEMES);
//     if (raritySel) raritySel.value = pick(RARITIES);
//     applyComposerRow(row);
//   });
// });

// document.querySelectorAll('#composer select').forEach(select => {
//   select.addEventListener('change', (e) => {
//     const row = e.target.closest('tr');
//     if (row) {
//       applyComposerRow(row);
//     }
//   });
// });

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
    if (f && f.type?.startsWith('image/')) { 
      fileToTarget(f, targetEl); 
      targetEl.classList.remove('is-empty'); 
      updateThumbUsageMarkers(); 
      if (targetId === 'faceImg') {
        checkAndUpdateEruditToggle();
      }
      if (targetId === 'wm2Img') ensureShown('wm2');
      return; 
    }
    const url = dt?.getData('text/uri-list') || dt?.getData('text/plain');
    if (url) { 
      targetEl.src = url; 
      targetEl.classList.remove('is-empty'); 
      updateThumbUsageMarkers(); 
      if (targetId === 'faceImg') {
        checkAndUpdateEruditToggle();
      }
      if (targetId === 'wm2Img') ensureShown('wm2');
    } else if (category === 'watermark2') {
      if (!wm2Img) return;
      wm2Img.src = url;
      wm2Img.classList.remove('is-empty');
      wm2Img.style.filter = `brightness(1.12) saturate(1.06) contrast(0.98)`;
      if (wm2Img.src.includes('/erudit/')) {
        transformState.wm2.y = 98;
        transformState.wm2.brightness = 1.81;
        applyTransformState();
      } else if (wm2Img.src.includes('/sphere/')) {
        transformState.wm2.y = 0;
        transformState.wm2.brightness = 1;
        applyTransformState();
      }
      ensureShown('wm2');
    }
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
  if (wm2Img) wm2Img.classList.toggle("hidden",    !isTargetShown('wm2'));
  frameImg.classList.toggle("hidden", !isTargetShown('frame'));
  avatarPanel?.classList.remove("hidden");
  infoPanel?.classList.remove("hidden");
  if (!isTargetShown('wm')) wmImg.style.opacity = "0";
  if (wm2Img && !isTargetShown('wm2')) wm2Img.style.opacity = "0";
  if (wmOverlayImg) wmOverlayImg.classList.toggle("hidden", !isTargetShown('wm'));
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

// Randomization
function randomizeAll() {
  Object.keys(transformState).forEach(key => {
    transformState[key] = { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 };
  });
  
  eruditStyleApplied = false;
  applyTransformState();
  resetControlsToDefault();
  
  // Randomize each component
  const bgRarity = pick(RARITIES);
  const bgIdx = pick(BG_INDEXES);
  const bgCandidates = buildAssetPathCandidates('background', bgIdx, bgRarity);
  tryLoadRandomImage(bgCandidates, bgImg);
  
  const frameTheme = pick(THEMES);
  const frameRarity = pick(RARITIES);
  const frameCandidates = buildAssetPathCandidates('frame', frameTheme, frameRarity);
  tryLoadRandomImage(frameCandidates, frameImg);
  
  const faceTheme = pick(THEMES);
  const faceRarity = pick(RARITIES.filter(r => r !== 'mystic'));
  const faceCandidates = buildAssetPathCandidates('face', faceTheme, faceRarity);
  tryLoadRandomImage(faceCandidates, faceImg, () => {
    checkAndUpdateEruditToggle();
  });
  
  const wmTheme = pick(THEMES);
  const wmRarity = pick(RARITIES);
  const wmCandidates = buildAssetPathCandidates('watermark', wmTheme, wmRarity);
  tryLoadRandomImage(wmCandidates, wmImg, () => {
    if (wmImg.src.includes('/erudit/')) {
      transformState.wm.y = 98;
      transformState.wm.brightness = 1.81;
      applyTransformState();
    } else if (wmImg.src.includes('/sphere/')) {
      transformState.wm.y = 0;
      transformState.wm.brightness = 1;
      applyTransformState();
    }
  });

  // Laisser WM2 vide par défaut: ne pas randomizer wm2
  
  updateThumbUsageMarkers();
}

function tryLoadRandomImage(candidates, targetImg, onLoad = null) {
  const tryLoad = (idx) => {
    if (!candidates[idx]) return;
    
    const img = new Image();
    img.onload = () => {
      targetImg.src = candidates[idx];
      targetImg.classList.remove('is-empty');
      onLoad?.();
    };
    img.onerror = () => tryLoad(idx + 1);
    img.src = candidates[idx];
  };
  
  tryLoad(0);
}

// Event Listeners
document.getElementById('randomizeBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  randomizeAll();
});

document.addEventListener('click', (e) => {
  const btn = e.target instanceof HTMLElement ? e.target.closest('#randomizeBtn') : null;
  if (btn) {
    e.preventDefault();
    randomizeAll();
  }
});

// Favorites System

function getCurrentComposition() {
  return {
    bgSrc: bgImg.src,
    faceSrc: faceImg.src,
    wmSrc: wmImg.src,
    wm2Src: wm2Img?.src,
    frameSrc: frameImg.src,
    avatarSrc: avatarImg.src,
    timestamp: Date.now()
  };
}

function loadComposition(comp) {
  if (comp.bgSrc) bgImg.src = comp.bgSrc;
  if (comp.faceSrc) faceImg.src = comp.faceSrc;
  if (comp.wmSrc) wmImg.src = comp.wmSrc;
  if (comp.wm2Src && wm2Img) wm2Img.src = comp.wm2Src;
  if (comp.frameSrc) frameImg.src = comp.frameSrc;
  if (comp.avatarSrc) avatarImg.src = comp.avatarSrc;
  updateThumbUsageMarkers();
  checkAndUpdateEruditToggle();
  
    // Apply watermark styles based on type
    if (wmImg.src.includes('/erudit/')) {
      transformState.wm.y = 98;
      transformState.wm.brightness = 1.81;
      applyTransformState();
    } else if (wmImg.src.includes('/sphere/')) {
      transformState.wm.y = 0;
      transformState.wm.brightness = 1;
      applyTransformState();
    }
}

function getFavorites() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch(e) {
    console.error('Erreur lecture localStorage:', e);
    return {};
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch(e) {
    console.error('Erreur sauvegarde localStorage:', e);
  }
}

function saveComposition(name) {
  if (!name || !name.trim()) {
    alert('Veuillez entrer un nom pour la composition');
    return;
  }
  const favorites = getFavorites();
  favorites[name] = getCurrentComposition();
  saveFavorites(favorites);
  renderFavorites();
}

function deleteComposition(name) {
  if (!confirm(`Supprimer "${name}" ?`)) return;
  const favorites = getFavorites();
  delete favorites[name];
  saveFavorites(favorites);
  renderFavorites();
}

function renderFavorites() {
  const container = document.getElementById('favoritesList');
  if (!container) return;
  
  const favorites = getFavorites();
  const keys = Object.keys(favorites);
  
  if (keys.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:16px; color:rgba(255,255,255,.5); font-size:12px;">Aucune composition sauvegardée</div>';
    return;
  }
  
  container.innerHTML = '';
  keys.sort().forEach((name, index) => {
    const comp = favorites[name];
    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.style.cssText = 'display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:6px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);';
    
    const numberSpan = document.createElement('span');
    numberSpan.textContent = index + 1;
    numberSpan.style.cssText = 'font-size:11px; font-weight:600; color:#fff; min-width:20px;';
    
    const loadBtn = document.createElement('button');
    loadBtn.className = 'load-favorite';
    loadBtn.textContent = '👁';
    loadBtn.title = 'Load';
    loadBtn.style.cssText = 'padding:4px; background:rgba(78,161,255,.2); border:1px solid rgba(78,161,255,.4); color:#4ea1ff; border-radius:4px; cursor:pointer; font-size:12px;';
    loadBtn.onclick = () => loadComposition(comp);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-favorite';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete';
    deleteBtn.style.cssText = 'padding:4px; background:rgba(255,90,90,.2); border:1px solid rgba(255,90,90,.4); color:#ff5a5a; border-radius:4px; cursor:pointer; font-size:12px;';
    deleteBtn.onclick = () => deleteComposition(name);
    
    item.appendChild(numberSpan);
    item.appendChild(loadBtn);
    item.appendChild(deleteBtn);
    container.appendChild(item);
  });
}

function initializeSaveButton() {
  const saveBtn = document.getElementById('saveComposition');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const input = document.getElementById('compositionName');
      if (input) {
        saveComposition(input.value);
        input.value = '';
      }
    });
    console.log('Save button initialized');
  } else {
    console.error('Save button not found!');
  }
}



function applyFilter(filter) {
  const thumbs = document.querySelectorAll('#allThumbs .thumb');
  const activeRarityBtn = document.querySelector('.rarity-btn.active');
  const activeRarity = activeRarityBtn ? activeRarityBtn.dataset.rarity : 'all';
  
  console.log('Applying filter:', filter, 'with rarity:', activeRarity, 'to', thumbs.length, 'thumbs');
  
  let visibleCount = 0;
  thumbs.forEach(thumb => {
    if (thumb.classList.contains('thumb-empty')) {
      return;
    }
    
    const category = thumb.dataset.category;
    const rarity = thumb.dataset.rarity;
    
    const categoryMatch = filter === 'all' || category === filter;
    const rarityMatch = activeRarity === 'all' || rarity === activeRarity;
    
    if (categoryMatch && rarityMatch) {
      thumb.classList.remove('hidden');
      visibleCount++;
    } else {
      thumb.classList.add('hidden');
    }
  });
  
  console.log('Visible thumbs after filter:', visibleCount);
}


function applyRarityFilter(rarity) {
  const thumbs = document.querySelectorAll('#allThumbs .thumb');
  const activeFilterBtn = document.querySelector('.filter-btn.active');
  const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
  
  console.log('Applying rarity filter:', rarity, 'with category:', activeFilter, 'to', thumbs.length, 'thumbs');
  
  let visibleCount = 0;
  thumbs.forEach(thumb => {
    if (thumb.classList.contains('thumb-empty')) {
      return;
    }
    
    const category = thumb.dataset.category;
    const thumbRarity = thumb.dataset.rarity;
    
    const categoryMatch = activeFilter === 'all' || category === activeFilter;
    const rarityMatch = rarity === 'all' || thumbRarity === rarity;
    
    if (categoryMatch && rarityMatch) {
      thumb.classList.remove('hidden');
      visibleCount++;
    } else {
      thumb.classList.add('hidden');
    }
  });
  
  console.log('Visible thumbs after rarity filter:', visibleCount);
}

// Rarity Rotation System
let rarityIndex = 0;
const rarities = ['common', 'rare', 'epic', 'legendary', 'ancient', 'mystic'];

const scholarPresets = {
  common: {
    background: './assets/catalog/background/common/common4.svg',
    face: './assets/catalog/face/erudit/common.svg',
    frame: './assets/catalog/frame/erudit/common.svg',
    watermark: './assets/catalog/watermark/erudit/common.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 2, x: 0, y: 136, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 98, opacity: 1, brightness: 1.81 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  rare: {
    background: './assets/catalog/background/rare/rare4.svg',
    face: './assets/catalog/face/erudit/rare.svg',
    frame: './assets/catalog/frame/erudit/rare.svg',
    watermark: './assets/catalog/watermark/erudit/rare.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 2, x: 0, y: 136, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 98, opacity: 1, brightness: 1.81 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  epic: {
    background: './assets/catalog/background/epic/epic4.svg',
    face: './assets/catalog/face/erudit/epic.svg',
    frame: './assets/catalog/frame/erudit/epic.svg',
    watermark: './assets/catalog/watermark/erudit/epic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 2, x: 0, y: 136, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 98, opacity: 1, brightness: 1.81 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  legendary: {
    background: './assets/catalog/background/legendary/legendary4.svg',
    face: './assets/catalog/face/erudit/legendary.svg',
    frame: './assets/catalog/frame/erudit/legendary.svg',
    watermark: './assets/catalog/watermark/erudit/legendary.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 2, x: 0, y: 136, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 98, opacity: 1, brightness: 1.81 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  ancient: {
    background: './assets/catalog/background/ancient/ancient4.svg',
    face: './assets/catalog/face/erudit/ancient.svg',
    frame: './assets/catalog/frame/erudit/ancient.svg',
    watermark: './assets/catalog/watermark/erudit/ancient.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 2, x: 0, y: 136, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 98, opacity: 1, brightness: 1.81 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  mystic: {
    background: './assets/catalog/background/mystic/mystic4.svg',
    face: './assets/catalog/face/erudit/mystic.svg',
    frame: './assets/catalog/frame/erudit/mystic.svg',
    watermark: './assets/catalog/watermark/erudit/mystic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 2, x: 0, y: 136, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 98, opacity: 1, brightness: 1.81 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  }
};


const beePresets = {
  common: {
    background: './assets/catalog/background/common/common.svg',
    face: './assets/catalog/face/abeille/common.svg',
    frame: './assets/catalog/frame/abeille/common.svg',
    watermark: './assets/catalog/watermark/abeille/common.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 0.7, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  rare: {
    background: './assets/catalog/background/rare/rare.svg',
    face: './assets/catalog/face/abeille/rare.svg',
    frame: './assets/catalog/frame/abeille/rare.svg',
    watermark: './assets/catalog/watermark/abeille/rare.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 0.7, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  epic: {
    background: './assets/catalog/background/epic/epic.svg',
    face: './assets/catalog/face/abeille/epic.svg',
    frame: './assets/catalog/frame/abeille/epic.svg',
    watermark: './assets/catalog/watermark/abeille/epic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 0.7, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  legendary: {
    background: './assets/catalog/background/legendary/legendary.svg',
    face: './assets/catalog/face/abeille/legendary.svg',
    frame: './assets/catalog/frame/abeille/legendary.svg',
    watermark: './assets/catalog/watermark/abeille/legendary.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 0.7, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  ancient: {
    background: './assets/catalog/background/ancient/ancient.svg',
    face: './assets/catalog/face/abeille/ancient.svg',
    frame: './assets/catalog/frame/abeille/ancient.svg',
    watermark: './assets/catalog/watermark/abeille/ancient.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 0.7, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  mystic: {
    background: './assets/catalog/background/mystic/mystic1.jpg',
    face: './assets/catalog/face/abeille/mystic.svg',
    frame: './assets/catalog/frame/abeille/mystic.svg',
    watermark: './assets/catalog/watermark/abeille/mystic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 0.7, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  }
};

const spherePresets = {
  common: {
    background: './assets/catalog/background/common/common4.svg',
    face: './assets/catalog/face/sphere/common.svg',
    frame: './assets/catalog/frame/sphere/common.svg',
    watermark: './assets/catalog/watermark/sphere/common.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  rare: {
    background: './assets/catalog/background/rare/rare4.svg',
    face: './assets/catalog/face/sphere/rare.svg',
    frame: './assets/catalog/frame/sphere/rare.svg',
    watermark: './assets/catalog/watermark/sphere/rare.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  epic: {
    background: './assets/catalog/background/epic/epic4.svg',
    face: './assets/catalog/face/sphere/epic.svg',
    frame: './assets/catalog/frame/sphere/epic.svg',
    watermark: './assets/catalog/watermark/sphere/epic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  legendary: {
    background: './assets/catalog/background/legendary/legendary4.svg',
    face: './assets/catalog/face/sphere/legendary.svg',
    frame: './assets/catalog/frame/sphere/legendary.svg',
    watermark: './assets/catalog/watermark/sphere/legendary.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  ancient: {
    background: './assets/catalog/background/ancient/ancient4.svg',
    face: './assets/catalog/face/sphere/ancient.svg',
    frame: './assets/catalog/frame/sphere/ancient.svg',
    watermark: './assets/catalog/watermark/sphere/ancient.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  mystic: {
    background: './assets/catalog/background/mystic/mystic1.jpg',
    face: './assets/catalog/face/sphere/mystic.svg',
    frame: './assets/catalog/frame/sphere/mystic.svg',
    watermark: './assets/catalog/watermark/sphere/mystic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  }
};

const scholar2Presets = {
  common: {
    background: '', // No background
    face: './assets/catalog/watermark/sphere/common.svg', // sphere watermark as face
    frame: './assets/catalog/frame/sphere/common.svg', // sphere frame
    watermark: './assets/catalog/face/erudit/common.svg', // erudit face as watermark
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 150, opacity: 1, brightness: 1 }, // offset Y 150
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  rare: {
    background: '', // No background
    face: './assets/catalog/watermark/sphere/rare.svg',
    frame: './assets/catalog/frame/sphere/rare.svg',
    watermark: './assets/catalog/face/erudit/rare.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 150, opacity: 1, brightness: 1 }, // offset Y 150
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  epic: {
    background: '', // No background
    face: './assets/catalog/watermark/sphere/epic.svg',
    frame: './assets/catalog/frame/sphere/epic.svg',
    watermark: './assets/catalog/face/erudit/epic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 150, opacity: 1, brightness: 1 }, // offset Y 150
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  legendary: {
    background: '', // No background
    face: './assets/catalog/watermark/sphere/legendary.svg',
    frame: './assets/catalog/frame/sphere/legendary.svg',
    watermark: './assets/catalog/face/erudit/legendary.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 150, opacity: 1, brightness: 1 }, // offset Y 150
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  ancient: {
    background: '', // No background
    face: './assets/catalog/watermark/sphere/ancient.svg',
    frame: './assets/catalog/frame/sphere/ancient.svg',
    watermark: './assets/catalog/face/erudit/ancient.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 150, opacity: 1, brightness: 1 }, // offset Y 150
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  },
  mystic: {
    background: '', // No background
    face: './assets/catalog/watermark/sphere/mystic.svg',
    frame: './assets/catalog/frame/sphere/mystic.svg',
    watermark: './assets/catalog/face/erudit/mystic.svg',
    transforms: {
      bg: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      face: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 },
      wm: { scale: 1, x: 0, y: 150, opacity: 1, brightness: 1 }, // offset Y 150
      frame: { scale: 1, x: 0, y: 0, opacity: 1, brightness: 1 }
    }
  }
};

const presets = {
};

function initializePresets() {
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  console.log('Found preset buttons:', presetBtns.length);
  
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetName = btn.dataset.preset;
      console.log('Applying preset:', presetName);
      applyPreset(presetName);
    });
  });
}

function applyPreset(presetName) {
  if (presetName === 'scholar') {
    const currentRarity = rarities[rarityIndex];
    const preset = scholarPresets[currentRarity];
    
    if (!preset) {
      console.error('Scholar preset not found for rarity:', currentRarity);
      return;
    }

    // Apply each asset
    if (preset.background) {
      bgImg.src = preset.background;
    }
    if (preset.face) {
      faceImg.src = preset.face;
      faceImg.classList.remove('is-empty');
    }
    if (preset.frame) {
      frameImg.src = preset.frame;
    }
    if (preset.watermark) {
      wmImg.src = preset.watermark;
    }

    // Apply transforms if they exist
    if (preset.transforms) {
      Object.keys(preset.transforms).forEach(target => {
        if (transformState[target] && preset.transforms[target]) {
          transformState[target] = { ...preset.transforms[target] };
        }
      });
      applyTransformState();

      resetControlsToDefault();
    }

    // Update thumb usage markers
    updateThumbUsageMarkers();
    checkAndUpdateEruditToggle();

    // Move to next rarity for next click
    rarityIndex = (rarityIndex + 1) % rarities.length;
    
    // Update button description to show current rarity
    const scholarBtn = document.getElementById('scholarBtn');
    if (scholarBtn) {
      const descSpan = scholarBtn.querySelector('.preset-desc');
      if (descSpan) {
        descSpan.textContent = `Scholar (${currentRarity.charAt(0).toUpperCase() + currentRarity.slice(1)})`;
      }
    }

    console.log('Scholar preset applied:', currentRarity);
    return;
  }


  if (presetName === 'bee') {
    const currentRarity = rarities[rarityIndex];
    const preset = beePresets[currentRarity];
    
    if (!preset) {
      console.error('Bee preset not found for rarity:', currentRarity);
      return;
    }

    // Apply each asset
    if (preset.background) {
      bgImg.src = preset.background;
    }
    if (preset.face) {
      faceImg.src = preset.face;
      faceImg.classList.remove('is-empty');
    }
    if (preset.frame) {
      frameImg.src = preset.frame;
    }
    if (preset.watermark) {
      wmImg.src = preset.watermark;
    }

    // Apply transforms if they exist
    if (preset.transforms) {
      Object.keys(preset.transforms).forEach(target => {
        if (transformState[target] && preset.transforms[target]) {
          transformState[target] = { ...preset.transforms[target] };
        }
      });
      applyTransformState();

      resetControlsToDefault();
    }

    // Update thumb usage markers
    updateThumbUsageMarkers();
    checkAndUpdateEruditToggle();

    // Move to next rarity for next click
    rarityIndex = (rarityIndex + 1) % rarities.length;
    
    // Update button description to show current rarity
    const beeBtn = document.getElementById('beeBtn');
    if (beeBtn) {
      const descSpan = beeBtn.querySelector('.preset-desc');
      if (descSpan) {
        descSpan.textContent = `Bee (${currentRarity.charAt(0).toUpperCase() + currentRarity.slice(1)})`;
      }
    }

    console.log('Bee preset applied:', currentRarity);
    return;
  }

  if (presetName === 'sphere_alt') {
    const currentRarity = rarities[rarityIndex];
    const preset = spherePresets[currentRarity];
    
    if (!preset) {
      console.error('Sphere Alt preset not found for rarity:', currentRarity);
      return;
    }

    // Apply each asset
    if (preset.background) {
      bgImg.src = preset.background;
    }
    if (preset.face) {
      faceImg.src = preset.face;
      faceImg.classList.remove('is-empty');
    }
    if (preset.frame) {
      frameImg.src = preset.frame;
    }
    if (preset.watermark) {
      wmImg.src = preset.watermark;
    }

    // Apply transforms if they exist
    if (preset.transforms) {
      Object.keys(preset.transforms).forEach(target => {
        if (transformState[target] && preset.transforms[target]) {
          transformState[target] = { ...preset.transforms[target] };
        }
      });
      applyTransformState();

      resetControlsToDefault();
    }

    // Update thumb usage markers
    updateThumbUsageMarkers();
    checkAndUpdateEruditToggle();

    // Move to next rarity for next click
    rarityIndex = (rarityIndex + 1) % rarities.length;
    
    // Update button description to show current rarity
    const sphereAltBtn = document.getElementById('sphereAltBtn');
    if (sphereAltBtn) {
      const descSpan = sphereAltBtn.querySelector('.preset-desc');
      if (descSpan) {
        descSpan.textContent = `Sphere (${currentRarity.charAt(0).toUpperCase() + currentRarity.slice(1)})`;
      }
    }

    console.log('Sphere preset applied:', currentRarity);
    return;
  }

  if (presetName === 'scholar2') {
    const currentRarity = rarities[rarityIndex];
    const preset = scholar2Presets[currentRarity];
    
    if (!preset) {
      console.error('Scholar2 preset not found for rarity:', currentRarity);
      return;
    }

    // Apply each asset
    if (preset.background) {
      bgImg.src = preset.background;
    } else if (preset.background === '') {
      bgImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5CYII=';
    }
    if (preset.face) {
      faceImg.src = preset.face;
      faceImg.classList.remove('is-empty');
    }
    if (preset.frame) {
      frameImg.src = preset.frame;
    }
    if (preset.watermark) {
      wmImg.src = preset.watermark;
    }

    // Apply transforms if they exist
    if (preset.transforms) {
      Object.keys(preset.transforms).forEach(target => {
        if (transformState[target] && preset.transforms[target]) {
          transformState[target] = { ...preset.transforms[target] };
        }
      });
      applyTransformState();
    }

    // Always reset controls to default values after applying preset
    resetControlsToDefault();

    // Update button description
    const btn = document.getElementById('scholar2Btn');
    if (btn) {
      const desc = btn.querySelector('.preset-desc');
      if (desc) {
        desc.textContent = `Scholar2 ${currentRarity.charAt(0).toUpperCase() + currentRarity.slice(1)}`;
      }
    }

    // Cycle to next rarity
    rarityIndex = (rarityIndex + 1) % rarities.length;
    updateThumbUsageMarkers();
    checkAndUpdateEruditToggle();
    console.log('Scholar2 preset applied:', currentRarity);
    return;
  }

  const preset = presets[presetName];
  if (!preset) {
    console.error('Preset not found:', presetName);
    return;
  }

  // Apply each asset
  if (preset.background) {
    bgImg.src = preset.background;
  } else if (preset.background === '') {
    // Set to empty background
    bgImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5CYII=';
  }
  if (preset.face) {
    faceImg.src = preset.face;
    faceImg.classList.remove('is-empty');
  }
  if (preset.frame) {
    frameImg.src = preset.frame;
  }
  if (preset.watermark) {
    wmImg.src = preset.watermark;
  }

  // Apply transforms if they exist
  if (preset.transforms) {
    Object.keys(preset.transforms).forEach(target => {
      if (transformState[target] && preset.transforms[target]) {
        transformState[target] = { ...preset.transforms[target] };
      }
    });
    applyTransformState();

    // Always reset controls to default values after applying preset
    resetControlsToDefault();
  }

  // Update thumb usage markers
  updateThumbUsageMarkers();
  checkAndUpdateEruditToggle();

  console.log('Preset applied:', presetName);
}


