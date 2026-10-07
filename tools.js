/* ארגז הכלים — איורי SVG בסגנון מדבקה (קו דיו עבה), ומטא־דאטה לכל כלי.
   כל איור בתיבה של 128x128. impact = נקודת הפגיעה, grip = איפה מחזיקים.
   rot = סיבוב האיור (מעלות), מחושב גם על הנקודות כדי שהפגיעה תנחת בדיוק. */
(function () {
  const INK = '#16110c';
  const S = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

  const svg = (body, rot = 0) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256">` +
    `<g transform="rotate(${rot} 64 64)">${body}</g></svg>`;

  const ART = {
    glove: svg(`
      <path d="M92 40 C96 26 84 14 66 14 L40 14 C20 14 8 30 8 52 C8 74 22 92 44 94 L78 94 C88 94 94 86 94 76 Z" fill="#d8262b" ${S}/>
      <path d="M22 38 C24 26 34 22 46 22" fill="none" stroke="#ff8a7a" stroke-width="6" stroke-linecap="round"/>
      <path d="M40 60 C40 48 52 44 62 48 C70 52 70 62 62 66" fill="none" ${S}/>
      <rect x="88" y="30" width="30" height="72" rx="6" fill="#f4ede0" ${S}/>
      <path d="M96 48 L110 56 M110 48 L96 56 M96 66 L110 74 M110 66 L96 74 M96 84 L110 92 M110 84 L96 92" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    `),
    slap: svg(`
      <path d="M40 120 L40 96 C30 90 22 80 18 66 L10 46 C8 38 18 34 22 42 L32 60 L32 22 C32 14 44 14 44 22 L44 50 L46 12 C46 4 58 4 58 12 L58 50 L62 16 C62 8 74 8 74 16 L72 52 L78 26 C80 18 92 20 90 28 L84 70 C82 86 78 94 74 98 L74 120 Z" fill="#eab089" ${S}/>
      <path d="M50 70 C56 76 66 76 70 70" fill="none" stroke="#b9785a" stroke-width="3" stroke-linecap="round"/>
    `, -32),
    flipflop: svg(`
      <path d="M64 6 C88 6 98 24 96 46 C94 64 86 74 86 92 C86 112 78 122 64 122 C50 122 42 112 42 92 C42 74 34 64 32 46 C30 24 40 6 64 6 Z" fill="#2f7fd6" ${S}/>
      <path d="M64 14 C82 14 88 28 87 44 C86 60 78 72 78 90 C78 106 72 112 64 112 C56 112 50 106 50 90 C50 72 42 60 41 44 C40 28 46 14 64 14 Z" fill="#6fb6ff"/>
      <path d="M38 62 C44 44 56 34 64 30 C72 34 84 44 90 62" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path d="M38 62 C44 44 56 34 64 30 C72 34 84 44 90 62" fill="none" stroke="#ffd000" stroke-width="6" stroke-linecap="round"/>
    `, -38),
    shoe: svg(`
      <path d="M8 88 L8 58 C8 50 16 46 24 50 C34 56 44 56 50 46 L56 34 C60 28 68 28 72 34 L80 50 C88 62 104 66 116 70 C122 72 124 78 124 84 L124 92 Z" fill="#fbfbf8" ${S}/>
      <path d="M8 90 L124 90 L122 102 C122 106 118 108 114 108 L14 108 C10 108 8 106 8 102 Z" fill="#d9d4ca" ${S}/>
      <path d="M30 76 C52 80 76 74 100 60 C86 74 64 84 34 84 Z" fill="${INK}"/>
      <path d="M58 44 L70 40 M60 52 L74 48" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="18" cy="66" r="3" fill="${INK}"/>
    `),
    pan: svg(`
      <path d="M74 74 L118 118" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
      <path d="M74 74 L118 118" stroke="#5a3a22" stroke-width="11" stroke-linecap="round"/>
      <circle cx="48" cy="48" r="40" fill="#2a2724" ${S}/>
      <circle cx="48" cy="48" r="29" fill="#3d3934"/>
      <path d="M28 34 C34 24 44 20 54 22" fill="none" stroke="#8a847b" stroke-width="5" stroke-linecap="round"/>
    `),
    brass: svg(`
      <path d="M10 64 C10 42 18 30 32 30 L96 30 C110 30 118 42 118 64 L118 70 C112 84 94 96 64 98 C34 96 16 84 10 70 Z" fill="#c9ced6" ${S}/>
      <circle cx="30" cy="54" r="11" fill="#1c1712" ${S}/>
      <circle cx="55" cy="52" r="11" fill="#1c1712" ${S}/>
      <circle cx="80" cy="52" r="11" fill="#1c1712" ${S}/>
      <circle cx="104" cy="54" r="10" fill="#1c1712" ${S}/>
      <path d="M22 36 L100 36" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <path d="M36 82 C52 90 76 90 92 82" fill="none" stroke="#8b929c" stroke-width="4" stroke-linecap="round"/>
    `),
    hammer: svg(`
      <rect x="56" y="40" width="16" height="84" rx="6" fill="#c8864a" ${S}/>
      <path d="M60 50 L60 116" stroke="#e8b27a" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 18 L96 16 C104 16 110 22 110 30 L110 34 C110 40 104 46 96 46 L18 46 Z" fill="#9aa3ad" ${S}/>
      <rect x="10" y="12" width="14" height="40" rx="3" fill="#6d7680" ${S}/>
      <path d="M32 24 L94 24" stroke="#e6ebf0" stroke-width="4" stroke-linecap="round"/>
    `, -40),
    saw: svg(`
      <path d="M6 54 L84 38 L84 82 L10 82 Z" fill="#dfe4ea" ${S}/>
      <path d="M10 82 L14 90 L18 82 L22 90 L26 82 L30 90 L34 82 L38 90 L42 82 L46 90 L50 82 L54 90 L58 82 L62 90 L66 82 L70 90 L74 82 L78 90 L82 82" fill="#dfe4ea" ${S}/>
      <path d="M16 62 L78 50" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <path d="M80 34 L110 30 C120 30 124 40 122 52 L118 84 C116 92 108 94 100 92 L80 88 Z" fill="#b5462a" ${S}/>
      <rect x="92" y="46" width="18" height="28" rx="9" fill="#1c1712"/>
      <circle cx="86" cy="48" r="3" fill="${INK}"/><circle cx="86" cy="72" r="3" fill="${INK}"/>
    `),
    egg: svg(`
      <path d="M64 10 C88 10 106 50 106 76 C106 102 88 118 64 118 C40 118 22 102 22 76 C22 50 40 10 64 10 Z" fill="#f7eedc" ${S}/>
      <path d="M44 44 C48 32 54 26 60 24" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
      <circle cx="80" cy="92" r="4" fill="#e3d4b6"/><circle cx="50" cy="96" r="3" fill="#e3d4b6"/>
    `),
    chair: svg(`
      <rect x="30" y="86" width="12" height="36" rx="3" fill="#7a4a24" ${S}/>
      <rect x="86" y="86" width="12" height="36" rx="3" fill="#7a4a24" ${S}/>
      <rect x="34" y="28" width="60" height="42" rx="8" fill="#b3202a" ${S}/>
      <rect x="42" y="36" width="44" height="26" rx="5" fill="#d8404a"/>
      <rect x="22" y="68" width="84" height="20" rx="6" fill="#8f1820" ${S}/>
      <path d="M28 76 L100 76" stroke="#d8404a" stroke-width="3" stroke-linecap="round"/>
      <path d="M42 28 L44 8 L55 19 L64 3 L73 19 L84 8 L86 28 Z" fill="#ffd000" ${S}/>
      <circle cx="64" cy="16" r="3.5" fill="#d8262b"/>
    `),
    table: svg(`
      <rect x="12" y="56" width="16" height="64" rx="4" fill="#7a4a24" ${S}/>
      <rect x="100" y="56" width="16" height="64" rx="4" fill="#7a4a24" ${S}/>
      <rect x="22" y="70" width="84" height="10" rx="3" fill="#5a3418" ${S}/>
      <rect x="4" y="42" width="120" height="20" rx="6" fill="#c8864a" ${S}/>
      <path d="M14 50 L110 50" stroke="#e8b27a" stroke-width="4" stroke-linecap="round"/>
      <path d="M44 42 L46 18 L56 28 L64 12 L72 28 L82 18 L84 42 Z" fill="#ffd000" ${S}/>
      <circle cx="64" cy="30" r="3.5" fill="#d8262b"/>
    `),
    vase: svg(`
      <path d="M50 8 L78 8 C80 8 80 14 78 14 L76 14 C76 30 78 38 90 54 C104 72 100 108 84 118 C74 124 54 124 44 118 C28 108 24 72 38 54 C50 38 52 30 52 14 L50 14 C48 14 48 8 50 8 Z" fill="#f4ede0" ${S}/>
      <path d="M36 66 C56 74 74 74 94 66 M34 88 C56 98 76 98 96 88" fill="none" stroke="#2f7fd6" stroke-width="7" stroke-linecap="round"/>
      <circle cx="64" cy="80" r="6" fill="#ffd000" stroke="${INK}" stroke-width="3"/>
      <path d="M44 62 C42 76 42 90 48 104" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    `),
  };

  // רמת כוח 1–5 (לתצוגה) ו-dmg אמיתי. כל מכה = טוז אחד, לא משנה הכלי.
  const TOOLS = [
    { id: 'glove',    name: 'אגרוף',  dmg: 5, pow: 3, anim: 'punch', impact: [14, 56], grip: [104, 66], rot: 0,   size: .30, sfx: 'punch',  mark: 'bruise',   words: ['בום!', 'טוז!', 'פאו!', 'אאוץ\'!'] },
    { id: 'slap',     name: 'סטירה',  dmg: 3, pow: 1, anim: 'swing', impact: [52, 44], grip: [58, 118], rot: -32, size: .30, sfx: 'slap',   mark: 'hand',     words: ['פאק!', 'טראח!', 'בוז!', 'טוז!'] },
    { id: 'flipflop', name: 'כפכף',   dmg: 4, pow: 2, anim: 'swing', impact: [64, 26], grip: [64, 114], rot: -38, size: .34, sfx: 'slap',   mark: 'flip',     words: ['כפכף!', 'שלאק!', 'יא טוז!'] },
    { id: 'shoe',     name: 'נעל',    dmg: 5, pow: 3, anim: 'throw', impact: [64, 70], grip: [64, 70],  rot: 0,   size: .28, sfx: 'thud',   mark: 'print',    words: ['בום!', 'טאק!', 'טוז!'] },
    { id: 'pan',      name: 'מחבת',   dmg: 7, pow: 4, anim: 'swing', impact: [46, 46], grip: [116, 116],rot: 0,   size: .38, sfx: 'bong',   mark: 'bruise',   words: ['בוינג!', 'דונג!', 'טוז!'] },
    { id: 'brass',    name: 'אגרופן', dmg: 7, pow: 4, anim: 'punch', impact: [64, 52], grip: [64, 90],  rot: 0,   size: .24, sfx: 'punch',  mark: 'bruise+',  words: ['קראנץ\'!', 'בום!', 'אוי!'] },
    { id: 'hammer',   name: 'פטיש',   dmg: 8, pow: 5, anim: 'swing', impact: [16, 32], grip: [64, 118], rot: -40, size: .38, sfx: 'clank',  mark: 'bump',     words: ['טונק!', 'קלאנג!', 'טוז!'] },
    { id: 'saw',      name: 'מסור',   dmg: 8, pow: 5, anim: 'saw',   impact: [42, 86], grip: [104, 64], rot: 0,   size: .40, sfx: 'saw',    mark: 'scratch',  words: ['זזזזט!', 'ריצ\'!', 'אוי!'] },
    { id: 'egg',      name: 'ביצה',   dmg: 2, pow: 1, anim: 'throw', impact: [64, 64], grip: [64, 64],  rot: 0,   size: .18, sfx: 'splat',  mark: 'egg',      words: ['שפלאט!', 'איכס!', 'טוז!'] },
    { id: 'chair',    name: 'כיסא כתר', dmg: 9, pow: 5, anim: 'swing', impact: [64, 40], grip: [36, 120], rot: 0, size: .42, sfx: 'clank', mark: 'bump', words: ['קראש!', 'טונק!', 'טוז!'] },
    { id: 'table',    name: 'שולחן כתר', dmg: 11, pow: 5, anim: 'swing', impact: [100, 50], grip: [20, 118], rot: 0, size: .48, sfx: 'thud', mark: 'bump', words: ['בום!', 'דאנג!', 'טוז!'] },
    { id: 'vase',     name: 'אגרטל', dmg: 6, pow: 3, anim: 'throw', impact: [64, 64], grip: [64, 64], rot: 0, size: .26, sfx: 'shatter', mark: 'bruise', words: ['קראש!', 'פראק!', 'טוז!'] },
  ];

  function rotPt([x, y], deg) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const dx = x - 64, dy = y - 64;
    return [64 + dx * c - dy * s, 64 + dx * s + dy * c];
  }

  for (const t of TOOLS) {
    t.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[t.id]);
    t.impactR = rotPt(t.impact, t.rot);
    t.gripR = rotPt(t.grip, t.rot);
    t.img = new Image();
    t.img.src = t.src;
  }

  window.TOOLS = TOOLS;
})();
