const mainBubble = document.querySelector("#mainParallax");
const secondaryBubble = document.querySelector("#secondaryParallax");
const dropBubble = document.querySelector("#dropParallax");
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  document.querySelectorAll("svg").forEach((svg) => {
    if (typeof svg.pauseAnimations === "function") svg.pauseAnimations();
  });
}

const PARALLAX_INTENSITY = 0.5;
const PARALLAX_SMOOTHNESS = 0.025;

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

window.addEventListener("pointermove", (event) => {
  const normalizedX = event.clientX / window.innerWidth - 0.5;
  const normalizedY = event.clientY / window.innerHeight - 0.5;

  targetX = normalizedX * 180 * PARALLAX_INTENSITY;
  targetY = normalizedY * 130 * PARALLAX_INTENSITY;
});

document.documentElement.addEventListener("mouseleave", () => {
  targetX = 0;
  targetY = 0;
});

/* ============================================================
   MENÚ MÓVIL — TOGGLE HAMBURGUESA (Responsive)
   ============================================================ */
(function initMobileNav() {
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (!navToggle || !mainNav) return;

  function setMenu(open) {
    mainNav.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-active", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    if (open) {
      const firstLink = mainNav.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  }

  navToggle.addEventListener("click", () => {
    setMenu(!mainNav.classList.contains("is-open"));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("click", (e) => {
    if (mainNav.classList.contains("is-open") && !mainNav.contains(e.target) && !navToggle.contains(e.target)) {
      setMenu(false);
      navToggle.focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
      return;
    }

    if (e.key === "Tab" && mainNav.classList.contains("is-open")) {
      const links = [...mainNav.querySelectorAll("a")];
      const first = links[0];
      const last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        navToggle.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 981) setMenu(false);
  });
})();

/* ============================================================
   ISLAS DE GALERÍA Y ACCESIBILIDAD
   ============================================================ */
(function initDocks() {
  const galleryToggle = document.getElementById("galleryToggle");
  const galleryPanel = document.getElementById("galleryPanel");
  const galleryClose = document.getElementById("galleryClose");
  const accessibilityToggle = document.getElementById("accessibilityToggle");
  const accessibilityPanel = document.getElementById("accessibilityPanel");
  const readerToggle = document.getElementById("readerToggle");
  const contrastToggle = document.getElementById("contrastToggle");
  const darkToggle = document.getElementById("darkToggle");
  const reset = document.getElementById("accessibilityReset");
  if (!galleryToggle || !galleryPanel || !accessibilityToggle || !accessibilityPanel) return;

  const storageKey = "senda-explorer-accessibility";
  const defaults = { colorblind: "none", reader: false, contrast: false, dark: false };
  let settings = { ...defaults };
  try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; } catch (_) {}

  function setPanel(panel, toggle, open, focusSelector) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open && focusSelector) {
      const target = panel.querySelector(focusSelector);
      if (target) target.focus();
    }
  }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch (_) {}
  }

  function applySettings() {
    document.body.classList.remove(
      "theme-colorblind-protanopia",
      "theme-colorblind-deuteranopia",
      "theme-colorblind-tritanopia",
      "theme-high-contrast",
      "theme-dark"
    );
    if (settings.colorblind !== "none") document.body.classList.add(`theme-colorblind-${settings.colorblind}`);
    if (settings.contrast) document.body.classList.add("theme-high-contrast");
    if (settings.dark) document.body.classList.add("theme-dark");

    document.querySelectorAll("[data-colorblind]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.colorblind === settings.colorblind));
    });
    readerToggle.setAttribute("aria-pressed", String(settings.reader));
    readerToggle.textContent = settings.reader ? "Desactivar relator" : "Activar relator";
    contrastToggle.setAttribute("aria-pressed", String(settings.contrast));
    contrastToggle.textContent = settings.contrast ? "Desactivar alto contraste" : "Alto contraste";
    darkToggle.setAttribute("aria-pressed", String(settings.dark));
    darkToggle.textContent = settings.dark ? "Desactivar modo oscuro" : "Modo oscuro";
    persist();
  }

  function readPage() {
    if (!("speechSynthesis" in window)) {
      readerToggle.textContent = "Relator no disponible";
      return;
    }
    window.speechSynthesis.cancel();
    if (!settings.reader) return;
    const main = document.querySelector("main");
    const text = main ? [...main.querySelectorAll("h1, h2, h3, p, li")]
      .filter((element) => !element.closest(".sr-only, [hidden]"))
      .map((element) => element.textContent.trim()).filter(Boolean).join(". ") : "";
    if (text) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  galleryToggle.addEventListener("click", () => setPanel(galleryPanel, galleryToggle, galleryPanel.hidden, "button"));
  if (galleryClose) galleryClose.addEventListener("click", () => { setPanel(galleryPanel, galleryToggle, false); galleryToggle.focus(); });
  accessibilityToggle.addEventListener("click", () => setPanel(accessibilityPanel, accessibilityToggle, accessibilityPanel.hidden, "button"));

  document.querySelectorAll("[data-colorblind]").forEach((button) => {
    button.addEventListener("click", () => { settings.colorblind = button.dataset.colorblind; applySettings(); });
  });
  readerToggle.addEventListener("click", () => { settings.reader = !settings.reader; applySettings(); readPage(); });
  contrastToggle.addEventListener("click", () => { settings.contrast = !settings.contrast; applySettings(); });
  darkToggle.addEventListener("click", () => { settings.dark = !settings.dark; applySettings(); });
  reset.addEventListener("click", () => {
    settings = { ...defaults };
    applySettings();
    window.speechSynthesis?.cancel();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".gallery-dock") && !galleryPanel.hidden) setPanel(galleryPanel, galleryToggle, false);
    if (!event.target.closest(".accessibility-dock") && !accessibilityPanel.hidden) setPanel(accessibilityPanel, accessibilityToggle, false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!galleryPanel.hidden) { setPanel(galleryPanel, galleryToggle, false); galleryToggle.focus(); }
    if (!accessibilityPanel.hidden) { setPanel(accessibilityPanel, accessibilityToggle, false); accessibilityToggle.focus(); }
  });

  applySettings();
})();

