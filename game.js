/* מלך הטוזים — מנוע המשחק
   קנבס אחד: רקע פוסטר, הדמות (גוף + ראש נפרד עם קפיץ), סימני מכות, כלים מונפשים, חלקיקים, טקסט קומיקס. */
(() => {
  'use strict';

  // ---------- נתוני הדמות (בקואורדינטות של התמונה 345x1058) ----------
  const HERO = {
    src: 'assets/hero.png',
    w: 345, h: 1058,
    head: { x: 108, y: 0, w: 142, h: 216 },   // מלבן הראש (כולל צוואר)
    headCut: { x0: 110, x1: 248, y: 198, fade: 10 }, // מה נמחק מהגוף
    headFade: { from: 198, to: 216 },
    neck: [178, 205],                           // ציר סיבוב הראש
    eyes: [[146, 108], [191, 105]],
    eyeW: 19,
    face: [168, 132],
    feet: [150, 1058],                          // ציר הנפילה/נטייה
  };
  const OS = 2;          // רזולוציית הקנבסים הפנימיים (חדות סימנים)
  const MAX_HP = 170;

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  const hudEl = document.querySelector('.hud');
  const toolbarEl = $('toolbar');
  const scoreEl = $('score'), scoreNum = $('scoreNum');
  const meterEl = $('meter'), meterFill = $('meterFill'), meterState = $('meterState'), meterPct = $('meterPct');

  // ---------- מצב ----------
  const state = {
    phase: 'intro',       // intro | play | ko | won
    hp: MAX_HP,
    hits: 0,
    startedAt: 0,
    koAt: 0,
    toolIdx: 0,
    usage: {},
    eyes: [0, 0],
    marks: [],
    bandages: 0,
    combo: 0,
    lastHitAt: 0,
  };

  // פיזיקת הדמות (קפיצים)
  const phys = {
    th: 0, thv: 0, thT: 0,      // נטיית גוף
    ph: 0, phv: 0, phT: 0,      // נטיית ראש
    sq: 1, sqv: 0, sqT: 1,      // מעיכה אנכית
    ox: 0, oxv: 0,              // החלקה אופקית
    oy: 0, oyv: 0, oyT: 0,      // שקיעה (נוקאאוט)
    hs: 1, hsv: 0,              // קנה מידה של הראש (פאנץ')
  };

  const attacks = [];
  const particles = [];
  const bursts = [];
  const flashes = [];
  let shake = 0;

  // ---------- פריסה ----------
  let W = 0, H = 0, dpr = 1;
  const layout = { Hc: 400, k: 1, feetX: 0, feetY: 0, top: 0, bottom: 0 };
  let bgCanvas = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    const hudB = hudEl.getBoundingClientRect().bottom;
    const tbT = toolbarEl.getBoundingClientRect().top;
    const top = hudB + 10;
    const bottom = tbT + 28;
    const avail = Math.max(200, bottom - top);
    layout.Hc = Math.min(avail, W * 2.6);
    layout.k = layout.Hc / HERO.h;
    layout.feetX = W / 2 + (HERO.w / 2 - HERO.feet[0]) * layout.k * 0.2;
    layout.feetY = bottom;
    layout.top = top;
    layout.bottom = bottom;
    buildBackground();
  }

  // ---------- רקע: פוסטר עם קרני שמש, זרקור ורצפה ----------
  function buildBackground() {
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    const g = bgCanvas.getContext('2d');
    g.scale(dpr, dpr);

    g.fillStyle = '#0e0b08';
    g.fillRect(0, 0, W, H);

    // קרניים מסביב לראש
    const cx = W / 2, cy = layout.top + layout.Hc * 0.12;
    const R = Math.hypot(W, H);
    const n = 28;
    g.fillStyle = '#17120d';
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
      g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
      g.closePath();
      g.fill();
    }

    // זרקור חם
    const sp = g.createRadialGradient(cx, cy + layout.Hc * 0.25, 10, cx, cy + layout.Hc * 0.25, Math.max(W, layout.Hc) * 0.75);
    sp.addColorStop(0, 'rgba(255, 208, 0, 0.20)');
    sp.addColorStop(0.45, 'rgba(255, 170, 0, 0.07)');
    sp.addColorStop(1, 'rgba(14, 11, 8, 0)');
    g.fillStyle = sp;
    g.fillRect(0, 0, W, H);

    // רצפה
    const fy = layout.feetY - layout.Hc * 0.02;
    const fl = g.createLinearGradient(0, fy, 0, H);
    fl.addColorStop(0, '#221b14');
    fl.addColorStop(1, '#0e0b08');
    g.fillStyle = fl;
    g.fillRect(0, fy, W, H - fy);
    g.fillStyle = 'rgba(255, 208, 0, 0.35)';
    g.fillRect(0, fy, W, 2);

    // רסטר (halftone) בפינות — תחושת דפוס זול של פוסטר קרבות
    g.fillStyle = 'rgba(255, 208, 0, 0.07)';
    const step = 11;
    for (let y = 0; y < fy; y += step) {
      for (let x = 0; x < W; x += step) {
        const dx = Math.abs(x - cx) / (W / 2);
        const r = Math.max(0, dx - 0.55) * 4.2;
        if (r > 0.3) {
          g.beginPath();
          g.arc(x + ((y / step) % 2) * step / 2, y, Math.min(r, 3.6), 0, Math.PI * 2);
          g.fill();
        }
      }
    }

    // וינייטה
    const vg = g.createRadialGradient(cx, H * 0.5, Math.min(W, H) * 0.3, cx, H * 0.5, R * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
  }

  // ---------- הכנת הדמות ----------
  const heroImg = new Image();
  let heroData = null;          // RGBA בגודל התמונה המקורי
  let bodyBase, headBase, bodyOut, headOut, bodyLayer, headLayer;

  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.round(w * OS);
    c.height = Math.round(h * OS);
    return c;
  }

  function prepareHero() {
    // נתוני פיקסלים לבדיקת פגיעה ובהירות
    const probe = document.createElement('canvas');
    probe.width = HERO.w; probe.height = HERO.h;
    const pg = probe.getContext('2d', { willReadFrequently: true });
    pg.drawImage(heroImg, 0, 0);
    heroData = pg.getImageData(0, 0, HERO.w, HERO.h).data;

    // גוף בלי ראש
    bodyBase = mkCanvas(HERO.w, HERO.h);
    let g = bodyBase.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(heroImg, 0, 0, bodyBase.width, bodyBase.height);
    g.globalCompositeOperation = 'destination-out';
    g.scale(OS, OS);
    const hc = HERO.headCut;
    g.fillStyle = '#000';
    g.fillRect(hc.x0, 0, hc.x1 - hc.x0, hc.y);
    const eg = g.createLinearGradient(0, hc.y, 0, hc.y + hc.fade);
    eg.addColorStop(0, 'rgba(0,0,0,1)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg;
    g.fillRect(hc.x0 + 6, hc.y, hc.x1 - hc.x0 - 12, hc.fade);

    // הראש לבד, עם דהייה בתחתית הצוואר
    const hd = HERO.head;
    headBase = mkCanvas(hd.w, hd.h);
    g = headBase.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(heroImg, hd.x, hd.y, hd.w, hd.h, 0, 0, headBase.width, headBase.height);
    g.globalCompositeOperation = 'destination-out';
    g.scale(OS, OS);
    const fg = g.createLinearGradient(0, HERO.headFade.from - hd.y, 0, HERO.headFade.to - hd.y);
    fg.addColorStop(0, 'rgba(0,0,0,0)');
    fg.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fg;
    g.fillRect(0, HERO.headFade.from - hd.y, hd.w, hd.h);

    bodyOut = mkCanvas(HERO.w, HERO.h);
    headOut = mkCanvas(hd.w, hd.h);
    bodyLayer = mkCanvas(HERO.w, HERO.h);
    headLayer = mkCanvas(hd.w, hd.h);
    composePart('body');
    composePart('head');
  }

  function alphaAt(x, y) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= HERO.w || y >= HERO.h) return 0;
    return heroData[(y * HERO.w + x) * 4 + 3];
  }
  function lumAt(x, y) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= HERO.w || y >= HERO.h) return 0;
    const i = (y * HERO.w + x) * 4;
    return 0.299 * heroData[i] + 0.587 * heroData[i + 1] + 0.114 * heroData[i + 2];
  }
  function onHero(x, y, r = 9) {
    if (alphaAt(x, y) > 60) return true;
    for (let a = 0; a < 6.28; a += 1.05) if (alphaAt(x + Math.cos(a) * r, y + Math.sin(a) * r) > 60) return true;
    return false;
  }
  function headTopAt(x) {
    for (let y = 0; y < 120; y++) if (alphaAt(x, y) > 120) return y;
    return 20;
  }

  // ---------- סימני מכות ----------
  // שכבה "multiply" (חבורות, פנסים, סימני יד) נחתכת לפי צללית הדמות;
  // שכבה "normal" (ביצה, סוליה, קרעים) גם נחתכת; "over" (נפיחות, פלסטרים) נצבעים מעל.
  function composePart(part) {
    const isHead = part === 'head';
    const base = isHead ? headBase : bodyBase;
    const out = isHead ? headOut : bodyOut;
    const layer = isHead ? headLayer : bodyLayer;
    const ox = isHead ? HERO.head.x : 0, oy = isHead ? HERO.head.y : 0;
    const marks = state.marks.filter((m) => m.part === part);

    const o = out.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalCompositeOperation = 'source-over';
    o.clearRect(0, 0, out.width, out.height);
    o.drawImage(base, 0, 0);

    const l = layer.getContext('2d');
    const pass = (kind) => {
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, layer.width, layer.height);
      l.setTransform(OS, 0, 0, OS, -ox * OS, -oy * OS);
      let any = false;
      if (kind === 'multiply' && isHead) any = drawEyes(l) || any;
      for (const m of marks) if (MARK[m.type] && MARK[m.type].layer === kind) { MARK[m.type].draw(l, m); any = true; }
      if (!any) return;
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalCompositeOperation = 'destination-in';
      l.drawImage(base, 0, 0);
      o.globalCompositeOperation = kind === 'multiply' ? 'multiply' : 'source-over';
      o.drawImage(layer, 0, 0);
    };
    pass('multiply');
    pass('normal');

    o.globalCompositeOperation = 'source-over';
    o.setTransform(OS, 0, 0, OS, -ox * OS, -oy * OS);
    if (isHead) drawEyeShine(o);
    for (const m of marks) if (MARK[m.type] && MARK[m.type].layer === 'over') MARK[m.type].draw(o, m);
    o.setTransform(1, 0, 0, 1, 0, 0);
  }

  function blob(g, x, y, rx, ry, rot, stops) {
    g.save();
    g.translate(x, y);
    g.rotate(rot || 0);
    g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    for (const [p, c] of stops) gr.addColorStop(p, c);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, rx, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // פנסים בעיניים — מתעצמים עם כל מכה
  function drawEyes(g) {
    let any = false;
    HERO.eyes.forEach(([x, y], i) => {
      const v = state.eyes[i];
      if (v <= 0.02) return;
      any = true;
      const w = HERO.eyeW;
      // הילה צהבהבה־ירקרקה של חבורה ישנה
      blob(g, x, y + 3, w * (1.55 + v * 0.35), w * (1.25 + v * 0.3), 0, [
        [0, `rgba(150, 120, 40, ${0.0})`],
        [0.55, `rgba(150, 130, 40, ${0.28 * v})`],
        [1, 'rgba(150, 130, 40, 0)'],
      ]);
      // הפנס עצמו
      blob(g, x, y + 2, w * (1.05 + v * 0.35), w * (0.78 + v * 0.3), i ? 0.12 : -0.12, [
        [0, `rgba(40, 8, 45, ${0.95 * v})`],
        [0.45, `rgba(70, 15, 70, ${0.85 * v})`],
        [0.8, `rgba(110, 35, 80, ${0.45 * v})`],
        [1, 'rgba(120, 40, 80, 0)'],
      ]);
      // אדמומיות בעפעף התחתון
      blob(g, x, y + w * 0.75, w * 0.9, w * 0.35, 0, [
        [0, `rgba(170, 30, 50, ${0.5 * v})`],
        [1, 'rgba(170, 30, 50, 0)'],
      ]);
    });
    return any;
  }
  // נפיחות מבריקה מעל פנס חזק
  function drawEyeShine(g) {
    HERO.eyes.forEach(([x, y], i) => {
      const v = state.eyes[i];
      if (v < 0.6) return;
      const w = HERO.eyeW;
      blob(g, x + (i ? 2 : -2), y - w * 0.35, w * 0.85, w * 0.32, 0, [
        [0, `rgba(255, 220, 255, ${0.22 * (v - 0.5)})`],
        [1, 'rgba(255, 220, 255, 0)'],
      ]);
    });
  }

  const MARK = {
    bruise: {
      layer: 'multiply',
      draw(g, m) {
        blob(g, m.x, m.y, m.r * 1.35, m.r * 1.05, m.rot, [
          [0, `rgba(85, 12, 60, ${0.85 * m.a})`],
          [0.45, `rgba(120, 30, 75, ${0.6 * m.a})`],
          [0.78, `rgba(160, 110, 50, ${0.22 * m.a})`],
          [1, 'rgba(160, 110, 50, 0)'],
        ]);
      },
    },
    red: {
      layer: 'multiply',
      draw(g, m) {
        blob(g, m.x, m.y, m.r * 1.4, m.r, m.rot, [
          [0, `rgba(235, 50, 50, ${0.6 * m.a})`],
          [1, 'rgba(235, 50, 50, 0)'],
        ]);
      },
    },
    hand: {
      layer: 'multiply',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.rotate(m.rot);
        g.scale(m.s, m.s);
        g.lineCap = 'round';
        for (const [w, a] of [[10, 0.22], [6, 0.35]]) {
          g.strokeStyle = `rgba(225, 35, 40, ${a})`;
          g.lineWidth = w;
          for (let i = 0; i < 4; i++) {
            const fx = -12 + i * 8;
            g.beginPath();
            g.moveTo(fx * 0.8, 6);
            g.lineTo(fx, -20 - (i === 1 || i === 2 ? 5 : 0));
            g.stroke();
          }
          g.beginPath(); g.moveTo(-14, 12); g.lineTo(-24, 0); g.stroke();
        }
        blob(g, -2, 12, 15, 11, 0, [[0, 'rgba(225,35,40,.5)'], [1, 'rgba(225,35,40,0)']]);
        g.restore();
      },
    },
    flip: {
      layer: 'multiply',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.rotate(m.rot);
        g.scale(m.s, m.s);
        g.strokeStyle = 'rgba(225, 40, 45, .55)';
        g.lineWidth = 5;
        g.beginPath();
        g.ellipse(0, 0, 11, 26, 0, 0, Math.PI * 2);
        g.stroke();
        blob(g, 0, 0, 12, 25, 0, [[0, 'rgba(225,40,45,.35)'], [1, 'rgba(225,40,45,.05)']]);
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(-10, 4); g.lineTo(0, -12); g.lineTo(10, 4); g.stroke();
        g.restore();
      },
    },
    print: {
      layer: 'normal',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.rotate(m.rot);
        g.scale(m.s, m.s);
        g.fillStyle = 'rgba(214, 204, 184, .5)';
        g.beginPath();
        g.ellipse(0, -12, 12, 17, 0, 0, Math.PI * 2);
        g.ellipse(0, 18, 9, 11, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(14, 11, 8, .55)';
        g.lineWidth = 2;
        for (let y = -24; y < 28; y += 6) {
          if (y > 3 && y < 8) continue;
          g.beginPath(); g.moveTo(-10, y); g.lineTo(10, y + 2); g.stroke();
        }
        g.restore();
      },
    },
    egg: {
      layer: 'normal',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.scale(m.s, m.s);
        g.fillStyle = 'rgba(255, 252, 238, .88)';
        g.beginPath();
        const pts = m.pts;
        g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i <= pts.length; i++) {
          const p = pts[i % pts.length], q = pts[(i - 1) % pts.length];
          g.quadraticCurveTo(q[0] * 1.25, q[1] * 1.25, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        }
        g.fill();
        // טפטופים
        for (const d of m.drips) {
          g.fillRect(d[0] - 2.5, 0, 5, d[1]);
          g.beginPath(); g.arc(d[0], d[1], 3.4, 0, Math.PI * 2); g.fill();
        }
        blob(g, 2, 1, 9, 8, 0, [[0, '#ffc21a'], [0.8, '#f2a200'], [1, 'rgba(242,162,0,0)']]);
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.beginPath(); g.arc(-1, -3, 2.4, 0, Math.PI * 2); g.fill();
        g.restore();
      },
    },
    scratch: {
      layer: 'multiply',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.rotate(m.rot);
        g.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          g.strokeStyle = 'rgba(150, 10, 25, .75)';
          g.lineWidth = 1.8;
          g.beginPath();
          g.moveTo(-16, i * 5);
          for (let x = -16; x <= 16; x += 4) g.lineTo(x, i * 5 + (x % 8 ? 1.2 : -1.2));
          g.stroke();
        }
        g.restore();
      },
    },
    tear: {
      layer: 'normal',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.rotate(m.rot);
        g.fillStyle = 'rgba(234, 176, 137, .95)'; // עור מציץ מבעד לחולצה
        g.beginPath();
        g.moveTo(-16, 0);
        for (let x = -16; x <= 16; x += 4) g.lineTo(x, (x / 4) % 2 ? -4 : -1);
        for (let x = 16; x >= -16; x -= 4) g.lineTo(x, (x / 4) % 2 ? 4 : 1);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(210, 200, 185, .7)';
        g.lineWidth = 1.2;
        g.stroke();
        g.restore();
      },
    },
    bump: {
      layer: 'over',
      draw(g, m) {
        const r = m.r;
        g.save();
        g.translate(m.x, m.y);
        blob(g, 0, 0, r, r * 0.8, 0, [
          [0, '#f0b896'], [0.55, '#d98e70'], [0.85, '#b8664f'], [1, 'rgba(160, 80, 60, 0)'],
        ]);
        blob(g, 0, r * 0.1, r * 0.55, r * 0.4, 0, [[0, 'rgba(220, 40, 50, .45)'], [1, 'rgba(220,40,50,0)']]);
        blob(g, -r * 0.3, -r * 0.35, r * 0.28, r * 0.16, -0.4, [[0, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']]);
        g.restore();
      },
    },
    bandage: {
      layer: 'over',
      draw(g, m) {
        g.save();
        g.translate(m.x, m.y);
        g.rotate(m.rot);
        const strip = (a) => {
          g.save();
          g.rotate(a);
          g.fillStyle = '#e8bf92';
          g.strokeStyle = 'rgba(120, 80, 40, .55)';
          g.lineWidth = 1;
          roundRect(g, -22, -6, 44, 12, 5);
          g.fill(); g.stroke();
          g.fillStyle = '#d7a877';
          roundRect(g, -7, -5, 14, 10, 2);
          g.fill();
          g.fillStyle = 'rgba(120, 80, 40, .4)';
          for (const x of [-17, -13, 13, 17]) for (const y of [-2.5, 2.5]) { g.beginPath(); g.arc(x, y, 0.9, 0, 6.3); g.fill(); }
          g.restore();
        };
        strip(0.6);
        strip(-0.6);
        g.restore();
      },
    },
  };

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function addMark(m) {
    state.marks.push(m);
    // תקרה כדי שלא יהפוך לכתם אחד גדול (פלסטרים ונפיחויות נשארים)
    const soft = state.marks.filter((x) => x.type !== 'bandage' && x.type !== 'bump');
    if (soft.length > 46) state.marks.splice(state.marks.indexOf(soft[0]), 1);
  }

  // ---------- מטריצות ----------
  function bodyMatrix() {
    const L = layout;
    return new DOMMatrix()
      .translate(L.feetX + phys.ox, L.feetY + phys.oy)
      .rotate(phys.th * 57.2958)
      .scale(L.k * (2 - phys.sq) * 0.5 + L.k * 0.5, L.k * phys.sq)
      .translate(-HERO.feet[0], -HERO.feet[1]);
  }
  function headMatrix(bm) {
    const [nx, ny] = HERO.neck;
    return bm.translate(nx, ny).rotate(phys.ph * 57.2958).scale(phys.hs, phys.hs).translate(-nx, -ny);
  }

  // ---------- סאונד (סינתזה, בלי קבצים) ----------
  const Sound = (() => {
    let ac = null, master = null, noiseBuf = null;
    let muted = false;
    try { muted = localStorage.getItem('tooz-muted') === '1'; } catch (e) {}

    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.8;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    function env(g, t, a, peak, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    function tone(type, f0, f1, dur, peak, delay = 0) {
      if (!ac) return;
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(g, t, 0.004, peak, dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function noise(ftype, f0, f1, q, dur, peak, delay = 0) {
      if (!ac) return;
      const t = ac.currentTime + delay;
      const s = ac.createBufferSource(); s.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = ftype; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ac.createGain();
      env(g, t, 0.003, peak, dur);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }
    function grunt() {
      if (!ac) return;
      const t = ac.currentTime + 0.03;
      const p = rnd(0.85, 1.25);
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(190 * p, t);
      o.frequency.exponentialRampToValueAtTime(105 * p, t + 0.26);
      const g = ac.createGain(); env(g, t, 0.02, 0.28, 0.28);
      const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 720; f1.Q.value = 3;
      const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 4;
      const mix = ac.createGain(); mix.gain.value = 1.4;
      o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.32);
    }
    const SFX = {
      punch() { tone('sine', 150, 42, 0.2, 0.9); noise('lowpass', 2200, 400, 0.7, 0.09, 0.6); },
      slap() { noise('highpass', 1800, 1800, 0.6, 0.08, 0.9); noise('bandpass', 3200, 2000, 1.2, 0.04, 0.5); tone('sine', 260, 120, 0.06, 0.3); },
      thud() { tone('sine', 120, 40, 0.22, 0.9); noise('lowpass', 1000, 300, 0.7, 0.12, 0.5); },
      bong() {
        [[320, 0.45, 1.4], [812, 0.28, 1.0], [1290, 0.2, 0.8], [1733, 0.12, 0.6], [2410, 0.07, 0.4]]
          .forEach(([f, p, d]) => tone('sine', f, f * 0.985, d, p));
        noise('bandpass', 2500, 1500, 1, 0.05, 0.5);
      },
      clank() {
        [[980, 0.3, 0.35], [1470, 0.22, 0.28], [2380, 0.14, 0.2], [3300, 0.08, 0.14]].forEach(([f, p, d]) => tone('square', f, f, d, p * 0.35));
        tone('sine', 110, 45, 0.18, 0.8); noise('bandpass', 4000, 2500, 2, 0.06, 0.4);
      },
      saw() {
        for (let i = 0; i < 5; i++) {
          noise('bandpass', i % 2 ? 2600 : 1700, i % 2 ? 1700 : 2600, 3, 0.085, 0.55, i * 0.08);
          tone('sawtooth', i % 2 ? 140 : 190, i % 2 ? 190 : 140, 0.08, 0.12, i * 0.08);
        }
      },
      splat() { noise('bandpass', 1600, 250, 1.5, 0.2, 0.9); tone('sine', 220, 70, 0.12, 0.4); },
      whoosh() { noise('bandpass', 350, 1500, 1.2, 0.16, 0.22); },
      bell() {
        for (let i = 0; i < 3; i++) {
          tone('sine', 1860, 1860, 0.9, 0.35, i * 0.28);
          tone('sine', 4700, 4700, 0.5, 0.1, i * 0.28);
        }
      },
      fanfare() {
        [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, i === 3 ? 0.6 : 0.14, 0.12, 0.9 + i * 0.12));
        [523, 659, 784].forEach((f) => tone('triangle', f, f, 0.8, 0.12, 1.26));
      },
    };
    return {
      init,
      play(name) { if (ac && !muted && SFX[name]) SFX[name](); },
      grunt() { if (ac && !muted) grunt(); },
      get muted() { return muted; },
      setMuted(v) {
        muted = v;
        try { localStorage.setItem('tooz-muted', v ? '1' : '0'); } catch (e) {}
        if (master) master.gain.value = v ? 0 : 0.8;
      },
    };
  })();

  const haptic = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  // ---------- ארגז הכלים ----------
  function buildToolbar() {
    TOOLS.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'tool';
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === state.toolIdx ? 'true' : 'false');
      b.setAttribute('aria-label', `${t.name}, עוצמה ${t.pow} מתוך 5`);
      const pow = Array.from({ length: 5 }, (_, j) => `<i class="${j < t.pow ? 'on' : ''}"></i>`).join('');
      b.innerHTML = `<span class="tool__pow" aria-hidden="true">${pow}</span><img src="${t.src}" alt="" draggable="false"><span>${t.name}</span>`;
      b.addEventListener('click', () => selectTool(i));
      toolbarEl.appendChild(b);
    });
  }
  function selectTool(i) {
    state.toolIdx = i;
    [...toolbarEl.children].forEach((b, j) => b.setAttribute('aria-checked', j === i ? 'true' : 'false'));
    toolbarEl.children[i].scrollIntoView({ behavior: prefersReduced.matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    haptic(8);
  }

  // ---------- התקפה ----------
  const ANIM = {
    swing: { impact: 0.1, dur: 0.38 },
    punch: { impact: 0.085, dur: 0.32 },
    throw: { impact: 0.17, dur: 0.75 },
    saw: { impact: 0.07, dur: 0.46 },
  };

  function attack(x, y) {
    const tool = TOOLS[state.toolIdx];
    const cx = layout.feetX + phys.ox;
    const flip = x >= cx ? 1 : -1;
    const a = ANIM[tool.anim];
    attacks.push({
      tool, x, y, flip, t: 0,
      impactT: a.impact, dur: a.dur, hit: null, done: false,
      from: [rnd(W * 0.3, W * 0.7), H + 40],
      spin: rnd(9, 14) * (Math.random() < 0.5 ? -1 : 1),
      vx: 0, vy: 0, px: 0, py: 0,
    });
    if (tool.anim !== 'saw') Sound.play('whoosh');
  }

  function resolveImpact(at) {
    const bm = bodyMatrix();
    const hm = headMatrix(bm);
    const p = new DOMPoint(at.x, at.y);
    const hp = hm.inverse().transformPoint(p);
    const bp = bm.inverse().transformPoint(p);

    let part = null, ix = 0, iy = 0;
    const hd = HERO.head;
    if (hp.x > hd.x && hp.x < hd.x + hd.w && hp.y < HERO.headFade.from && onHero(hp.x, hp.y, 10)) {
      part = 'head'; ix = hp.x; iy = hp.y;
    } else if (onHero(bp.x, bp.y, 10)) {
      part = 'body'; ix = bp.x; iy = bp.y;
    }
    at.hit = !!part;

    if (!part) {
      addBurst(at.x, at.y, 'פספסת', true);
      return;
    }
    landHit(at, part, clamp(ix, 0, HERO.w), clamp(iy, 0, HERO.h));
  }

  function landHit(at, part, ix, iy) {
    const t = at.tool;
    const now = performance.now();
    state.hits++;
    state.usage[t.id] = (state.usage[t.id] || 0) + 1;
    state.combo = now - state.lastHitAt < 650 ? state.combo + 1 : 1;
    state.lastHitAt = now;
    const headHit = part === 'head';
    const dmg = t.dmg * (headHit ? 1.25 : 1);
    state.hp = Math.max(0, state.hp - dmg);

    // ---- סימנים ----
    const skin = lumAt(ix, iy) > 85;
    const dirRot = at.flip > 0 ? 0.5 : -0.5;
    switch (t.mark) {
      case 'bruise':
      case 'bruise+':
        if (headHit || skin) addMark({ type: 'bruise', part, x: ix, y: iy, r: t.id === 'pan' ? 22 : rnd(11, 16), rot: rnd(-1, 1), a: t.mark === 'bruise+' ? 1 : 0.8 });
        if (t.id === 'pan' && headHit) addMark({ type: 'red', part, x: ix, y: iy, r: 18, rot: 0, a: 0.35 });
        break;
      case 'hand':
        if (headHit || skin) addMark({ type: 'hand', part, x: ix, y: iy, rot: dirRot + rnd(-0.3, 0.3), s: headHit ? 1.05 : 0.9 });
        break;
      case 'flip':
        if (headHit || skin) addMark({ type: 'flip', part, x: ix, y: iy, rot: dirRot + rnd(-0.4, 0.4), s: headHit ? 0.95 : 0.85 });
        break;
      case 'print':
        addMark({ type: 'print', part, x: ix, y: iy, rot: rnd(-0.8, 0.8), s: headHit ? 0.8 : 1.15 });
        break;
      case 'egg': {
        const pts = [];
        const n = 9;
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const r = rnd(10, 19); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
        const drips = Array.from({ length: 3 }, () => [rnd(-10, 10), rnd(16, 34)]);
        addMark({ type: 'egg', part, x: ix, y: iy, s: headHit ? 0.9 : 1.1, pts, drips });
        break;
      }
      case 'scratch':
        addMark({ type: skin || headHit ? 'scratch' : 'tear', part, x: ix, y: iy, rot: rnd(-0.5, 0.5) });
        break;
      case 'bump':
        if (headHit && iy < 70) {
          const bx = clamp(ix, 128, 228);
          addMark({ type: 'bump', part, x: bx, y: headTopAt(bx) + 3, r: rnd(13, 17) });
        } else if (headHit || skin) {
          addMark({ type: 'bruise', part, x: ix, y: iy, r: rnd(12, 16), rot: rnd(-1, 1), a: 0.9 });
        }
        break;
    }

    // ---- פנס בעין: כל מכה מעמיקה אותו ----
    let eyeI;
    if (headHit) eyeI = ix < HERO.face[0] ? 0 : 1;
    else eyeI = state.hits % 2;
    state.eyes[eyeI] = Math.min(1, state.eyes[eyeI] + (headHit ? 0.2 : 0.11));
    const dmgPct = 1 - state.hp / MAX_HP;
    state.eyes[0] = Math.max(state.eyes[0], clamp(dmgPct * 1.6, 0, 1));
    state.eyes[1] = Math.max(state.eyes[1], clamp((dmgPct - 0.15) * 1.7, 0, 1));

    // פלסטרים בנקודות ציון
    if (state.bandages === 0 && dmgPct > 0.45) {
      state.bandages = 1;
      addMark({ type: 'bandage', part: 'head', x: 205, y: 55, rot: 0.25 });
    } else if (state.bandages === 1 && dmgPct > 0.75) {
      state.bandages = 2;
      addMark({ type: 'bandage', part: 'head', x: 128, y: 150, rot: -0.3 });
    }

    composePart('head');
    if (!headHit) composePart('body');

    // ---- תגובה פיזיקלית ----
    const dir = -at.flip;
    const pow = t.pow / 5;
    const heightF = 1 - iy / HERO.h; // מכה גבוהה מזיזה יותר
    phys.thv += dir * (1.2 + pow * 2.6) * (0.5 + heightF);
    phys.oxv += dir * (60 + pow * 140);
    if (headHit) {
      phys.phv += dir * (4 + pow * 7);
      phys.hsv -= 1.2 + pow * 1.6;
      if (t.id === 'hammer' && iy < 70) phys.sqv -= 2.2;
    }
    phys.sqv -= 0.6 + pow * 1.3;

    // ---- אפקטים ----
    const big = t.pow >= 4;
    shake = Math.max(shake, prefersReduced.matches ? 0 : 4 + t.pow * 2.6);
    flashes.push({ x: at.x, y: at.y, t: 0, r: 40 + t.pow * 16 });
    spawnImpactParticles(at, t, headHit);
    const word = state.combo >= 4 && Math.random() < 0.6 ? `קומבו x${state.combo}` : pick(t.words);
    addBurst(at.x + rnd(-10, 10), at.y - 30 - (big ? 10 : 0), word, false, big);
    Sound.play(t.sfx);
    if (Math.random() < 0.55 || big) Sound.grunt();
    haptic(big ? [30, 20, 25] : 18);

    updateHud(true);

    if (state.hp <= 0 && state.phase === 'play') knockout(dir);
  }

  // ---------- חלקיקים / כתוביות ----------
  function spawnImpactParticles(at, t, headHit) {
    const n = 8 + t.pow * 3;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(160, 480) * (0.6 + t.pow * 0.12);
      particles.push({ kind: 'spark', x: at.x, y: at.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rnd(0.18, 0.34), c: Math.random() < 0.7 ? '#ffd000' : '#fff6d8', w: rnd(2, 4) });
    }
    if (t.id === 'egg') {
      for (let i = 0; i < 14; i++) {
        const a = rnd(-Math.PI, 0), s = rnd(120, 380);
        particles.push({ kind: 'dot', x: at.x, y: at.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 1200, life: 0, max: rnd(0.4, 0.7), c: Math.random() < 0.5 ? '#ffc21a' : '#fffaf0', r: rnd(2, 5) });
      }
    }
    if (t.id === 'saw') {
      for (let i = 0; i < 16; i++) {
        particles.push({ kind: 'dot', x: at.x + rnd(-20, 20), y: at.y, vx: rnd(-160, 160), vy: rnd(-260, -60), g: 900, life: 0, max: rnd(0.5, 0.9), c: '#d9c7a4', r: rnd(1.5, 3) });
      }
    }
    if (headHit && t.pow >= 3) {
      for (let i = 0; i < 4; i++) {
        const a = rnd(-2.6, -0.5), s = rnd(90, 200);
        particles.push({ kind: 'star', x: at.x, y: at.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 300, life: 0, max: rnd(0.5, 0.8), c: '#ffd000', r: rnd(6, 10), rot: rnd(0, 6) });
      }
    }
  }

  function addBurst(x, y, text, miss = false, big = false) {
    bursts.push({ x, y, text, t: 0, miss, big, rot: prefersReduced.matches ? 0 : rnd(-0.22, 0.22), spikes: miss ? 0 : 12 + ((Math.random() * 4) | 0) });
    if (bursts.length > 6) bursts.shift();
  }

  // ---------- נוקאאוט / ניצחון ----------
  function knockout(dir) {
    state.phase = 'ko';
    state.koAt = performance.now();
    phys.thT = dir * 0.22;
    phys.phT = dir * 0.42;
    phys.oyT = layout.Hc * 0.03;
    phys.sqT = 0.93;
    Sound.play('bell');
    Sound.play('fanfare');
    haptic([60, 40, 60, 40, 120]);
    addBurst(W / 2, layout.top + layout.Hc * 0.35, 'נוקאאוט!', false, true);
    setTimeout(showWin, 1500);
  }

  function showWin() {
    state.phase = 'won';
    const secs = (state.koAt - state.startedAt) / 1000;
    const top = Object.entries(state.usage).sort((a, b) => b[1] - a[1])[0];
    const topTool = top ? TOOLS.find((t) => t.id === top[0]).name : '—';
    $('statHits').textContent = state.hits;
    $('statTime').textContent = secs.toFixed(1);
    $('statTool').textContent = topTool;

    let best = null, total = 0;
    try {
      best = parseFloat(localStorage.getItem('tooz-best')) || null;
      total = (parseInt(localStorage.getItem('tooz-total'), 10) || 0) + state.hits;
      localStorage.setItem('tooz-total', String(total));
      if (!best || secs < best) localStorage.setItem('tooz-best', String(secs));
    } catch (e) {}
    const rec = $('statRecord');
    if (!best || secs < best) rec.textContent = best ? 'שיא חדש! אף פעם לא הפלת אותו כל כך מהר' : 'השיא הראשון שלך נרשם';
    else rec.textContent = `השיא שלך: ${best.toFixed(1)} שניות · סה״כ ${total} טוזים`;

    openScreen('win');
    setTimeout(() => $('againBtn').focus({ preventScroll: true }), 350);
  }

  function openScreen(id) {
    for (const s of document.querySelectorAll('.screen')) {
      const open = s.id === id;
      s.classList.toggle('is-open', open);
      s.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
  }

  function newGame() {
    Object.assign(state, {
      phase: 'play', hp: MAX_HP, hits: 0, startedAt: performance.now(), koAt: 0,
      usage: {}, eyes: [0, 0], marks: [], bandages: 0, combo: 0, lastHitAt: 0,
    });
    Object.assign(phys, { th: 0, thv: 0, thT: 0, ph: 0, phv: 0, phT: 0, sq: 1, sqv: 0, sqT: 1, ox: 0, oxv: 0, oy: 0, oyv: 0, oyT: 0, hs: 1, hsv: 0 });
    attacks.length = particles.length = bursts.length = flashes.length = 0;
    composePart('head');
    composePart('body');
    updateHud(false);
    openScreen(null);
  }

  // ---------- HUD ----------
  const STATES = [
    [0.86, 'רענן כמו מלפפון'],
    [0.66, 'מתחיל להרגיש'],
    [0.46, 'פנס ראשון'],
    [0.26, 'רואה כוכבים'],
    [0.001, 'על הקרשים'],
    [-1, 'נוקאאוט'],
  ];
  function updateHud(bump) {
    scoreNum.textContent = state.hits;
    const f = state.hp / MAX_HP;
    meterFill.style.transform = `scaleX(${f})`;
    const pct = Math.ceil(f * 100);
    meterPct.textContent = pct + '%';
    meterEl.setAttribute('aria-valuenow', String(pct));
    meterState.textContent = STATES.find(([th]) => f >= th)[1];
    if (bump && !prefersReduced.matches) {
      scoreEl.classList.remove('is-bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('is-bump');
    }
  }

  // ---------- לולאה ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt, now / 1000);
    draw(now / 1000);
    requestAnimationFrame(frame);
  }

  function spring(pos, vel, target, k, c, dt) {
    const a = -k * (pos - target) - c * vel;
    vel += a * dt;
    return [pos + vel * dt, vel, a];
  }

  function step(dt, t) {
    const dmgPct = 1 - state.hp / MAX_HP;
    const sway = state.phase === 'play' ? Math.sin(t * (0.9 + dmgPct)) * (0.01 + dmgPct * 0.035) : 0;
    let a;
    [phys.th, phys.thv, a] = spring(phys.th, phys.thv, phys.thT + sway, state.phase === 'play' ? 110 : 40, state.phase === 'play' ? 8 : 6, dt);
    [phys.ph, phys.phv] = spring(phys.ph, phys.phv, phys.phT + Math.sin(t * 1.3) * dmgPct * 0.06, 170, 7, dt);
    phys.phv -= a * 0.35 * dt; // הראש מפגר אחרי הגוף
    phys.ph = clamp(phys.ph, -0.5, 0.5);
    [phys.sq, phys.sqv] = spring(phys.sq, phys.sqv, phys.sqT + (state.phase === 'play' ? Math.sin(t * 2.1) * 0.006 : 0), 380, 16, dt);
    phys.sq = clamp(phys.sq, 0.8, 1.12);
    [phys.ox, phys.oxv] = spring(phys.ox, phys.oxv, 0, 140, 13, dt);
    [phys.oy, phys.oyv] = spring(phys.oy, phys.oyv, phys.oyT, 60, 9, dt);
    [phys.hs, phys.hsv] = spring(phys.hs, phys.hsv, 1, 420, 18, dt);
    phys.hs = clamp(phys.hs, 0.9, 1.08);

    for (const at of attacks) {
      at.t += dt;
      if (at.hit === null && at.t >= at.impactT) {
        if (state.phase === 'play') resolveImpact(at); else at.hit = false;
        if (at.tool.anim === 'throw') {
          at.vx = -at.flip * rnd(120, 260) * (at.hit ? 1 : 0.2);
          at.vy = at.hit ? -rnd(260, 420) : 0;
          if (!at.hit) { at.vx = (at.x - at.from[0]) * 1.2; at.vy = (at.y - at.from[1]) * 1.2; }
        }
        if (at.tool.anim === 'saw' && at.hit) Sound.play('saw');
      }
      if (at.t >= at.dur) at.done = true;
    }
    for (let i = attacks.length - 1; i >= 0; i--) if (attacks[i].done) attacks.splice(i, 1);

    for (const p of particles) {
      p.life += dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= 0.96; p.vy *= p.g ? 1 : 0.96;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.rot !== undefined) p.rot += dt * 6;
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life >= particles[i].max) particles.splice(i, 1);
    for (const b of bursts) b.t += dt;
    for (let i = bursts.length - 1; i >= 0; i--) if (bursts[i].t > 0.75) bursts.splice(i, 1);
    for (const f of flashes) f.t += dt;
    for (let i = flashes.length - 1; i >= 0; i--) if (flashes[i].t > 0.14) flashes.splice(i, 1);
    shake *= Math.pow(0.0008, dt);
    if (shake < 0.2) shake = 0;
  }

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeIn = (x) => x * x * x;

  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
    if (!heroData) return;

    const sx = shake ? rnd(-shake, shake) : 0, sy = shake ? rnd(-shake, shake) : 0;
    const base = new DOMMatrix().scale(dpr, dpr).translate(sx, sy);
    ctx.setTransform(base);

    // צל על הרצפה
    const L = layout;
    ctx.save();
    ctx.translate(L.feetX + phys.ox + phys.th * L.Hc * 0.25, L.feetY - 2);
    ctx.scale(1, 0.18);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, L.Hc * 0.2);
    sg.addColorStop(0, 'rgba(0,0,0,.7)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(0, 0, L.Hc * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // הבזקי פגיעה (מאחורי הדמות)
    for (const f of flashes) {
      const k = f.t / 0.14;
      ctx.fillStyle = `rgba(255, 220, 60, ${0.35 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + k), 0, Math.PI * 2); ctx.fill();
    }

    // גוף
    const bm = base.multiply(bodyMatrix());
    ctx.setTransform(bm);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bodyOut, 0, 0, HERO.w, HERO.h);

    // ראש
    const hm = base.multiply(headMatrix(bodyMatrix()));
    ctx.setTransform(hm);
    const hd = HERO.head;
    ctx.drawImage(headOut, hd.x, hd.y, hd.w, hd.h);

    // כוכבים מסתובבים כשהוא מסוחרר
    const dmgPct = 1 - state.hp / MAX_HP;
    if (dmgPct > 0.62 && state.phase !== 'intro') drawDizzy(t, dmgPct);

    ctx.setTransform(base);

    for (const at of attacks) drawAttack(at);
    for (const p of particles) drawParticle(p);
    for (const b of bursts) drawBurst(b);
  }

  function drawDizzy(t, dmgPct) {
    const cx = 178, cy = -4, rx = 78, ry = 18;
    const n = state.phase === 'play' ? 3 : 5;
    const items = [];
    for (let i = 0; i < n; i++) {
      const a = t * 3.2 + (i / n) * Math.PI * 2;
      items.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, s: Math.sin(a) });
    }
    const alpha = clamp((dmgPct - 0.62) * 5, 0, 1);
    for (const it of items) {
      ctx.globalAlpha = alpha * (0.55 + 0.45 * (it.s + 1) / 2);
      star(ctx, it.x, it.y, 20 + it.s * 5, t * 4, '#ffd000', '#16110c');
    }
    ctx.globalAlpha = 1;
  }

  function star(g, x, y, r, rot, fill, stroke) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    if (stroke) { g.lineWidth = r * 0.22; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(); }
    g.restore();
  }

  function drawAttack(at) {
    const tool = at.tool;
    if (!tool.img.complete) return;
    const sz = tool.size * layout.Hc;
    const s = sz / 128;
    const [ix, iy] = tool.impactR;
    const [gx, gy] = tool.gripR;
    const u = at.t;
    const it = at.impactT;
    let alpha = 1;
    const fadeStart = at.dur - 0.12;
    if (u > fadeStart) alpha = clamp(1 - (u - fadeStart) / 0.12, 0, 1);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (tool.anim === 'swing') {
      let ang;
      if (u < it) ang = 1.15 * (1 - easeIn(u / it));
      else { const k = (u - it) / (at.dur - it); ang = -0.12 * Math.sin(k * Math.PI) * (at.hit ? 1 : 3); }
      ctx.translate(at.x, at.y);
      ctx.scale(at.flip, 1);
      ctx.translate((gx - ix) * s, (gy - iy) * s);
      ctx.rotate(ang);
      ctx.drawImage(tool.img, -gx * s, -gy * s, sz, sz);
    } else if (tool.anim === 'punch') {
      let k, sc;
      if (u < it) { k = 1 - easeOut(u / it); sc = 1 + k * 0.55; }
      else { const r = (u - it) / (at.dur - it); k = Math.sin(Math.min(1, r * 1.4) * Math.PI / 2) * 0.28; sc = 1 + k * 0.2; }
      ctx.translate(at.x + at.flip * k * layout.Hc * 0.35, at.y + k * layout.Hc * 0.22);
      ctx.scale(at.flip * sc, sc);
      ctx.rotate(-0.1);
      ctx.drawImage(tool.img, -ix * s, -iy * s, sz, sz);
    } else if (tool.anim === 'throw') {
      let x, y, rot;
      if (u < it) {
        const k = u / it;
        x = at.from[0] + (at.x - at.from[0]) * k;
        y = at.from[1] + (at.y - at.from[1]) * k - Math.sin(k * Math.PI) * layout.Hc * 0.18;
        rot = at.spin * u;
      } else {
        if (tool.id === 'egg' && at.hit) { ctx.restore(); return; }
        const d = u - it;
        x = at.x + at.vx * d;
        y = at.y + at.vy * d + 0.5 * 1600 * d * d;
        rot = at.spin * u + d * 6;
      }
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(tool.img, -64 * s, -64 * s, sz, sz);
    } else if (tool.anim === 'saw') {
      const into = u < it ? easeOut(u / it) : 1;
      const osc = Math.sin(u * 42) * layout.Hc * 0.045;
      ctx.translate(at.x + at.flip * (1 - into) * layout.Hc * 0.2, at.y - (1 - into) * 20);
      ctx.scale(at.flip, 1);
      ctx.translate(osc, 0);
      ctx.rotate(-0.08 + Math.sin(u * 42) * 0.03);
      ctx.drawImage(tool.img, -ix * s, -iy * s, sz, sz);
    }
    ctx.restore();
  }

  function drawParticle(p) {
    const k = 1 - p.life / p.max;
    ctx.globalAlpha = clamp(k * 1.4, 0, 1);
    if (p.kind === 'spark') {
      ctx.strokeStyle = p.c;
      ctx.lineWidth = p.w * k + 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
      ctx.stroke();
    } else if (p.kind === 'dot') {
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'star') {
      star(ctx, p.x, p.y, p.r, p.rot, p.c, '#16110c');
    }
    ctx.globalAlpha = 1;
  }

  function drawBurst(b) {
    const u = b.t;
    let sc;
    if (u < 0.09) sc = 0.3 + (u / 0.09) * 0.95;
    else if (u < 0.18) sc = 1.25 - ((u - 0.09) / 0.09) * 0.25;
    else sc = 1;
    const alpha = u > 0.5 ? clamp(1 - (u - 0.5) / 0.25, 0, 1) : 1;
    const rise = prefersReduced.matches ? 0 : u * 40;
    const fs = b.miss ? 30 : b.big ? 60 : 48;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(b.x, b.y - rise);
    ctx.rotate(b.rot);
    ctx.scale(sc, sc);
    ctx.font = `700 ${fs}px Karantina, Rubik, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    const tw = ctx.measureText(b.text).width;

    if (!b.miss) {
      const R = tw * 0.62 + 22, r = R * 0.72;
      ctx.beginPath();
      for (let i = 0; i < b.spikes * 2; i++) {
        const a = (i / (b.spikes * 2)) * Math.PI * 2;
        const rr = i % 2 ? r : R;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.62);
      }
      ctx.closePath();
      ctx.fillStyle = b.big ? '#e8322b' : '#ffd000';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#16110c';
      ctx.stroke();
      ctx.fillStyle = b.big ? '#fff6d8' : '#16110c';
      ctx.fillText(b.text, 0, fs * 0.06);
    } else {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#16110c';
      ctx.strokeText(b.text, 0, 0);
      ctx.fillStyle = '#b9ae9b';
      ctx.fillText(b.text, 0, 0);
    }
    ctx.restore();
  }

  // ---------- קלט ----------
  canvas.addEventListener('pointerdown', (e) => {
    if (state.phase !== 'play') return;
    e.preventDefault();
    attack(e.clientX, e.clientY);
  }, { passive: false });
  // מונע זום/גלילה בלחיצה כפולה ב-iOS
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  $('startBtn').addEventListener('click', () => { Sound.init(); newGame(); scheduleInstallHint(); });
  $('againBtn').addEventListener('click', () => { Sound.init(); newGame(); });
  $('shareBtn').addEventListener('click', async () => {
    const text = `הפלתי אותו ב-${state.hits} טוזים תוך ${$('statTime').textContent} שניות. בוא נראה אותך`;
    const data = { title: 'מלך הטוזים', text, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${text}\n${location.href}`); $('shareBtn').textContent = 'הקישור הועתק'; }
    } catch (e) {}
  });

  const muteBtn = $('muteBtn');
  const syncMute = () => {
    muteBtn.setAttribute('aria-pressed', Sound.muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', Sound.muted ? 'הפעל סאונד' : 'השתק סאונד');
  };
  muteBtn.addEventListener('click', () => { Sound.init(); Sound.setMuted(!Sound.muted); syncMute(); });
  syncMute();

  // מקלדת: מספרים בוחרים כלי
  window.addEventListener('keydown', (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= TOOLS.length) selectTool(n - 1);
  });

  // ---------- רמז "הוסף למסך הבית" (אייפון בספארי בלבד) ----------
  function scheduleInstallHint() {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    let seen = false;
    try { seen = localStorage.getItem('tooz-hint') === '1'; } catch (e) {}
    if (!isIOS || standalone || seen) return;
    const el = $('installHint');
    setTimeout(() => {
      if (state.phase !== 'play') return;
      el.hidden = false;
      setTimeout(() => { el.hidden = true; }, 7000);
    }, 5000);
    $('installX').addEventListener('click', () => { el.hidden = true; });
    try { localStorage.setItem('tooz-hint', '1'); } catch (e) {}
  }

  // ---------- התחלה ----------
  buildToolbar();
  updateHud(false);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();
  heroImg.onload = () => {
    prepareHero();
    const go = () => { resize(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  };
  heroImg.src = HERO.src;
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
