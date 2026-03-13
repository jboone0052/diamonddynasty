export function nextSeededValue(seed: string, step: number): number {
  const source = `${seed}:${step}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

export function randomInt(seed: string, step: number, min: number, max: number): number {
  const value = nextSeededValue(seed, step);
  return Math.floor(min + value * (max - min + 1));
}