/* ============================================================
   FORMULARIO — VALIDACIÓN Y ESTADOS ACCESIBLES
   ============================================================ */
(function initContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";

    const fields = [...form.querySelectorAll("input[required], textarea[required]")];
    let firstInvalid = null;
    let valid = true;

    fields.forEach((field) => {
      const error = document.getElementById(`${field.id}Error`);
      const message = field.validity.valueMissing
        ? "Este campo es obligatorio."
        : field.validity.typeMismatch
          ? "Escribe un correo válido."
          : "";
      field.setAttribute("aria-invalid", String(Boolean(message)));
      if (error) error.textContent = message;
      if (message && !firstInvalid) firstInvalid = field;
      valid = valid && !message;
    });

    if (!valid) {
      status.textContent = "Revisa los campos marcados antes de enviar la solicitud.";
      firstInvalid.focus();
      return;
    }

    status.textContent = "Solicitud recibida. Nuestro equipo se pondrá en contacto contigo.";
    form.reset();
    fields.forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
  });
})();

function render() {
  currentX += (targetX - currentX) * PARALLAX_SMOOTHNESS;
  currentY += (targetY - currentY) * PARALLAX_SMOOTHNESS;

  if (mainBubble) {
    mainBubble.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }

  if (secondaryBubble) {
    secondaryBubble.style.transform = `translate(${currentX * 1.55}px, ${currentY * 1.55}px)`;
  }

  if (dropBubble) {
    dropBubble.style.transform = `translate(${currentX * 2.15}px, ${currentY * 2.15}px)`;
  }

  requestAnimationFrame(render);
}

if (mainBubble && secondaryBubble && dropBubble && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  render();
}

/* ============================================================
   CARRUSEL 3D HELICOIDAL — WEBGL (Three.js + Shaders GLSL)
   ============================================================ */
