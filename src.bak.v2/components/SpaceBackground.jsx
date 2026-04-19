import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Line } from "recharts";
import { makeCityLightsTexture, makeCloudTexture, makeMoonTexture, makePlanetTexture } from "../lib/planetTextures";
import { PLANET_TEXTURES, loadPlanetTexture } from "../lib/planetImages";

export function SpaceBackground({ warp = 0 }) {
  const ref = useRef(null);
  const warpRef = useRef(warp);
  useEffect(() => { warpRef.current = warp; }, [warp]);

  useEffect(() => {
    const el = ref.current; if (!el) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020510, 0.0015);

    const cam = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 3000);
    cam.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x02040a);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.innerHTML = "";
    el.appendChild(renderer.domElement);

    // World group — stays centered around camera on Z so "flying forward" feels endless
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    /* ─── Deep starfield (5 layers for parallax + more density) ─── */
    const starLayers = [];
    [
      { count: 3000, dist: 1400, size: 1.0, color: 0xffffff },   // far white
      { count: 2200, dist: 900,  size: 1.3, color: 0xbfe0ff },   // mid blue-white
      { count: 1600, dist: 600,  size: 1.8, color: 0xffd9a0 },   // mid warm
      { count: 1000, dist: 340,  size: 2.4, color: 0xffe8c0 },   // close warm
      { count:  500, dist: 200,  size: 3.0, color: 0xd8ecff },   // closest cool
    ].forEach(cfg => {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(cfg.count * 3);
      const col = new Float32Array(cfg.count * 3);
      for (let i = 0; i < cfg.count; i++) {
        const u = Math.random(), v = Math.random();
        const theta = 2*Math.PI*u, phi = Math.acos(2*v - 1);
        const r = cfg.dist * (0.65 + Math.random()*0.55);
        pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        // Occasional color-hot star (bluish or reddish) for variety
        const hotRoll = Math.random();
        let tint = cfg.color;
        if (hotRoll > 0.985) tint = 0xff6a6a;      // red giant
        else if (hotRoll > 0.97) tint = 0x80a8ff;  // blue supergiant
        else if (hotRoll > 0.94) tint = 0xffe58a;  // yellow
        const b = 0.55 + Math.random()*0.45;
        const base = new THREE.Color(tint);
        col[i*3]   = base.r * b;
        col[i*3+1] = base.g * b;
        col[i*3+2] = base.b * b;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));

      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 32;
      const cx = canvas.getContext("2d");
      const grd = cx.createRadialGradient(16,16,0,16,16,16);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.3, "rgba(255,255,255,0.8)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      cx.fillStyle = grd; cx.fillRect(0,0,32,32);
      const tex = new THREE.CanvasTexture(canvas);

      const m = new THREE.PointsMaterial({
        size: cfg.size, map: tex, vertexColors: true,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const points = new THREE.Points(g, m);
      worldGroup.add(points);
      starLayers.push({
        points,
        speed: cfg.dist > 1000 ? 0.015 : cfg.dist > 700 ? 0.025 : cfg.dist > 400 ? 0.05 : cfg.dist > 250 ? 0.09 : 0.14,
      });
    });

    /* ─── Warp-speed streak field (for "flying through space" feel) ─── */
    const WARP_COUNT = 900;
    const warpGeom = new THREE.BufferGeometry();
    const warpPositions = new Float32Array(WARP_COUNT * 6); // line segments: (x,y,z)(x,y,z)
    const warpColors = new Float32Array(WARP_COUNT * 6);
    const warpData = new Array(WARP_COUNT); // per-particle anchor

    const spawnWarp = (i) => {
      // Random point in a disk in front of camera, starting at variable depth
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 320;
      const depth = -50 - Math.random() * 900; // negative z = away from cam (forward)
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      warpData[i] = { x, y, z: depth, len: 0.5 + Math.random() * 4, hue: Math.random() };
    };
    for (let i = 0; i < WARP_COUNT; i++) spawnWarp(i);

    warpGeom.setAttribute("position", new THREE.BufferAttribute(warpPositions, 3));
    warpGeom.setAttribute("color", new THREE.BufferAttribute(warpColors, 3));
    const warpMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const warpLines = new THREE.LineSegments(warpGeom, warpMat);
    scene.add(warpLines);

    /* ─── Volumetric nebula (5 layered shader planes) ─── */
    const nebulae = [];
    const nebulaShader = {
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0x7cc8ff) },
        uColorB: { value: new THREE.Color(0xb089ff) },
        uSeed: { value: Math.random()*100 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime; uniform float uSeed;
        uniform vec3 uColorA; uniform vec3 uColorB;
        // Simplex-ish cheap noise
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          float a = hash(i), b = hash(i+vec2(1,0));
          float c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
        }
        float fbm(vec2 p){
          float v = 0.0, amp = 0.5;
          for(int i=0;i<5;i++){ v += amp*noise(p); p *= 2.1; amp *= 0.5; }
          return v;
        }
        void main(){
          vec2 p = (vUv - 0.5) * 3.0;
          float t = uTime * 0.04 + uSeed;
          float n = fbm(p + vec2(t, t*0.7));
          n = pow(n, 2.2);
          float dist = length(vUv - 0.5);
          float fade = smoothstep(0.55, 0.0, dist);
          vec3 col = mix(uColorA, uColorB, fbm(p*0.5 + uSeed));
          col *= n * 2.2;
          float alpha = n * fade * 0.65;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    };

    const nebulaConfigs = [
      { pos: [-120, 40, -280], scale: 400, colA: 0x3050a0, colB: 0x0a1430 },
      { pos: [180, -50, -320], scale: 450, colA: 0x6020a0, colB: 0x1a0830 },
      { pos: [-60, 80, -500], scale: 600, colA: 0x203a7a, colB: 0x0a1025 },
      { pos: [220, 100, -400], scale: 350, colA: 0x1a5878, colB: 0x081830 },
      { pos: [-200, -80, -450], scale: 500, colA: 0x4530a0, colB: 0x100a2e },
    ];
    nebulaConfigs.forEach((cfg, i) => {
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: i*13.7 },
          uColorA: { value: new THREE.Color(cfg.colA) },
          uColorB: { value: new THREE.Color(cfg.colB) },
        },
        vertexShader: nebulaShader.vertexShader,
        fragmentShader: nebulaShader.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...cfg.pos);
      mesh.scale.set(cfg.scale, cfg.scale, 1);
      worldGroup.add(mesh);
      nebulae.push({ mesh, mat });
    });

    /* ─── Gaussian splat cloud — billboarded anisotropic gaussians (3DGS-style) ───
       Real 3D Gaussian Splatting renders millions of oriented gaussians with
       alpha-blended compositing. This is a visual approximation: ~3,500 camera-
       facing quads with gaussian-falloff shader, anisotropic scale, per-splat
       color + rotation + opacity. Renders like a splat cloud without needing a
       .splat asset or external library.

       Upgrades: 15,000 splats (was 3,500), view-dependent color shift
       approximating spherical harmonics, true anisotropic covariance,
       proper 2D gaussian alpha (exp(-4r²) per the 3DGS paper). */
    const SPLAT_COUNT = 15000;
    const splatGeo = new THREE.BufferGeometry();
    // Each splat = 1 quad (2 tris = 6 verts) instanced via InstancedBufferGeometry
    const baseQuad = new Float32Array([
      -1,-1, 0,   1,-1, 0,   1, 1, 0,
      -1,-1, 0,   1, 1, 0,  -1, 1, 0,
    ]);
    const baseUv = new Float32Array([
       0,0,  1,0,  1,1,
       0,0,  1,1,  0,1,
    ]);
    splatGeo.setAttribute("position", new THREE.BufferAttribute(baseQuad, 3));
    splatGeo.setAttribute("uv", new THREE.BufferAttribute(baseUv, 2));
    const instGeo = new THREE.InstancedBufferGeometry();
    instGeo.index = splatGeo.index;
    instGeo.attributes.position = splatGeo.attributes.position;
    instGeo.attributes.uv = splatGeo.attributes.uv;

    const iPositions = new Float32Array(SPLAT_COUNT * 3);
    const iScales    = new Float32Array(SPLAT_COUNT * 2); // anisotropic (major, minor axis)
    const iRotations = new Float32Array(SPLAT_COUNT);     // angle in radians
    const iColors    = new Float32Array(SPLAT_COUNT * 3); // base (DC) color
    const iColorsB   = new Float32Array(SPLAT_COUNT * 3); // directional tint for view-dependent shift
    const iOpacities = new Float32Array(SPLAT_COUNT);
    const iNormals   = new Float32Array(SPLAT_COUNT * 3); // preferred view direction for color A/B blend

    // Nebula palette pairs — each splat gets (primary, secondary) so color
    // shifts with viewing angle, mimicking spherical harmonics lighting.
    const splatPaletteA = [
      [0.45, 0.30, 0.85], // violet
      [0.30, 0.55, 0.95], // blue
      [0.85, 0.45, 0.75], // rose
      [0.95, 0.80, 0.55], // gold dust
      [0.25, 0.70, 0.90], // cyan
      [0.60, 0.40, 1.00], // lavender
      [0.90, 0.55, 0.40], // orange-hydrogen
      [0.35, 0.85, 0.65], // teal
    ];
    const splatPaletteB = [
      [0.80, 0.45, 0.95], // bright magenta
      [0.60, 0.75, 1.00], // ice blue
      [1.00, 0.70, 0.85], // pink
      [1.00, 0.95, 0.75], // bright gold
      [0.55, 0.90, 1.00], // electric cyan
      [0.85, 0.70, 1.00], // light violet
      [1.00, 0.75, 0.55], // amber
      [0.60, 1.00, 0.85], // mint
    ];

    // 6 galactic clusters, bigger + deeper than before for denser appearance
    const clusterCenters = [
      [-320,   80, -650],
      [ 380, -100, -780],
      [-100,  150, -950],
      [ 220,  -70, -1150],
      [-420,  -40, -1400],
      [ 150,  120, -1700],
    ];

    for (let i = 0; i < SPLAT_COUNT; i++) {
      const cluster = i % clusterCenters.length;
      const [cx, cy, cz] = clusterCenters[cluster];
      // Box-Muller gaussian distribution, 3D
      const r1 = Math.random() || 0.001;
      const r2 = Math.random();
      const r3 = Math.random() || 0.001;
      const r4 = Math.random();
      const gx = Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2);
      const gy = Math.sqrt(-2 * Math.log(r1)) * Math.sin(2 * Math.PI * r2);
      const gz = Math.sqrt(-2 * Math.log(r3)) * Math.cos(2 * Math.PI * r4);
      iPositions[i*3]     = cx + gx * (90 + Math.random() * 70);
      iPositions[i*3 + 1] = cy + gy * (55 + Math.random() * 50);
      iPositions[i*3 + 2] = cz + gz * 140;

      // Anisotropic scale — elongation ratio up to 4×
      const baseScale = 1.8 + Math.random() * 6.5;
      const aniso = 0.3 + Math.random() * 3.5;
      iScales[i*2]     = baseScale * aniso;
      iScales[i*2 + 1] = baseScale / aniso;
      iRotations[i] = Math.random() * Math.PI * 2;

      // Paired palette for view-dependent blending
      const pIdx = Math.floor(Math.random() * splatPaletteA.length);
      const palA = splatPaletteA[pIdx];
      const palB = splatPaletteB[pIdx];
      const jit = 0.85 + Math.random() * 0.3;
      iColors[i*3]     = palA[0] * jit;
      iColors[i*3 + 1] = palA[1] * jit;
      iColors[i*3 + 2] = palA[2] * jit;
      iColorsB[i*3]     = palB[0] * jit;
      iColorsB[i*3 + 1] = palB[1] * jit;
      iColorsB[i*3 + 2] = palB[2] * jit;

      // Random preferred-view normal (unit vector)
      const nx = (Math.random() - 0.5) * 2;
      const ny = (Math.random() - 0.5) * 2;
      const nz = (Math.random() - 0.5) * 2;
      const nl = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
      iNormals[i*3]     = nx / nl;
      iNormals[i*3 + 1] = ny / nl;
      iNormals[i*3 + 2] = nz / nl;

      // Opacity — power-law distribution keeps scene bright without over-saturation
      iOpacities[i] = Math.pow(Math.random(), 2.0) * 0.48;
    }

    instGeo.setAttribute("iPos",     new THREE.InstancedBufferAttribute(iPositions, 3));
    instGeo.setAttribute("iScale",   new THREE.InstancedBufferAttribute(iScales, 2));
    instGeo.setAttribute("iRot",     new THREE.InstancedBufferAttribute(iRotations, 1));
    instGeo.setAttribute("iColor",   new THREE.InstancedBufferAttribute(iColors, 3));
    instGeo.setAttribute("iColorB",  new THREE.InstancedBufferAttribute(iColorsB, 3));
    instGeo.setAttribute("iOpacity", new THREE.InstancedBufferAttribute(iOpacities, 1));
    instGeo.setAttribute("iNormal",  new THREE.InstancedBufferAttribute(iNormals, 3));
    instGeo.instanceCount = SPLAT_COUNT;

    const splatMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute vec3 iPos;
        attribute vec2 iScale;
        attribute float iRot;
        attribute vec3 iColor;
        attribute vec3 iColorB;
        attribute float iOpacity;
        attribute vec3 iNormal;
        varying vec2 vUv;
        varying vec3 vCol;
        varying float vOp;
        void main(){
          vUv = uv;
          // View-dependent color blend based on dot(normal, viewDir).
          // This approximates the directional color term of 3DGS spherical
          // harmonics: splats look slightly different from different angles.
          vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
          vec3 viewDir = normalize(-mv.xyz);
          vec3 nrm = normalize(mat3(modelViewMatrix) * iNormal);
          float facing = max(dot(nrm, viewDir), 0.0);
          vCol = mix(iColor, iColorB, facing * 0.75);
          vOp = iOpacity;
          // Rotate + scale the quad in view-space (proper billboard)
          float cs = cos(iRot), sn = sin(iRot);
          vec2 p2 = vec2(position.x * iScale.x, position.y * iScale.y);
          p2 = vec2(p2.x * cs - p2.y * sn, p2.x * sn + p2.y * cs);
          mv.xy += p2;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vCol;
        varying float vOp;
        void main(){
          // Proper 2D gaussian: G(d) = exp(-4·d²) where d is normalized dist
          // from center. Matches the 3DGS paper's alpha convention.
          vec2 d = vUv - 0.5;
          float r2 = dot(d, d) * 4.0;
          float g = exp(-r2 * 4.0);
          if (g < 0.004) discard;
          gl_FragColor = vec4(vCol, g * vOp);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const splatMesh = new THREE.Mesh(instGeo, splatMat);
    worldGroup.add(splatMesh);

    /* ─── Sophisticated planets — distant, highly detailed, with rings & moons ─── */
    const planets = [];
    const moons = [];
    const asteroids = []; // no asteroid belt now
    const satellites = []; // no satellites now

    // Palette + kind per planet (rich details via makePlanetTexture + emissive city lights).
    // `nasaKey` references a PLANET_TEXTURES entry — if the image loads from the public-domain
    // Wikimedia Commons CDN, the procedural texture is swapped out for real imagery.
    const planetConfigs = [
      {
        // Earth — Apollo 17 Blue Marble when NASA imagery loads, procedural fallback
        kind: "terran",
        nasaKey: "earth",
        palette: { base:"#1e3a5e", band:"rgba(70,130,180,", spot:"rgba(130,200,170,", hi:"rgba(220,240,255," },
        atmo: 0x5098d8,
        size: 50,
        pos: [-420, 60, -1600],
        tilt: 0.25,
        spin: 0.00035,
        hasRing: false,
        moonCount: 2,
      },
      {
        // Gas giant with rings + 3 moons — tries Jupiter Hubble imagery, purple fallback
        kind: "gas",
        nasaKey: "jupiter",
        palette: { base:"#3a1a4a", band:"rgba(150,80,180,", spot:"rgba(220,140,240,", hi:"rgba(240,200,255," },
        atmo: 0xa070c8,
        size: 85,
        pos: [520, -80, -2100],
        tilt: -0.3,
        spin: 0.00025,
        hasRing: true,
        moonCount: 3,
      },
    ];

    planetConfigs.forEach((cfg, pi) => {
      // Hi-detail sphere (128×128 for smooth edges at close zoom)
      const pg = new THREE.SphereGeometry(1, 128, 128);
      const surfaceTex = makePlanetTexture(cfg.palette, pi + 3, cfg.kind);
      const cloudTex = makeCloudTexture();
      const nightTex = makeCityLightsTexture(pi + 3, cfg.kind);      const surfaceMat = new THREE.MeshStandardMaterial({
        map: surfaceTex,
        roughness: cfg.kind === "gas" ? 0.95 : 0.78,
        metalness: 0.04,
        emissiveMap: nightTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: cfg.kind === "terran" ? 1.4 : 0.0,
      });
      const planet = new THREE.Mesh(pg, surfaceMat);

      // Cloud layer (slightly larger radius, semi-transparent)
      const cg = new THREE.SphereGeometry(1.015, 96, 96);
      const cm = new THREE.MeshStandardMaterial({
        map: cloudTex, transparent: true,
        opacity: cfg.kind === "gas" ? 0.22 : 0.5,
        depthWrite: false, roughness: 1.0,
      });
      const clouds = new THREE.Mesh(cg, cm);

      // Atmosphere fresnel shell
      const ag = new THREE.SphereGeometry(1.18, 96, 96);
      const am = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(cfg.atmo) } },
        vertexShader: `
          varying vec3 vN; varying vec3 vP;
          void main(){
            vN = normalize(normalMatrix * normal);
            vec4 wp = modelViewMatrix * vec4(position,1.0);
            vP = wp.xyz;
            gl_Position = projectionMatrix * wp;
          }`,
        fragmentShader: `
          varying vec3 vN; varying vec3 vP;
          uniform vec3 uColor;
          void main(){
            vec3 V = normalize(-vP);
            float f = pow(1.0 - max(dot(V, vN), 0.0), 2.6);
            gl_FragColor = vec4(uColor * f * 1.6, f * 0.85);
          }`,
        transparent: true, side: THREE.BackSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const atmo = new THREE.Mesh(ag, am);

      const pivot = new THREE.Group();
      pivot.add(planet); pivot.add(clouds); pivot.add(atmo);

      // Ring system for the gas giant
      if (cfg.hasRing) {
        // Main ring
        const rg = new THREE.RingGeometry(1.55, 2.55, 160);
        const rc = document.createElement("canvas");
        rc.width = 1024; rc.height = 1;
        const rctx = rc.getContext("2d");
        for (let x = 0; x < 1024; x++) {
          // Gap + band pattern — realistic Saturn-style
          const band = Math.sin(x * 0.12) * 0.5 + 0.5;
          const gap = (x > 440 && x < 470) || (x > 720 && x < 740);
          const alpha = gap ? 0 : (0.4 + band * 0.45);
          const bright = 190 + Math.random() * 50;
          rctx.fillStyle = `rgba(${bright + 20},${bright - 5},${bright - 40},${alpha.toFixed(2)})`;
          rctx.fillRect(x, 0, 1, 1);
        }
        const ringTex = new THREE.CanvasTexture(rc);
        const rmat = new THREE.MeshBasicMaterial({
          map: ringTex, transparent: true, side: THREE.DoubleSide,
          opacity: 0.92, depthWrite: false,
        });
        // Radial UV mapping
        const uvs = rg.attributes.uv;
        const pos = rg.attributes.position;
        for (let vi = 0; vi < uvs.count; vi++) {
          const x = pos.getX(vi), y = pos.getY(vi);
          const r = Math.sqrt(x*x + y*y);
          uvs.setXY(vi, (r - 1.55) / (2.55 - 1.55), 0.5);
        }
        const ring = new THREE.Mesh(rg, rmat);
        ring.rotation.x = Math.PI / 2 - 0.25;
        pivot.add(ring);

        // Two thin ringlets (inner + outer)
        [{ri: 1.42, ro: 1.52, op: 0.4, c: 0xd8c4a0},
         {ri: 2.6,  ro: 2.78, op: 0.28, c: 0xc0b090}].forEach(rcfg => {
          const g2 = new THREE.RingGeometry(rcfg.ri, rcfg.ro, 128);
          const m2 = new THREE.MeshBasicMaterial({
            color: rcfg.c, transparent: true, opacity: rcfg.op,
            side: THREE.DoubleSide, depthWrite: false,
          });
          const r2 = new THREE.Mesh(g2, m2);
          r2.rotation.x = Math.PI / 2 - 0.25;
          pivot.add(r2);
        });
      }

      pivot.scale.setScalar(cfg.size);
      pivot.position.set(...cfg.pos);
      pivot.rotation.z = cfg.tilt;

      // Moon halo — soft bloom around the planet
      const haloCanvas = document.createElement("canvas");
      haloCanvas.width = 256; haloCanvas.height = 256;
      const hx = haloCanvas.getContext("2d");
      const hgrad = hx.createRadialGradient(128, 128, 40, 128, 128, 128);
      hgrad.addColorStop(0, `rgba(${(cfg.atmo >> 16) & 255},${(cfg.atmo >> 8) & 255},${cfg.atmo & 255},0.45)`);
      hgrad.addColorStop(0.4, `rgba(${(cfg.atmo >> 16) & 255},${(cfg.atmo >> 8) & 255},${cfg.atmo & 255},0.1)`);
      hgrad.addColorStop(1, "rgba(0,0,0,0)");
      hx.fillStyle = hgrad;
      hx.fillRect(0, 0, 256, 256);
      const haloTex = new THREE.CanvasTexture(haloCanvas);
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.7,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.set(4.2, 4.2, 1);
      pivot.add(halo);

      worldGroup.add(pivot);
      planets.push({
        pivot, planet, clouds, atmo, am, halo,
        kind: cfg.kind, spin: cfg.spin, scale: cfg.size,
        surfaceMat, procTex: surfaceTex, nasaKey: cfg.nasaKey,
      });

      // Moons
      for (let mi = 0; mi < cfg.moonCount; mi++) {
        const mtex = makeMoonTexture((pi + 3) * 11 + mi * 3, ["#a8a39b","#c8b8a0","#8a8880"][mi % 3]);
        const mmat = new THREE.MeshStandardMaterial({
          map: mtex, roughness: 0.95, metalness: 0.0,
          emissive: 0x111115, emissiveIntensity: 0.05,
        });
        const msize = (cfg.kind === "gas" ? 0.1 : 0.17) + Math.random() * 0.06;
        const moon = new THREE.Mesh(new THREE.SphereGeometry(msize, 48, 48), mmat);
        const orbitGroup = new THREE.Group();
        pivot.add(orbitGroup);
        orbitGroup.add(moon);
        const orbitR = 1.7 + mi * 0.5 + Math.random() * 0.2;
        moon.position.set(orbitR, 0, 0);
        orbitGroup.rotation.x = (Math.random() - 0.5) * 0.5;
        moons.push({
          orbit: orbitGroup, mesh: moon,
          phase: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.004,
          spin: 0.008 + Math.random() * 0.012,
        });
      }
    });

    /* ─── Async NASA planet-imagery upgrade ───
       Procedural textures render immediately; if the public-domain NASA/ESA
       imagery loads successfully from Wikimedia Commons, swap it in for much
       higher fidelity. Loads fail silently (ad-blocker, CORS, offline) and
       the scene keeps its procedural fallback. */
    planets.forEach(p => {
      if (!p.nasaKey) return;
      const cfg = PLANET_TEXTURES[p.nasaKey];
      if (!cfg) return;
      loadPlanetTexture(THREE, cfg.color).then(tex => {
        if (!tex || !p.surfaceMat) return;
        p.surfaceMat.map = tex;
        p.surfaceMat.needsUpdate = true;
        // Keep procedural night-lights / clouds — they're atmospheric details
        // the NASA still image doesn't include.
      });
    });

    /* ─── Space dust — dense near-field particles streaming past the camera ─── */
    const DUST_COUNT = 1800;
    const dustGeom = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustColors = new Float32Array(DUST_COUNT * 3);
    const dustSizes = new Float32Array(DUST_COUNT);
    const dustData = new Array(DUST_COUNT);

    const spawnDust = (i, camZNow) => {
      // Random point in a cylinder ahead of the camera
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 180;
      const z = camZNow - 20 - Math.random() * 800;
      dustData[i] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z,
        tint: Math.random(),
      };
    };
    for (let i = 0; i < DUST_COUNT; i++) spawnDust(i, 0);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustSizes[i] = 0.3 + Math.random() * 1.2;
    }

    dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeom.setAttribute("color", new THREE.BufferAttribute(dustColors, 3));

    const dustCanvas = document.createElement("canvas");
    dustCanvas.width = dustCanvas.height = 16;
    const dcx = dustCanvas.getContext("2d");
    const dgrd = dcx.createRadialGradient(8, 8, 0, 8, 8, 8);
    dgrd.addColorStop(0, "rgba(255,255,255,1)");
    dgrd.addColorStop(0.4, "rgba(255,255,255,0.55)");
    dgrd.addColorStop(1, "rgba(255,255,255,0)");
    dcx.fillStyle = dgrd; dcx.fillRect(0, 0, 16, 16);
    const dustTex = new THREE.CanvasTexture(dustCanvas);

    const dustMat = new THREE.PointsMaterial({
      size: 1.4, map: dustTex, vertexColors: true,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true,
    });
    const dustPoints = new THREE.Points(dustGeom, dustMat);
    scene.add(dustPoints);

    /* ─── Debris field — tumbling fragments streaming past ─── */
    const debris = [];
    const DEBRIS_COUNT = 80;
    const debrisShapes = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
    ];
    debrisShapes.forEach(g => {
      const pa = g.attributes.position;
      for (let vi = 0; vi < pa.count; vi++) {
        const jitter = 0.7 + Math.random() * 0.6;
        pa.setX(vi, pa.getX(vi) * jitter);
        pa.setY(vi, pa.getY(vi) * jitter);
        pa.setZ(vi, pa.getZ(vi) * jitter);
      }
      g.computeVertexNormals();
    });
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0xa8a196, roughness: 0.95, metalness: 0.0,
      emissive: 0x181818, emissiveIntensity: 0.1,
    });

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const shape = debrisShapes[i % 4];
      const m = new THREE.Mesh(shape, debrisMat);
      const size = 0.3 + Math.random() * 1.6;
      m.scale.setScalar(size);
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 280;
      m.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -100 - Math.random() * 1200
      );
      m.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
      scene.add(m);
      debris.push({
        mesh: m,
        spinX: (Math.random() - 0.5) * 0.025,
        spinY: (Math.random() - 0.5) * 0.025,
        spinZ: (Math.random() - 0.5) * 0.025,
      });
    }

    /* ─── Distant blinking beacons — stations / far-away ships ─── */
    const beaconCount = 40;
    const beaconGeom = new THREE.BufferGeometry();
    const beaconPositions = new Float32Array(beaconCount * 3);
    const beaconColors = new Float32Array(beaconCount * 3);
    const beaconData = new Array(beaconCount);
    for (let i = 0; i < beaconCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 600;
      beaconPositions[i*3]     = Math.cos(angle) * radius;
      beaconPositions[i*3 + 1] = Math.sin(angle) * radius;
      beaconPositions[i*3 + 2] = -300 - Math.random() * 1400;
      const hue = Math.random();
      const col = hue < 0.33 ? [1, 0.3, 0.3] : hue < 0.66 ? [0.3, 0.8, 1] : [1, 0.9, 0.5];
      beaconData[i] = { baseCol: col, phase: Math.random() * Math.PI * 2, speed: 1 + Math.random() * 3 };
      beaconColors[i*3] = col[0]; beaconColors[i*3+1] = col[1]; beaconColors[i*3+2] = col[2];
    }
    beaconGeom.setAttribute("position", new THREE.BufferAttribute(beaconPositions, 3));
    beaconGeom.setAttribute("color", new THREE.BufferAttribute(beaconColors, 3));
    const beaconMat = new THREE.PointsMaterial({
      size: 3.0, map: dustTex, vertexColors: true,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const beaconPoints = new THREE.Points(beaconGeom, beaconMat);
    worldGroup.add(beaconPoints);

    /* ─── Comets — glowing nuclei with long curved ion tails ─── */
    const comets = [];
    const COMET_COUNT = 4;
    const cometHeadGeo = new THREE.SphereGeometry(1, 16, 16);
    for (let ci = 0; ci < COMET_COUNT; ci++) {
      const headMat = new THREE.MeshBasicMaterial({
        color: ci === 0 ? 0xc0f0ff : ci === 1 ? 0xffd890 : ci === 2 ? 0xffa0ff : 0xa0ffb0,
        transparent: true, opacity: 0.95,
      });
      const head = new THREE.Mesh(cometHeadGeo, headMat);
      head.scale.setScalar(0.7 + Math.random() * 0.5);

      const TAIL_PTS = 60;
      const tailGeom = new THREE.BufferGeometry();
      const tailPos = new Float32Array(TAIL_PTS * 3);
      const tailCol = new Float32Array(TAIL_PTS * 3);
      tailGeom.setAttribute("position", new THREE.BufferAttribute(tailPos, 3));
      tailGeom.setAttribute("color", new THREE.BufferAttribute(tailCol, 3));
      const tailMat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const tail = new THREE.Line(tailGeom, tailMat);

      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 128;
      const gcx = glowCanvas.getContext("2d");
      const gg = gcx.createRadialGradient(64, 64, 4, 64, 64, 64);
      gg.addColorStop(0, "rgba(255,255,255,0.95)");
      gg.addColorStop(0.4, "rgba(200,230,255,0.5)");
      gg.addColorStop(1, "rgba(0,0,0,0)");
      gcx.fillStyle = gg;
      gcx.fillRect(0, 0, 128, 128);
      const glowTex = new THREE.CanvasTexture(glowCanvas);
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, opacity: 0.9,
      });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(5, 5, 1);

      const group = new THREE.Group();
      group.add(head); group.add(glow); group.add(tail);
      worldGroup.add(group);

      const radiusA = 450 + Math.random() * 500;
      const radiusB = 250 + Math.random() * 350;
      const inclineX = (Math.random() - 0.5) * 1.0;
      const inclineZ = (Math.random() - 0.5) * 0.8;
      const speed = 0.06 + Math.random() * 0.05;
      const phase = Math.random() * Math.PI * 2;
      const baseZ = -700 - Math.random() * 600;

      comets.push({
        group, head, tail, tailGeom, tailPos, tailCol, glow, glowMat,
        radiusA, radiusB, inclineX, inclineZ, speed, phase, baseZ,
        prevPositions: Array.from({ length: TAIL_PTS }, () => ({ x: 0, y: 0, z: 0 })),
        color: ci === 0 ? [0.75, 0.95, 1.0] : ci === 1 ? [1.0, 0.85, 0.55] : ci === 2 ? [1.0, 0.6, 0.95] : [0.6, 1.0, 0.7],
      });
    }



    /* ─── Detailed ships with thrust trails ─── */
    const ships = [];
    function buildShip(color) {
      const g = new THREE.Group();

      // ─── Main hull — tapered body with cylindrical midsection ───
      const bodyGeo = new THREE.ConeGeometry(0.42, 2.6, 12);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xc0d0e0, metalness: 0.92, roughness: 0.28,
        emissive: 0x0a1220, emissiveIntensity: 0.25,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI/2;
      g.add(body);

      // Hull "band" — dark cylinder detail wrapped around midsection
      const bandGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.5, 16);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0x3a4050, metalness: 0.85, roughness: 0.5,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.x = Math.PI / 2;
      band.position.z = -0.1;
      g.add(band);

      // Rear thruster housing
      const thrusterGeo = new THREE.CylinderGeometry(0.36, 0.3, 0.5, 16);
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x5a6270, metalness: 0.9, roughness: 0.35,
      });
      const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      thruster.rotation.x = Math.PI / 2;
      thruster.position.z = -1.05;
      g.add(thruster);

      // ─── Cockpit canopy — glassy half-sphere ───
      const cockpitGeo = new THREE.SphereGeometry(0.38, 24, 16, 0, Math.PI*2, 0, Math.PI/2);
      const cockpitMat = new THREE.MeshStandardMaterial({
        color: color, emissive: color, emissiveIntensity: 1.3,
        metalness: 0.75, roughness: 0.12, transparent: true, opacity: 0.88,
      });
      const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
      cockpit.position.set(0, 0.18, 0.45);
      cockpit.rotation.x = -Math.PI/2;
      g.add(cockpit);

      // ─── Swept wings with engine pods ───
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(1.35, 0.35);
      wingShape.lineTo(1.55, 0.05);
      wingShape.lineTo(1.45, -0.1);
      wingShape.lineTo(0.1, -0.22);
      wingShape.lineTo(0, 0);
      const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
        depth: 0.09, bevelEnabled: true, bevelSegments: 1,
        bevelSize: 0.02, bevelThickness: 0.02,
      });
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x7080a0, metalness: 0.88, roughness: 0.35,
      });
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(0, -0.04, -0.25);
      g.add(wingL);
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.rotation.y = Math.PI;
      wingR.position.set(0, -0.04, -0.25);
      g.add(wingR);

      // Engine pods on each wing (cylinders under wing tips)
      [[1.25, -0.12, -0.2], [-1.25, -0.12, -0.2]].forEach(pos => {
        const podGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.5, 12);
        const podMat = new THREE.MeshStandardMaterial({
          color: 0x4a5468, metalness: 0.9, roughness: 0.3,
        });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(...pos);
        g.add(pod);
        // Small exhaust glow at pod rear
        const exhGeo = new THREE.SphereGeometry(0.09, 10, 10);
        const exhMat = new THREE.MeshBasicMaterial({
          color: color, transparent: true, opacity: 0.85,
          blending: THREE.AdditiveBlending,
        });
        const exh = new THREE.Mesh(exhGeo, exhMat);
        exh.position.set(pos[0], pos[1], pos[2] - 0.3);
        g.add(exh);
      });

      // ─── Wing-tip nav lights (hard points + point lights) ───
      [[1.45, 0.0, -0.25], [-1.45, 0.0, -0.25]].forEach((p, i) => {
        const tipGeo = new THREE.SphereGeometry(0.08, 10, 10);
        const tipMat = new THREE.MeshBasicMaterial({ color: i ? 0xb089ff : 0x7cc8ff });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(...p);
        g.add(tip);
        const light = new THREE.PointLight(i ? 0xb089ff : 0x7cc8ff, 1.2, 6);
        light.position.set(...p);
        g.add(light);
      });

      // ─── Dorsal antenna array (gives ship silhouette) ───
      const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6);
      const antennaMat = new THREE.MeshStandardMaterial({
        color: 0x888, metalness: 0.9, roughness: 0.2,
      });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.set(0, 0.35, -0.2);
      g.add(antenna);
      // Small dish
      const dishGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16);
      const dishMat = new THREE.MeshStandardMaterial({
        color: 0xb0b8c8, metalness: 0.85, roughness: 0.3,
      });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(0, 0.65, -0.2);
      g.add(dish);

      // ─── Engine bloom (big glowing disc at rear) ───
      const engineGeo = new THREE.CircleGeometry(0.32, 24);
      const engineMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const engine = new THREE.Mesh(engineGeo, engineMat);
      engine.position.z = -1.32;
      engine.rotation.y = Math.PI;
      g.add(engine);

      // ─── Continuous thrust trail (Line, not Points — no dotted artifact) ───
      const trailLen = 32;
      const trailGeo = new THREE.BufferGeometry();
      const trailPos = new Float32Array(trailLen * 3);
      const trailCol = new Float32Array(trailLen * 3);
      // Pre-seed trail along -Z with color fade
      const cObj = new THREE.Color(color);
      for (let i = 0; i < trailLen; i++) {
        trailPos[i*3]     = 0;
        trailPos[i*3 + 1] = 0;
        trailPos[i*3 + 2] = -1.3 - i * 0.32;
        const fade = 1 - (i / trailLen);
        trailCol[i*3]     = cObj.r * fade;
        trailCol[i*3 + 1] = cObj.g * fade;
        trailCol[i*3 + 2] = cObj.b * fade;
      }
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 3));
      const trailMat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      g.add(trail);

      return g;
    }

    for (let i = 0; i < 6; i++) {
      const colors = [0x7cc8ff, 0xb089ff, 0xffd57a, 0x4adea0, 0xff5a6a, 0x80a0ff];
      const color = colors[i];
      const ship = buildShip(color);
      // Vary ship sizes — some small, some larger freighter-scale
      const scaleMul = i % 3 === 0 ? 1.6 : i % 3 === 1 ? 0.9 : 1.2;
      ship.scale.multiplyScalar(scaleMul);
      const path = {
        radius: 35 + i * 12 + Math.random() * 15,
        speed: 0.08 + i * 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
        depth: -60 - i * 38 - Math.random() * 30,
        vertOffset: (Math.random() - 0.5) * 40,
      };
      scene.add(ship);
      ships.push({ ship, path });
    }

    /* ─── Aurora plasma ribbons (shader-driven drifting curtains) ─── */
    const auroraShader = {
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0x7cc8ff) },
        uColorB: { value: new THREE.Color(0xb089ff) },
        uSeed: { value: Math.random() * 50 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        float hash(float n){ return fract(sin(n) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          float a = hash(dot(i, vec2(1.0, 57.0)));
          float b = hash(dot(i + vec2(1.0, 0.0), vec2(1.0, 57.0)));
          float c = hash(dot(i + vec2(0.0, 1.0), vec2(1.0, 57.0)));
          float d = hash(dot(i + vec2(1.0, 1.0), vec2(1.0, 57.0)));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
        }
        void main(){
          float t = uTime * 0.08;
          // Vertical ribbon bands that wave
          float wave = sin(vUv.x * 6.0 + t * 1.4 + uSeed) * 0.5 + 0.5;
          float n = noise(vec2(vUv.x * 3.0 + t, vUv.y * 1.5 - t * 0.5));
          // Vertical gradient makes the ribbon fade at top & bottom
          float vgrad = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          // Ribbon shape: thin horizontal bands that wiggle
          float band = smoothstep(0.15, 0.0, abs(vUv.y - 0.5 + sin(vUv.x * 4.0 + t) * 0.25 + n * 0.2));
          float intensity = band * vgrad * (0.6 + n * 0.5);
          vec3 col = mix(uColorA, uColorB, wave + n * 0.3);
          gl_FragColor = vec4(col, intensity * 0.55);
        }
      `,
    };
    // Aurora ribbons removed — they read as big linear light-beams, not atmosphere.
    const auroras = [];

    /* ─── Distant galaxy sprites (huge fuzzy disks far away) ─── */
    const galaxyCanvas = document.createElement("canvas");
    galaxyCanvas.width = 256; galaxyCanvas.height = 256;
    const gx = galaxyCanvas.getContext("2d");
    // Spiral-ish galaxy
    const gradCore = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradCore.addColorStop(0, "rgba(255,240,220,0.95)");
    gradCore.addColorStop(0.15, "rgba(255,200,160,0.6)");
    gradCore.addColorStop(0.4, "rgba(180,120,200,0.35)");
    gradCore.addColorStop(0.7, "rgba(80,60,140,0.15)");
    gradCore.addColorStop(1, "rgba(0,0,0,0)");
    gx.fillStyle = gradCore;
    gx.fillRect(0, 0, 256, 256);
    // Spiral arms — rotated ellipses
    gx.save();
    gx.translate(128, 128);
    for (let a = 0; a < 4; a++) {
      gx.rotate(Math.PI / 2);
      const g2 = gx.createLinearGradient(-110, 0, 110, 0);
      g2.addColorStop(0, "rgba(200,180,255,0)");
      g2.addColorStop(0.5, "rgba(220,210,255,0.22)");
      g2.addColorStop(1, "rgba(200,180,255,0)");
      gx.fillStyle = g2;
      gx.beginPath(); gx.ellipse(0, 0, 110, 18, 0, 0, Math.PI * 2); gx.fill();
    }
    gx.restore();
    // Star speckle
    for (let i = 0; i < 160; i++) {
      const rr = Math.random() * 120;
      const ang = Math.random() * Math.PI * 2;
      const sx = 128 + Math.cos(ang) * rr;
      const sy = 128 + Math.sin(ang) * rr;
      gx.fillStyle = `rgba(255,255,255,${(0.3 + Math.random() * 0.6).toFixed(2)})`;
      gx.fillRect(sx, sy, 1, 1);
    }
    const galaxyTex = new THREE.CanvasTexture(galaxyCanvas);
    const galaxyPositions = [
      { pos: [-650, 280, -1400], size: 420, rot: 0.4 },
      { pos: [ 720, -180, -1600], size: 520, rot: -0.6 },
      { pos: [-120, -420, -1800], size: 380, rot: 1.1 },
    ];
    const galaxies = [];
    galaxyPositions.forEach(g => {
      const mat = new THREE.MeshBasicMaterial({
        map: galaxyTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(g.size, g.size), mat);
      mesh.position.set(...g.pos);
      mesh.rotation.z = g.rot;
      worldGroup.add(mesh);
      galaxies.push({ mesh, rotSpeed: 0.00008 + Math.random() * 0.00012 });
    });

    /* ─── Shooting stars (occasional blazing streaks) ─── */
    const SHOOT_MAX = 5;
    const shootGeom = new THREE.BufferGeometry();
    const shootPositions = new Float32Array(SHOOT_MAX * 6);
    const shootColors = new Float32Array(SHOOT_MAX * 6);
    shootGeom.setAttribute("position", new THREE.BufferAttribute(shootPositions, 3));
    shootGeom.setAttribute("color", new THREE.BufferAttribute(shootColors, 3));
    const shootMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, linewidth: 2,
    });
    const shootLines = new THREE.LineSegments(shootGeom, shootMat);
    scene.add(shootLines);
    const shoots = Array.from({ length: SHOOT_MAX }, () => ({
      active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0,
    }));
    const spawnShootingStar = (idx, camZNow) => {
      const s = shoots[idx];
      // Spawn far ahead, high up and off to a side, streak across
      s.x = (Math.random() - 0.5) * 600;
      s.y = 80 + Math.random() * 200;
      s.z = camZNow - 400 - Math.random() * 400;
      // Velocity mostly sideways + downward
      const dir = Math.random() < 0.5 ? 1 : -1;
      s.vx = dir * (3 + Math.random() * 5);
      s.vy = -(1 + Math.random() * 3);
      s.vz = 1 + Math.random() * 2;
      s.maxLife = 55 + Math.random() * 40;
      s.life = s.maxLife;
      s.active = true;
    };

    /* ─── Planet halo sprites (soft bloom glow around each planet) ─── */
    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = 256; haloCanvas.height = 256;
    const hx = haloCanvas.getContext("2d");
    const haloGrad = hx.createRadialGradient(128, 128, 30, 128, 128, 128);
    haloGrad.addColorStop(0, "rgba(255,255,255,0.55)");
    haloGrad.addColorStop(0.3, "rgba(255,255,255,0.15)");
    haloGrad.addColorStop(1, "rgba(255,255,255,0)");
    hx.fillStyle = haloGrad;
    hx.fillRect(0, 0, 256, 256);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    planets.forEach(p => {
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.55,
      });
      const halo = new THREE.Sprite(haloMat);
      const planetRadius = p.planet.geometry.parameters.radius || 12;
      const haloScale = planetRadius * 5.5;
      halo.scale.set(haloScale, haloScale, 1);
      p.pivot.add(halo);
      p.halo = halo;
    });

    /* ─── Lights ─── */
    scene.add(new THREE.AmbientLight(0x0a1020, 0.35));
    const sun = new THREE.DirectionalLight(0xfff0e0, 1.2);
    sun.position.set(200, 100, -300);
    scene.add(sun);
    const fillCyan = new THREE.PointLight(0x6080c0, 0.35, 800); fillCyan.position.set(-400, 200, -400); scene.add(fillCyan);
    const fillMag = new THREE.PointLight(0x8060a0, 0.3,  800); fillMag.position.set(400, -200, -600); scene.add(fillMag);

    /* ─── Mouse parallax ─── */
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMouse = e => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let raf;
    const t0 = performance.now();
    let camZ = 0; // accumulated forward travel
    let warpSmooth = 0; // eased warp intensity [0..1]
    const animate = () => {
      const t = (performance.now() - t0) * 0.001;

      // Ease the warp intensity toward target
      warpSmooth += (warpRef.current - warpSmooth) * 0.03;

      tx += (mx * 2 - tx) * 0.04;
      ty += (my * 1.5 - ty) * 0.04;
      cam.position.x = tx;
      cam.position.y = -ty;

      // Base drift + warp-driven forward motion
      // Base cruise is gentle — you're drifting through space, not warping.
      // Warp burst (triggered by "ENGAGE WARP" button) briefly spikes speed.
      const forwardSpeed = 0.18 + warpSmooth * 3.2; // units/frame
      camZ -= forwardSpeed;
      // Gentle bob so it never feels static
      cam.position.z = camZ + Math.sin(t*0.4) * 0.8;
      cam.lookAt(cam.position.x, cam.position.y, camZ - 500);

      // Environment flies with the camera (endless space feeling)
      worldGroup.position.z = camZ;

      // Star parallax
      starLayers.forEach(l => { l.points.rotation.y += l.speed * 0.001; });

      // ─── Space dust streaming past the camera ───
      {
        const posArr = dustGeom.attributes.position.array;
        const colArr = dustGeom.attributes.color.array;
        const dustVel = 0.8 + warpSmooth * 14;
        for (let i = 0; i < DUST_COUNT; i++) {
          const d = dustData[i];
          d.z += dustVel;
          if (d.z > camZ + 30) {
            // Recycle far ahead
            const angle = Math.random() * Math.PI * 2;
            const radius = 4 + Math.random() * 180;
            d.x = Math.cos(angle) * radius;
            d.y = Math.sin(angle) * radius;
            d.z = camZ - 400 - Math.random() * 600;
            d.tint = Math.random();
          }
          posArr[i*3]     = d.x;
          posArr[i*3 + 1] = d.y;
          posArr[i*3 + 2] = d.z;
          // Near-camera dust tinted by flight color, far dust stays white
          const depth = Math.min(1, Math.abs(d.z - camZ) / 600);
          const fade = 1 - depth;
          const r = d.tint < 0.4 ? 0.8 + fade * 0.2 : d.tint < 0.8 ? 0.4 + fade * 0.3 : 1.0;
          const g = d.tint < 0.4 ? 0.95 : d.tint < 0.8 ? 0.9 + fade * 0.1 : 0.6 + fade * 0.2;
          const b = d.tint < 0.4 ? 1.0 : d.tint < 0.8 ? 1.0 : 0.9;
          colArr[i*3] = r; colArr[i*3 + 1] = g; colArr[i*3 + 2] = b;
        }
        dustGeom.attributes.position.needsUpdate = true;
        dustGeom.attributes.color.needsUpdate = true;
      }

      // ─── Debris tumbling and streaming forward ───
      debris.forEach(d => {
        d.mesh.rotation.x += d.spinX;
        d.mesh.rotation.y += d.spinY;
        d.mesh.rotation.z += d.spinZ;
        // Stream forward toward camera
        d.mesh.position.z += 0.3 + warpSmooth * 6;
        if (d.mesh.position.z > camZ + 20) {
          // Recycle far ahead
          const angle = Math.random() * Math.PI * 2;
          const radius = 20 + Math.random() * 280;
          d.mesh.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            camZ - 600 - Math.random() * 800
          );
        }
      });

      // ─── Beacons — pulse brightness ───
      {
        const colArr = beaconGeom.attributes.color.array;
        for (let i = 0; i < beaconCount; i++) {
          const bd = beaconData[i];
          const pulse = 0.35 + Math.abs(Math.sin(t * bd.speed + bd.phase)) * 0.65;
          colArr[i*3]     = bd.baseCol[0] * pulse;
          colArr[i*3 + 1] = bd.baseCol[1] * pulse;
          colArr[i*3 + 2] = bd.baseCol[2] * pulse;
        }
        beaconGeom.attributes.color.needsUpdate = true;
      }

      // ─── Warp streaks ───
      // Warp streaks: ONLY visible during warp burst (button press), zero at idle.
      // Removes the "lines from spaceships" artifact at idle.
      const streakOpacity = warpSmooth < 0.05 ? 0 : Math.min(1, warpSmooth * 1.4);
      warpMat.opacity = streakOpacity;
      if (streakOpacity > 0.02) {
        const posAttr = warpGeom.attributes.position.array;
        const colAttr = warpGeom.attributes.color.array;
        const streakVel = 1.2 + warpSmooth * 22;
        for (let i = 0; i < WARP_COUNT; i++) {
          const p = warpData[i];
          p.z += streakVel;
          // When behind camera, recycle far ahead
          if (p.z > camZ + 20) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 6 + Math.random() * 340;
            p.x = Math.cos(angle) * radius;
            p.y = Math.sin(angle) * radius;
            p.z = camZ - 400 - Math.random() * 700;
            p.len = 0.5 + Math.random() * 4;
            p.hue = Math.random();
          }
          const streakLen = p.len * (1 + warpSmooth * 12);
          const i6 = i * 6;
          // Start of segment
          posAttr[i6]   = p.x;
          posAttr[i6+1] = p.y;
          posAttr[i6+2] = p.z;
          // End of segment (trailing behind in +Z = toward camera)
          posAttr[i6+3] = p.x;
          posAttr[i6+4] = p.y;
          posAttr[i6+5] = p.z + streakLen;
          // Color — mostly white with occasional cool-tinted streaks
          let r, g, b;
          if (p.hue < 0.15)       { r = 0.55; g = 0.8;  b = 1.0; }  // cool cyan tint (rare)
          else if (p.hue < 0.25)  { r = 0.8;  g = 0.7;  b = 1.0; }  // lavender (rare)
          else                    { r = 1.0;  g = 1.0;  b = 1.0; }  // mostly white
          colAttr[i6]   = r * 0.4; // dim head
          colAttr[i6+1] = g * 0.4;
          colAttr[i6+2] = b * 0.4;
          colAttr[i6+3] = r;       // bright tail
          colAttr[i6+4] = g;
          colAttr[i6+5] = b;
        }
        warpGeom.attributes.position.needsUpdate = true;
        warpGeom.attributes.color.needsUpdate = true;
      }

      nebulae.forEach((n, i) => {
        n.mat.uniforms.uTime.value = t;
        n.mesh.rotation.z = t * 0.003 * (i%2?1:-1);
      });

      splatMat.uniforms.uTime.value = t;

      auroras.forEach((a, i) => {
        a.mat.uniforms.uTime.value = t;
        a.mesh.rotation.z += (i % 2 ? 0.00015 : -0.0002);
        a.mesh.position.y += Math.sin(t * 0.3 + i) * 0.05;
      });

      galaxies.forEach(g => { g.mesh.rotation.z += g.rotSpeed; });

      // Shooting stars — randomly spawn + advance + fade
      if (Math.random() < 0.012) {
        const idx = shoots.findIndex(s => !s.active);
        if (idx >= 0) spawnShootingStar(idx, camZ);
      }
      let anyShootActive = false;
      for (let i = 0; i < SHOOT_MAX; i++) {
        const s = shoots[i];
        const i6 = i * 6;
        if (!s.active) {
          // Zero out
          for (let k = 0; k < 6; k++) shootPositions[i6 + k] = 0;
          for (let k = 0; k < 6; k++) shootColors[i6 + k] = 0;
          continue;
        }
        anyShootActive = true;
        s.x += s.vx; s.y += s.vy; s.z += s.vz;
        s.life -= 1;
        // Head of streak
        shootPositions[i6]   = s.x;
        shootPositions[i6+1] = s.y;
        shootPositions[i6+2] = s.z;
        // Tail behind along velocity (scaled length)
        const tailLen = 14 + (s.maxLife - s.life) * 0.4;
        shootPositions[i6+3] = s.x - s.vx * tailLen * 0.12;
        shootPositions[i6+4] = s.y - s.vy * tailLen * 0.12;
        shootPositions[i6+5] = s.z - s.vz * tailLen * 0.12;
        const lifeRatio = Math.max(0, s.life / s.maxLife);
        const head = lifeRatio;
        const tail = lifeRatio * 0.2;
        // White-hot head, cyan tail
        shootColors[i6]   = head;          shootColors[i6+1] = head;        shootColors[i6+2] = head;
        shootColors[i6+3] = tail * 0.0;    shootColors[i6+4] = tail * 0.9;  shootColors[i6+5] = tail;
        if (s.life <= 0) s.active = false;
      }
      shootGeom.attributes.position.needsUpdate = true;
      shootGeom.attributes.color.needsUpdate = true;
      shootMat.opacity = anyShootActive ? 1 : 0;

      planets.forEach((p, i) => {
        p.planet.rotation.y += p.speed;
        p.clouds.rotation.y += p.speed * 1.8;
        p.pivot.rotation.y += 0.0001;
        // Pulse halo slightly with time
        if (p.halo) {
          const pulse = 0.5 + Math.sin(t * 0.4 + i) * 0.08;
          p.halo.material.opacity = pulse;
        }
      });

      moons.forEach(m => {
        m.phase += m.speed;
        m.orbit.rotation.y = m.phase;
        m.mesh.rotation.y += m.spin;
      });

      // Asteroids — orbit around gas giant + tumble
      asteroids.forEach(a => {
        a.angle += a.orbitSpeed;
        a.mesh.position.set(Math.cos(a.angle) * a.r, a.yOff, Math.sin(a.angle) * a.r);
        a.mesh.rotation.x += a.spinX;
        a.mesh.rotation.y += a.spinY;
        a.mesh.rotation.z += a.spinZ;
      });

      // Comets — elliptical orbits, tail trails camera position history
      comets.forEach(c => {
        c.phase += c.speed * 0.01;
        const ang = c.phase;
        // Position on inclined ellipse, translated forward with camZ so comets stay in view
        const localX = Math.cos(ang) * c.radiusA;
        const localY = Math.sin(ang * 1.3) * c.radiusA * 0.12;
        const localZ = Math.sin(ang) * c.radiusB;
        // Apply a small incline
        const cosX = Math.cos(c.inclineX), sinX = Math.sin(c.inclineX);
        const y1 = localY * cosX - localZ * sinX;
        const z1 = localY * sinX + localZ * cosX;
        const cosZ = Math.cos(c.inclineZ), sinZ = Math.sin(c.inclineZ);
        const x2 = localX * cosZ - y1 * sinZ;
        const y2 = localX * sinZ + y1 * cosZ;
        const finalX = x2;
        const finalY = y2;
        const finalZ = c.baseZ + z1 + camZ;

        c.group.position.set(finalX, finalY, finalZ);
        c.head.position.set(0, 0, 0);
        c.glow.position.set(0, 0, 0);

        // Shift tail trail — record current head world position, then rewrite tail
        c.prevPositions.unshift({ x: finalX, y: finalY, z: finalZ });
        if (c.prevPositions.length > 60) c.prevPositions.pop();

        // Write tail relative to group position (so the Line sits at same origin as group)
        const tp = c.tailPos;
        const tc = c.tailCol;
        for (let pi = 0; pi < 60; pi++) {
          const p = c.prevPositions[pi] || c.prevPositions[c.prevPositions.length - 1];
          tp[pi*3]     = p.x - finalX;
          tp[pi*3 + 1] = p.y - finalY;
          tp[pi*3 + 2] = p.z - finalZ;
          const fade = 1 - pi / 60;
          tc[pi*3]     = c.color[0] * fade;
          tc[pi*3 + 1] = c.color[1] * fade;
          tc[pi*3 + 2] = c.color[2] * fade;
        }
        c.tailGeom.attributes.position.needsUpdate = true;
        c.tailGeom.attributes.color.needsUpdate = true;
        // Glow pulses
        c.glowMat.opacity = 0.6 + Math.sin(t * 2 + c.phase * 3) * 0.15;
      });

      // Satellites — orbit their parent planet, blink nav light
      satellites.forEach(s => {
        s.phase += s.speed;
        s.orbit.rotation.y = s.phase;
        s.group.rotation.y = -s.phase; // counter-rotate so panels face outward
        // Blink ~1.2Hz
        const lit = ((t * 1.2 + s.phase) % 1) < 0.3;
        s.navLight.material.color.setHex(lit ? 0xff4040 : 0x401818);
      });

      ships.forEach(({ ship, path }) => {
        const angle = t * path.speed + path.phase;
        const x = Math.cos(angle) * path.radius;
        const z = path.depth + camZ + Math.sin(angle) * path.radius;
        const y = path.vertOffset + Math.sin(angle * 1.3) * 4;
        ship.position.set(x, y, z);
        // Point along tangent
        const nx = -Math.sin(angle) * path.radius;
        const nz = Math.cos(angle) * path.radius;
        ship.lookAt(x + nx, y, z + nz);
      });

      renderer.render(scene, cam);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={ref}
      style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
      }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3. LIVE COINGECKO DATA HOOK
   ═══════════════════════════════════════════════════════════════════════ */

export default SpaceBackground;
