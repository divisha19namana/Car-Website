/**
 * NOCTIS — Scrollytelling Engine & Interactive System
 * Plain vanilla JavaScript, zero dependencies.
 */

(function () {
  'use strict';

  const config = window.NOCTIS_CONFIG;
  if (!config) {
    console.error('NOCTIS: config.js must be loaded before main.js');
    return;
  }

  // State Management
  const state = {
    isMobile: window.innerWidth < 768,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    heroLoadedFrames: new Map(), // index -> HTMLImageElement
    dismantleLoadedFrames: new Map(),
    heroCurrentFrame: 0,
    heroTargetFrame: 0,
    heroLastDrawn: -1,
    dismantleCurrentFrame: 0,
    dismantleTargetFrame: 0,
    dismantleLastDrawn: -1,
    activeLineupIndex: 0,
    lastScrollY: 0,
    navHidden: false,
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    cursor: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  };

  // Clamp helper
  const clamp = (val, min = 0, max = 1) => Math.min(Math.max(val, min), max);

  /* ==========================================================================
     1. PRELOADER & FRAME MANAGEMENT
     ========================================================================== */
  const preloaderEl = document.getElementById('preloader');
  const preloaderLine = document.getElementById('preloader-progress-line');
  const preloaderCounter = document.getElementById('preloader-counter');

  function getFrameUrl(type, index) {
    const isMob = state.isMobile;
    if (type === 'hero') {
      return isMob ? config.frames.hero.mobilePath(index) : config.frames.hero.desktopPath(index);
    } else {
      return isMob ? config.frames.dismantle.mobilePath(index) : config.frames.dismantle.desktopPath(index);
    }
  }

  function loadSingleFrame(type, index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = getFrameUrl(type, index);
      const cache = type === 'hero' ? state.heroLoadedFrames : state.dismantleLoadedFrames;

      img.decode()
        .then(() => {
          cache.set(index, img);
          resolve(img);
        })
        .catch(() => {
          // If decode fails or img completes via load
          img.onload = () => {
            cache.set(index, img);
            resolve(img);
          };
          img.onerror = () => {
            resolve(null);
          };
        });
    });
  }

  async function preloadHeroInitial() {
    const totalInitial = config.frames.hero.preloadInitial || 40;
    let loadedCount = 0;

    const initialPromises = [];
    for (let i = 1; i <= totalInitial; i++) {
      initialPromises.push(
        loadSingleFrame('hero', i).then(() => {
          loadedCount++;
          const percent = Math.round((loadedCount / totalInitial) * 100);
          if (preloaderLine) {
            preloaderLine.style.transform = `translateX(-50%) scaleX(${percent / 100})`;
          }
          if (preloaderCounter) {
            preloaderCounter.textContent = String(percent).padStart(3, '0');
          }
        })
      );
    }

    await Promise.all(initialPromises);

    // Initial load ready — reveal site with xenon flash
    if (preloaderLine) preloaderLine.classList.add('flash');
    setTimeout(() => {
      document.body.classList.remove('is-loading');
      // Draw first frames
      drawHeroCanvas(0);
      drawDismantleCanvas(0);

      // Continue background loading
      startBackgroundLoading();
    }, 200);
  }

  function startBackgroundLoading() {
    // 1. Load remaining hero frames in chunks
    const heroTotal = config.frames.hero.count;
    const initial = config.frames.hero.preloadInitial || 40;
    const dismantleTotal = config.frames.dismantle.count;

    async function loadRemainingHero() {
      for (let i = initial + 1; i <= heroTotal; i++) {
        if (!state.heroLoadedFrames.has(i)) {
          await loadSingleFrame('hero', i);
        }
      }
      loadAllDismantle();
    }

    async function loadAllDismantle() {
      for (let i = 1; i <= dismantleTotal; i++) {
        if (!state.dismantleLoadedFrames.has(i)) {
          await loadSingleFrame('dismantle', i);
        }
      }
    }

    // Schedule background queue with idle callback or timeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadRemainingHero(), { timeout: 1000 });
    } else {
      setTimeout(loadRemainingHero, 500);
    }
  }

  // Get nearest loaded frame if specific frame isn't yet in memory
  function getNearestFrame(type, targetIndex) {
    const cache = type === 'hero' ? state.heroLoadedFrames : state.dismantleLoadedFrames;
    const max = type === 'hero' ? config.frames.hero.count : config.frames.dismantle.count;
    if (cache.has(targetIndex)) {
      return cache.get(targetIndex);
    }
    // Search outwards for nearest loaded frame
    for (let offset = 1; offset < max; offset++) {
      if (targetIndex - offset >= 1 && cache.has(targetIndex - offset)) {
        return cache.get(targetIndex - offset);
      }
      if (targetIndex + offset <= max && cache.has(targetIndex + offset)) {
        return cache.get(targetIndex + offset);
      }
    }
    return null;
  }

  /* ==========================================================================
     2. FILM-GRAIN OVERLAY (Offscreen Noise Tile)
     ========================================================================== */
  function initFilmGrain() {
    const canvas = document.getElementById('film-grain');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create 128x128 noise pattern tile
    const tileSize = 128;
    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    const offCtx = offscreen.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const buf = imgData.data;

    for (let i = 0; i < buf.length; i += 4) {
      const val = Math.random() * 255;
      buf[i] = val;     // R
      buf[i + 1] = val; // G
      buf[i + 2] = val; // B
      buf[i + 3] = 255; // A
    }
    offCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain);
    resizeGrain();

    let pattern = ctx.createPattern(offscreen, 'repeat');

    // Shift noise randomly about 8 times per second (every ~125ms)
    let lastShift = 0;
    function grainLoop(now) {
      if (now - lastShift > 125) {
        lastShift = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const shiftX = Math.floor(Math.random() * tileSize);
        const shiftY = Math.floor(Math.random() * tileSize);
        ctx.save();
        ctx.translate(shiftX, shiftY);
        ctx.fillStyle = pattern;
        ctx.fillRect(-tileSize, -tileSize, canvas.width + tileSize * 2, canvas.height + tileSize * 2);
        ctx.restore();
      }
      requestAnimationFrame(grainLoop);
    }
    requestAnimationFrame(grainLoop);
  }

  /* ==========================================================================
     3. CUSTOM CURSOR ("The Headlight")
     ========================================================================== */
  const cursorEl = document.getElementById('custom-cursor');
  const cursorLabelEl = cursorEl ? cursorEl.querySelector('.cursor-label') : null;

  function initCustomCursor() {
    if (!cursorEl || !window.matchMedia('(pointer: fine)').matches || state.reducedMotion) {
      return;
    }

    window.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', () => {
      cursorEl.classList.add('is-pressed');
      setTimeout(() => cursorEl.classList.remove('is-pressed'), 120);
    });

    // Delegate hover states
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target) {
        cursorEl.classList.add('mode-bar');
        let label = target.getAttribute('data-cursor');
        if (!label) {
          if (target.classList.contains('lineup-slide')) {
            label = target.classList.contains('is-open') ? 'CONFIGURE' : 'OPEN';
          } else if (target.tagName === 'A' || target.tagName === 'BUTTON') {
            label = 'VIEW';
          }
        }
        if (cursorLabelEl) cursorLabelEl.textContent = label || '';
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target) {
        cursorEl.classList.remove('mode-bar');
        if (cursorLabelEl) cursorLabelEl.textContent = '';
      }
    });
  }

  function updateCursor() {
    if (!cursorEl || !window.matchMedia('(pointer: fine)').matches || state.reducedMotion) return;
    const lerp = config.scroll.cursorLerp || 0.18;
    state.cursor.x += (state.mouse.x - state.cursor.x) * lerp;
    state.cursor.y += (state.mouse.y - state.cursor.y) * lerp;
    cursorEl.style.transform = `translate3d(${state.cursor.x}px, ${state.cursor.y}px, 0)`;
  }

  /* ==========================================================================
     4. NAVIGATION BEHAVIOR
     ========================================================================== */
  const navEl = document.getElementById('site-nav');
  function initNav() {
    if (!navEl) return;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > state.lastScrollY) {
        // Scrolling down
        if (!state.navHidden) {
          navEl.classList.add('nav-hidden');
          state.navHidden = true;
        }
      } else {
        // Scrolling up
        if (state.navHidden) {
          navEl.classList.remove('nav-hidden');
          state.navHidden = false;
        }
      }
      state.lastScrollY = currentScrollY;
    }, { passive: true });
  }

  /* ==========================================================================
     5. CANVAS RENDERING ENGINE (Contain/Cover, DPR cap 2)
     ========================================================================== */
  const heroCanvas = document.getElementById('hero-canvas');
  const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
  const dismantleCanvas = document.getElementById('dismantle-canvas');
  const dismantleCtx = dismantleCanvas ? dismantleCanvas.getContext('2d') : null;

  function resizeCanvas(canvas, ctx) {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = Math.round(rect.width * dpr);
    const displayH = Math.round(rect.height * dpr);

    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
    }
  }

  function drawFrameToCanvas(canvas, ctx, img) {
    if (!canvas || !ctx || !img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    ctx.fillStyle = '#07080A'; // --asphalt
    ctx.fillRect(0, 0, cw, ch);

    const isLandscape = cw >= ch;

    if (isLandscape) {
      // Cover fit on landscape
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      // Contain fit on portrait, vertically centred, car never cropped
      const scale = Math.min(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  }

  function drawHeroCanvas(frameIndex) {
    const img = getNearestFrame('hero', frameIndex + 1);
    if (img && heroCanvas && heroCtx) {
      drawFrameToCanvas(heroCanvas, heroCtx, img);
      state.heroLastDrawn = frameIndex;
    }
  }

  function drawDismantleCanvas(frameIndex) {
    const img = getNearestFrame('dismantle', frameIndex + 1);
    if (img && dismantleCanvas && dismantleCtx) {
      drawFrameToCanvas(dismantleCanvas, dismantleCtx, img);
      state.dismantleLastDrawn = frameIndex;
    }
  }

  /* ==========================================================================
     6. SECTION 1: HERO SCROLLYTELLING & TELEMETRY
     ========================================================================== */
  const heroWrapper = document.getElementById('hero');
  const heroBlackout = document.getElementById('hero-blackout');
  const heroProgressFill = document.getElementById('hero-progress-fill');
  const hudChapterVal = document.getElementById('hud-chapter-val');
  const hudSpeedVal = document.getElementById('hud-speed-val');
  const hudDistanceVal = document.getElementById('hud-distance-val');
  const chapterEls = [
    document.getElementById('chapter-1'),
    document.getElementById('chapter-2'),
    document.getElementById('chapter-3'),
    document.getElementById('chapter-4'),
  ];

  function updateHero() {
    if (!heroWrapper) return;
    const rect = heroWrapper.getBoundingClientRect();
    const maxScroll = heroWrapper.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const progress = clamp(-rect.top / maxScroll, 0, 1);
    const heroCount = config.frames.hero.count;
    state.heroTargetFrame = Math.round(progress * (heroCount - 1));

    // Progress bar fill
    if (heroProgressFill) {
      heroProgressFill.style.width = `${progress * 100}%`;
    }

    // Telemetry HUD updates
    const speed = Math.round(progress * config.telemetry.maxSpeedKmH);
    const distance = (progress * config.telemetry.maxDistanceKm).toFixed(1);
    if (hudSpeedVal) hudSpeedVal.textContent = `${String(speed).padStart(3, '0')} KM/H`;
    if (hudDistanceVal) hudDistanceVal.textContent = `${distance} KM`;

    // Over last 5% of scroll (0.95 to 1.00), fade canvas to solid black
    if (heroBlackout) {
      if (progress >= 0.95) {
        const blackoutOpacity = (progress - 0.95) / 0.05;
        heroBlackout.style.opacity = blackoutOpacity.toFixed(3);
      } else {
        heroBlackout.style.opacity = '0';
      }
    }

    // Chapters activation & line-reveal
    let currentChapter = '01';
    config.heroChapters.forEach((ch, idx) => {
      const el = chapterEls[idx];
      if (!el) return;
      const inRange = progress >= ch.range[0] && progress <= ch.range[1];
      if (inRange) {
        currentChapter = ch.index;
        el.classList.add('active');
        const lines = el.querySelectorAll('.line-inner');
        lines.forEach((line) => line.classList.add('is-revealed'));
      } else {
        el.classList.remove('active');
        const lines = el.querySelectorAll('.line-inner');
        lines.forEach((line) => line.classList.remove('is-revealed'));
      }
    });

    if (hudChapterVal) {
      hudChapterVal.textContent = `${currentChapter} / 04`;
    }
  }

  /* ==========================================================================
     7. SECTION 2: STATEMENT WORD-BY-WORD SCROLL REVEAL
     ========================================================================== */
  const statementQuoteEl = document.getElementById('statement-quote');
  const statementSection = document.getElementById('statement');
  let statementWords = [];

  function initStatement() {
    if (!statementQuoteEl) return;
    const text = statementQuoteEl.textContent.trim();
    const words = text.split(/\s+/);
    statementQuoteEl.innerHTML = words
      .map((w) => `<span class="statement-word">${w}</span>`)
      .join(' ');
    statementWords = statementQuoteEl.querySelectorAll('.statement-word');
  }

  function updateStatement() {
    if (!statementSection || statementWords.length === 0) return;
    const rect = statementSection.getBoundingClientRect();
    const vh = window.innerHeight;
    // Progress through the section
    const start = vh * 0.85;
    const end = vh * 0.15;
    const progress = clamp((start - rect.top) / (start - end), 0, 1);

    const total = statementWords.length;
    statementWords.forEach((word, idx) => {
      const wordThreshold = idx / total;
      if (progress >= wordThreshold) {
        const opacity = clamp(0.15 + ((progress - wordThreshold) * total) * 0.85, 0.15, 1);
        word.style.opacity = opacity.toFixed(2);
      } else {
        word.style.opacity = '0.15';
      }
    });
  }

  /* ==========================================================================
     8. SECTION 3: DISMANTLE SCROLLYTELLING & CALLOUTS
     ========================================================================== */
  const dismantleWrapper = document.getElementById('dismantle');
  const dismantleProgressFill = document.getElementById('dismantle-progress-fill');
  const dismantleCalloutsContainer = document.getElementById('dismantle-callouts');

  function initDismantleCallouts() {
    if (!dismantleCalloutsContainer) return;
    dismantleCalloutsContainer.innerHTML = '';

    config.dismantleCallouts.forEach((callout) => {
      const item = document.createElement('div');
      item.className = 'callout-item';
      item.id = callout.id;

      // Small xenon dot on the part
      const dot = document.createElement('div');
      dot.className = 'callout-dot';
      dot.style.left = `${callout.dot.x}%`;
      dot.style.top = `${callout.dot.y}%`;

      // SVG Hairline
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'callout-svg');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'callout-line');
      line.setAttribute('x1', `${callout.dot.x}%`);
      line.setAttribute('y1', `${callout.dot.y}%`);
      line.setAttribute('x2', `${callout.lineEnd.x}%`);
      line.setAttribute('y2', `${callout.lineEnd.y}%`);
      svg.appendChild(line);

      // Text card
      const card = document.createElement('div');
      card.className = 'callout-card';
      card.style.left = `${callout.text.x}%`;
      card.style.top = `${callout.text.y}%`;
      if (callout.text.align === 'right') {
        card.style.textAlign = 'right';
        card.style.transform = 'translate(-100%, -50%)';
      } else {
        card.style.textAlign = 'left';
        card.style.transform = 'translate(0, -50%)';
      }

      card.innerHTML = `
        <span class="callout-label">${callout.label}</span>
        <span class="callout-desc">${callout.desc}</span>
      `;

      item.appendChild(dot);
      item.appendChild(svg);
      item.appendChild(card);
      dismantleCalloutsContainer.appendChild(item);
    });
  }

  function updateDismantle() {
    if (!dismantleWrapper) return;
    const rect = dismantleWrapper.getBoundingClientRect();
    const maxScroll = dismantleWrapper.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const progress = clamp(-rect.top / maxScroll, 0, 1);
    const dismantleCount = config.frames.dismantle.count;
    state.dismantleTargetFrame = Math.round(progress * (dismantleCount - 1));

    if (dismantleProgressFill) {
      dismantleProgressFill.style.width = `${progress * 100}%`;
    }

    // Callout sequentially revealed after 70% progress
    config.dismantleCallouts.forEach((callout) => {
      const el = document.getElementById(callout.id);
      if (!el) return;
      if (progress >= callout.triggerProgress) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     9. SECTION 4: LINEUP HOVER ACCORDION
     ========================================================================== */
  const lineupAccordionEl = document.getElementById('lineup-accordion');
  let hoverTimeout = null;

  function initLineup() {
    if (!lineupAccordionEl) return;
    lineupAccordionEl.innerHTML = '';

    config.lineup.forEach((car, index) => {
      const slide = document.createElement('button');
      slide.className = `lineup-slide ${index === 0 ? 'is-open just-opened' : ''}`;
      slide.setAttribute('role', 'tab');
      slide.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      slide.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('data-index', index);
      slide.setAttribute('data-cursor', index === 0 ? 'CONFIGURE' : 'OPEN');
      slide.id = `lineup-slide-${car.id}`;

      // Closed view: number, rotated model name
      const closedContent = `
        <div class="slide-closed-content" aria-hidden="true">
          <span class="slide-num">${car.num}</span>
          <span class="slide-name-rotated">${car.name}</span>
          <span class="slide-num">—</span>
        </div>
      `;

      // Car image layer
      const carImageWrap = `
        <div class="slide-car-wrap">
          <img src="${car.image}" alt="${car.alt}" class="slide-car-img" loading="lazy">
        </div>
      `;

      // Swatches HTML
      const swatchesHtml = car.swatches
        .map(
          (sw, swIdx) => `
          <button type="button" class="swatch-btn ${sw.active ? 'active' : ''}" 
                  style="background-color: ${sw.color}" 
                  title="${sw.name}" 
                  data-swatch-idx="${swIdx}"
                  aria-label="${car.name} ${sw.name}">
          </button>
        `
        )
        .join('');

      // Open view: model title, tagline, specs row, swatches, CTA
      const openContent = `
        <div class="slide-open-content">
          <div class="slide-open-header">
            <span class="section-mono-tag">${car.num} — SPECIFICATION</span>
            <h3 class="slide-model-title">${car.name}</h3>
          </div>
          <div class="slide-open-footer">
            <p class="slide-tagline">${car.tagline}</p>
            <div class="slide-specs-row">
              <div class="spec-cell">
                <span class="spec-label">RANGE</span>
                <span class="spec-val">${car.specs.range}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-label">0–100 KM/H</span>
                <span class="spec-val">${car.specs.accel}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-label">POWER</span>
                <span class="spec-val">${car.specs.power}</span>
              </div>
            </div>
            <div class="slide-actions">
              <div class="slide-swatches" role="group" aria-label="Available Colours">
                ${swatchesHtml}
              </div>
              <a href="#reserve" class="slide-cta" data-cursor="RESERVE">Configure →</a>
            </div>
          </div>
        </div>
      `;

      slide.innerHTML = closedContent + carImageWrap + openContent;
      lineupAccordionEl.appendChild(slide);

      // Event listeners: Debounced hover (80ms) for desktop
      slide.addEventListener('mouseenter', () => {
        if (state.isMobile) return;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          openLineupSlide(index);
        }, 80);
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
      });

      // Click / Tap for touch & keyboard
      slide.addEventListener('click', (e) => {
        const swatchBtn = e.target.closest('.swatch-btn');
        if (swatchBtn) {
          e.stopPropagation();
          const swatches = slide.querySelectorAll('.swatch-btn');
          swatches.forEach((s) => s.classList.remove('active'));
          swatchBtn.classList.add('active');
          return;
        }
        openLineupSlide(index);
      });

      // Keyboard navigation (Arrow Left / Right / Up / Down)
      slide.addEventListener('keydown', (e) => {
        const slides = lineupAccordionEl.querySelectorAll('.lineup-slide');
        let nextIndex = index;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextIndex = (index + 1) % slides.length;
          slides[nextIndex].focus();
          openLineupSlide(nextIndex);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          nextIndex = (index - 1 + slides.length) % slides.length;
          slides[nextIndex].focus();
          openLineupSlide(nextIndex);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLineupSlide(index);
        }
      });
    });

    // Staggered scroll entrance observer
    const lineupSection = document.getElementById('lineup');
    if (lineupSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const slides = lineupAccordionEl.querySelectorAll('.lineup-slide');
              slides.forEach((s, idx) => {
                setTimeout(() => s.classList.add('visible'), idx * 80);
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(lineupSection);
    } else {
      const slides = lineupAccordionEl.querySelectorAll('.lineup-slide');
      slides.forEach((s) => s.classList.add('visible'));
    }
  }

  function openLineupSlide(targetIndex) {
    if (state.activeLineupIndex === targetIndex) return;
    const slides = lineupAccordionEl.querySelectorAll('.lineup-slide');
    slides.forEach((slide, idx) => {
      const isOpen = idx === targetIndex;
      slide.classList.toggle('is-open', isOpen);
      slide.setAttribute('aria-selected', isOpen ? 'true' : 'false');
      slide.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      slide.setAttribute('data-cursor', isOpen ? 'CONFIGURE' : 'OPEN');
      if (isOpen) {
        slide.classList.add('just-opened');
        setTimeout(() => slide.classList.remove('just-opened'), 700);
      }
    });
    state.activeLineupIndex = targetIndex;
  }

  /* ==========================================================================
     10. MAIN ANIMATION LOOP (rAF 60fps)
     ========================================================================== */
  function mainLoop() {
    updateCursor();

    if (!state.reducedMotion) {
      // 1. Hero frame lerp & redraw
      const heroLerp = config.scroll.lerpFactor || 0.15;
      state.heroCurrentFrame += (state.heroTargetFrame - state.heroCurrentFrame) * heroLerp;
      const roundedHero = Math.round(state.heroCurrentFrame);
      if (roundedHero !== state.heroLastDrawn) {
        drawHeroCanvas(roundedHero);
      }

      // 2. Dismantle frame lerp & redraw
      state.dismantleCurrentFrame += (state.dismantleTargetFrame - state.dismantleCurrentFrame) * heroLerp;
      const roundedDismantle = Math.round(state.dismantleCurrentFrame);
      if (roundedDismantle !== state.dismantleLastDrawn) {
        drawDismantleCanvas(roundedDismantle);
      }
    }

    requestAnimationFrame(mainLoop);
  }

  /* ==========================================================================
     11. SCROLL & RESIZE LISTENERS
     ========================================================================== */
  function onScroll() {
    updateHero();
    updateStatement();
    updateDismantle();
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const isMob = window.innerWidth < 768;
      if (isMob !== state.isMobile) {
        state.isMobile = isMob;
        // Re-draw canvases with corresponding image sets
        drawHeroCanvas(state.heroLastDrawn >= 0 ? state.heroLastDrawn : 0);
        drawDismantleCanvas(state.dismantleLastDrawn >= 0 ? state.dismantleLastDrawn : 0);
      }
      resizeCanvas(heroCanvas, heroCtx);
      resizeCanvas(dismantleCanvas, dismantleCtx);
      drawHeroCanvas(state.heroLastDrawn >= 0 ? state.heroLastDrawn : 0);
      drawDismantleCanvas(state.dismantleLastDrawn >= 0 ? state.dismantleLastDrawn : 0);
    }, 150);
  }

  /* ==========================================================================
     12. INITIALIZATION
     ========================================================================== */
  function init() {
    initFilmGrain();
    initCustomCursor();
    initNav();
    initStatement();
    initDismantleCallouts();
    initLineup();

    // Set stage heights from config
    if (heroWrapper) {
      heroWrapper.style.height = `${config.scroll.heroHeightMultiplier * 100}vh`;
    }
    if (dismantleWrapper) {
      dismantleWrapper.style.height = `${config.scroll.dismantleHeightMultiplier * 100}vh`;
    }

    // Canvases initial sizing
    resizeCanvas(heroCanvas, heroCtx);
    resizeCanvas(dismantleCanvas, dismantleCtx);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Initial scroll sync
    onScroll();

    // Start rAF loop
    requestAnimationFrame(mainLoop);

    // Preload initial frames and reveal site
    preloadHeroInitial();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

