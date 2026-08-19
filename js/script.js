const mainBubble = document.querySelector("#mainParallax");
const secondaryBubble = document.querySelector("#secondaryParallax");
const dropBubble = document.querySelector("#dropParallax");

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
  }

  navToggle.addEventListener("click", () => {
    setMenu(!mainNav.classList.contains("is-open"));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 981) setMenu(false);
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

if (mainBubble && secondaryBubble && dropBubble && window.matchMedia("(pointer: fine)").matches) {
  render();
}

/* ============================================================
   CARRUSEL 3D HELICOIDAL — WEBGL (Three.js + Shaders GLSL)
   ============================================================ */
(() => {
  "use strict";

  const helixStage = document.getElementById("helixStage");
  const helixCanvas = document.getElementById("helixCanvas");
  const helixLoader = document.getElementById("helixLoader");
  const helixFsBtn = document.getElementById("helixFsBtn");
  const helixFsIconExpand = document.getElementById("helixFsIconExpand");
  const helixFsIconExit = document.getElementById("helixFsIconExit");
  const helixFsLabel = document.getElementById("helixFsLabel");

  if (!helixStage || !helixCanvas || !helixLoader || !window.THREE) return;

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- URLs de imágenes ---------- */
  const IMAGE_URLS = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=600&q=80"
  ];

  /* ---------- Configuración ---------- */
  const ATLAS = { slotW: 460, slotH: 380, gapPx: 84 };

  const CONFIG = {
    spiralTurns: 2.7,
    spiralRadius: 1.6,
    spiralHeight: 3.8,
    slotWorldW: 11.0,
    planeH: 4.0,
    widthSegments: 256,
    heightSegments: 96,
    cameraDistance: 12.5
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
    for (let i = 0; i < N; i++) {
      try {
        const img = await loadImage(urls[i]);
        drawCover(ctx, img, i * step, 0, ATLAS.slotW, ATLAS.slotH);
      } catch (err) {
        console.warn(err.message);
      }
      loaded++;
      if (onProgress) onProgress(loaded, N);
    }

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
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x06111d, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06111d, 0.022);

    camera = new THREE.PerspectiveCamera(
      50,
      helixStage.clientWidth / helixStage.clientHeight,
      0.1,
      1000
    );
    // Centrado absoluto: cámara alineada al eje Z puro, mirando al origen
    camera.position.set(0, 0, CONFIG.cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    window.addEventListener("resize", onResize);
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

    // Geometría procedural: doblar el plano a lo largo de una hélice
    for (let i = 0; i < positions.count; i++) {
      const x = orig[i * 3];
      const y = orig[i * 3 + 1];

      let t = (x + totalWidth / 2) / totalWidth;
      t = Math.max(0, Math.min(1, t));

      const angle = t * Math.PI * 2 * CONFIG.spiralTurns;
      const radius = CONFIG.spiralRadius * (1 - t * 0.12);

      const px = Math.sin(angle) * radius;
      const pz = Math.cos(angle) * radius;
      const py = (t - 0.5) * CONFIG.spiralHeight + y * 0.35;

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
          float margin = 0.05;
          if (localU < margin || localU > (1.0 - margin)) {
            discard;
          }

          // Remapear UV dentro del área segura para mostrar la imagen completa
          float remappedU = (localU - margin) / (1.0 - 2.0 * margin);
          float finalU = (cell + remappedU) / totalImages;

          vec4 color = texture2D(map, vec2(finalU, vUv.y));
          gl_FragColor = color;
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
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

  const clock = new THREE.Clock();

  function pxPerCard() {
    if (!PHYSICS.pxPerCard) {
      PHYSICS.pxPerCard = helixStage.clientWidth / 3.6;
    }
    return PHYSICS.pxPerCard;
  }

  function integratePhysics(dt) {
    dt = Math.min(dt, 0.05);

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
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      autoIdle = 0;
      velocity += dir * 3.2;
      phase += dir * 0.12;
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
    } else if (helixStage.requestFullscreen) {
      helixStage.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", updateFsUI);

  /* ---------- Resize + boot ---------- */
  function onResize() {
    const w = helixStage.clientWidth;
    const h = helixStage.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    PHYSICS.pxPerCard = null;
  }

  function boot() {
    // Solo iniciar cuando la sección de galería sea visible
    const gallerySection = document.getElementById("galeria");
    if (!gallerySection) {
      bootWebGL();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bootWebGL();
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    io.observe(gallerySection);
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
