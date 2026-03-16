function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function nextSeededValue(seed: string, step: number): number {
  const seedHash = hashSeed(seed);
  let value = (seedHash + Math.imul((step + 1) >>> 0, 0x9e3779b9)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 0x100000000;
}

export function randomInt(seed: string, step: number, min: number, max: number): number {
  const value = nextSeededValue(seed, step);
  return Math.floor(min + value * (max - min + 1));
}

export function randomFloat(seed: string, step: number, min = 0, max = 1): number {
  const value = nextSeededValue(seed, step);
  return min + value * (max - min);
}

