import {
  Agent,
  AgentRole,
  BoardElements,
  FallbackMapGeometry,
  MapCallout,
  PresetPlanSeed,
  Side,
  StrategyPlay,
  ValorantMap,
} from '../types/tactix';

export const ROLES_ORDER: AgentRole[] = ['duelist', 'initiator', 'controller', 'sentinel'];

export const ROLE_META: Record<
  AgentRole,
  { label: string; th: string; colorClass: string; bgClass: string; borderClass: string; hex: string }
> = {
  duelist: {
    label: 'Duelist',
    th: 'เปิดหน้า / เข้าทำ',
    colorClass: 'text-[#FB923C]',
    bgClass: 'bg-[#FB923C]/15 text-[#FB923C]',
    borderClass: 'border-[#FB923C]/40',
    hex: '#FB923C',
  },
  initiator: {
    label: 'Initiator',
    th: 'หาข้อมูล / เปิดทาง',
    colorClass: 'text-[#FACC15]',
    bgClass: 'bg-[#FACC15]/15 text-[#FACC15]',
    borderClass: 'border-[#FACC15]/40',
    hex: '#FACC15',
  },
  controller: {
    label: 'Controller',
    th: 'ปิดควัน / คุมพื้นที่',
    colorClass: 'text-[#60A5FA]',
    bgClass: 'bg-[#60A5FA]/15 text-[#60A5FA]',
    borderClass: 'border-[#60A5FA]/40',
    hex: '#60A5FA',
  },
  sentinel: {
    label: 'Sentinel',
    th: 'กันไซท์ / ระวังหลัง',
    colorClass: 'text-[#34D399]',
    bgClass: 'bg-[#34D399]/15 text-[#34D399]',
    borderClass: 'border-[#34D399]/40',
    hex: '#34D399',
  },
};

export const ROUND_TYPES = [
  { id: 'pistol', label: 'Pistol', th: 'รอบปืนพก' },
  { id: 'eco', label: 'Eco / Save', th: 'รอบประหยัด' },
  { id: 'bonus', label: 'Bonus', th: 'รอบโบนัส' },
  { id: 'full', label: 'Full Buy', th: 'ซื้อเต็ม' },
  { id: 'retake', label: 'Retake', th: 'แผนรีเทค' },
] as const;

export function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const makeAgent = (name: string, role: AgentRole, abilityNames: string[]): Agent => ({
  id: normalizeId(name),
  name,
  role,
  abilities: abilityNames.map((aName, idx) => ({
    slot: ['Ability1', 'Ability2', 'Grenade', 'Ultimate'][idx] ?? `Slot${idx + 1}`,
    name: aName,
    description: '',
  })),
});

export const FALLBACK_AGENTS: Agent[] = [
  makeAgent('Jett', 'duelist', ['Updraft', 'Tailwind', 'Cloudburst', 'Blade Storm']),
  makeAgent('Phoenix', 'duelist', ['Curveball', 'Hot Hands', 'Blaze', 'Run it Back']),
  makeAgent('Reyna', 'duelist', ['Devour', 'Dismiss', 'Leer', 'Empress']),
  makeAgent('Raze', 'duelist', ['Blast Pack', 'Paint Shells', 'Boom Bot', 'Showstopper']),
  makeAgent('Yoru', 'duelist', ['Blindside', 'Gatecrash', 'Fakeout', 'Dimensional Drift']),
  makeAgent('Neon', 'duelist', ['Relay Bolt', 'High Gear', 'Fast Lane', 'Overdrive']),
  makeAgent('Iso', 'duelist', ['Undercut', 'Double Tap', 'Contingency', 'Kill Contract']),
  makeAgent('Waylay', 'duelist', ['Lightspeed', 'Refract', 'Saturate', 'Convergent Paths']),
  makeAgent('Sova', 'initiator', ['Shock Bolt', 'Recon Bolt', 'Owl Drone', "Hunter's Fury"]),
  makeAgent('Breach', 'initiator', ['Flashpoint', 'Fault Line', 'Aftershock', 'Rolling Thunder']),
  makeAgent('Skye', 'initiator', ['Trailblazer', 'Guiding Light', 'Regrowth', 'Seekers']),
  makeAgent('KAY/O', 'initiator', ['FLASH/drive', 'ZERO/point', 'FRAG/ment', 'NULL/cmd']),
  makeAgent('Fade', 'initiator', ['Seize', 'Haunt', 'Prowler', 'Nightfall']),
  makeAgent('Gekko', 'initiator', ['Wingman', 'Dizzy', 'Mosh Pit', 'Thrash']),
  makeAgent('Tejo', 'initiator', ['Special Delivery', 'Guided Salvo', 'Stealth Drone', 'Armageddon']),
  makeAgent('Brimstone', 'controller', ['Incendiary', 'Sky Smoke', 'Stim Beacon', 'Orbital Strike']),
  makeAgent('Omen', 'controller', ['Paranoia', 'Dark Cover', 'Shrouded Step', 'From the Shadows']),
  makeAgent('Viper', 'controller', ['Poison Cloud', 'Toxic Screen', 'Snake Bite', "Viper's Pit"]),
  makeAgent('Astra', 'controller', ['Nova Pulse', 'Nebula', 'Gravity Well', 'Cosmic Divide']),
  makeAgent('Harbor', 'controller', ['Cove', 'High Tide', 'Cascade', 'Reckoning']),
  makeAgent('Clove', 'controller', ['Meddle', 'Ruse', 'Pick-Me-Up', 'Not Dead Yet']),
  makeAgent('Sage', 'sentinel', ['Slow Orb', 'Healing Orb', 'Barrier Orb', 'Resurrection']),
  makeAgent('Cypher', 'sentinel', ['Cyber Cage', 'Spycam', 'Trapwire', 'Neural Theft']),
  makeAgent('Killjoy', 'sentinel', ['Alarmbot', 'Turret', 'Nanoswarm', 'Lockdown']),
  makeAgent('Chamber', 'sentinel', ['Headhunter', 'Rendezvous', 'Trademark', 'Tour De Force']),
  makeAgent('Deadlock', 'sentinel', ['Sonic Sensor', 'Barrier Mesh', 'GravNet', 'Annihilation']),
  makeAgent('Vyse', 'sentinel', ['Shear', 'Arc Rose', 'Razorvine', 'Steel Garden']),
];

const DEFAULT_DEF_SPAWN = { x: 230, y: 28, w: 140, h: 70 };
const DEFAULT_ATK_SPAWN = { x: 230, y: 502, w: 140, h: 70 };

export const GENERIC_2SITE_GEOMETRY: FallbackMapGeometry = {
  defenderSpawn: DEFAULT_DEF_SPAWN,
  attackerSpawn: DEFAULT_ATK_SPAWN,
  sites: [
    { x: 50, y: 150, w: 170, h: 155, label: 'A' },
    { x: 380, y: 150, w: 170, h: 155, label: 'B' },
  ],
  floors: [
    { x: 85, y: 305, w: 65, h: 225 },
    { x: 85, y: 480, w: 155, h: 50 },
    { x: 265, y: 98, w: 70, h: 404 },
    { x: 450, y: 305, w: 65, h: 225 },
    { x: 360, y: 480, w: 155, h: 50 },
    { x: 220, y: 245, w: 50, h: 44 },
    { x: 330, y: 245, w: 50, h: 44 },
    { x: 135, y: 60, w: 40, h: 95 },
    { x: 135, y: 60, w: 100, h: 40 },
    { x: 425, y: 60, w: 40, h: 95 },
    { x: 365, y: 60, w: 100, h: 40 },
  ],
  callouts: [
    { x: 118, y: 415, text: 'A MAIN' },
    { x: 482, y: 415, text: 'B MAIN' },
    { x: 300, y: 360, text: 'MID' },
  ],
};

export const FALLBACK_CALLOUTS: Record<string, MapCallout[]> = {
  ascent: [
    { key: 'A Tree', group: 'A', name: 'Tree', x: 39.8, y: 29.5 },
    { key: 'A Lobby', group: 'A', name: 'Lobby', x: 60.3, y: 25.9 },
    { key: 'A Main', group: 'A', name: 'Main', x: 48.4, y: 20.1 },
    { key: 'A Window', group: 'A', name: 'Window', x: 24.1, y: 29.2 },
    { key: 'A Site', group: 'A', name: 'Site', x: 35.0, y: 14.2 },
    { key: 'A Rafters', group: 'A', name: 'Rafters', x: 23.9, y: 14.4 },
    { key: 'A Garden', group: 'A', name: 'Garden', x: 28.5, y: 30.9 },
    { key: 'A Wine', group: 'A', name: 'Wine', x: 48.6, y: 5.8 },
    { key: 'Atk Spawn', group: 'Atk', name: 'Spawn', x: 81.7, y: 56.9 },
    { key: 'Def Spawn', group: 'Def', name: 'Spawn', x: 13.2, y: 43.4 },
    { key: 'B Lobby', group: 'B', name: 'Lobby', x: 71.7, y: 67.8 },
    { key: 'B Main', group: 'B', name: 'Main', x: 40.5, y: 71.2 },
    { key: 'B Boat House', group: 'B', name: 'Boat House', x: 27.0, y: 88.7 },
    { key: 'B Site', group: 'B', name: 'Site', x: 28.5, y: 73.7 },
    { key: 'Mid Bottom', group: 'Mid', name: 'Bottom', x: 39.7, y: 49.5 },
    { key: 'Mid Catwalk', group: 'Mid', name: 'Catwalk', x: 52.5, y: 41.1 },
    { key: 'Mid Courtyard', group: 'Mid', name: 'Courtyard', x: 49.3, y: 48.8 },
    { key: 'Mid Cubby', group: 'Mid', name: 'Cubby', x: 45.5, y: 33.6 },
    { key: 'Mid Link', group: 'Mid', name: 'Link', x: 51.4, y: 61.7 },
    { key: 'Mid Market', group: 'Mid', name: 'Market', x: 29.8, y: 49.7 },
    { key: 'Mid Pizza', group: 'Mid', name: 'Pizza', x: 30.6, y: 44.7 },
    { key: 'Mid Top', group: 'Mid', name: 'Top', x: 66.5, y: 38.0 },
  ],
  haven: [
    { key: 'A Garden', group: 'A', name: 'Garden', x: 74.2, y: 41.0 },
    { key: 'A Link', group: 'A', name: 'Link', x: 29.0, y: 32.4 },
    { key: 'A Lobby', group: 'A', name: 'Lobby', x: 62.4, y: 38.5 },
    { key: 'A Long', group: 'A', name: 'Long', x: 57.6, y: 17.7 },
    { key: 'A Sewer', group: 'A', name: 'Sewer', x: 50.0, y: 38.4 },
    { key: 'A Site', group: 'A', name: 'Site', x: 40.2, y: 17.0 },
    { key: 'A Tower', group: 'A', name: 'Tower', x: 30.8, y: 13.9 },
    { key: 'Atk Spawn', group: 'Atk', name: 'Spawn', x: 89.5, y: 51.2 },
    { key: 'B Back', group: 'B', name: 'Back', x: 29.4, y: 49.5 },
    { key: 'B Site', group: 'B', name: 'Site', x: 40.1, y: 50.1 },
    { key: 'C Cubby', group: 'C', name: 'Cubby', x: 60.1, y: 80.2 },
    { key: 'C Garage', group: 'C', name: 'Garage', x: 49.3, y: 62.9 },
    { key: 'C Link', group: 'C', name: 'Link', x: 34.3, y: 64.9 },
    { key: 'C Lobby', group: 'C', name: 'Lobby', x: 66.4, y: 76.6 },
    { key: 'C Long', group: 'C', name: 'Long', x: 64.4, y: 89.4 },
    { key: 'C Site', group: 'C', name: 'Site', x: 41.8, y: 82.1 },
    { key: 'C Window', group: 'C', name: 'Window', x: 41.9, y: 64.3 },
    { key: 'Def Spawn', group: 'Def', name: 'Spawn', x: 14.0, y: 42.2 },
    { key: 'Mid Courtyard', group: 'Mid', name: 'Courtyard', x: 59.0, y: 50.6 },
    { key: 'Mid Doors', group: 'Mid', name: 'Doors', x: 62.4, y: 63.1 },
    { key: 'Mid Window', group: 'Mid', name: 'Window', x: 67.6, y: 49.6 },
  ],
  bind: [
    { key: 'A Bath', group: 'A', name: 'Bath', x: 83.9, y: 43.0 },
    { key: 'A Cubby', group: 'A', name: 'Cubby', x: 58.7, y: 46.0 },
    { key: 'A Exit', group: 'A', name: 'Exit', x: 92.4, y: 52.2 },
    { key: 'A Lamps', group: 'A', name: 'Lamps', x: 58.2, y: 33.9 },
    { key: 'A Link', group: 'A', name: 'Link', x: 51.8, y: 59.2 },
    { key: 'A Lobby', group: 'A', name: 'Lobby', x: 76.3, y: 60.7 },
    { key: 'A Short', group: 'A', name: 'Short', x: 62.4, y: 49.7 },
    { key: 'A Site', group: 'A', name: 'Site', x: 73.4, y: 33.3 },
    { key: 'A Teleporter', group: 'A', name: 'Teleporter', x: 60.6, y: 41.1 },
    { key: 'A Tower', group: 'A', name: 'Tower', x: 72.8, y: 20.8 },
    { key: 'Atk Cave', group: 'Atk', name: 'Cave', x: 59.2, y: 73.6 },
    { key: 'Atk Spawn', group: 'Atk', name: 'Spawn', x: 58.2, y: 95.8 },
    { key: 'B Elbow', group: 'B', name: 'Elbow', x: 15.8, y: 30.6 },
    { key: 'B Exit', group: 'B', name: 'Exit', x: 47.3, y: 44.1 },
    { key: 'B Fountain', group: 'B', name: 'Fountain', x: 25.9, y: 62.9 },
    { key: 'B Garden', group: 'B', name: 'Garden', x: 24.7, y: 42.8 },
    { key: 'B Hall', group: 'B', name: 'Hall', x: 28.5, y: 20.2 },
    { key: 'B Link', group: 'B', name: 'Link', x: 42.2, y: 59.2 },
    { key: 'B Long', group: 'B', name: 'Long', x: 19.3, y: 51.5 },
    { key: 'B Short', group: 'B', name: 'Short', x: 39.7, y: 53.0 },
    { key: 'B Site', group: 'B', name: 'Site', x: 29.2, y: 31.2 },
    { key: 'B Teleporter', group: 'B', name: 'Teleporter', x: 15.1, y: 43.5 },
    { key: 'B Window', group: 'B', name: 'Window', x: 32.3, y: 44.7 },
    { key: 'Def Spawn', group: 'Def', name: 'Spawn', x: 51.7, y: 10.4 },
  ],
};

