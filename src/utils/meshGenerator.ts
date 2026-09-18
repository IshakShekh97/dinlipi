/**
 * Dynamic Mesh & Backdrop Generator
 * Inspired by modern glassmorphic Finnish & Apple FinTech aesthetics.
 * Palette anchored on:
 * - Black (#020202)
 * - Blue Slate (#326273)
 * - Tangerine Dream (#E39774)
 * - Oxidized Iron (#B02E0C)
 * - Palm Leaf (#899D78)
 */

export type ShapePatternType =
  | 'waves'
  | 'orbs'
  | 'geometry'
  | 'arcs'
  | 'ribbons'
  | 'aurora'
  | 'fluid';

export interface MeshPreset {
  id: string;
  label: string;
  description: string;
  gradient: [string, string, string];
  shape: ShapePatternType;
}

/**
 * Curated Pre-Built Mesh Backdrop Palettes
 * Each preset is a multi-tone harmonic mesh gradient blending the 5 palette anchors.
 */
export const CURATED_MESH_PRESETS: MeshPreset[] = [
  {
    id: 'tangerineAurora',
    label: 'Tangerine Aurora',
    description: 'Warm Tangerine Dream shifting into deep Blue Slate and Obsidian',
    gradient: ['#E39774', '#326273', '#020202'],
    shape: 'aurora',
  },
  {
    id: 'blueNordic',
    label: 'Blue Slate Nordic',
    description: 'Crisp arctic slate with specular frost accents',
    gradient: ['#326273', '#5D99B0', '#12252D'],
    shape: 'waves',
  },
  {
    id: 'oxidizedSunset',
    label: 'Oxidized Sunset',
    description: 'Velvet iron embers blending into warm apricot glow',
    gradient: ['#B02E0C', '#E39774', '#020202'],
    shape: 'fluid',
  },
  {
    id: 'palmAurora',
    label: 'Palm Aurora',
    description: 'Tranquil Palm Leaf with Nordic slate depths',
    gradient: ['#899D78', '#326273', '#0E1714'],
    shape: 'orbs',
  },
  {
    id: 'obsidianGlass',
    label: 'Obsidian Minimal',
    description: 'Smoked graphite glass with specular sheen',
    gradient: ['#28343C', '#12191D', '#020202'],
    shape: 'geometry',
  },
  {
    id: 'terracottaDawn',
    label: 'Terracotta Dawn',
    description: 'Apricot dawn transitioning into deep terracotta velvet',
    gradient: ['#E39774', '#B02E0C', '#4F1505'],
    shape: 'ribbons',
  },
  {
    id: 'slateMist',
    label: 'Slate & Palm Mist',
    description: 'Subtle balance between Blue Slate and Palm Leaf sage',
    gradient: ['#326273', '#899D78', '#17272E'],
    shape: 'arcs',
  },
  {
    id: 'ironFlame',
    label: 'Iron Velvet Flame',
    description: 'Bold oxidized iron infused with Tangerine highlights',
    gradient: ['#B02E0C', '#E39774', '#661601'],
    shape: 'waves',
  },
];

/**
 * Anchor palette shades with harmonic variants for generative mesh synthesis.
 */
const HARMONIC_ANCHORS = {
  tangerine: ['#E39774', '#F5B495', '#C47754', '#FFD1BF', '#9E4E2C'],
  slate: ['#326273', '#4A8094', '#214754', '#6AA9C2', '#122830'],
  iron: ['#B02E0C', '#D44822', '#851E05', '#EB633E', '#521000'],
  palm: ['#899D78', '#A2B591', '#667A55', '#BDCEB0', '#4A5B3B'],
  obsidian: ['#020202', '#12181C', '#1E272D', '#2B373F', '#090C0E'],
};

/**
 * Helper to calculate perceptual luminance for contrast checks.
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
 * Generates an algorithmic, harmonious random mesh palette guaranteed
 * to harmonize with the 5-tone design system and provide contrast.
 */
export function generateRandomMeshPalette(): {
  gradient: [string, string, string];
  shape: ShapePatternType;
  name: string;
  isLightText: boolean;
} {
  const shapeOptions: ShapePatternType[] = [
    'waves',
    'orbs',
    'geometry',
    'arcs',
    'ribbons',
    'aurora',
    'fluid',
  ];
  const selectedShape = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];

  // Harmonic mood strategies:
  // 1. Tangerine & Slate (Warm & Cool contrast)
  // 2. Iron & Tangerine (Fiery Sunset)
  // 3. Slate & Palm (Nordic Organic)
  // 4. Obsidian Minimal (Deep Glass)
  // 5. Palm & Tangerine (Dawn Oasis)
  const strategies = [
    () => {
      const top = HARMONIC_ANCHORS.tangerine[Math.floor(Math.random() * HARMONIC_ANCHORS.tangerine.length)];
      const mid = HARMONIC_ANCHORS.slate[Math.floor(Math.random() * HARMONIC_ANCHORS.slate.length)];
      const base = HARMONIC_ANCHORS.obsidian[Math.floor(Math.random() * HARMONIC_ANCHORS.obsidian.length)];
      return { gradient: [top, mid, base] as [string, string, string], name: 'Aurora Sunset' };
    },
    () => {
      const top = HARMONIC_ANCHORS.slate[Math.floor(Math.random() * HARMONIC_ANCHORS.slate.length)];
      const mid = HARMONIC_ANCHORS.slate[1];
      const base = HARMONIC_ANCHORS.obsidian[1];
      return { gradient: [top, mid, base] as [string, string, string], name: 'Nordic Frost' };
    },
    () => {
      const top = HARMONIC_ANCHORS.iron[Math.floor(Math.random() * HARMONIC_ANCHORS.iron.length)];
      const mid = HARMONIC_ANCHORS.tangerine[Math.floor(Math.random() * HARMONIC_ANCHORS.tangerine.length)];
      const base = HARMONIC_ANCHORS.iron[4];
      return { gradient: [top, mid, base] as [string, string, string], name: 'Oxidized Velvet' };
    },
    () => {
      const top = HARMONIC_ANCHORS.palm[Math.floor(Math.random() * HARMONIC_ANCHORS.palm.length)];
      const mid = HARMONIC_ANCHORS.slate[Math.floor(Math.random() * HARMONIC_ANCHORS.slate.length)];
      const base = HARMONIC_ANCHORS.obsidian[1];
      return { gradient: [top, mid, base] as [string, string, string], name: 'Sage Horizon' };
    },
    () => {
      const top = HARMONIC_ANCHORS.obsidian[3];
      const mid = HARMONIC_ANCHORS.slate[2];
      const base = HARMONIC_ANCHORS.obsidian[0];
      return { gradient: [top, mid, base] as [string, string, string], name: 'Obsidian Sheen' };
    },
    () => {
      const top = HARMONIC_ANCHORS.tangerine[0];
      const mid = HARMONIC_ANCHORS.iron[1];
      const base = HARMONIC_ANCHORS.obsidian[0];
      return { gradient: [top, mid, base] as [string, string, string], name: 'Solar Ember' };
    },
  ];

  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  const { gradient, name } = strategy();

  const lum = getHexLuminance(gradient[0]);
  const isLightText = lum < 140;

  return {
    gradient,
    shape: selectedShape,
    name,
    isLightText,
  };
}
