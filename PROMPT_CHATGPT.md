# פרומט ל-ChatGPT — יצירת הדמות המצוירת למשחק

## איך משתמשים
1. פותחים שיחה חדשה ב-ChatGPT (מודל יצירת תמונות).
2. מצרפים **את כל התמונות של הדמות המצוירת** (כל הזוויות) **ואת `assets/hero.png`** (התמונה הקיימת — היא הייחוס לפוזה, למסגור ולפרופורציות).
3. מדביקים את הפרומט שלמטה.
4. מורידים את התוצאה כ-PNG שקוף ושומרים כ-`assets/hero.png` (דורסים את הקיים).
5. אם התמונה יצאה בגודל אחר — לא נורא, היחס חשוב (≈ 1 : 3.07). מומלץ לחתוך/לשנות ל-**345×1058**. אם הפרופורציות של הראש שונות — שלח לי את התמונה ואכוון את קואורדינטות הראש בקוד.

---

## הפרומט (להדביק כמו שהוא)

```
You are given two kinds of input images:
(A) several reference images of MY CARTOON CHARACTER from different angles — this defines WHO the character is (face, hair, outfit, colors, art style, line work). Keep him 100% consistent with these.
(B) one reference photo, "hero.png" — this defines the EXACT POSE, FRAMING AND PROPORTIONS I need. It is a full-body standing figure, 3/4 view, facing slightly to the viewer's left, arms relaxed down at the sides, feet together.

TASK: Redraw the standing figure from (B) as my cartoon character from (A) — same pose, same camera angle, same framing — as a single full-body image for a mobile game where players hit the character.

HARD REQUIREMENTS
1. CANVAS: tall vertical image, aspect ratio 345:1058 (about 1 : 3.07). If you can't do that exactly, use the tallest portrait size available, and keep the figure centered with the same relative margins as in (B).
2. BACKGROUND: fully transparent PNG (real alpha channel). No floor, no shadow, no ground line, no background, no vignette, no text, no watermark. If transparency is impossible, use a perfectly flat pure white (#FFFFFF) background and tell me.
3. POSE & FRAMING identical to (B): head at the very top of the canvas (top of the head touches the top edge, ~0–1% margin), feet touching the bottom edge, figure centered horizontally. Head occupies roughly the top 20% of the height (head + neck ≈ 216 of 1058 px). Neck/chin joint at about 17% of the height, horizontally at about 52% of the width. Eyes at about 10% of the height, left eye ~42% and right eye ~55% of the width. Feet at about 44% of the width. Body is slightly turned, shoulders broad, the right hand (viewer's left) hangs by the thigh, left hand hangs in front of the hip.
4. HEAD MUST BE CLEAN AND SEPARABLE: the game cuts the head off at the neck and tilts/shakes it independently when hit. So: the neck must be clearly visible with a clean, simple area (no scarf, no collar, no hair or objects overlapping the neck), the head must not be tilted or turned more than in (B), and nothing (arms, hair, props) may cross in front of the neck.
5. EYES: draw the eyes OPEN, looking at the viewer, with simple clean whites and pupils and NO eyebrow/eyelid overlap shadows — the game paints black eyes (shiners), swelling and bruises over them as the character takes damage.
6. NO DAMAGE: the character must look completely fresh and untouched — NO bruises, NO blood, NO bandages, NO scratches, NO black eyes, NO dirt, NO sweat, NO torn clothes. The game engine draws all hit marks (bruises, black eyes, bumps, egg splats, scratches, bandages) procedurally on top of the image. Flat, clean skin and clothes only.
7. STYLE: the same cartoon style as (A) — bold, thick dark-ink outline (~4–6 px at 1000 px height), flat cel colors with minimal soft shading, high contrast, sticker-like look, crisp edges with no halo or glow around the outline. The outline must be a closed, continuous silhouette, because the game uses the silhouette for hit detection.
8. COLORS: skin tones and clothing must be mid-to-light value with visible skin areas (face, arms, hands) — bruise marks multiply over skin, so skin must not be dark or heavily textured. Avoid pure black large areas on the face. Clothes can be dark but keep some fabric detail so scratches and tears are visible.
9. FACE: neutral, slightly smug/cocky expression, mouth slightly open as if about to say something, same as the attitude of the person in (B). Do not add speech bubbles.
10. ONE character only, ONE image only, no collage, no turnaround sheet, no extra poses, no props in hands, nothing cropped.

OUTPUT: a single PNG, full body, as described. If anything in the requirements conflicts with the references, the references in (A) win for identity and (B) wins for pose/proportions.
```

---

## טיפים אם התוצאה לא מושלמת
- **רקע לא שקוף:** תבקש "remove the background and export as transparent PNG", או תריץ ב-remove.bg / הכלי של Photoshop/Canva.
- **הראש גדול/קטן מדי יחסית ל-hero.png:** תבקש "make the head 20% of total height, exactly like the reference photo".
- **יצא עם סימני מכות / פנס:** תבקש "regenerate with a completely clean untouched face and body".
- **הצוואר חסום:** תבקש "free the neck area — nothing overlapping the neck".
- אחרי שמחליפים את `assets/hero.png` — לרענן את הדף (אם המשחק מותקן כאפליקציה, לסגור ולפתוח פעמיים כדי שהקאש יתעדכן).
