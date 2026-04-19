import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function OmniLogo({ size = 140, intensity = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const W = size, H = size;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.set(0, 0, 5.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    el.innerHTML = "";
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    /* ─── Plasma core (inner sphere with fresnel glow) ─── */
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 4);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uInt: { value: intensity } },
      vertexShader: `
        varying vec3 vN; varying vec3 vP; varying vec3 vW;
        uniform float uTime;
        void main(){
          vN = normalize(normalMatrix * normal);
          vec3 p = position;
          float d = sin(p.y*8.0 + uTime*2.0) * cos(p.x*6.0 + uTime*1.7) * 0.04;
          p += normal * d;
          vP = p;
          vec4 wp = modelMatrix * vec4(p,1.0);
          vW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        varying vec3 vN; varying vec3 vP; varying vec3 vW;
        uniform float uTime; uniform float uInt;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(dot(V, normalize(vN)), 0.0), 2.2);
          vec3 cCyan = vec3(0.0, 0.9, 1.0);
          vec3 cMag  = vec3(1.0, 0.18, 0.84);
          vec3 cGold = vec3(1.0, 0.81, 0.29);
          float mix1 = 0.5 + 0.5*sin(uTime*1.4 + vP.y*3.0);
          float mix2 = 0.5 + 0.5*sin(uTime*0.8 + vP.x*2.0 + 1.57);
          vec3 col = mix(cCyan, cMag, mix1);
          col = mix(col, cGold, mix2*0.3);
          col *= (0.6 + fres*1.8) * uInt;
          col += fres * vec3(0.2, 0.8, 1.0) * 1.2;
          gl_FragColor = vec4(col, 0.95);
        }`,
      transparent: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    /* ─── Three clean orthogonal rings ─── */
    const ringMats = [];
    const rings = [];
    const ringColors = [0x7cc8ff, 0xb089ff, 0xffd57a];
    const ringAxes = [
      [0, 0, 0],
      [Math.PI/2, 0, 0],
      [0, Math.PI/2, 0],
    ];
    for (let i = 0; i < 3; i++) {
      const rg = new THREE.TorusGeometry(1.2 + i*0.02, 0.022, 24, 220);
      const rm = new THREE.MeshStandardMaterial({
        color: ringColors[i],
        emissive: ringColors[i],
        emissiveIntensity: 1.0,
        metalness: 0.95,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(rg, rm);
      ring.rotation.set(...ringAxes[i]);
      group.add(ring);
      rings.push(ring);
      ringMats.push(rm);
    }

    /* ─── No knots, no particles — cleaner look ─── */
    // Stub geometries/materials so the cleanup block at the end doesn't error
    const knotGeoA = new THREE.BufferGeometry();
    const knotMatA = new THREE.MeshBasicMaterial();
    const knotGeoB = new THREE.BufferGeometry();
    const knotMatB = new THREE.MeshBasicMaterial();
    const knotA = new THREE.Object3D();
    const knotB = new THREE.Object3D();
    const partGeo = new THREE.BufferGeometry();
    const partMat = new THREE.MeshBasicMaterial();
    const partTex = new THREE.CanvasTexture(document.createElement("canvas"));
    const partCount = 0;
    const partSeed = new Float32Array(0);

    /* ─── Lights ─── */
    scene.add(new THREE.AmbientLight(0x304060, 0.5));
    const l1 = new THREE.PointLight(0x7cc8ff, 3.5, 12); l1.position.set(3, 2, 4); scene.add(l1);
    const l2 = new THREE.PointLight(0xb089ff, 3.0, 12); l2.position.set(-3, -2, 3); scene.add(l2);
    const l3 = new THREE.PointLight(0xffd57a, 1.5, 10); l3.position.set(0, 3, -2); scene.add(l3);

    let raf;
    const t0 = performance.now();
    const animate = () => {
      const t = (performance.now() - t0) * 0.001;
      coreMat.uniforms.uTime.value = t;

      core.rotation.x = t * 0.3;
      core.rotation.y = t * 0.4;

      rings.forEach((r, i) => {
        r.rotation.x += 0.0015 * (i === 1 ? 1 : i === 0 ? -1 : 0.5);
        r.rotation.y += 0.002  * (i === 2 ? 1 : i === 1 ? -1 : 0.5);
        r.rotation.z += 0.0008 * (i === 0 ? -1 : 1);
        ringMats[i].emissiveIntensity = 0.85 + Math.sin(t*1.1 + i*1.8) * 0.25;
      });

      group.rotation.y = t * 0.08;
      group.rotation.x = Math.sin(t*0.12) * 0.08;

      renderer.render(scene, cam);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      coreGeo.dispose(); coreMat.dispose();
      knotGeoA.dispose(); knotMatA.dispose();
      knotGeoB.dispose(); knotMatB.dispose();
      rings.forEach(r => r.geometry.dispose());
      ringMats.forEach(m => m.dispose());
      partGeo.dispose(); partMat.dispose(); partTex.dispose();
    };
  }, [size, intensity]);

  return (
    <div ref={ref}
      style={{ width:size, height:size, animation:"omniPulse 4s ease-in-out infinite" }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. PHOTOREAL SPACE BACKGROUND
   • PBR planets with fresnel atmospheres and animated cloud layers
   • Volumetric nebulae via layered additive shader planes
   • Proper starfield with parallax + twinkle
   • Detailed spaceships with thrust trails
   ═══════════════════════════════════════════════════════════════════════ */

/* Procedural planet texture — generated once per planet */
// Seeded pseudo-random for reproducible planet details

export default OmniLogo;
