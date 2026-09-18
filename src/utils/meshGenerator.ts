/**
 * Dynamic Mesh & Backdrop Generator
 * Supports full-spectrum multi-tone glassmorphic FinTech aesthetics across ALL colors,
 * with dedicated generators for colors, mesh gradients, and shapes.
 */

export type ShapePatternType =
  | 'waves'
  | 'orbs'
  | 'geometry'
  | 'arcs'
  | 'ribbons'
  | 'aurora'
  | 'fluid';

export const ALL_SHAPE_PATTERNS: { id: ShapePatternType; label: string }[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'waves', label: 'Waves' },
  { id: 'fluid', label: 'Fluid' },
  { id: 'orbs', label: 'Orbs' },
  { id: 'arcs', label: 'Arcs' },
  { id: 'ribbons', label: 'Ribbons' },
  { id: 'geometry', label: 'Geometry' },
];

export interface MeshPreset {
  id: string;
  label: string;
  description: string;
  gradient: [string, string, string];
  shape: ShapePatternType;
}

/**
 * Curated Pre-Built Mesh Backdrop Palettes spanning all color spectra
 */
export const CURATED_MESH_PRESETS: MeshPreset[] = [
  {
    id: 'tangerineAurora',
    label: 'Tangerine Aurora',
    description: 'Warm Tangerine shifting into deep Slate and Obsidian',
    gradient: ['#E39774', '#326273', '#020202'],
    shape: 'aurora',
  },
  {
    id: 'cyberpunkNeon',
    label: 'Cyberpunk Neon',
    description: 'Electric fuchsia blending into vivid purple and midnight obsidian',
    gradient: ['#FF007F', '#7928CA', '#08061A'],
    shape: 'fluid',
  },
  {
    id: 'emeraldMatrix',
    label: 'Emerald Aura',
    description: 'Luminous mint neon into deep sea teal and rich forest dark',
    gradient: ['#00F5A0', '#00D9F5', '#041B1F'],
    shape: 'waves',
  },
  {
    id: 'solarGold',
    label: 'Solar Radiance',
    description: 'Warm golden amber blending into coral sunset and mahogany',
    gradient: ['#FFE259', '#FFA751', '#2C0E00'],
    shape: 'arcs',
  },
  {
    id: 'royalAmethyst',
    label: 'Royal Amethyst',
    description: 'Deep violet aura transitioning into neon magenta and deep galaxy',
    gradient: ['#8E2DE2', '#F000FF', '#120024'],
    shape: 'orbs',
  },
  {
    id: 'electricOcean',
    label: 'Electric Ocean',
    description: 'Vibrant cyan shifting into royal sapphire and abyssal navy',
    gradient: ['#00C9FF', '#92FE9D', '#031424'],
    shape: 'ribbons',
  },
  {
    id: 'crimsonVelvet',
    label: 'Crimson Flame',
    description: 'Fiery ruby shifting into warm apricot and espresso',
    gradient: ['#FF416C', '#8A2387', '#1A0010'],
    shape: 'geometry',
  },
  {
    id: 'blueNordic',
    label: 'Nordic Slate',
    description: 'Crisp arctic slate with specular frost accents',
    gradient: ['#326273', '#5D99B0', '#12252D'],
    shape: 'waves',
  },
  {
    id: 'sakuraDawn',
    label: 'Sakura Petal',
    description: 'Soft rose glow shifting into violet dusk and plum dark',
    gradient: ['#FF9A8B', '#FF6A88', '#2D0B1E'],
    shape: 'aurora',
  },
  {
    id: 'hyperCitrus',
    label: 'Hyper Citrus',
    description: 'Zesty lemon lime shifting into electric tangerine and plum',
    gradient: ['#F9D423', '#FF4E50', '#200438'],
    shape: 'fluid',
  },
  {
    id: 'obsidianGlass',
    label: 'Obsidian Minimal',
    description: 'Smoked graphite glass with specular metallic sheen',
    gradient: ['#28343C', '#12191D', '#020202'],
    shape: 'geometry',
  },
  {
    id: 'mintOasis',
    label: 'Mint Horizon',
    description: 'Refreshing seafoam green blending into aqua marine and ink',
    gradient: ['#A8FF78', '#78FFD6', '#0A2027'],
    shape: 'orbs',
  },
];

