/**
 * Public-domain planetary imagery URLs.
 *
 * All images here are sourced from NASA, ESA, or Wikimedia Commons and are in
 * the public domain or under Creative Commons licenses that permit use in any
 * context, including commercial.
 *
 * We use them as THREE.TextureLoader sources for the SpaceBackground scene.
 *
 * IMPORTANT: these URLs point to external CDNs (Wikimedia upload servers,
 * NASA SVS). If any fail to load, the scene falls back to procedurally
 * generated canvas textures via `makePlanetTexture` in planetTextures.js.
 */

export const PLANET_TEXTURES = {
  earth: {
    color: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/The_Blue_Marble_%28remastered%29.jpg/1024px-The_Blue_Marble_%28remastered%29.jpg",
    clouds: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Fair_use_clouds.jpg/1024px-Fair_use_clouds.jpg",
    night: null,  // City lights — generated procedurally
    credit: "NASA Goddard Space Flight Center / NOAA",
  },
  mars: {
    color: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/1024px-OSIRIS_Mars_true_color.jpg",
    credit: "ESA/Rosetta/OSIRIS",
  },
  jupiter: {
    color: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/1024px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg",
    credit: "NASA/ESA Hubble Space Telescope",
  },
  saturn: {
    color: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Saturn_during_Equinox.jpg/1024px-Saturn_during_Equinox.jpg",
    credit: "NASA/JPL-Caltech/Cassini",
  },
  neptune: {
    color: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg/1024px-Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg",
    credit: "NASA/JPL Voyager 2",
  },
  moon: {
    color: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1024px-FullMoon2010.jpg",
    credit: "Gregory H. Revera / Wikimedia Commons",
  },
};

/** Load a texture with THREE.TextureLoader, falling back on error. */
export function loadPlanetTexture(THREE, url, onFallback) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        resolve(tex);
      },
      undefined,
      () => {
        // CDN block / offline / CORS — use fallback
        onFallback && onFallback();
        resolve(null);
      }
    );
  });
}
