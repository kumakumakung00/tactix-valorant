export interface CrosshairLineSettings {
  show: boolean;
  thickness: number;
  length: number;
  verticalLength: number;
  offset: number;
  opacity: number;
}

export interface ParsedCrosshair {
  color: string;
  outlines: boolean;
  outlineThickness: number;
  outlineOpacity: number;
  centerDot: boolean;
  dotThickness: number;
  dotOpacity: number;
  inner: CrosshairLineSettings;
  outer: CrosshairLineSettings;
}

const PRESET_COLORS = [
  '#FFFFFF',
  '#00FF00',
  '#7FFF00',
  '#DFFF00',
  '#FFFF00',
  '#00FFFF',
  '#FF00FF',
  '#FF0000',
];

function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Parses the primary-crosshair (`P`) section of a Valorant crosshair share code. */
export function parseCrosshairCode(code: string): ParsedCrosshair {
  const parts = code.trim().split(';');
  const settings = new Map<string, string>();
  let section = '';

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    if (token === 'P' || token === 'A' || token === 'S') {
      section = token;
      continue;
    }
    if (section !== 'P') continue;
    settings.set(token, parts[i + 1]);
    i++;
  }

  const colorIndex = toNumber(settings.get('c'), 0);
  const customHex = settings.get('u');
  const color =
    colorIndex === 8 && customHex
      ? `#${customHex.slice(0, 6)}`
      : PRESET_COLORS[colorIndex] ?? PRESET_COLORS[0];

  const line = (prefix: '0' | '1', defaults: Omit<CrosshairLineSettings, 'verticalLength'>) => {
    const length = toNumber(settings.get(`${prefix}l`), defaults.length);
    const separateVertical = settings.get(`${prefix}g`) === '1';
    return {
      show: toNumber(settings.get(`${prefix}b`), defaults.show ? 1 : 0) === 1,
      thickness: toNumber(settings.get(`${prefix}t`), defaults.thickness),
      length,
      verticalLength: separateVertical ? toNumber(settings.get(`${prefix}v`), length) : length,
      offset: toNumber(settings.get(`${prefix}o`), defaults.offset),
      opacity: toNumber(settings.get(`${prefix}a`), defaults.opacity),
    };
  };

  return {
    color,
    outlines: toNumber(settings.get('h'), 1) === 1,
    outlineThickness: toNumber(settings.get('t'), 1),
    outlineOpacity: toNumber(settings.get('o'), 0.5),
    centerDot: toNumber(settings.get('d'), 0) === 1,
    dotThickness: toNumber(settings.get('z'), 2),
    dotOpacity: toNumber(settings.get('a'), 1),
    inner: line('0', { show: true, thickness: 2, length: 6, offset: 3, opacity: 0.8 }),
    outer: line('1', { show: true, thickness: 2, length: 2, offset: 10, opacity: 0.35 }),
  };
}