export const MAP_FEATURES_TH: Record<string, string> = {
  ascent: 'ประตูปิดไซท์ได้ · Mid เปิดกว้างควบคุมจังหวะเกม',
  haven: '3 ไซท์ (A/B/C) · ต้องหมุนทีมและอ่านข่าวไว',
  bind: 'ไม่มี Mid · มีประตูวาร์ป 2 จุดสลับไซท์เร็ว',
  split: 'Mid สูงชัน · คุม Heaven เพื่อเปิดทางเข้าไซท์',
  lotus: '3 ไซท์ · ประตูหมุนและกำแพงทำลายได้',
  sunset: 'Mid คอนโทรลสำคัญ · Market เชื่อม B เร็ว',
  icebox: 'แนวตั้งเยอะ · ซิปไลน์และการวาง Spike หลากหลาย',
  breeze: 'พื้นที่กว้างมาก · ดวลระยะไกลและม่าน Viper สำคัญ',
  pearl: 'ไม่มีกิมมิกพิเศษ · เน้นคุม Mid และ Post-plant B Long',
  fracture: 'ฝั่งบุกโอบได้ 2 ด้าน · ฝั่งรับต้องชิงพื้นที่เชิงรุก',
  abyss: 'ไม่มีขอบเขตตกเหวตาย · กระโดดอ้อมและคุม Mid',
  corrode: '2 ไซท์ยุทธวิธี · มี Mid Window/Stairs เชื่อม A-B เร็ว',
  summit: '2 ไซท์ · มีโซน B Drop/Trophy และ Mid Fountain',
  district: 'Team Deathmatch · ตรอกเมืองปะทะระยะกลาง-ใกล้',
  kasbah: 'Team Deathmatch · ลานป้อมปราการสลับมุมสูง',
  drift: 'Team Deathmatch · ทางยาวตรงกลางวัดคมระยะไกล',
  glitch: 'Team Deathmatch · อารีน่า 2 โซนสลับสภาพแวดล้อม',
  piazza: 'Team Deathmatch · จัตุรัสเปิดกว้างดวลปืนเร็ว',
};

