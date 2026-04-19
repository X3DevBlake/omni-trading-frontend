import * as THREE from "three";

export function makeSeededRand(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Cheap 2D value noise on a grid (used to carve continent masks)

export function makeNoiseGrid(w, h, scale, rand) {
  const gw = Math.ceil(w / scale) + 2, gh = Math.ceil(h / scale) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const sample = (x, y) => {
    const gx = x / scale, gy = y / scale;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    const fx = gx - ix, fy = gy - iy;
    const a = grid[iy * gw + ix];
    const b = grid[iy * gw + ix + 1];
    const c = grid[(iy + 1) * gw + ix];
    const d = grid[(iy + 1) * gw + ix + 1];
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };
  return sample;
}

export function makePlanetTexture(palette, seed = 1, kind = "terran") {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const g = c.getContext("2d");
  const rand = makeSeededRand(seed * 9973 + 17);

  // Base fill
  g.fillStyle = palette.base; g.fillRect(0, 0, 1024, 512);

  // Latitudinal bands (stronger for gas giants)
  const bandCount = kind === "gas" ? 36 : 18;
  const bandAlpha = kind === "gas" ? 0.18 : 0.08;
  for (let i = 0; i < bandCount; i++) {
    const y = (i / bandCount) * 512;
    const h = (kind === "gas" ? 14 : 10) + Math.sin(i * seed * 2.3) * 6;
    g.fillStyle = `${palette.band}${(bandAlpha + rand() * 0.14).toFixed(3)})`;
    g.fillRect(0, y, 1024, h);
  }

  // Continents / landmasses via fractal noise mask (for rocky/terran kinds)
  if (kind === "terran" || kind === "ice" || kind === "lava") {
    const land = makeNoiseGrid(1024, 512, 60, makeSeededRand(seed * 31 + 7));
    const detail = makeNoiseGrid(1024, 512, 14, makeSeededRand(seed * 71 + 3));
    const img = g.getImageData(0, 0, 1024, 512);
    const d = img.data;
    const landColor = kind === "terran" ? [92, 138, 82]
                     : kind === "ice"   ? [210, 232, 248]
                     : [180, 52, 30]; // lava
    const beachColor = kind === "terran" ? [198, 180, 130]
                       : kind === "ice"   ? [180, 210, 230]
                       : [240, 140, 40];
    for (let y = 0; y < 512; y++) {
      // Latitude shading (poles lighter for terran)
      const lat = Math.abs(y - 256) / 256;
      for (let x = 0; x < 1024; x++) {
        const v = land(x, y) * 0.7 + detail(x, y) * 0.3;
        // Wrap X: pull edges toward same value for seamless wrap
        const edgeFade = Math.min(1, x / 40, (1024 - x) / 40);
        const threshold = 0.52 + lat * 0.05;
        if (v > threshold) {
          const idx = (y * 1024 + x) * 4;
          const strength = Math.min(1, (v - threshold) * 5);
          const isCoast = strength < 0.25;
          const col = isCoast ? beachColor : landColor;
          const mix = edgeFade * strength;
          // Ice cap tint at poles for terran
          const polar = kind === "terran" && lat > 0.7 ? (lat - 0.7) * 3.3 : 0;
          const r = col[0] * (1 - polar) + 240 * polar;
          const gg = col[1] * (1 - polar) + 245 * polar;
          const b = col[2] * (1 - polar) + 250 * polar;
          d[idx    ] = d[idx    ] * (1 - mix) + r  * mix;
          d[idx + 1] = d[idx + 1] * (1 - mix) + gg * mix;
          d[idx + 2] = d[idx + 2] * (1 - mix) + b  * mix;
        }
      }
    }
    g.putImageData(img, 0, 0);
  }

  // Storm / spot detail
  const spotCount = kind === "gas" ? 24 : 90;
  for (let i = 0; i < spotCount; i++) {
    const x = rand() * 1024, y = rand() * 512;
    const r = (kind === "gas" ? 20 : 6) + rand() * (kind === "gas" ? 60 : 30);
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, palette.spot + (kind === "gas" ? "0.55" : "0.38") + ")");
    rg.addColorStop(1, palette.spot + "0)");
    g.fillStyle = rg;
    g.beginPath();
    if (kind === "gas") g.ellipse(x, y, r * 1.6, r * 0.7, 0, 0, Math.PI * 2);
    else g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // Highlights
  for (let i = 0; i < 70; i++) {
    const x = rand() * 1024, y = rand() * 512;
    const r = 2 + rand() * 5;
    g.fillStyle = palette.hi + (0.22 + rand() * 0.28).toFixed(2) + ")";
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// City lights emissive map — only bright where terran "land" is.
// For gas/ice/lava planets returns a dark texture (no cities).

export function makeCityLightsTexture(seed = 1, kind = "terran") {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 512);
  if (kind !== "terran") {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const land = makeNoiseGrid(1024, 512, 60, makeSeededRand(seed * 31 + 7));
  const detail = makeNoiseGrid(1024, 512, 14, makeSeededRand(seed * 71 + 3));
  const rand = makeSeededRand(seed * 41 + 13);
  // Scatter city lights where land is above threshold, denser near equator
  for (let i = 0; i < 2200; i++) {
    const x = rand() * 1024;
    const y = 40 + rand() * 432; // avoid poles
    const lat = Math.abs(y - 256) / 256;
    if (rand() < lat * 0.6) continue;
    const v = land(x, y) * 0.7 + detail(x, y) * 0.3;
    if (v < 0.58) continue;
    const r = 0.6 + rand() * 1.4;
    const bright = (0.55 + rand() * 0.45);
    const hue = rand() < 0.25 ? "180,220,255" : "255,215,160"; // bluish or warm
    g.fillStyle = `rgba(${hue},${bright.toFixed(2)})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Moon / asteroid surface — cratered gray texture

export function makeMoonTexture(seed = 1, baseColor = "#a8a39b") {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  const rand = makeSeededRand(seed * 7 + 3);
  g.fillStyle = baseColor; g.fillRect(0, 0, 512, 256);
  // Regolith noise
  const n = makeNoiseGrid(512, 256, 24, makeSeededRand(seed * 11 + 9));
  const img = g.getImageData(0, 0, 512, 256);
  const d = img.data;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      const v = n(x, y);
      const tone = (v - 0.5) * 40;
      const idx = (y * 512 + x) * 4;
      d[idx    ] = Math.max(0, Math.min(255, d[idx    ] + tone));
      d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + tone));
      d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + tone));
    }
  }
  g.putImageData(img, 0, 0);
  // Craters
  for (let i = 0; i < 80; i++) {
    const x = rand() * 512, y = rand() * 256;
    const r = 3 + rand() * 18;
    const rg = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    rg.addColorStop(0, "rgba(25,25,30,0.55)");
    rg.addColorStop(0.75, "rgba(255,255,255,0.12)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    const x = Math.random()*512, y = Math.random()*256;
    const r = 6 + Math.random()*30;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, "rgba(255,255,255," + (0.25+Math.random()*0.3).toFixed(2) + ")");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