/**
 * Converts HSL to Hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
  const normL = l / 100;
  const normS = s / 100;
  const a = normS * Math.min(normL, 1 - normL);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Calculates perceptual luminance for contrast checks.
 */
export function getHexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 128;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Generates an algorithmic, full-spectrum 3-stop gradient across ANY hue.
 */
export function generateRandomVibrantGradient(): {
  gradient: [string, string, string];
  name: string;
} {
  // Broad palette color families
  const HUE_FAMILIES = [
    { name: 'Neon Emerald', hue: 155 },
    { name: 'Electric Cyan', hue: 188 },
    { name: 'Sapphire Galaxy', hue: 218 },
    { name: 'Royal Indigo', hue: 250 },
    { name: 'Violet Cyber', hue: 280 },
    { name: 'Magenta Flare', hue: 315 },
    { name: 'Crimson Rose', hue: 345 },
    { name: 'Sunset Amber', hue: 22 },
    { name: 'Golden Sun', hue: 45 },
    { name: 'Lime Electric', hue: 90 },
    { name: 'Aqua Mint', hue: 168 },
    { name: 'Deep Cosmic', hue: 270 },
  ];

  const pickFamily = HUE_FAMILIES[Math.floor(Math.random() * HUE_FAMILIES.length)];
  // Add subtle random jitter to base hue (+- 15 degrees)
  const baseHue = (pickFamily.hue + Math.floor(Math.random() * 30 - 15) + 360) % 360;

  // 4 harmonic color schemes
  const schemeType = Math.floor(Math.random() * 4);
  let stop1: string;
  let stop2: string;
  let stop3: string;

  if (schemeType === 0) {
    // Analogous Flow (vibrant top, harmonic mid, ultra-rich deep base)
    stop1 = hslToHex(baseHue, 88 + Math.random() * 10, 56);
    stop2 = hslToHex((baseHue + 35) % 360, 80 + Math.random() * 12, 42);
    stop3 = hslToHex((baseHue + 60) % 360, 75, 12);
  } else if (schemeType === 1) {
    // Complementary Pop (electric primary, contrasting accent, deep shadow)
    stop1 = hslToHex(baseHue, 92, 58);
    stop2 = hslToHex((baseHue + 175) % 360, 85, 45);
    stop3 = hslToHex((baseHue + 20) % 360, 80, 10);
  } else if (schemeType === 2) {
    // Triadic Neon Shift
    stop1 = hslToHex(baseHue, 95, 60);
    stop2 = hslToHex((baseHue + 120) % 360, 85, 48);
    stop3 = hslToHex((baseHue + 240) % 360, 78, 14);
  } else {
    // Specular Glow on Obsidian
    stop1 = hslToHex(baseHue, 94, 62);
    stop2 = hslToHex((baseHue + 40) % 360, 86, 38);
    stop3 = '#040608';
  }

  return {
    gradient: [stop1, stop2, stop3],
    name: `${pickFamily.name} Mesh`,
  };
}

/**
 * Returns a random shape pattern.
 */
export function generateRandomShapeOnly(): ShapePatternType {
  const shapeOptions: ShapePatternType[] = [
    'waves',
    'orbs',
    'geometry',
    'arcs',
    'ribbons',
    'aurora',
    'fluid',
  ];
  return shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
}

/**
 * Generates both random full-spectrum colors and random shape.
 */
export function generateRandomMeshPalette(): {
  gradient: [string, string, string];
  shape: ShapePatternType;
  name: string;
  isLightText: boolean;
} {
  const { gradient, name } = generateRandomVibrantGradient();
  const shape = generateRandomShapeOnly();
  const lum = getHexLuminance(gradient[0]);

  return {
    gradient,
    shape,
    name,
    isLightText: lum < 145,
  };
}