export const FALLBACK_MAPS: ValorantMap[] = [
  {
    id: 'ascent',
    uuid: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
    name: 'Ascent',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.ascent,
    callouts: FALLBACK_CALLOUTS.ascent,
    fallbackGeometry: {
      defenderSpawn: DEFAULT_DEF_SPAWN,
      attackerSpawn: DEFAULT_ATK_SPAWN,
      sites: [
        { x: 50, y: 150, w: 180, h: 160, label: 'A' },
        { x: 380, y: 150, w: 180, h: 160, label: 'B' },
      ],
      floors: [
        { x: 80, y: 300, w: 70, h: 230 },
        { x: 80, y: 480, w: 160, h: 50 },
        { x: 260, y: 98, w: 80, h: 404 },
        { x: 450, y: 300, w: 70, h: 230 },
        { x: 360, y: 480, w: 160, h: 50 },
        { x: 220, y: 240, w: 50, h: 44 },
        { x: 330, y: 262, w: 60, h: 44 },
        { x: 140, y: 60, w: 40, h: 100 },
        { x: 140, y: 60, w: 100, h: 40 },
        { x: 420, y: 60, w: 40, h: 100 },
        { x: 360, y: 60, w: 100, h: 40 },
      ],
      callouts: [
        { x: 115, y: 420, text: 'A MAIN' },
        { x: 485, y: 420, text: 'B MAIN' },
        { x: 300, y: 380, text: 'MID' },
        { x: 300, y: 160, text: 'MARKET' },
      ],
    },
  },
  {
    id: 'haven',
    uuid: '2bee0dc9-4ffe-519b-1cbd-7fbe763a6047',
    name: 'Haven',
    category: 'standard',
    sites: ['A', 'B', 'C'],
    feature: MAP_FEATURES_TH.haven,
    callouts: FALLBACK_CALLOUTS.haven,
    fallbackGeometry: {
      defenderSpawn: DEFAULT_DEF_SPAWN,
      attackerSpawn: DEFAULT_ATK_SPAWN,
      sites: [
        { x: 40, y: 140, w: 150, h: 150, label: 'A' },
        { x: 240, y: 220, w: 120, h: 120, label: 'B' },
        { x: 420, y: 140, w: 150, h: 150, label: 'C' },
      ],
      floors: [
        { x: 80, y: 290, w: 60, h: 240 },
        { x: 80, y: 480, w: 160, h: 50 },
        { x: 470, y: 290, w: 60, h: 240 },
        { x: 360, y: 480, w: 170, h: 50 },
        { x: 270, y: 340, w: 60, h: 162 },
        { x: 270, y: 98, w: 60, h: 122 },
        { x: 100, y: 60, w: 40, h: 80 },
        { x: 100, y: 60, w: 130, h: 40 },
        { x: 470, y: 60, w: 40, h: 80 },
        { x: 370, y: 60, w: 140, h: 40 },
        { x: 330, y: 400, w: 140, h: 40 },
        { x: 140, y: 400, w: 130, h: 40 },
      ],
      callouts: [
        { x: 110, y: 360, text: 'A LONG' },
        { x: 500, y: 360, text: 'C LONG' },
        { x: 400, y: 423, text: 'GARAGE' },
        { x: 300, y: 470, text: 'MID' },
      ],
    },
  },
  {
    id: 'bind',
    uuid: '2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba',
    name: 'Bind',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.bind,
    callouts: FALLBACK_CALLOUTS.bind,
    fallbackGeometry: {
      defenderSpawn: DEFAULT_DEF_SPAWN,
      attackerSpawn: DEFAULT_ATK_SPAWN,
      sites: [
        { x: 50, y: 140, w: 170, h: 150, label: 'A' },
        { x: 380, y: 140, w: 170, h: 170, label: 'B' },
      ],
      floors: [
        { x: 90, y: 290, w: 60, h: 240 },
        { x: 90, y: 480, w: 150, h: 50 },
        { x: 450, y: 310, w: 60, h: 220 },
        { x: 360, y: 480, w: 150, h: 50 },
        { x: 240, y: 380, w: 120, h: 122 },
        { x: 150, y: 400, w: 90, h: 50 },
        { x: 360, y: 400, w: 90, h: 50 },
        { x: 250, y: 130, w: 100, h: 60 },
        { x: 220, y: 145, w: 30, h: 30 },
        { x: 120, y: 60, w: 40, h: 80 },
        { x: 120, y: 60, w: 110, h: 40 },
        { x: 440, y: 60, w: 40, h: 80 },
        { x: 370, y: 60, w: 110, h: 40 },
      ],
      callouts: [
        { x: 120, y: 360, text: 'A SHORT' },
        { x: 480, y: 370, text: 'B LONG' },
        { x: 300, y: 395, text: 'LOBBY' },
        { x: 300, y: 205, text: 'TELEPORT' },
      ],
      teleporters: { from: { x: 300, y: 450 }, to: { x: 300, y: 160 } },
    },
  },
  {
    id: 'split',
    uuid: 'd960549e-485c-e861-8d71-aa9d1aed12a2',
    name: 'Split',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.split,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'lotus',
    uuid: '2fe4ed3a-450a-948b-6d6b-e89a78e680a9',
    name: 'Lotus',
    category: 'standard',
    sites: ['A', 'B', 'C'],
    feature: MAP_FEATURES_TH.lotus,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'sunset',
    uuid: '92584fbe-486a-b1b2-9faa-39b0f486b498',
    name: 'Sunset',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.sunset,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'icebox',
    uuid: 'e2ad5c54-4114-a870-9641-8ea21279579a',
    name: 'Icebox',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.icebox,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'pearl',
    uuid: 'fd267378-4d1d-484f-ff52-77821ed10dc2',
    name: 'Pearl',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.pearl,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'breeze',
    uuid: '2fb9a4fd-47b8-4e7d-a969-74b4046ebd53',
    name: 'Breeze',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.breeze,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'fracture',
    uuid: 'b529448b-4d60-346e-e89e-00a4c527a405',
    name: 'Fracture',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.fracture,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'abyss',
    uuid: '224b0a95-48b9-f703-1bd8-67aca101a61f',
    name: 'Abyss',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.abyss,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'corrode',
    uuid: '1c18ab1f-420d-0d8b-71d0-77ad3c439115',
    name: 'Corrode',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.corrode,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'summit',
    uuid: '756da597-416b-c0f2-f47b-afbdf28670bc',
    name: 'Summit',
    category: 'standard',
    sites: ['A', 'B'],
    feature: MAP_FEATURES_TH.summit,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'district',
    uuid: '690b3ed2-4dff-945b-8223-6da834e30d24',
    name: 'District',
    category: 'tdm',
    sites: ['TDM'],
    feature: MAP_FEATURES_TH.district,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'kasbah',
    uuid: '12452a9d-48c3-0b02-e7eb-0381c3520404',
    name: 'Kasbah',
    category: 'tdm',
    sites: ['TDM'],
    feature: MAP_FEATURES_TH.kasbah,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'drift',
    uuid: '2c09d728-42d5-30d8-43dc-96a05cc7ee9d',
    name: 'Drift',
    category: 'tdm',
    sites: ['TDM'],
    feature: MAP_FEATURES_TH.drift,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'glitch',
    uuid: 'd6336a5a-428f-c591-98db-c8a291159134',
    name: 'Glitch',
    category: 'tdm',
    sites: ['TDM'],
    feature: MAP_FEATURES_TH.glitch,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
  {
    id: 'piazza',
    uuid: 'de28aa9b-4cbe-1003-320e-6cb3ec309557',
    name: 'Piazza',
    category: 'tdm',
    sites: ['TDM'],
    feature: MAP_FEATURES_TH.piazza,
    callouts: [],
    fallbackGeometry: GENERIC_2SITE_GEOMETRY,
  },
];

export const MAP_TIPS: Record<string, Record<Side, string[]>> = {
  ascent: {
    attack: [
      'ยึด Mid Catwalk หรือ Market ก่อน เพื่อตัดการหมุนของฝั่งรับระหว่าง A และ B',
      'ใช้ควันปิด Heaven (Rafters) และ Door/Tree ก่อนพุ่งเข้าไซท์ A',
      'เก็บยูทิลิตี้ Molly / Shock Dart ไว้ถ่วงเวลาการรีเทคหลังวาง Spike',
    ],
    defense: [
      'กดปิดประตูเหล็กเมื่อถูกบุกหนัก เพื่อบังคับให้ศัตรูต้องยิงเปิดประตูและเสียเวลา',
      'วาง Sentinel (Cypher/Killjoy) คุม B Main ป้องกันการ Rush เร็ว',
      'ส่ง Initiator เช็คข้อมูล Mid ช่วงต้นรอบเพื่อรู้ทิศทางเกมบุกทันที',
    ],
  },
  haven: {
    attack: [
      'ทำเสียงหลอกไซท์หนึ่งแล้วหมุนเร็วไปอีกไซท์ เพราะฝั่งรับต้องกระจายกันถึง 3 ไซท์',
      'คุม Garage ให้ได้เพื่อเปิดทางกดดันทั้ง B และ C พร้อมกัน',
      'ใช้แฟลชหรือโดรนเปิด A Long ก่อนเข้าปะทะมุม A Tower',
    ],
    defense: [
      'จัดโครงสร้าง 1-3-1 หรือ 2-1-2 ให้ทุกไซท์มีคนคอยรายงานข้อมูล',
      'Controller ยืนโซนกลาง (B/Mid) เพื่อให้ปา Smoke ช่วยได้ทันทั้ง 3 ไซท์',
      'เมื่อเสียไซท์แล้วให้รวมกลุ่มรีเทคพร้อมกัน อย่าเดินเข้าไปตายทีละคน',
    ],
  },
  bind: {
    attack: [
      'ใช้ประตูวาร์ป (Teleporter) หลอกเสียงและสลับไซท์เมื่ออีกฝั่งส่งคนไปซ้อน',
      'ปา Smoke ปิด B Hall และ Elbow ก่อนโถมเข้าทาง Hookah (B Window)',
      'เข้า A Short และ A Bath พร้อมกัน 2 ทาง เพื่อไม่ให้ฝั่งรับเล็งดักทางเดียว',
    ],
    defense: [
      'ตั้งใจฟังเสียงประตูวาร์ปเพื่ออ่านการหมุนทีมของฝั่งบุกทันที',
      'วางกับดักและสกิลถ่วงเวลาที่ A Short และ B Window ซึ่งเป็นคอขวดแคบ',
      'เล่นแบบถอยหลังไซท์และเน้น Retake ร่วมกัน เพราะเส้นทางหมุนของฝั่งรับสั้น',
    ],
  },
  split: {
    attack: [
      'Mid Control คือหัวใจของ Split — ยึด Vent หรือ Mail เพื่อบีบ A Heaven หรือ B Heaven',
      'ปิดควันที่ A Ramps และ A Heaven ก่อนเข้าไซท์ A',
      'ใช้ Breacher/Flash เคลียร์มุม B Garage ก่อนลงไซท์ B',
    ],
    defense: [
      'ส่ง 2 คนคุม Mid/Vent อย่างแน่นหนา เพราะถ้าเสีย Mid จะเสียพื้นที่ Heaven ทั้งสองฝั่ง',
      'Sage/Cypher เหมาะมากสำหรับปิดทางเข้า B Main ที่แคบ',
      'ใช้มุมสูงจาก Rafters/Heaven ยิงกดดันคู่กับเพื่อนที่คอยดักมุมล่าง',
    ],
  },
  lotus: {
    attack: [
      'ชิงพื้นที่ A Rubble ตั้งแต่ต้นรอบด้วยยูทิลิตี้เพื่อคุมจังหวะเกม',
      'ใช้ประตูหมุนเชื่อม A-B และ B-C เพื่อหมุนไซท์เร็วหลังหลอกฝั่งรับ',
      'พังประตูลับที่ C Link เพื่อเปิดมุมยิงหลังไซท์ C',
    ],
    defense: [
      'ต้องสู้ชิงพื้นที่ A Main (Rubble) ช่วงต้นรอบ อย่าปล่อยให้ฝั่งบุกยืนคุมฟรี',
      'วาง Sentinel คุม C Mound หรือ B Main เพื่อดักการย่องเข้าเงียบ',
      'เตรียมยูทิลิตี้ Retake ไซท์ A เพราะเข้าได้หลายทาง',
    ],
  },
  sunset: {
    attack: [
      'คุม Mid Tiles และ Top Mid เพื่อแยกฝั่งรับและเจาะ Market เข้า B',
      'เคลียร์มุม A Elbow และ A Alley ก่อนเข้าวาง Spike ไซท์ A',
      'เล่น Post-plant B จาก B Main ด้วย Lineup หรือสกิลถ่วงเวลา',
    ],
    defense: [
      'คุม Mid Tiles ร่วมกับ Initiator เพื่อไม่ให้ฝั่งบุกเดินเข้า Market สบาย',
      'วางกับดักกัน B Main เพราะทางบุกตรงและเร็วมาก',
      'ซ้อนมุมยิง A Elbow + Site เพื่อแลกคิลได้เปรียบ',
    ],
  },
  icebox: {
    attack: [
      'ใช้ม่าน Viper/Harbor ตัดสายตามุมสูงที่ A Rafters และ A Screen ก่อนวาง Spike',
      'เช็คคนซ่อนที่ B Yellow และ B Snowman ด้วยโดรนก่อนเข้าไซท์ B',
      'ส่ง 1 คนป่วน Mid Tube / Kitchen เพื่อดึงตัวซ้อนของฝั่งรับ',
    ],
    defense: [
      'คุม Mid Boiler/Kitchen เพื่อไม่ให้ฝั่งบุกโอบหลังไซท์ A และ B ผ่านท่อ',
      'เล่นมุมยกระดับที่ A Rafters และ B Hut คู่กับสกิลหน่วงเวลา',
      'หากเสีย B Yellow ให้ถอยคุม Snowman รอเพื่อนหมุนมา Retake พร้อมกัน',
    ],
  },
  pearl: {
    attack: [
      'B Ramp ไป B Long เป็นจุดยิง Post-plant ที่ทรงพลัง — เคลียร์ B Tower ก่อนวาง Spike',
      'เจาะ Mid Plaza → Mid Doors เพื่อบีบ B Link หรือ A Art ได้ทั้ง 2 ไซท์',
      'ปา Smoke ปิด A Flowers และ A Secret ก่อนเข้าไซท์ A',
    ],
    defense: [
      'อย่าปล่อยให้ฝั่งบุกยึด B Main/Ramp ได้ฟรีโดยไม่เสียสกิล เพราะจะรีเทค B ยากมาก',
      'วาง Sentinel หรือ Controller คุม Mid Connector / A Art เพื่อตัดการ Split',
      'ใช้แฟลชสวนทางยาว B Long หรือ A Main เพื่อเก็บข้อมูลและชิงจังหวะ',
    ],
  },
  breeze: {
    attack: [
      'ม่าน Viper หรือ Harbor สำคัญมากสำหรับตัดมุมยิงกว้างใน A Site และ B Site',
      'ส่งคนเช็ค Mid Pillar → Mid Wood Doors เพื่อลอบเจาะ A Bridge หรือ B Elbow',
      'วาง Spike เปิด A Main หรือ B Main แล้วถอยเล่นระยะไกล',
    ],
    defense: [
      'คุม Mid Nest และ Mid Wood Doors ให้ดีเพื่อป้องกันการ Split เข้า A/B',
      'Operator มีประสิทธิภาพสูงมากทั้งที่ A Pyramids และ B Back',
      'รีบสกัดการเดินผ่าน B Tunnel หากอีกฝั่งพยายามหมุนไซท์เร็ว',
    ],
  },
  fracture: {
    attack: [
      'ใช้ Zipline ข้ามไปฝั่ง Dish / Arcade เพื่อบีบไซท์จาก 2 ด้านพร้อมกัน',
      'ปา Smoke ปิดมุมจาก Def Spawn และ A Link / B Link ก่อนลงไซท์',
      'ประสานจังหวะเข้า A Main + A Drop ให้พร้อมกันในวินาทีเดียว',
    ],
    defense: [
      'ห้ามนั่งรอรับในไซท์อย่างเดียว — ต้องดันชิงพื้นที่ฝั่งใดฝั่งหนึ่ง (เช่น A Main หรือ B Main) ช่วงต้นรอบ',
      'ใช้ Def Spawn เป็นจุดหมุนเร็วและซ้อนยิง Crossfire ระหว่างสองทางเข้า',
      'ระวังการโอบหลังผ่าน B Canteen และ A Rope ตลอดเวลา',
    ],
  },
  abyss: {
    attack: [
      'ระวังขอบเหวและใช้สกิลกระโดด/วาร์ปสร้างมุมเข้าทำที่ไม่คาดคิด',
      'ยึด Mid Catwalk เพื่อเข้า A Vent หรือ Mid Bend เพื่อเจาะ B Link',
      'ปา Smoke ปิด A Secret / A Bridge และ B Tower ก่อนวาง Spike',
    ],
    defense: [
      'วางกับดักและสกิลดักเสียงที่ Mid Library/Catwalk เพื่ออ่านแผน Split',
      'ใช้ตำแหน่งสูงที่ A Tower และ B Tower คุมทางเข้าหลักทั้งสองไซท์',
      'ระวังโดนผลัก/ดึงตกเหวบริเวณ B Danger และ A Bridge',
    ],
  },
  corrode: {
    attack: [
      'คุม Mid Stairs และ Mid Window เพื่อเปิดทางบีบทั้ง A Link และ B Link',
      'ปา Smoke ปิดมุมสูงที่ A Crane / A Elbow และ B Tower ก่อนเข้าวาง Spike',
      'ใช้แฟลชเปิดมุมแคบที่ A Pocket หรือ B Arch ก่อนเดินเคลียร์ไซท์',
    ],
    defense: [
      'คุมพื้นที่ Mid Top และ Mid Window ร่วมกันเพื่อตัดการหมุนเกมของฝั่งบุก',
      'วาง Sentinel คุม A Main หรือ B Main เพื่อชะลอเกมบุกเร็ว',
      'ใช้โครงสร้าง Crossfire ระหว่าง A Crane กับ A Pocket หรือ B Tower กับ B Arch',
    ],
  },
  summit: {
    attack: [
      'ชิงพื้นที่ Mid Fountain → Mid Window เพื่อบีบ A Link หรือ B Trophy',
      'ปา Smoke ปิด A Art / A Cave ก่อนดันเข้า A Site จาก A Main',
      'ประสานเข้าทาง B Main คู่กับ B Drop/Trophy เพื่อบีบ B Site พร้อมกัน',
    ],
    defense: [
      'คุม Mid Fountain และ Mid Window เพื่อรู้การกระจายตัวของฝั่งบุกทันที',
      'วางสกิลกันทางลงที่ B Drop และคุมมุม B Gym/Tower',
      'ใช้มุมลึกที่ A Cave / A Art เล่นซ้อนรอจังหวะเพื่อนหมุนมา Retake',
    ],
  },
};

export function getTipsForMap(mapId: string, side: Side): string[] {
  const byMap = MAP_TIPS[mapId];
  if (byMap) return byMap[side];
  return side === 'attack'
    ? [
        'ใช้สกิลหาข้อมูลเคลียร์มุมอันตรายก่อนเข้าไซท์ทุกครั้ง',
        'ปา Smoke ปิดมุมสไนเปอร์และทางหมุนของฝั่งรับก่อนพุ่งเข้าทำ',
        'วาง Spike ในจุดที่ทีมสามารถคุมจากระยะปลอดภัยได้หลังวางเสร็จ',
      ]
    : [
        'กระจายกำลังคุมจุดเข้าหลักและส่งสัญญาณเตือนทันทีเมื่อเห็นศัตรู',
        'เก็บ Smoke และ Molly ไว้ถ่วงเวลาการเข้าไซท์ รอเพื่อนร่วมทีมหมุนมาซ้อน',
        'ประสานสกิลแฟลชและ Recon เพื่อชิงจังหวะ Retake พร้อมกันทั้งทีม',
      ];
}

export const PRESET_SEEDS: PresetPlanSeed[] = [
  // ==================== ASCENT ====================
  {
    id: 'ascent-attack-a',
    mapId: 'ascent',
    side: 'attack',
    name: 'A Split ผ่าน Mid Tree',
    roundType: 'full',
    smokes: ['A Rafters', 'A Garden', 'Mid Pizza'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Site'],
      ['Mid Top', 'Mid Catwalk', 'Mid Cubby', 'A Tree'],
    ],
    utilities: [
      { kind: 'recon', pos: 'A Site', label: 'เช็คหลังกล่อง' },
      { kind: 'flash', pos: 'A Main', label: 'แฟลชเปิดไซท์' },
      { kind: 'spike', pos: { x: 33, y: 14 }, label: 'วาง Spike เปิด A Main' },
    ],
    notes: [
      'Smoke ปิด A Rafters (Heaven), Garden และ Pizza เพื่อตัดมุมยิงและทางหมุนของฝั่งรับ',
      'ทีมหลัก 3 คนออกจาก A Lobby ดันผ่าน A Main ใช้แฟลช + Recon เปิดไซท์พร้อมกัน',
      'อีก 2 คนยึด Mid ผ่าน Catwalk → Cubby แล้วบีบเข้าทาง A Tree เพื่อประกบ 2 ทิศทาง',
    ],
  },
  {
    id: 'ascent-attack-b',
    mapId: 'ascent',
    side: 'attack',
    name: 'Fast B Execute + Market',
    roundType: 'full',
    smokes: ['Mid Market', 'B Boat House', { x: 20, y: 63 }],
    routes: [
      ['Atk Spawn', 'B Lobby', 'B Main', 'B Site'],
      ['Mid Top', 'Mid Courtyard', 'Mid Pizza', 'Mid Market'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชออก B Main' },
      { kind: 'molly', pos: 'B Boat House', label: 'ไล่คนหลัง Boat' },
      { kind: 'spike', pos: { x: 28, y: 75 }, label: 'วาง Spike Default' },
    ],
    notes: [
      'Smoke ปิด Mid Market, Boat House และ Lane เพื่อกันฝั่งรับยิงขวางจาก CT',
      '3 คนเร่งสปีดผ่าน B Main เคลียร์ Switch เพื่อปิดประตู Market ทันที',
      '2 คนคุม Mid กดดัน Market ตัดกำลังเสริมฝั่งรับที่หมุนมาจาก A',
    ],
  },
  {
    id: 'ascent-attack-fake',
    mapId: 'ascent',
    side: 'attack',
    name: 'หลอก A → หมุนเจาะ Mid เข้า B',
    roundType: 'bonus',
    smokes: ['A Rafters', 'Mid Market', 'B Boat House'],
    routes: [
      ['A Lobby', 'A Main'],
      ['Atk Spawn', 'Mid Top', 'Mid Courtyard', 'Mid Market', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'Mid Market', label: 'แฟลชเจาะ Market' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike เปิด Market' },
    ],
    notes: [
      'ส่ง 1-2 คนโยนสกิลและ Smoke หลอกที่ A Main ให้ฝั่งรับหมุนไปซ้อน A',
      'กลุ่มหลัก 3-4 คนดักรอ Mid แล้วเร่งเจาะ Mid Market ลงไซท์ B พร้อมกัน',
      'ปิดประตู Market และวาง Spike เปิดทาง Market สำหรับเล่น Post-plant',
    ],
  },
  {
    id: 'ascent-defense-standard',
    mapId: 'ascent',
    side: 'defense',
    name: 'ตั้งรับมาตรฐาน 2-1-2',
    roundType: 'full',
    smokes: ['A Main', 'B Main', 'Mid Top'],
    routes: [
      ['Def Spawn', 'A Garden', 'A Site'],
      ['Def Spawn', 'Mid Market', 'Mid Courtyard'],
      ['Def Spawn', { x: 20, y: 58 }, 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Main', label: 'กับดัก/สกัด B Main' },
      { kind: 'recon', pos: 'Mid Top', label: 'เช็คข่าวต้นรอบ' },
    ],
    notes: [
      'จัดกำลัง 2-1-2: A 2 คน (Site + Tree), Mid 1 คนคอยเช็คข่าว, B 2 คน',
      'Sentinel วางกับดัก B Main เพื่อปล่อยตัวอีกคนช่วยซ้อน Mid หรือ Market ได้เร็ว',
      'หากฝั่งบุกโถมเข้าไซท์ ให้รีบ Smoke ปิดปากทางเข้าและปิดประตูถ่วงเวลา',
    ],
  },
  {
    id: 'ascent-defense-midpush',
    mapId: 'ascent',
    side: 'defense',
    name: 'ดันชิงพื้นที่ Mid + Catwalk',
    roundType: 'pistol',
    smokes: ['Mid Top', 'B Main'],
    routes: [
      ['A Tree', 'Mid Cubby', 'Mid Catwalk'],
      ['Mid Market', 'Mid Courtyard', 'Mid Bottom'],
    ],
    utilities: [
      { kind: 'flash', pos: 'Mid Courtyard', label: 'แฟลชสวน Mid' },
      { kind: 'recon', pos: 'Mid Top', label: 'สแกนฝั่งบุก' },
    ],
    notes: [
      'ต้นรอบปา Smoke ปิด Mid Top แล้วส่ง 2 คนดันยึด Catwalk + Courtyard ทันที',
      'ได้ข้อมูลครบแล้วให้ 1 คนคุม Mid ส่วนอีกคนกลับไปซ้อนไซท์',
      'เหมาะสำหรับรอบ Pistol หรือ Anti-Eco เพื่อชิงความได้เปรียบพื้นที่กลาง',
    ],
  },
  {
    id: 'ascent-defense-retake',
    mapId: 'ascent',
    side: 'defense',
    name: 'ถอยเล่น Retake ไซท์ A (คุม B แน่น)',
    roundType: 'retake',
    smokes: ['A Main', 'A Tree'],
    routes: [
      ['Def Spawn', 'A Garden', 'A Site'],
      ['Mid Market', 'Mid Pizza', 'A Tree'],
    ],
    utilities: [
      { kind: 'molly', pos: 'A Site', label: 'ตัดการวาง Spike' },
      { kind: 'flash', pos: 'A Rafters', label: 'แฟลชรีเทคจาก Heaven' },
    ],
    notes: [
      'ปล่อย 1 คนคอยเก็บข้อมูล A Main แบบปลอดภัย ห้ามแลกชีวิตก่อนเพื่อนมา',
      'รวมทีมบุกคืนพร้อมกัน 2 ทาง: จาก A Garden/Heaven และจาก A Tree',
      'ใช้ Recon + แฟลชเปิดพร้อม Smoke ปิดทางเข้า A Main ก่อนเข้าไปกู้ Spike',
    ],
  },

  // ==================== HAVEN ====================
  {
    id: 'haven-attack-a',
    mapId: 'haven',
    side: 'attack',
    name: 'A Split (Long + Sewer)',
    roundType: 'full',
    smokes: ['A Tower', 'A Link', { x: 26, y: 18 }],
    routes: [
      ['Atk Spawn', 'A Garden', 'A Lobby', 'A Long', 'A Site'],
      ['A Lobby', 'A Sewer', { x: 46, y: 26 }, 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Long', label: 'แฟลชมุม Long' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'Smoke ปิด A Tower (Heaven) และ A Link (CT) ตัดตัวซ้อนจากกลางแผนที่',
      '3 คนบุกทาง A Long ใช้โดรน/แฟลชเปิดทางก่อนเข้าปะทะ',
      '2 คนย่องเข้าทาง A Sewer (Short) เพื่อบีบฝั่งรับที่ยืนหลังกล่องไซท์ A',
    ],
  },
  {
    id: 'haven-attack-b',
    mapId: 'haven',
    side: 'attack',
    name: 'Mid B + Garage กดดันตรงกลาง',
    roundType: 'bonus',
    smokes: ['A Link', 'C Link', 'B Back'],
    routes: [
      ['Atk Spawn', 'Mid Window', 'Mid Courtyard', 'B Site'],
      ['Mid Doors', 'C Garage'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Site', label: 'สแกนหลังไซท์ B' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      'Smoke ปิดทางเชื่อม A Link, C Link และหลังไซท์ B (B Back) ตัดการยิงซ้อน',
      '3 คนดันผ่าน Mid Courtyard เข้าไซท์ B ตรง ๆ หลังเช็คข้อมูลครบ',
      '2 คนยึด Mid Doors → C Garage เพื่อดักตัวหมุนจากไซท์ C',
    ],
  },
  {
    id: 'haven-attack-c',
    mapId: 'haven',
    side: 'attack',
    name: 'C Crunch (C Long + Garage)',
    roundType: 'full',
    smokes: ['C Link', { x: 35, y: 78 }, 'C Window'],
    routes: [
      ['Atk Spawn', 'C Lobby', 'C Long', 'C Site'],
      ['Mid Doors', 'C Garage', 'C Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'C Site', label: 'สแกนหลังไซท์' },
      { kind: 'spike', pos: 'C Site', label: 'วาง Spike เปิด C Long' },
    ],
    notes: [
      'Smoke ปิด C Link (CT) และ Spawn เพื่อตัดทางรีเทคของฝั่งรับ',
      '2 คนคุม Mid Doors เจาะ C Garage แล้วยึดทางเชื่อมเข้าข้างไซท์',
      '3 คนดันผ่าน C Long พร้อมแฟลชเปิด เคลียร์มุม Cubby แล้ววาง Spike เปิด Long',
    ],
  },
  {
    id: 'haven-defense-std',
    mapId: 'haven',
    side: 'defense',
    name: 'ตั้งรับ 1-3-1 คุม Mid & Garage',
    roundType: 'full',
    smokes: ['A Long', 'Mid Window', 'C Long'],
    routes: [
      ['Def Spawn', 'A Tower', 'A Site'],
      ['Def Spawn', 'B Site'],
      ['Def Spawn', 'C Link', 'C Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'C Garage', label: 'คุม Garage' },
      { kind: 'recon', pos: 'A Long', label: 'เช็ค A Long ต้นรอบ' },
    ],
    notes: [
      'จัดกำลัง 1-3-1: A 1 คน, B+Garage 3 คนคุมโซนกลาง, C 1 คน',
      'คนคุม B และ Garage พร้อมหมุนไปซ้อน A หรือ C ได้ภายในไม่กี่วินาที',
      'ถ้าฝั่งบุกเข้าไซท์ที่มีคนเดียว ให้ถอยตั้งหลักรอทีมหมุนมา Retake พร้อมกัน',
    ],
  },
  {
    id: 'haven-defense-apush',
    mapId: 'haven',
    side: 'defense',
    name: 'ดันชิง A Long ต้นรอบ (2 คน)',
    roundType: 'pistol',
    smokes: ['A Lobby', 'C Long'],
    routes: [
      ['A Site', 'A Long', 'A Lobby'],
      ['Def Spawn', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Long', label: 'แฟลชชิง A Long' },
      { kind: 'molly', pos: 'A Sewer', label: 'กันคนย่อง Sewer' },
    ],
    notes: [
      'ส่ง Duelist + Initiator ดันชิง A Long ต้นรอบพร้อมแฟลชและ Smoke ปิด A Lobby',
      'หาก A Long ว่างให้ทิ้ง 1 คนยืนลึกแล้วส่งคนอื่นขยับไปช่วยคุม Mid และ C',
      'ช่วยลดภาระการป้องกัน 3 ไซท์ของฝั่งรับได้มาก',
    ],
  },
  {
    id: 'haven-defense-retake',
    mapId: 'haven',
    side: 'defense',
    name: 'แผน Play Retake ไซท์ C & A',
    roundType: 'retake',
    smokes: ['C Long', 'C Garage', 'A Long'],
    routes: [
      ['Def Spawn', 'C Link', 'C Site'],
      ['Mid Doors', 'C Garage', 'C Site'],
      ['A Tower', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'C Link', label: 'แฟลชรีเทค C' },
      { kind: 'recon', pos: 'C Site', label: 'สแกนหลังกล่อง C' },
    ],
    notes: [
      'ยืนเล่นหลังมุมปลอดภัยในไซท์ C/A เพื่อเก็บข้อมูลแล้วถอยรอทีม',
      'รวมทีมรีเทคพร้อมกันจาก C Link + C Garage ด้วยแฟลชและ Recon',
    ],
  },

  // ==================== BIND ====================
  {
    id: 'bind-attack-a',
    mapId: 'bind',
    side: 'attack',
    name: 'A Execute (Short + Bath)',
    roundType: 'full',
    smokes: ['A Tower', 'A Lamps', { x: 66, y: 24 }],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Bath', 'A Site'],
      ['Atk Cave', 'A Link', 'A Short', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Bath', label: 'แฟลชออก Showers' },
      { kind: 'molly', pos: 'A Lamps', label: 'เคลียร์มุม U-Hall' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike หน้ากล่อง' },
    ],
    notes: [
      'Smoke ปิด A Tower (Heaven), Lamps และมุม CT เพื่อปิดสายตาตัวซ้อน',
      '3 คนดันผ่าน A Bath (Showers) ใช้แฟลชเปิดไซท์พร้อมกัน',
      '2 คนบีบจาก A Short คุมพื้นที่หน้า U-Hall และระวังการวาร์ปหมุนของฝั่งรับ',
    ],
  },
  {
    id: 'bind-attack-b',
    mapId: 'bind',
    side: 'attack',
    name: 'B Execute (Long + Hookah)',
    roundType: 'full',
    smokes: ['B Elbow', 'B Hall', 'B Garden'],
    routes: [
      ['Atk Spawn', 'B Fountain', 'B Long', 'B Site'],
      ['B Link', 'B Short', 'B Window', 'B Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Window', label: 'เช็คคนใน Hookah' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike เปิด B Long' },
    ],
    notes: [
      'Smoke ปิด Elbow, Hall (CT) และ Garden เพื่อกันคนแอบยิงหลังไซท์',
      '2 คนเข้ายึด B Window (Hookah) ก่อนโดดลงไซท์พร้อมเพื่อน',
      '3 คนดัน B Long เคลียร์มุม Garden แล้ววาง Spike ให้เพื่อนเล่น Post-plant จาก Long',
    ],
  },
  {
    id: 'bind-attack-tp',
    mapId: 'bind',
    side: 'attack',
    name: 'หลอก A แล้ววาร์ป B Teleporter',
    roundType: 'bonus',
    smokes: ['A Lamps', 'B Hall', 'B Elbow'],
    routes: [
      ['Atk Cave', 'A Short', 'A Teleporter'],
      ['B Exit', 'B Long', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Short', label: 'ล่อฝั่งรับซ้อน A' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      'ทำเสียงยิงและโยนสกิลที่ A Short ให้ฝั่งรับส่งคนจาก B มาซ้อน A',
      'เข้าประตูวาร์ป A Teleporter → B Exit แล้วพุ่งเข้า B Site ผ่าน B Long ทันที',
      'ระวังคนดักหน้าประตูวาร์ป B Exit ด้วยแฟลชก่อนเปิดประตู',
    ],
  },
  {
    id: 'bind-defense-std',
    mapId: 'bind',
    side: 'defense',
    name: 'ตั้งรับ 2-1-2 คุมคอขวด',
    roundType: 'full',
    smokes: ['A Short', 'B Window', 'B Long'],
    routes: [
      ['Def Spawn', 'A Site'],
      ['Def Spawn', 'B Hall', 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'A Short', label: 'กับดัก A Short' },
      { kind: 'molly', pos: 'B Window', label: 'สกัดคนโดด Hookah' },
    ],
    notes: [
      'Bind ไม่มี Mid — เน้น 2 คนไซท์ A (Short + Bath) และ 2 คนไซท์ B (Long + Hookah)',
      'ฟังเสียงประตูวาร์ปตลอดเวลาเพื่อรู้ทันทีว่าฝั่งบุกย้ายไซท์',
      'ใช้ Smoke ปิดทางแคบ A Short และ B Window เพื่อตัดจังหวะเข้าทำ',
    ],
  },
  {
    id: 'bind-defense-showers',
    mapId: 'bind',
    side: 'defense',
    name: 'ดันชิง A Bath (Showers) ต้นรอบ',
    roundType: 'pistol',
    smokes: ['A Lobby', 'B Long'],
    routes: [
      ['A Site', 'A Bath', 'A Lobby'],
      ['A Lamps', 'A Short'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Bath', label: 'แฟลชสวน Showers' },
      { kind: 'recon', pos: 'B Long', label: 'เช็คข่าวฝั่ง B' },
    ],
    notes: [
      'ส่ง 2 คนดันยึด A Bath ตั้งแต่ต้นรอบพร้อมแฟลชและ Smoke ปิด A Lobby',
      'หากยึด Bath ได้ ฝั่งบุกจะถูกบีบให้เข้าทาง A Short ทางเดียวหรือเปลี่ยนไซท์',
      'คนที่อยู่ A Lamps คอยส่อง A Short และซ้อนยิงช่วยเพื่อนใน Bath',
    ],
  },
  {
    id: 'bind-defense-retake',
    mapId: 'bind',
    side: 'defense',
    name: 'Retake B (Hall + Elbow) + คุมวาร์ป',
    roundType: 'retake',
    smokes: ['B Window', 'B Long'],
    routes: [
      ['Def Spawn', 'B Hall', 'B Site'],
      ['Def Spawn', 'B Elbow', 'B Site'],
      ['A Teleporter', 'B Exit'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Elbow', label: 'แฟลชเปิด Elbow' },
      { kind: 'molly', pos: 'B Site', label: 'ตัดการวาง Spike' },
    ],
    notes: [
      'คุมพื้นที่ B Hall และ Elbow เพื่อบีบให้ฝั่งบุกต้องวาง Spike มุมแคบ',
      'ส่ง 1 คนวาร์ปหรือเดินอ้อม B Garden เพื่อบีบพร้อมทีมจาก Hall/Elbow',
    ],
  },

  // ==================== SPLIT ====================
  {
    id: 'split-attack-mid',
    mapId: 'split',
    side: 'attack',
    name: 'ยึด Mid บีบขึ้น Heaven (A/B Split)',
    roundType: 'full',
    smokes: ['Mid Vent', 'Mid Mail', 'A Rafters'],
    routes: [
      ['Atk Spawn', 'Mid Bottom', 'Mid Top', 'A Ramps', 'A Tower', 'A Site'],
      ['A Lobby', 'A Main', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'Mid Top', label: 'แฟลชยึด Mid' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'Smoke ปิด Mid Mail และ Vent เพื่อตัดคนยิงซ้อนจากมุมสูง Mid',
      '3 คนบุกยึด Mid → A Ramps → A Tower เพื่อบีบไซท์ A จากด้านบน',
      '2 คนดัน A Main พร้อมกันเมื่อทีมบน Heaven พร้อมลงไซท์',
    ],
  },
  {
    id: 'split-attack-b',
    mapId: 'split',
    side: 'attack',
    name: 'B Split (Garage + Mid Mail)',
    roundType: 'full',
    smokes: ['B Tower', 'B Alley', 'Mid Vent'],
    routes: [
      ['Atk Spawn', 'B Lobby', 'B Garage', 'B Site'],
      ['Mid Bottom', 'Mid Top', 'Mid Mail', 'B Tower'],
    ],
    utilities: [
      { kind: 'molly', pos: 'B Back', label: 'ไล่คนหลังกล่อง' },
      { kind: 'flash', pos: 'B Garage', label: 'แฟลชออก Garage' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike Default B' },
    ],
    notes: [
      'Smoke ปิด B Tower (Heaven) และ B Alley (CT) ก่อนออกจาก B Garage',
      '2 คนเจาะผ่าน Mid Mail เพื่อกดดัน B Rafters และตัดตัวซ้อน',
      '3 คนออก B Garage พร้อมสกิลเคลียร์มุมแคบและวาง Spike หลัง Pillar',
    ],
  },
  {
    id: 'split-attack-arush',
    mapId: 'split',
    side: 'attack',
    name: 'Fast A Rush (Main + Ramp) รอบ Pistol',
    roundType: 'pistol',
    smokes: ['A Rafters', 'A Screens'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Site'],
      ['A Main', 'A Ramps', 'A Tower'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชพุ่งออก A Main' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike เร็ว' },
    ],
    notes: [
      'โถมเข้า A Main 5 คนตั้งแต่เริ่มรอบด้วยแฟลชและ Smoke ปิด Heaven',
      'ส่ง Duelist 1–2 คนยึด A Ramps ตัดคนลงมาจาก A Tower',
    ],
  },
  {
    id: 'split-defense-mid',
    mapId: 'split',
    side: 'defense',
    name: 'คุม Mid แน่นหนา (2-2-1)',
    roundType: 'full',
    smokes: ['Mid Top', 'A Main', 'B Garage'],
    routes: [
      ['A Tower', 'A Ramps', 'Mid Vent'],
      ['B Tower', 'Mid Mail'],
      ['Def Spawn', 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Garage', label: 'สกัด B Garage' },
      { kind: 'recon', pos: 'Mid Top', label: 'เช็คข่าว Mid' },
    ],
    notes: [
      'Split ต้องไม่เสีย Mid — ส่งคนคุม Vent และ Mail ช่วยกันส่องตลอดเวลา',
      'Sentinel วางสกิลสกัด B Garage เพื่อให้ 1 คนยืนคุม B ได้อย่างมั่นใจ',
      'หากฝั่งบุกเข้า A Main ให้ใช้มุมสูงจาก A Rafters/Tower ยิงกดดัน',
    ],
  },
  {
    id: 'split-defense-apush',
    mapId: 'split',
    side: 'defense',
    name: 'ดันชิง A Main ต้นรอบ',
    roundType: 'bonus',
    smokes: ['A Lobby', 'Mid Top'],
    routes: [
      ['A Site', 'A Main', 'A Lobby'],
      ['A Ramps', 'Mid Vent'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชชิง A Main' },
      { kind: 'molly', pos: 'B Garage', label: 'ถ่วง B Garage' },
    ],
    notes: [
      'ส่ง 2 คนดันยึดพื้นที่ A Main / Sewer เพื่อเช็คข้อมูลและบีบพื้นที่ฝั่งบุก',
      'ถ้าไม่มีศัตรูที่ A ให้ถอย 1 คนมาซ้อน Mid กับ B ได้ทันที',
    ],
  },
  {
    id: 'split-defense-retake',
    mapId: 'split',
    side: 'defense',
    name: 'Retake B จาก Tower + Alley',
    roundType: 'retake',
    smokes: ['B Garage', 'B Main'],
    routes: [
      ['B Tower', 'B Rafters', 'B Site'],
      ['Def Spawn', 'B Alley', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Alley', label: 'แฟลชเปิด B Alley' },
    ],
    notes: [
      'รักษาพื้นที่ B Tower ไว้ให้ได้ แล้วประสานลงพร้อมคนที่เดินเข้า B Alley',
    ],
  },

  // ==================== LOTUS ====================
  {
    id: 'lotus-attack-a',
    mapId: 'lotus',
    side: 'attack',
    name: 'ชิงพื้นที่ A Rubble + Execute A',
    roundType: 'full',
    smokes: ['A Stairs', 'A Drop', 'A Top'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Rubble', 'A Main', 'A Site'],
      ['A Lobby', 'A Root', 'A Door', 'A Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'A Main', label: 'สแกน A Main' },
      { kind: 'flash', pos: 'A Door', label: 'เปิดประตูหมุน A' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'ใช้สกิลชิงพื้นที่ A Rubble ตั้งแต่ 3 วินาทีแรกเพื่อไม่ให้ฝั่งรับดันมายืนฟรี',
      'ปา Smoke ปิด A Stairs และ A Drop ก่อนเดินเข้า A Site',
      'เปิดประตูหมุน A Door เพื่อเพิ่มมุมเข้าตีและกดดันตัวซ้อนจาก A Link',
    ],
  },
  {
    id: 'lotus-attack-c',
    mapId: 'lotus',
    side: 'attack',
    name: 'C Execute + ประตูหมุน B-C',
    roundType: 'full',
    smokes: ['C Gravel', 'C Hall', 'C Link'],
    routes: [
      ['Atk Spawn', 'C Lobby', 'C Mound', 'C Main', 'C Site'],
      ['B Pillars', 'B Main', 'C Door', 'C Waterfall', 'C Site'],
    ],
    utilities: [
      { kind: 'molly', pos: 'C Bend', label: 'ไล่คนหลัง Bend' },
      { kind: 'spike', pos: 'C Site', label: 'วาง Spike เปิด C Mound' },
    ],
    notes: [
      'Smoke ปิด C Gravel, Hall และ C Link ตัดมุมรีเทคทั้งหมดของฝั่งรับ',
      '3 คนดันผ่าน C Mound → C Main เคลียร์มุม Bend',
      '2 คนเปิดประตู C Door ผ่าน Waterfall เพื่อบีบหลังไซท์ C พร้อมกัน',
    ],
  },
  {
    id: 'lotus-attack-bfake',
    mapId: 'lotus',
    side: 'attack',
    name: 'B Fast Rush + หมุนเข้า A/C',
    roundType: 'pistol',
    smokes: ['B Upper', 'C Link', 'A Link'],
    routes: [
      ['Atk Spawn', 'B Pillars', 'B Main', 'B Site'],
      ['B Site', 'A Door', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชเข้าไซท์ B' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      'ตีไซท์ B อย่างรวดเร็วเพื่อดึงคนจาก A/C หรือวาง Spike ทันทีก่อนฝั่งรับซ้อนทัน',
      'หาก B มีคนตั้งรับแน่น ให้เปิดประตู A Door เพื่อหมุนเข้า A ทันที',
    ],
  },
  {
    id: 'lotus-defense-arubble',
    mapId: 'lotus',
    side: 'defense',
    name: 'สู้ชิง A Rubble ตั้งแต่ต้นรอบ',
    roundType: 'full',
    smokes: ['A Lobby', 'B Pillars', 'C Mound'],
    routes: [
      ['A Site', 'A Main', 'A Rubble'],
      ['Def Spawn', 'B Site'],
      ['C Gravel', 'C Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Rubble', label: 'แฟลชชิง A Rubble' },
      { kind: 'wall', pos: 'C Main', label: 'กับดักคุมไซท์ C' },
    ],
    notes: [
      'Lotus ฝั่งรับต้องชิงพื้นที่ A Rubble ช่วงต้นรอบด้วย Recon + แฟลช + Smoke',
      'หากยึด A Rubble ได้แล้วให้ส่งคนหมุนไปคุม B และ C อย่างมั่นคง',
      'วาง Sentinel คุมฝั่ง C Main เพื่อป้องกันการบุกเงียบ',
    ],
  },
  {
    id: 'lotus-defense-retake',
    mapId: 'lotus',
    side: 'defense',
    name: 'ตั้งรับ 1-1-3 เน้นคุม A และ C',
    roundType: 'retake',
    smokes: ['A Main', 'C Main'],
    routes: [
      ['A Top', 'A Stairs', 'A Site'],
      ['B Upper', 'B Site'],
      ['Def Spawn', 'C Gravel', 'C Link', 'C Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Main', label: 'เช็ค B Main' },
    ],
    notes: [
      'ปล่อยไซท์ B ไว้ 1 คนคอยส่องและถ่วงเวลา หากโดนบุกหนักให้ถอยมารอ Retake จาก A Link และ C Link',
      'เก็บสกิลรีเทคไว้เคลียร์มุม B Pillars และ B Site พร้อมกัน',
    ],
  },
  {
    id: 'lotus-defense-cpush',
    mapId: 'lotus',
    side: 'defense',
    name: 'ดันชิง C Mound ต้นรอบ (2 คน)',
    roundType: 'bonus',
    smokes: ['C Lobby', 'B Pillars'],
    routes: [
      ['C Site', 'C Main', 'C Mound'],
      ['A Site', 'A Root'],
    ],
    utilities: [
      { kind: 'flash', pos: 'C Main', label: 'แฟลชชิง C Mound' },
    ],
    notes: [
      'ส่ง 2 คนดันยึด C Mound ตั้งแต่ต้นรอบเพื่อจับจังหวะฝั่งบุกและตัดข้อมูลฝั่ง C',
    ],
  },

  // ==================== SUNSET ====================
  {
    id: 'sunset-attack-bsplit',
    mapId: 'sunset',
    side: 'attack',
    name: 'Mid Tiles → เจาะ Market เข้า B',
    roundType: 'full',
    smokes: ['Mid Top', 'B Boba', 'B Market'],
    routes: [
      ['Atk Spawn', 'Mid Tiles', 'Mid Courtyard', 'B Market', 'B Site'],
      ['B Lobby', 'B Main', 'B Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'Mid Courtyard', label: 'สแกน Mid' },
      { kind: 'flash', pos: 'B Main', label: 'แฟลชออก B Main' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike เปิด B Main' },
    ],
    notes: [
      'Smoke ปิด Mid Top กันคนสไนเปอร์จากฝั่งรับ แล้วยึด Mid Tiles → Courtyard',
      '2-3 คนเจาะผ่าน B Market พร้อมสกิลเปิดทางเข้าหลังไซท์ B',
      'อีก 2 คนดัน B Main เข้าพร้อมกันและวาง Spike เปิดมุมให้เล่น Post-plant จาก B Main',
    ],
  },
  {
    id: 'sunset-attack-a',
    mapId: 'sunset',
    side: 'attack',
    name: 'A Split (Main + A Elbow)',
    roundType: 'full',
    smokes: ['A Alley', 'A Link', 'Mid Top'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Site'],
      ['A Lobby', 'A Elbow', 'A Site'],
    ],
    utilities: [
      { kind: 'molly', pos: 'A Site', label: 'ไล่คนหลังกล่อง A' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'Smoke ปิด A Alley และ A Link ตัดตัวซ้อนที่มาจาก Mid และ Def Spawn',
      'แบ่งทีมเข้า A Main และ A Elbow พร้อมกันเพื่อบีบคนป้องกันในไซท์ A',
    ],
  },
  {
    id: 'sunset-attack-brush',
    mapId: 'sunset',
    side: 'attack',
    name: 'B Main Fast Rush รอบ Pistol/Eco',
    roundType: 'pistol',
    smokes: ['B Boba', 'B Market'],
    routes: [
      ['Atk Spawn', 'B Lobby', 'B Main', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชพุ่งออก B Main' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ทันที' },
    ],
    notes: [
      'โถมเข้า B Main พร้อมแฟลช 2 ลูกและ Smoke ปิด Market + Boba',
      'เคลียร์มุม Back Site แล้ววาง Spike ทันที',
    ],
  },
  {
    id: 'sunset-defense-mid',
    mapId: 'sunset',
    side: 'defense',
    name: 'ชิงพื้นที่ Mid Tiles + Top Mid',
    roundType: 'full',
    smokes: ['Mid Bottom', 'B Main', 'A Main'],
    routes: [
      ['Def Spawn', 'Mid Top', 'Mid Courtyard'],
      ['B Boba', 'B Market', 'B Site'],
      ['A Alley', 'A Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Main', label: 'กับดัก B Main' },
      { kind: 'recon', pos: 'Mid Tiles', label: 'เช็คข่าว Mid' },
    ],
    notes: [
      'ใช้ Initiator + Controller ชิง Mid Courtyard/Tiles ต้นรอบเพื่อตัดแผน B Split',
      'วาง Sentinel คุม B Main เพื่อกันการ Rush เร็ว 5 คน',
    ],
  },
  {
    id: 'sunset-defense-a',
    mapId: 'sunset',
    side: 'defense',
    name: 'ดันเช็ค A Main + Crossfire Elbow',
    roundType: 'pistol',
    smokes: ['A Lobby', 'Mid Tiles'],
    routes: [
      ['A Site', 'A Elbow', 'A Lobby'],
      ['A Link', 'A Main'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชสวน A Main' },
    ],
    notes: [
      'เล่น Crossfire ระหว่าง A Elbow และ A Main เพื่อเก็บคิลแรกในรอบ Pistol',
      'หาก A Main เงียบ ให้รีบขยับ 1 คนผ่าน Mid Top ไปซ้อน B Market ทันที',
    ],
  },
  {
    id: 'sunset-defense-bretake',
    mapId: 'sunset',
    side: 'defense',
    name: 'Play Retake B (Market + Boba)',
    roundType: 'retake',
    smokes: ['B Main'],
    routes: [
      ['Def Spawn', 'B Boba', 'B Site'],
      ['Mid Top', 'B Market', 'B Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Site', label: 'สแกนในไซท์ B' },
    ],
    notes: [
      'ถ้า B Main บุกหนักให้ถอยมารวมตัวกันแล้วรีเทคพร้อมกันทาง Market และ Boba',
    ],
  },

  // ==================== ICEBOX ====================
  {
    id: 'icebox-attack-a',
    mapId: 'icebox',
    side: 'attack',
    name: 'A Execute (Belt + Pipes)',
    roundType: 'full',
    smokes: ['A Rafters', 'A Screen', 'A Nest'],
    routes: [
      ['Atk Spawn', 'A Belt', 'A Nest', 'A Site'],
      ['Atk Spawn', 'A Pipes', 'A Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'A Rafters', label: 'สแกน Rafters/Pipes' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike มุม Belt' },
    ],
    notes: [
      'ปาม่าน/Smoke ปิด A Rafters และ A Screen เพื่อตัดมุมสูงฝั่งรับ',
      'เช็ค A Nest และ A Pipes ด้วยโดรนก่อนส่ง Duelist ขึ้นไซท์',
      'วาง Spike ตำแหน่งเปิดทาง A Belt เพื่อให้เพื่อนคุมจากระยะไกลได้',
    ],
  },
  {
    id: 'icebox-attack-b',
    mapId: 'icebox',
    side: 'attack',
    name: 'B Execute + Mid Tube Lurker',
    roundType: 'full',
    smokes: ['B Hall', 'B Snowman', 'B Hut'],
    routes: [
      ['Atk Spawn', 'B Garage', 'B Green', 'B Yellow', 'B Site'],
      ['Mid Blue', 'B Tube', 'B Kitchen'],
    ],
    utilities: [
      { kind: 'molly', pos: 'B Yellow', label: 'เคลียร์หลัง Yellow' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      'Smoke ปิด B Snowman และมุม Kitchen/Hall ก่อนผ่าน B Yellow',
      'ส่ง 1 คนแอบเข้า B Tube คุม B Kitchen เพื่อดักตัวหมุนจากไซท์ A',
      'วาง Spike แล้วใช้สกิลหน่วงเวลาจาก B Green / Yellow',
    ],
  },
  {
    id: 'icebox-defense-std',
    mapId: 'icebox',
    side: 'defense',
    name: 'คุม Mid Boiler + ตั้งรับไซท์',
    roundType: 'full',
    smokes: ['A Belt', 'B Garage', 'Mid Blue'],
    routes: [
      ['Def Spawn', 'A Screen', 'A Site'],
      ['Def Spawn', 'Mid Boiler', 'B Kitchen'],
      ['B Snowman', 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Tube', label: 'กันคนย่อง Tube' },
      { kind: 'recon', pos: 'A Belt', label: 'สแกนต้นรอบ' },
    ],
    notes: [
      'วางกับดักหรือสกิลแจ้งเตือนที่ B Tube / B Kitchen ป้องกันการลอบยิงหลัง',
      'คุม Mid Boiler เพื่อส่องทั้ง Mid Blue และช่วยยิงซ้อนทาง A Screen ได้ไว',
    ],
  },
  {
    id: 'icebox-defense-bpush',
    mapId: 'icebox',
    side: 'defense',
    name: 'ดันชิง B Green + Garage ต้นรอบ',
    roundType: 'bonus',
    smokes: ['B Garage', 'A Belt'],
    routes: [
      ['B Site', 'B Yellow', 'B Green', 'B Garage'],
      ['A Rafters', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Green', label: 'แฟลชชิง B Green' },
    ],
    notes: [
      'ดันยึดพื้นที่ B Green เพื่อเช็คข่าวฝั่ง B — หากว่างให้ดึงคนกลับไปซ้อน Mid และ A',
    ],
  },

  // ==================== PEARL ====================
  {
    id: 'pearl-attack-b',
    mapId: 'pearl',
    side: 'attack',
    name: 'B Long Post-Plant Execute',
    roundType: 'full',
    smokes: ['B Tower', 'B Hall', 'B Tunnel'],
    routes: [
      ['Atk Spawn', 'B Club', 'B Ramp', 'B Main', 'B Site'],
      ['Mid Plaza', 'B Link', 'B Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Site', label: 'สแกน B Screen/Tower' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike เปิด B Long' },
    ],
    notes: [
      'Smoke ปิด B Tower, Hall และ Tunnel เพื่อปิดทางรีเทคของฝั่งรับ',
      'ยึด B Main/Ramp แล้ววาง Spike ตำแหน่งเปิดทาง B Long เพื่อถอยมาคุมระยะไกล',
    ],
  },
  {
    id: 'pearl-attack-a',
    mapId: 'pearl',
    side: 'attack',
    name: 'A Split (A Main + A Art)',
    roundType: 'full',
    smokes: ['A Flowers', 'A Secret', 'A Dugout'],
    routes: [
      ['Atk Spawn', 'A Restaurant', 'A Main', 'A Site'],
      ['Mid Plaza', 'Mid Doors', 'A Art', 'A Link', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชออก A Main' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'แบ่ง 2 คนยึด Mid Plaza → Mid Doors → A Art เพื่อตีโอบ A Link',
      '3 คนบุก A Main พร้อม Smoke ปิด A Flowers และ Secret',
    ],
  },
  {
    id: 'pearl-defense-mid',
    mapId: 'pearl',
    side: 'defense',
    name: 'คุม Mid Connector + B Ramp',
    roundType: 'full',
    smokes: ['Mid Top', 'B Main', 'A Main'],
    routes: [
      ['Def Records', 'Mid Connector', 'Mid Doors'],
      ['B Tower', 'B Site'],
      ['A Flowers', 'A Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'A Art', label: 'กันคนย่อง A Art' },
      { kind: 'recon', pos: 'B Main', label: 'สแกน B Long' },
    ],
    notes: [
      'คุม Mid Connector ให้แน่นเพื่อไม่ให้ฝั่งบุกเจาะทั้ง A Art และ B Link',
      'ยิงชะลอที่ B Main / B Ramp อย่าปล่อยให้ฝั่งบุกวาง Spike เปิด Long ง่าย ๆ',
    ],
  },
  {
    id: 'pearl-defense-apush',
    mapId: 'pearl',
    side: 'defense',
    name: 'ดันชิง A Main + Restaurant',
    roundType: 'pistol',
    smokes: ['A Restaurant', 'B Main'],
    routes: [
      ['A Site', 'A Main', 'A Restaurant'],
      ['B Screen', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชสวน A Main' },
    ],
    notes: [
      'ดันยึด A Main ช่วงต้นรอบเพื่อรู้ตำแหน่งบุก — ถ้าว่างให้รีบขยับไปช่วย B Ramp',
    ],
  },

  // ==================== BREEZE ====================
  {
    id: 'breeze-attack-a',
    mapId: 'breeze',
    side: 'attack',
    name: 'A Execute + Mid Wood Doors',
    roundType: 'full',
    smokes: ['A Bridge', 'A Ramp', 'Mid Nest'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Shop', 'A Pyramids', 'A Site'],
      ['Mid Bottom', 'Mid Pillar', 'Mid Wood Doors', 'A Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'A Site', label: 'สแกนหลัง Pyramids' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'ใช้ม่าน/Smoke ปิด A Bridge, Ramp และ Mid Nest เพื่อตัดระยะสไนเปอร์',
      '2 คนเจาะ Mid Wood Doors บีบข้างไซท์ A พร้อมกับทีมหลักที่ออก A Shop',
    ],
  },
  {
    id: 'breeze-attack-b',
    mapId: 'breeze',
    side: 'attack',
    name: 'B Main + B Elbow Execute',
    roundType: 'full',
    smokes: ['B Wall', 'Def Arches', 'B Tunnel'],
    routes: [
      ['Atk Spawn', 'B Window', 'B Main', 'B Site'],
      ['Mid Bottom', 'Mid Cannon', 'B Elbow', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชออก B Main' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike หลัง Pillar B' },
    ],
    notes: [
      'Smoke ปิด Def Arches และ B Wall ตัดคนซ้อนจาก Mid และ Back Site',
      'แบ่ง 2 คนเข้าทาง Mid Cannon → B Elbow เพื่อบีบไซท์ B จาก 2 ทาง',
    ],
  },
  {
    id: 'breeze-attack-eco',
    mapId: 'breeze',
    side: 'attack',
    name: 'Mid Cannon → A Bridge ไว (Pistol/Eco)',
    roundType: 'pistol',
    smokes: ['Mid Nest', 'A Bridge'],
    routes: [
      ['Atk Spawn', 'Mid Bottom', 'Mid Pillar', 'Mid Wood Doors', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'Mid Wood Doors', label: 'แฟลชเปิดประตู' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike เร็วไซท์ A' },
    ],
    notes: [
      'เดินรวมกลุ่ม 5 คนเข้าทาง Mid Pillar เพื่อลดระยะปืนสั้นแล้วทะลุประตูไม้เข้าไซท์ A',
    ],
  },
  {
    id: 'breeze-defense-std',
    mapId: 'breeze',
    side: 'defense',
    name: 'คุม Mid Nest + ซ้อนไซท์ระยะไกล',
    roundType: 'full',
    smokes: ['A Shop', 'B Main', 'Mid Pillar'],
    routes: [
      ['Def Spawn', 'A Bridge', 'A Site'],
      ['Def Spawn', 'Mid Nest', 'Mid Top'],
      ['Def Arches', 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Tunnel', label: 'กันคนอ้อม B Tunnel' },
      { kind: 'recon', pos: 'Mid Pillar', label: 'สแกน Mid ต้นรอบ' },
    ],
    notes: [
      'ให้คนถือปืนยาว/Operator ยืนคุม Mid Nest และ A Bridge เพื่อส่องพื้นที่เปิดกว้าง',
      'วางสกิลเตือนที่ B Tunnel และ Mid Wood Doors ป้องกันการโอบหลัง',
    ],
  },
  {
    id: 'breeze-defense-apush',
    mapId: 'breeze',
    side: 'defense',
    name: 'ดันชิง A Hall/Shop + Retake B',
    roundType: 'bonus',
    smokes: ['A Lobby', 'B Window'],
    routes: [
      ['A Site', 'A Pyramids', 'A Shop'],
      ['Def Arches', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Shop', label: 'แฟลชชิง A Shop' },
    ],
    notes: [
      'ดันเช็ค A Shop ต้นรอบเพื่อเก็บข้อมูล — หากไม่มีคนบุกให้หมุนซ้อน Mid กับ B ทันที',
    ],
  },

  // ==================== FRACTURE ====================
  {
    id: 'fracture-attack-a',
    mapId: 'fracture',
    side: 'attack',
    name: 'บีบไซท์ A (A Main + A Drop/Dish)',
    roundType: 'full',
    smokes: ['A Link', 'Def Spawn', 'A Rope'],
    routes: [
      ['Atk Spawn', 'A Hall', 'A Door', 'A Main', 'A Site'],
      ['Atk Bridge', 'A Gate', 'A Dish', 'A Drop', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชออก A Main' },
      { kind: 'molly', pos: 'A Site', label: 'ไล่คนบนไซท์' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'ใช้ซิปไลน์ไปฝั่ง A Gate → A Dish 2-3 คน เพื่อกระโดดลง A Drop พร้อมทีม A Main',
      'Smoke ปิด A Link และ Def Spawn เพื่อตัดทางรีเทคของฝั่งรับ',
    ],
  },
  {
    id: 'fracture-attack-b',
    mapId: 'fracture',
    side: 'attack',
    name: 'บีบไซท์ B (B Main + B Arcade)',
    roundType: 'full',
    smokes: ['B Generator', 'B Link', 'B Canteen'],
    routes: [
      ['Atk Spawn', 'B Tree', 'B Main', 'B Site'],
      ['Atk Bridge', 'B Bench', 'B Arcade', 'B Tower', 'B Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Site', label: 'สแกน B Site' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      '2 คนข้ามซิปไลน์มายึด B Bench → B Arcade เพื่อกดดันจาก B Tower',
      '3 คนดัน B Main → B Tunnel พร้อมแฟลชเปิดไซท์และวาง Spike หลัง Generator',
    ],
  },
  {
    id: 'fracture-attack-pistol',
    mapId: 'fracture',
    side: 'attack',
    name: '5-Man A Drop Fast Rush (Pistol)',
    roundType: 'pistol',
    smokes: ['A Link', 'A Rope'],
    routes: [
      ['Atk Bridge', 'A Gate', 'A Dish', 'A Drop', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Drop', label: 'แฟลชก่อนลง Drop' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike เร็ว' },
    ],
    notes: [
      'ข้ามซิปไลน์ทั้ง 5 คนมายึด Dish แล้วลง A Drop พร้อมกันในรอบปืนพก',
    ],
  },
  {
    id: 'fracture-defense-aggro',
    mapId: 'fracture',
    side: 'defense',
    name: 'ดันชิงพื้นที่ฝั่ง B Arcade / A Main',
    roundType: 'full',
    smokes: ['B Tree', 'A Dish'],
    routes: [
      ['B Tower', 'B Arcade', 'B Bench'],
      ['Def Spawn', 'A Link', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Arcade', label: 'แฟลชชิง Arcade' },
      { kind: 'wall', pos: 'A Drop', label: 'สกัด A Drop' },
    ],
    notes: [
      'Fracture ฝั่งรับต้องกล้าดันชิงพื้นที่ 1 ฝั่งต้นรอบเพื่อลดมุมโดนโอบ 2 ทาง',
      'ถ้ายึด B Arcade ได้ ให้ทิ้งคนส่อง Zipline แล้วรวมกำลังไปซ้อนฝั่ง A',
    ],
  },
  {
    id: 'fracture-defense-apush',
    mapId: 'fracture',
    side: 'defense',
    name: 'ดันยึด A Hall + Crossfire B',
    roundType: 'bonus',
    smokes: ['A Lobby', 'B Arcade'],
    routes: [
      ['A Site', 'A Main', 'A Door', 'A Hall'],
      ['Def Spawn', 'B Canteen', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Door', label: 'แฟลชชิง A Hall' },
    ],
    notes: [
      'ส่ง 2 คนดันยึด A Hall/Door เพื่อตัดทาง A Main แล้วดึงคนซ้อนเข้า Def Spawn คุม B',
    ],
  },

  // ==================== ABYSS ====================
  {
    id: 'abyss-attack-a',
    mapId: 'abyss',
    side: 'attack',
    name: 'A Main + A Vent Split ผ่าน Mid',
    roundType: 'full',
    smokes: ['A Secret', 'A Security', 'A Bridge'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Site'],
      ['Mid Bend', 'Mid Bottom', 'Mid Catwalk', 'A Vent', 'A Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'A Site', label: 'เช็ค A Tower' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'Smoke ปิด A Secret, Security และ Bridge เพื่อตัดทางหมุนฝั่งรับ',
      '2 คนเจาะ Mid Catwalk → A Vent เพื่อบีบไซท์ A จากด้านใน',
    ],
  },
  {
    id: 'abyss-attack-b',
    mapId: 'abyss',
    side: 'attack',
    name: 'B Main + Mid Catwalk Execute',
    roundType: 'full',
    smokes: ['B Tower', 'B Link', 'Mid Library'],
    routes: [
      ['Atk Spawn', 'B Lobby', 'B Nest', 'B Main', 'B Site'],
      ['Mid Bottom', 'Mid Library', 'B Link', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชออก B Main' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ใกล้ Danger' },
    ],
    notes: [
      'Smoke ปิด B Tower และ B Link ระวังขอบเหวที่ B Danger',
      '2 คนเดิน Mid Library → B Link เพื่อประกบคนป้องกันไซท์ B',
    ],
  },
  {
    id: 'abyss-attack-pistol',
    mapId: 'abyss',
    side: 'attack',
    name: 'Fast A Main 5 คน (Pistol/Eco)',
    roundType: 'pistol',
    smokes: ['A Tower', 'A Security'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Main', label: 'แฟลชออก A Main' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'โถมเข้า A Main ไวพร้อมแฟลชและ Smoke ปิด A Tower เพื่อตัดมุมสูง',
    ],
  },
  {
    id: 'abyss-defense-mid',
    mapId: 'abyss',
    side: 'defense',
    name: 'คุม Mid Library + High Ground Tower',
    roundType: 'full',
    smokes: ['A Main', 'B Main', 'Mid Bottom'],
    routes: [
      ['Def Spawn', 'A Security', 'A Tower'],
      ['Def Spawn', 'Mid Top', 'Mid Library'],
      ['B Link', 'B Tower'],
    ],
    utilities: [
      { kind: 'wall', pos: 'A Vent', label: 'กันคนย่อง Vent' },
    ],
    notes: [
      'คุม Mid Library และวางสกิลดัก A Vent เพื่อป้องกันการ Split เข้าไซท์',
      'ใช้ตำแหน่งสูงที่ A Tower และ B Tower คุมทางเข้าหลักทั้ง 2 ไซท์',
    ],
  },
  {
    id: 'abyss-defense-retake',
    mapId: 'abyss',
    side: 'defense',
    name: 'Retake A (Tower + Secret) + ดัน B Nest',
    roundType: 'retake',
    smokes: ['A Main', 'B Lobby'],
    routes: [
      ['Def Spawn', 'A Security', 'A Site'],
      ['A Tower', 'A Site'],
      ['B Site', 'B Main', 'B Nest'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Security', label: 'แฟลชรีเทค A' },
    ],
    notes: [
      'ดันเช็คข่าว B Nest ต้นรอบแล้วดึงคนมาช่วยรีเทค A จากมุมสูง Tower และ Secret พร้อมกัน',
    ],
  },

  // ==================== CORRODE ====================
  {
    id: 'corrode-attack-a',
    mapId: 'corrode',
    side: 'attack',
    name: 'A Main + Mid Window Split',
    roundType: 'full',
    smokes: ['A Crane', 'A Elbow', 'Mid Stairs'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Pocket', 'A Site'],
      ['Mid Bottom', 'Mid Window', 'A Link', 'A Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'A Site', label: 'สแกน A Crane/Yard' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'Smoke ปิด A Crane, Elbow และ Mid Stairs เพื่อปิดทางยิงซ้อน',
      '3 คนดันผ่าน A Main → A Pocket พร้อมแฟลชเปิดไซท์',
      '2 คนยึด Mid Window → A Link บีบเข้าด้านข้างไซท์ A พร้อมกัน',
    ],
  },
  {
    id: 'corrode-attack-b',
    mapId: 'corrode',
    side: 'attack',
    name: 'B Main + Mid Stairs Execute',
    roundType: 'full',
    smokes: ['B Tower', 'B Arch', 'B Elbow'],
    routes: [
      ['Atk Spawn', 'B Lobby', 'B Main', 'B Site'],
      ['Mid Bottom', 'Mid Stairs', 'B Link', 'B Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชออก B Main' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      'Smoke ปิด B Tower, B Arch และ Elbow เพื่อตัดตัวป้องกันมุมสูง',
      'ประสานเข้า B Main และ B Link จาก Mid Stairs พร้อมกัน',
    ],
  },
  {
    id: 'corrode-attack-pistol',
    mapId: 'corrode',
    side: 'attack',
    name: 'A Pocket Fast Hit (Pistol/Eco)',
    roundType: 'pistol',
    smokes: ['A Crane', 'A Elbow'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Pocket', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Pocket', label: 'แฟลชเข้า Pocket' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike เร็ว' },
    ],
    notes: [
      'เร่งสปีดเข้า A Pocket 5 คนเพื่อปิดมุมยิงกว้างของปืนยาวฝั่งรับ',
    ],
  },
  {
    id: 'corrode-defense-std',
    mapId: 'corrode',
    side: 'defense',
    name: 'คุม Mid Top/Window + ตั้งรับ 2-1-2',
    roundType: 'full',
    smokes: ['A Main', 'B Main', 'Mid Bottom'],
    routes: [
      ['Def Spawn', 'A Crane', 'A Site'],
      ['Def Spawn', 'Mid Top', 'Mid Window'],
      ['B Arch', 'B Tower', 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Main', label: 'สกัด B Main' },
      { kind: 'recon', pos: 'Mid Bottom', label: 'สแกน Mid ต้นรอบ' },
    ],
    notes: [
      'คุม Mid Top และ Mid Window เพื่อสกัดการ Split ผ่าน A Link / B Link',
      'ใช้มุมยิง Crossfire ระหว่าง A Crane กับ A Pocket และ B Tower กับ B Arch',
    ],
  },
  {
    id: 'corrode-defense-retake',
    mapId: 'corrode',
    side: 'defense',
    name: 'Retake A (Crane + Link) + ดัน B Main',
    roundType: 'retake',
    smokes: ['A Main', 'B Lobby'],
    routes: [
      ['Def Spawn', 'A Elbow', 'A Site'],
      ['Mid Window', 'A Link', 'A Site'],
      ['B Site', 'B Main'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Elbow', label: 'แฟลชรีเทค A' },
    ],
    notes: [
      'ดันเช็คข่าว B Main แล้วรวมทีมรีเทคไซท์ A จาก A Elbow และ A Link พร้อมกัน',
    ],
  },

  // ==================== SUMMIT ====================
  {
    id: 'summit-attack-a',
    mapId: 'summit',
    side: 'attack',
    name: 'A Split (A Main + A Link)',
    roundType: 'full',
    smokes: ['A Art', 'A Cave', 'Mid Window'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Garden', 'A Site'],
      ['Mid Top', 'Mid Bend', 'A Link', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Garden', label: 'แฟลชเข้า A Garden' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'Smoke ปิด A Art, A Cave และ Mid Window เพื่อตัดมุมซ้อนจากฐานฝั่งรับ',
      '3 คนดัน A Main → A Garden คู่กับ 2 คนที่เจาะ Mid Bend → A Link',
    ],
  },
  {
    id: 'summit-attack-b',
    mapId: 'summit',
    side: 'attack',
    name: 'B Main + B Trophy/Drop Crunch',
    roundType: 'full',
    smokes: ['B Tower', 'B Gym', 'Mid Window'],
    routes: [
      ['Atk Spawn', 'B Lobby', 'B Main', 'B Site'],
      ['Mid Top', 'Mid Fountain', 'B Link', 'B Trophy', 'B Drop', 'B Site'],
    ],
    utilities: [
      { kind: 'recon', pos: 'B Site', label: 'สแกนไซท์ B' },
      { kind: 'spike', pos: 'B Site', label: 'วาง Spike ไซท์ B' },
    ],
    notes: [
      'Smoke ปิด B Tower และ B Gym แล้วส่งทีมยึด Mid Fountain → B Trophy เพื่อลง B Drop',
      'เข้าทาง B Main และ B Drop พร้อมกันเพื่อบีบคนป้องกันไซท์ B',
    ],
  },
  {
    id: 'summit-attack-pistol',
    mapId: 'summit',
    side: 'attack',
    name: 'A Garden Fast Rush (Pistol/Eco)',
    roundType: 'pistol',
    smokes: ['A Art', 'A Cave'],
    routes: [
      ['Atk Spawn', 'A Lobby', 'A Main', 'A Garden', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'A Garden', label: 'แฟลชเปิด Garden' },
      { kind: 'spike', pos: 'A Site', label: 'วาง Spike ไซท์ A' },
    ],
    notes: [
      'เร่งบุกผ่าน A Garden 5 คนในรอบปืนพกก่อนฝั่งรับหมุนจาก B ทัน',
    ],
  },
  {
    id: 'summit-defense-std',
    mapId: 'summit',
    side: 'defense',
    name: 'คุม Mid Fountain + B Trophy',
    roundType: 'full',
    smokes: ['A Main', 'B Main', 'Mid Top'],
    routes: [
      ['Def Spawn', 'A Art', 'A Site'],
      ['Def Spawn', 'Mid Window', 'Mid Bottom'],
      ['B Gym', 'B Tower', 'B Site'],
    ],
    utilities: [
      { kind: 'wall', pos: 'B Drop', label: 'คุมทางลง B Drop' },
      { kind: 'recon', pos: 'Mid Fountain', label: 'เช็ค Mid ต้นรอบ' },
    ],
    notes: [
      'คุม Mid Window / Bottom เพื่ออ่านเกมว่าอีกฝั่งจะเจาะ A Link หรือ B Link',
      'วางสกิลสกัดที่ B Drop และ B Main เพื่อถ่วงเวลาให้เพื่อนหมุนมาช่วยทัน',
    ],
  },
  {
    id: 'summit-defense-bpush',
    mapId: 'summit',
    side: 'defense',
    name: 'ดันชิง B Main + Retake A Art',
    roundType: 'retake',
    smokes: ['B Lobby', 'A Garden'],
    routes: [
      ['B Site', 'B Main', 'B Lobby'],
      ['Def Spawn', 'A Cave', 'A Art', 'A Site'],
    ],
    utilities: [
      { kind: 'flash', pos: 'B Main', label: 'แฟลชชิง B Main' },
    ],
    notes: [
      'ดันยึด B Main ต้นรอบเพื่อเก็บข้อมูล — หากบุก A ให้รวมทีมรีเทคจาก A Cave และ A Art',
    ],
  },

  // ==================== TDM MAPS ====================
  {
    id: 'district-attack-mid',
    mapId: 'district',
    side: 'attack',
    name: 'คุม Mid & ซอยข้าง (TDM Split)',
    roundType: 'full',
    smokes: [{ x: 50, y: 36, label: 'Mid Def' }],
    routes: [
      [{ x: 25, y: 78 }, { x: 24, y: 50 }, { x: 38, y: 38 }],
      [{ x: 50, y: 80 }, { x: 50, y: 48 }],
      [{ x: 76, y: 78 }, { x: 75, y: 50 }, { x: 64, y: 38 }],
    ],
    utilities: [{ kind: 'flash', pos: { x: 50, y: 52 }, label: 'แฟลชชิงเลนกลาง' }],
    notes: [
      'คุมจุดเกิดอาวุธเลนซ้าย-ขวาและส่ง 2 คนยึดตรงกลางเพื่อสร้าง Crossfire',
    ],
  },
  {
    id: 'district-defense-hold',
    mapId: 'district',
    side: 'defense',
    name: 'ตั้งโซนดักซอย + คุม Orb',
    roundType: 'full',
    smokes: [{ x: 50, y: 62, label: 'Mid Atk' }],
    routes: [
      [{ x: 28, y: 24 }, { x: 26, y: 46 }],
      [{ x: 50, y: 22 }, { x: 50, y: 44 }],
      [{ x: 72, y: 24 }, { x: 74, y: 46 }],
    ],
    utilities: [{ kind: 'recon', pos: { x: 50, y: 50 }, label: 'เช็คเลนกลาง' }],
    notes: [
      'คุมพื้นที่ Orb ฝั่งตัวเองแล้วดึงมุมยิงคู่กับเพื่อน อย่าดันลึกเกินจุดเกิดศัตรู',
    ],
  },
  {
    id: 'kasbah-attack-mid',
    mapId: 'kasbah',
    side: 'attack',
    name: 'คุมระเบียงสูง + ลานกลาง',
    roundType: 'full',
    smokes: [{ x: 50, y: 35, label: 'Plaza High' }],
    routes: [
      [{ x: 24, y: 78 }, { x: 24, y: 48 }],
      [{ x: 50, y: 80 }, { x: 50, y: 50 }],
      [{ x: 76, y: 78 }, { x: 76, y: 48 }],
    ],
    utilities: [{ kind: 'flash', pos: { x: 50, y: 52 }, label: 'แฟลชลานกลาง' }],
    notes: [
      'ยึดระเบียงข้างเพื่อคุมมุมสูงเหนือลานกลาง Kasbah และเก็บอาวุธกลาง',
    ],
  },
  {
    id: 'kasbah-defense-hold',
    mapId: 'kasbah',
    side: 'defense',
    name: 'Crossfire ซ้าย-ขวา คุมป้อม',
    roundType: 'full',
    smokes: [{ x: 50, y: 64, label: 'Plaza Entry' }],
    routes: [
      [{ x: 26, y: 22 }, { x: 28, y: 48 }],
      [{ x: 74, y: 22 }, { x: 72, y: 48 }],
    ],
    utilities: [{ kind: 'molly', pos: { x: 50, y: 50 }, label: 'กันคนกลางลาน' }],
    notes: [
      'คุมสองปีกซ้ายขวาเพื่อช่วยกันยิงตัดศัตรูที่วิ่งผ่านลานเปิดตรงกลาง',
    ],
  },
  {
    id: 'drift-attack-mid',
    mapId: 'drift',
    side: 'attack',
    name: 'คุมเลนยาวกลาง + สไลด์อ้อมข้าง',
    roundType: 'full',
    smokes: [{ x: 50, y: 38, label: 'Mid Lane' }],
    routes: [
      [{ x: 22, y: 78 }, { x: 22, y: 45 }],
      [{ x: 50, y: 80 }, { x: 50, y: 50 }],
      [{ x: 78, y: 78 }, { x: 78, y: 45 }],
    ],
    utilities: [{ kind: 'wall', pos: { x: 50, y: 48 }, label: 'บังสายตาเลนกลาง' }],
    notes: [
      'ใช้ Smoke/Wall ตัดสายตาเลนกลางแล้วโอบออกทางซอยข้างเพื่อยิงข้าง',
    ],
  },
  {
    id: 'drift-defense-hold',
    mapId: 'drift',
    side: 'defense',
    name: 'ตั้งรับระยะไกล + ดักปีกข้าง',
    roundType: 'full',
    smokes: [{ x: 50, y: 62, label: 'Mid Chokepoint' }],
    routes: [
      [{ x: 50, y: 20 }, { x: 50, y: 42 }],
      [{ x: 24, y: 24 }, { x: 24, y: 48 }],
      [{ x: 76, y: 24 }, { x: 76, y: 48 }],
    ],
    utilities: [{ kind: 'recon', pos: { x: 50, y: 50 }, label: 'สแกนเลนกลาง' }],
    notes: [
      'วาง 1 คนถือปืนระยะไกลกลางแผนที่ และอีก 4 คนคุมปีกข้างทั้งสองฝั่ง',
    ],
  },
  {
    id: 'glitch-attack-mid',
    mapId: 'glitch',
    side: 'attack',
    name: 'เจาะเลนกลาง 2 โซน + อ้อมข้าง',
    roundType: 'full',
    smokes: [{ x: 50, y: 36, label: 'Mid Glitch' }],
    routes: [
      [{ x: 25, y: 78 }, { x: 25, y: 46 }],
      [{ x: 50, y: 80 }, { x: 50, y: 48 }],
      [{ x: 75, y: 78 }, { x: 75, y: 46 }],
    ],
    utilities: [{ kind: 'flash', pos: { x: 50, y: 50 }, label: 'แฟลชเลนกลาง' }],
    notes: [
      'คุมทางเชื่อมระหว่างโซน Sunset กับ Haven ใน Glitch เพื่อดึงจังหวะเกมเร็ว',
    ],
  },
  {
    id: 'glitch-defense-hold',
    mapId: 'glitch',
    side: 'defense',
    name: 'คุมโซนบน + ดักมุมแคบข้าง',
    roundType: 'full',
    smokes: [{ x: 50, y: 64, label: 'Mid Entry' }],
    routes: [
      [{ x: 28, y: 22 }, { x: 28, y: 46 }],
      [{ x: 72, y: 22 }, { x: 72, y: 46 }],
    ],
    utilities: [{ kind: 'molly', pos: { x: 50, y: 50 }, label: 'ถ่วงกลางแผนที่' }],
    notes: [
      'ใช้สกิลหน่วงพื้นที่กลางและคุมมุมยกระดับเพื่อแลกคิลได้เปรียบ',
    ],
  },
  {
    id: 'piazza-attack-mid',
    mapId: 'piazza',
    side: 'attack',
    name: 'คุมจัตุรัสกลาง + ปีกซ้าย-ขวา',
    roundType: 'full',
    smokes: [{ x: 50, y: 36, label: 'Mid Piazza' }],
    routes: [
      [{ x: 26, y: 78 }, { x: 28, y: 48 }],
      [{ x: 50, y: 80 }, { x: 50, y: 48 }],
      [{ x: 74, y: 78 }, { x: 72, y: 48 }],
    ],
    utilities: [{ kind: 'flash', pos: { x: 50, y: 52 }, label: 'แฟลชจัตุรัส' }],
    notes: [
      'คุมขอบจัตุรัส Piazza และใช้ Smoke ตัดระยะสายตาก่อนเดินเก็บอาวุธ',
    ],
  },
  {
    id: 'piazza-defense-hold',
    mapId: 'piazza',
    side: 'defense',
    name: 'Crossfire รอบจัตุรัสกลาง',
    roundType: 'full',
    smokes: [{ x: 50, y: 62, label: 'Square Entry' }],
    routes: [
      [{ x: 26, y: 22 }, { x: 26, y: 48 }],
      [{ x: 74, y: 22 }, { x: 74, y: 48 }],
    ],
    utilities: [{ kind: 'recon', pos: { x: 50, y: 50 }, label: 'สแกนจัตุรัส' }],
    notes: [
      'จับคู่ยิงไขว้ซ้าย-ขวาคุมจัตุรัสกลางเพื่อเก็บรอบเร็ว',
    ],
  },
];

export function resolvePoint(
  map: ValorantMap,
  point: string | { x: number; y: number }
): { x: number; y: number; label?: string } | null {
  if (typeof point !== 'string') return point;
  const found = map.callouts.find((c) => c.key.toLowerCase() === point.toLowerCase());
  if (found) return { x: found.x, y: found.y, label: found.key };
  return null;
}

export function buildPlayFromPreset(seed: PresetPlanSeed, map: ValorantMap): StrategyPlay {
  const elements: BoardElements = {
    strokes: [],
    markers: [],
  };

  seed.routes.forEach((routePts, idx) => {
    const resolved = routePts
      .map((p) => resolvePoint(map, p))
      .filter((p): p is { x: number; y: number } => p !== null);
    if (resolved.length >= 2) {
      elements.strokes.push({
        id: `${seed.id}-route-${idx}`,
        kind: 'route',
        points: resolved,
        color: seed.side === 'defense' ? '#22D3EE' : '#34D399',
        dashed: true,
      });
    }
  });

  seed.smokes.forEach((sm, idx) => {
    const pt = resolvePoint(map, sm);
    if (pt) {
      elements.markers.push({
        id: `${seed.id}-smoke-${idx}`,
        kind: 'smoke',
        x: pt.x,
        y: pt.y,
        label: typeof sm === 'string' ? sm : sm.label ?? `${idx + 1}`,
      });
    }
  });

  (seed.utilities ?? []).forEach((util, idx) => {
    const pt = resolvePoint(map, util.pos);
    if (pt) {
      elements.markers.push({
        id: `${seed.id}-util-${idx}`,
        kind: util.kind,
        x: pt.x,
        y: pt.y,
        label: util.label,
      });
    }
  });

  return {
    id: seed.id,
    mapId: seed.mapId,
    side: seed.side,
    name: seed.name,
    roundType: seed.roundType,
    isPreset: true,
    elements,
    steps: seed.notes.map((text, idx) => ({
      id: `${seed.id}-step-${idx}`,
      text,
      done: false,
    })),
    assignments: {},
    notes: '',
    updatedAt: 0,
  };
}