(() => {
  "use strict";

  const helixStage = document.getElementById("helixStage");
  const helixWrap = document.getElementById("helixWrap");
  const helixCanvas = document.getElementById("helixCanvas");
  const helixLoader = document.getElementById("helixLoader");
  const helixFsBtn = document.getElementById("helixFsBtn");
  const helixFsIconExpand = document.getElementById("helixFsIconExpand");
  const helixFsIconExit = document.getElementById("helixFsIconExit");
  const helixFsLabel = document.getElementById("helixFsLabel");
  const helixPrev = document.getElementById("helixPrev");
  const helixPause = document.getElementById("helixPause");
  const helixNext = document.getElementById("helixNext");
  const helixAnnouncement = document.getElementById("helixAnnouncement");

  if (!helixStage || !helixWrap || !helixCanvas || !helixLoader) return;

  if (!window.THREE) {
    helixLoader.textContent = "Galería interactiva no disponible. Usa el formato accesible.";
    return;
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- URLs de imágenes ---------- */
  const IMAGE_URLS = [
    "https://redturisticadepueblospatrimonio.com.co/sites/default/files/styles/cms_bootstrap_12_12_square/public/glazed-cms-media/_dsc1371.jpg?itok=fKtda6-G&fid=1887",
    "https://travelgrafia.co/wp-content/uploads/2024/12/Barrios-del-centro-historico-de-Cartagena.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRofTlrhuCrsmXrbiXhGZyUW2mUf_h72QiJ7aPdGWcX6wgC3dxutuB0YExx&s=10",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb0We0OB1YD1PBvWw8w6PY7x1E1OQ7JZB79ORwB03QQbZKt3e6LnKSIjGx&s=10",
    "https://images.squarespace-cdn.com/content/v1/600ecc2f276d9d4dbba5f712/1692052225491-7AAEO1USHQHXIMT6AJQQ/Medellin_Colombia_SouthAmerica-15.JPG",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgDRb2bO5V3IgzEx4yy2TAqwcP1y3bcjiDRlytbs2bpm9MTYJ-96NqUyg&s=10",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85"
  ];

  /* ---------- Configuración ---------- */
  const ATLAS = { slotW: 460, slotH: 380, gapPx: 84 };

  const CONFIG = {
    radius: 8.0,
    arc: Math.PI * 0.6,
    slotWorldW: 2.2,
    planeH: 3.5,
    widthSegments: 220,
    heightSegments: 96,
    cameraDistance: 11.5,
    cameraFov: 42
  };

  const PHYSICS = {
    damping: 2.15,
    snapThreshold: 0.34,
    wheelFactor: 0.00045,
    pxPerCard: null,
    autoAdvanceSpeed: 2.5,
    autoAdvanceDelay: 4.5
  };

  let renderer, scene, camera, material, group;
  let slotCount = 1;

  /* ---------- Carga de imágenes ---------- */
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo cargar: " + url));
      img.src = url;
    });
  }

  function drawCover(ctx, img, dx, dy, dw, dh) {
    const imgRatio = img.width / img.height;
    const slotRatio = dw / dh;
    let sw, sh, sx, sy;
    if (imgRatio > slotRatio) {
      sh = img.height;
      sw = sh * slotRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / slotRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  async function createMasterTexture(urls, onProgress) {
    const N = urls.length;
    const step = ATLAS.slotW + ATLAS.gapPx;
    const totalSlots = N + 1; // duplicado de la primera imagen (scroll continuo)

    const canvas = document.createElement("canvas");
    canvas.width = totalSlots * step;
    canvas.height = ATLAS.slotH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let loaded = 0;
    let loadedImages = 0;
    for (let i = 0; i < N; i++) {
      try {
        const img = await loadImage(urls[i]);
        drawCover(ctx, img, i * step, 0, ATLAS.slotW, ATLAS.slotH);
        loadedImages++;
      } catch (err) {
        console.warn(err.message);
      }
      loaded++;
      if (onProgress) onProgress(loaded, N);
    }

    if (!loadedImages) throw new Error("No se pudo cargar ninguna imagen de la galería");

    if (loaded > 0) {
      try {
        const first = await loadImage(urls[0]);
        drawCover(ctx, first, N * step, 0, ATLAS.slotW, ATLAS.slotH);
      } catch (err) {
        console.warn("No se pudo duplicar la primera imagen:", err.message);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    return { texture, period: totalSlots };
  }

  /* ---------- Escena Three.js ---------- */
  function initScene() {
    renderer = new THREE.WebGLRenderer({
      canvas: helixCanvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      CONFIG.cameraFov,
      helixStage.clientWidth / helixStage.clientHeight,
      0.1,
      1000
    );
    // Centrado absoluto: cámara alineada al eje Z puro, mirando al origen
    camera.position.set(0, 0, CONFIG.cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    window.addEventListener("resize", onResize);
    if (window.ResizeObserver) {
      new ResizeObserver(onResize).observe(helixStage);
    }
  }

  function createHelix(texture, period) {
    slotCount = period;
    const totalWidth = CONFIG.slotWorldW * period;

    const geometry = new THREE.PlaneGeometry(
      totalWidth,
      CONFIG.planeH,
      CONFIG.widthSegments,
      CONFIG.heightSegments
    );

    const positions = geometry.attributes.position;
    const orig = positions.array.slice();

    // Banda curva horizontal: un solo arco evita que los extremos se cierren sobre la cámara.
    for (let i = 0; i < positions.count; i++) {
      const x = orig[i * 3];
      const y = orig[i * 3 + 1];

      let t = (x + totalWidth / 2) / totalWidth;
      t = Math.max(0, Math.min(1, t));

      const angle = (t - 0.5) * CONFIG.arc;
      const px = Math.sin(angle) * CONFIG.radius;
      const pz = Math.cos(angle) * CONFIG.radius - CONFIG.radius;
      const py = y;

      positions.setXYZ(i, px, py, pz);
    }

    geometry.computeVertexNormals();

    material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        gap: { value: 0.0 },
        offset: { value: 0.0 },
        totalImages: { value: period }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float gap;
        uniform float offset;
        uniform float totalImages;
        varying vec2 vUv;

        void main() {
          float u = fract(vUv.x + offset);

          // Cada celda del atlas contiene una imagen con margen de protección.
          // Evita que las imágenes se corten/empalmen en los bordes de la geometría.
          float cell = floor(u * totalImages);
          float localU = fract(u * totalImages);

          // Margen lateral del 5% por cada marco
          float margin = 0.04;
          if (localU < margin || localU > (1.0 - margin)) {
            discard;
          }

          // Remapear UV dentro del área segura para mostrar la imagen completa
          float remappedU = (localU - margin) / (1.0 - 2.0 * margin);
          float finalU = (cell + remappedU) / totalImages;

          vec4 color = texture2D(map, vec2(finalU, vUv.y));
          float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          gl_FragColor = vec4(color.rgb, color.a * edgeFade);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    group = new THREE.Group();
    group.add(mesh);
    // Sin rotación de grupo: geometría centrada en el origen del mundo
    group.rotation.set(0, 0, 0);
    scene.add(group);
  }

  /* ---------- Física: inercia, snap y autoavance ---------- */
  let phase = 0;
  let velocity = 0;
  let dragging = false;
  let downX = 0;
  let downPhase = 0;
  let downTime = 0;
  let lastMoveX = 0;
  let lastMoveTime = 0;
  let instantVel = 0;
  let autoIdle = 0;
  let dragTrail = [];
  let isPaused = prefersReducedMotion;

  const clock = new THREE.Clock();

  function pxPerCard() {
    if (!PHYSICS.pxPerCard) {
      PHYSICS.pxPerCard = helixStage.clientWidth / 3.6;
    }
    return PHYSICS.pxPerCard;
  }

  function integratePhysics(dt) {
    dt = Math.min(dt, 0.05);

    if (isPaused) {
      velocity = 0;
      return;
    }

    if (dragging) {
      velocity = 0;
      return;
    }

    // Decaimiento exponencial de la inercia
    velocity *= Math.exp(-PHYSICS.damping * dt);

    // Snap magnético hacia la imagen más cercana
    if (Math.abs(velocity) < PHYSICS.snapThreshold) {
      const target = Math.round(phase);
      const diff = target - phase;
      phase += diff * Math.min(1, dt * 14);
      if (Math.abs(diff) < 0.001) {
        phase = target;
        velocity = 0;
      }
    }

    phase += velocity * dt;

    // Auto-avance suave tras inactividad
    autoIdle += dt;
    if (!prefersReducedMotion && autoIdle > PHYSICS.autoAdvanceDelay) {
      phase += PHYSICS.autoAdvanceSpeed * dt;
    }

    // Normalizar la fase para evitar pérdida de precisión
    if (Math.abs(phase) > slotCount * 64) {
      phase = ((phase % slotCount) + slotCount) % slotCount;
    }
  }

  let camTargetX = 0;
  let camTargetY = 0;

  function renderScene(dt) {
    // A cada slot completo le corresponde 1/slotCount de offset
    material.uniforms.offset.value = phase / slotCount;

    // Parallax suave del cursor
    camera.position.x += (camTargetX - camera.position.x) * Math.min(1, dt * 3.2);
    camera.position.y += (camTargetY - camera.position.y) * Math.min(1, dt * 3.2);
    camera.fov = CONFIG.cameraFov;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function loop() {
    const dt = clock.getDelta();
    integratePhysics(dt);
    renderScene(dt);
    requestAnimationFrame(loop);
  }

  /* ---------- Interacción ---------- */
  helixCanvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    autoIdle = 0;
    dragTrail = [];
    velocity = 0;
    instantVel = 0;
    downX = e.clientX;
    downPhase = phase;
    downTime = performance.now();
    lastMoveX = e.clientX;
    lastMoveTime = downTime;
    dragTrail.push({ x: e.clientX, t: downTime });
    helixCanvas.classList.add("is-dragging");
    try { helixCanvas.setPointerCapture(e.pointerId); } catch (_) {}
  });

  helixCanvas.addEventListener("pointermove", (e) => {
    if (!dragging) {
      const rect = helixStage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      camTargetX = nx * 1.15;
      camTargetY = -ny * 0.8;
      return;
    }

    const now = performance.now();
    const dx = e.clientX - downX;
    phase = downPhase - dx / pxPerCard();

    const moveDelta = e.clientX - lastMoveX;
    const moveDt = Math.max(now - lastMoveTime, 1);
    instantVel = (moveDelta / pxPerCard()) / (moveDt / 1000);

    lastMoveX = e.clientX;
    lastMoveTime = now;
    dragTrail.push({ x: e.clientX, t: now });
    while (dragTrail.length > 4) dragTrail.shift();
  });

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    helixCanvas.classList.remove("is-dragging");

    if (dragTrail.length >= 2) {
      const first = dragTrail[0];
      const last = dragTrail[dragTrail.length - 1];
      const tSpan = (last.t - first.t) / 1000;
      if (tSpan > 0.001) {
        const xSpan = last.x - first.x;
        velocity = -(xSpan / pxPerCard()) / tSpan;
      } else {
        velocity = instantVel;
      }
    } else {
      velocity = instantVel;
    }
  }

  function moveBy(direction) {
    phase += direction;
    velocity = 0;
    autoIdle = 0;
    const imageNumber = ((Math.round(phase) % IMAGE_URLS.length) + IMAGE_URLS.length) % IMAGE_URLS.length + 1;
    if (helixAnnouncement) helixAnnouncement.textContent = `Imagen ${imageNumber} de ${IMAGE_URLS.length}`;
  }

  function updatePauseButton() {
    if (!helixPause) return;
    helixPause.textContent = isPaused ? "Reanudar movimiento" : "Pausar movimiento";
    helixPause.setAttribute("aria-pressed", String(isPaused));
  }

  updatePauseButton();
  if (helixPrev) helixPrev.addEventListener("click", () => moveBy(-1));
  if (helixNext) helixNext.addEventListener("click", () => moveBy(1));
  if (helixPause) {
    helixPause.addEventListener("click", () => {
      isPaused = !isPaused;
      autoIdle = 0;
      updatePauseButton();
    });
  }

  helixCanvas.addEventListener("pointerup", onPointerUp);
  helixCanvas.addEventListener("pointercancel", onPointerUp);

  helixStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      autoIdle = 0;
      velocity += e.deltaY * PHYSICS.wheelFactor;
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (document.activeElement !== helixCanvas) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      moveBy(dir);
      e.preventDefault();
    }
  });

  /* ---------- Pantalla completa ---------- */
  function updateFsUI() {
    const isFs = !!document.fullscreenElement;
    helixFsIconExpand.style.display = isFs ? "none" : "block";
    helixFsIconExit.style.display = isFs ? "block" : "none";
    helixFsLabel.textContent = isFs ? "Salir" : "Pantalla completa";
  }

  helixFsBtn.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (helixWrap.requestFullscreen) {
      helixWrap.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", updateFsUI);

  /* ---------- Resize + boot ---------- */
  function onResize() {
    const w = helixStage.clientWidth;
    const h = helixStage.clientHeight;
    camera.aspect = w / h;
    camera.fov = CONFIG.cameraFov;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    PHYSICS.pxPerCard = null;
  }

  function boot() {
    // Inicializar desde el primer render para que el canvas mida correctamente
    // aunque la página entre directamente con la sección de galería visible.
    bootWebGL();
  }

  let started = false;

  function bootWebGL() {
    if (started) return;
    started = true;

    try {
      initScene();
    } catch (err) {
      console.error(err);
      helixLoader.textContent = "WebGL no disponible";
      return;
    }

    createMasterTexture(IMAGE_URLS, (loaded, total) => {
      helixLoader.textContent =
        "Cargando galería… " + Math.round((loaded / total) * 100) + "%";
    })
      .then(({ texture, period }) => {
        createHelix(texture, period);
        helixLoader.classList.add("is-hidden");
        onResize();
        requestAnimationFrame(loop);
      })
      .catch((err) => {
        console.error(err);
        helixLoader.textContent = "No se pudo cargar la galería";
      });
  }

  boot();
})();
