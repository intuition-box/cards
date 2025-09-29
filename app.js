const EMPTY_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9p1pOQAAAABJRU5ErkJggg==';
const card      = document.getElementById("card");
const bgImg     = document.getElementById("bgImg");
const faceImg   = document.getElementById("faceImg");
const wmImg     = document.getElementById("wmImg");
const frameImg  = document.getElementById("frameImg");
const glare     = document.querySelector(".glare");
const avatarImg = document.getElementById("avatarImg");
const avatarPanel = document.getElementById("avatarPanel");
const infoPanel   = document.getElementById("infoPanel");

const bgInput     = document.getElementById("bgInput");
const faceInput   = document.getElementById("faceInput");
const wmInput     = document.getElementById("wmInput");
const frameInput  = document.getElementById("frameInput");
const avatarInput = document.getElementById("avatarInput");

const blendSelect = document.getElementById("blend");
const forceInput  = document.getElementById("force");

const showBg     = document.getElementById("showBg");
const showFace   = document.getElementById("showFace");
const showWm     = document.getElementById("showWm");
const showFrame  = document.getElementById("showFrame");
const showAvatar = document.getElementById("showAvatar");
const showInfo   = document.getElementById("showInfo");

let damp = +forceInput.value;
const urls = [];

function setBlend(mode) {
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
  if (showWm.checked) {
    wmImg.style.opacity = (0.08 + mag * 0.75).toFixed(3);
  }

  const px = ((cx / rect.width) - 0.5) * -12;
  const py = ((cy / rect.height) - 0.5) * -12;
  wmImg.style.transform = `translate3d(${px}px, ${py}px, 0) scale(1.03)`;

  const angle = Math.atan2(cy - rect.height/2, cx - rect.width/2) * 180/Math.PI + 180;
  glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.40), rgba(255,255,255,0.00) 55%)`;
  glare.style.opacity = 0.25 + mag * 0.25;
}

function tiltLeave() {
  card.style.transform = "";
  if (showWm.checked) wmImg.style.opacity = "0";
  wmImg.style.transform = "translate3d(0,0,0) scale(1.02)";
  glare.style.opacity = "0";
}

card.addEventListener("mousemove", tiltFromEvent);
card.addEventListener("mouseleave", tiltLeave);
card.addEventListener("touchmove", tiltFromEvent, { passive: true });
card.addEventListener("touchend", tiltLeave);

blendSelect.addEventListener("change", (e) => setBlend(e.target.value));
forceInput.addEventListener("input", (e) => { damp = +e.target.value; });
setBlend(blendSelect.value);

document.addEventListener("dragover", (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; });
document.addEventListener("drop", (e) => { e.preventDefault(); });

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
    
    // Support tactile pour mobile
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
        // Créer un élément fantôme pour le drag
        const ghost = img.cloneNode(true);
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.opacity = '0.5';
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);
        
        // Simuler un dragstart
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
        
        // Nettoyer le fantôme après un délai
        setTimeout(() => document.body.removeChild(ghost), 100);
      }
    }, { passive: true });
    
    img.addEventListener("touchend", (e) => {
      if (!isDragging) {
        // Si pas de drag, traiter comme un clic
        const clickEvent = new MouseEvent('click', { bubbles: true });
        img.dispatchEvent(clickEvent);
      }
      touchStartX = touchStartY = null;
      isDragging = false;
    }, { passive: true });
  });
});

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
      return;
    }
    const url = dt?.getData("text/uri-list") || dt?.getData("text/plain");
    if (url) {
      imgEl.src = url;
      imgEl.classList.remove('is-empty');
      updateThumbUsageMarkers();
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

function updateVisibility() {
  bgImg.classList.toggle("hidden",    !showBg.checked);
  faceImg.classList.toggle("hidden",  !showFace.checked);
  wmImg.classList.toggle("hidden",    !showWm.checked);
  frameImg.classList.toggle("hidden", !showFrame.checked);
  avatarPanel.classList.toggle("hidden", !showAvatar.checked);
  infoPanel.classList.toggle("hidden",   !showInfo.checked);

  if (!showWm.checked) wmImg.style.opacity = "0";
}
[showBg, showFace, showWm, showFrame, showAvatar, showInfo].forEach(cb => {
  cb.addEventListener("change", updateVisibility);
});
updateVisibility();

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
