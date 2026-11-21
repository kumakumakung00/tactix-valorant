export interface ProPlaybook {
  id: string;
  teamTag: string;
  teamName: string;
  mapId: string;
  // แผนพรีเซ็ตที่ใช้วาดบนแผนที่ (id ตรงกับ PRESET_SEEDS) — ไม่ใส่ = ใช้ได้ทุกด่านโดยไม่วาดแผน
  presetSeedId?: string;
  side: 'attack' | 'defense' | 'both';
  agents: [string, string, string, string, string];
  styleLabel: string;
  planSummary: string;
  keyPoints: string[];
}

export const PRO_PLAYBOOKS: ProPlaybook[] = [
  // ==================== ASCENT ====================
  {
    id: 'prx-ascent',
    teamTag: 'PRX',
    teamName: 'Paper Rex (W-Gaming)',
    mapId: 'ascent',
    presetSeedId: 'ascent-attack-a',
    side: 'attack',
    agents: ['jett', 'reyna', 'breach', 'sova', 'omen'],
    styleLabel: 'บุกเร็วประสานสกิล',
    planSummary: 'บุกเร็วเจาะ Mid ทะลุ Tree พร้อม A Main',
    keyPoints: [
      'Breach สตั๊น A Main + แฟลชเปิด ให้ Jett และ Reyna โดดเข้าเก็บคิลต้นไซท์',
      'Sova Recon เช็คหลังกล่องและ Tree ก่อนทีมบุกพร้อมกัน',
      'Omen ควันปิด Rafters/Garden ตัดมุมยิงของฝั่งรับ',
    ],
  },
  {
    id: 'fnc-ascent',
    teamTag: 'FNC',
    teamName: 'Fnatic (Meta Control)',
    mapId: 'ascent',
    presetSeedId: 'ascent-attack-a',
    side: 'attack',
    agents: ['jett', 'sova', 'kayo', 'omen', 'killjoy'],
    styleLabel: 'คุมเกมตามเมต้า ปิดสกิลก่อนเข้า',
    planSummary: 'ปามีดปิดสกิลไซท์ A + ควัน Heaven/Tree แล้วเข้าทำพร้อมกัน',
    keyPoints: [
      'KAY/O ปามีด Suppress ปิดสกิลตัวกันไซท์ A ก่อน Execute',
      'Omen ควัน Heaven (Rafters) และ Tree ตัดวิชั่นทั้งสองมุม',
      'ทั้ง 5 คนเข้าไซท์พร้อมกันอย่างมีจังหวะ ไม่โผล่ทีละคน',
    ],
  },

  // ==================== HAVEN ====================
  {
    id: 'sen-haven',
    teamTag: 'SEN',
    teamName: 'Sentinels (Split)',
    mapId: 'haven',
    presetSeedId: 'haven-attack-c',
    side: 'attack',
    agents: ['neon', 'breach', 'sova', 'omen', 'cypher'],
    styleLabel: 'สปีดประสานสตั๊น เจาะไซท์เดียวจบ',
    planSummary: 'สตั๊น C Long วิ่งเปิดพร้อมเจาะ Garage เข้าไซท์ C',
    keyPoints: [
      'Breach สตั๊น C Long ทะลุกำแพง แล้ว Neon วิ่งสปีดเปิดไซท์ทันที',
      'Sova โดรนเช็คหลังกล่อง C ก่อนทีมโผล่',
      'Omen ควัน C Link/Window ตัดทางหมุน ส่วน Cypher ดัก Flank ที่ Garage',
    ],
  },

  // ==================== BIND ====================
  {
    id: 'edg-bind',
    teamTag: 'EDG',
    teamName: 'EDward Gaming (Double Smoke)',
    mapId: 'bind',
    presetSeedId: 'bind-attack-b',
    side: 'attack',
    agents: ['raze', 'skye', 'gekko', 'brimstone', 'viper'],
    styleLabel: 'ตัดวิชั่น Double Smoke โดดเข้าทำ',
    planSummary: 'ตัดวิชั่นด้วยกำแพง Viper + ควัน Brimstone แล้วโดดเข้า B Hookah',
    keyPoints: [
      'Viper กางกำแพงตัด B Long ให้ทีมเดินเข้าแบบไม่โดนส่อง',
      'Brimstone ควันปิด Elbow/Hall + Molly ไล่คนใน Hookah',
      'Raze/Skye/Gekko โดดเข้าไซท์พร้อมกันหลังวิชั่นถูกตัดหมด',
    ],
  },

  // ==================== SPLIT ====================
  {
    id: 'gen-split',
    teamTag: 'GEN',
    teamName: 'Gen.G (Mid Dive)',
    mapId: 'split',
    presetSeedId: 'split-attack-mid',
    side: 'attack',
    agents: ['raze', 'jett', 'skye', 'omen', 'cypher'],
    styleLabel: 'บุกเร็วชิงกลาง แหวกแยกไซท์',
    planSummary: 'ชิง Mid Mail/Ramps แล้วแหวกเข้า B Garage หรือ A พร้อมกัน',
    keyPoints: [
      'Raze + Jett ชิง Mid ต้นรอบด้วยระเบิดและ Dash',
      'Skye หมา Dog เช็คมุมอับก่อนทีมขึ้น Heaven',
      'Omen ควัน Vent/Mail ตัดมุมสูง ส่วน Cypher ล็อกไซท์คนเดียว',
    ],
  },

  // ==================== LOTUS ====================
  {
    id: 'fnc-lotus',
    teamTag: 'FNC',
    teamName: 'Fnatic (Rubble Control)',
    mapId: 'lotus',
    presetSeedId: 'lotus-attack-a',
    side: 'attack',
    agents: ['raze', 'fade', 'omen', 'viper', 'killjoy'],
    styleLabel: 'คุมพื้นที่ก่อนบีบเข้าไซท์',
    planSummary: 'ยึด A Rubble ก่อน แล้วบีบเข้าไซท์ A ด้วยควัน 2 ชั้น',
    keyPoints: [
      'Raze ชิง Rubble ต้นรอบด้วย Boom Bot ระหว่างที่ Fade เช็คข้อมูล',
      'Viper + Omen ตัดสายตา Stairs/Drop และประตูหมุน',
      'Killjoy คุมหลังและเก็บ Lockdown ไว้กัน Retake',
    ],
  },

  // ==================== SUNSET ====================
  {
    id: 'edg-sunset',
    teamTag: 'EDG',
    teamName: 'EDward Gaming (Fast B)',
    mapId: 'sunset',
    presetSeedId: 'sunset-attack-bsplit',
    side: 'attack',
    agents: ['neon', 'gekko', 'breach', 'omen', 'cypher'],
    styleLabel: 'สปีดโถมไซท์ B ก่อนฝั่งรับตั้งตัว',
    planSummary: 'โถม B Main ด้วยสปีด Neon และสตั๊น Breach แล้ว Wingman วาง Spike',
    keyPoints: [
      'Neon วิ่งเปิด B Main ทันทีที่ Breach สตั๊นมุมตั้งรับ',
      'Gekko Dizzy บังคับหันหลบ + Wingman วาง Spike ปลอดภัย',
      'Omen ควันปิด Market/Boba ตัดมุมยิงซ้อน',
    ],
  },

  // ==================== ICEBOX ====================
  {
    id: 'fnc-icebox',
    teamTag: 'FNC',
    teamName: 'Fnatic (Belt Execute)',
    mapId: 'icebox',
    presetSeedId: 'icebox-attack-b',
    side: 'attack',
    agents: ['jett', 'sova', 'gekko', 'viper', 'killjoy'],
    styleLabel: 'ม่าน Viper คุมมุมสูง วาง Spike ปลอดภัย',
    planSummary: 'ม่าน Viper ตัด Snowman/Green แล้ว Wingman วาง Spike ไซท์ B',
    keyPoints: [
      'Viper กางม่านตัดมุมสูง ให้ทีมขึ้น Belt ได้ปลอดภัย',
      'Gekko Wingman วาง Spike ระหว่างที่ Sova โดรนเช็ค Yellow',
      'Jett ขึ้น Rafters/Pipes คุมมุมบน ส่วน Killjoy ดัก Flank Tube',
    ],
  },

  // ==================== PEARL ====================
  {
    id: 'loud-pearl',
    teamTag: 'LOUD',
    teamName: 'LOUD (B Long Post-Plant)',
    mapId: 'pearl',
    presetSeedId: 'pearl-attack-b',
    side: 'attack',
    agents: ['jett', 'sova', 'kayo', 'astra', 'killjoy'],
    styleLabel: 'เล่น Post-plant จากระยะไกล',
    planSummary: 'ยึด B Long วาง Spike แล้วเล่น Post-plant ด้วยดาว Astra',
    keyPoints: [
      'KAY/O มีดเช็ค B Screen/Tower ก่อนทีมเดินยาว',
      'Astra ควัน/Gravity Well ตัดการกู้ Spike จาก B Ramp',
      'Sova Lineup Shock Dart ถ่วงเวลาการ Defuse',
    ],
  },

  // ==================== BREEZE ====================
  {
    id: 'navi-breeze',
    teamTag: 'NAVI',
    teamName: 'NAVI (Viper Long Range)',
    mapId: 'breeze',
    presetSeedId: 'breeze-attack-a',
    side: 'attack',
    agents: ['jett', 'sova', 'kayo', 'viper', 'cypher'],
    styleLabel: 'ดวลระยะไกล ตัดวิชั่นผ่าไซท์',
    planSummary: 'ม่าน Viper ผ่าไซท์ A แล้ว Jett/KAY/O ดวลมุมไกลเข้าเก็บไซท์',
    keyPoints: [
      'Viper Wall ตัด Pyramids/Bridge เปิดทางเดินเข้า A',
      'KAY/O Flash ออก A Shop ให้ Jett เก็บมุม Operator',
      'Cypher วางสายกันโอบหลัง B Tunnel',
    ],
  },

  // ==================== FRACTURE ====================
  {
    id: 'eg-fracture',
    teamTag: 'EG',
    teamName: 'Evil Geniuses (Crunch)',
    mapId: 'fracture',
    presetSeedId: 'fracture-attack-a',
    side: 'attack',
    agents: ['raze', 'breach', 'fade', 'brimstone', 'cypher'],
    styleLabel: 'บีบสองด้านพร้อมกัน',
    planSummary: 'Breach สตั๊นทะลุกำแพงเข้า Dish บีบ A Main พร้อมกัน',
    keyPoints: [
      'Breach Fault Line สตั๊นข้ามกำแพง A Dish/Arcade',
      'Raze โยนระเบิดไล่คนหลังกล่อง ก่อนทีมบีบเข้าไซท์',
      'Brimstone ควันปิด Def Spawn/Link ตัดทางหมุน',
    ],
  },

  // ==================== ABYSS ====================
  {
    id: 'th-abyss',
    teamTag: 'TH',
    teamName: 'Team Heretics (Tower Control)',
    mapId: 'abyss',
    presetSeedId: 'abyss-attack-a',
    side: 'attack',
    agents: ['jett', 'sova', 'kayo', 'omen', 'cypher'],
    styleLabel: 'คุมมุมสูงและเปิดข้อมูลก่อนเข้า',
    planSummary: 'Jett ขึ้น Tower คุมมุมสูง พร้อม Sova เปิดข้อมูลเข้าไซท์ A',
    keyPoints: [
      'Jett ใช้ Updraft ขึ้น Tower คุม High Ground ก่อนปะทะ',
      'Sova Recon เช็ค Library/Site แล้ว KAY/O มีดปิดสกิล',
      'Omen ควัน Security + TP ข้ามขอบเหวหลอกจังหวะ',
    ],
  },

  // ==================== CORRODE ====================
  {
    id: 'vit-corrode',
    teamTag: 'VIT',
    teamName: 'Vitality (Mid Split)',
    mapId: 'corrode',
    presetSeedId: 'corrode-attack-a',
    side: 'attack',
    agents: ['raze', 'sova', 'omen', 'viper', 'cypher'],
    styleLabel: 'Double Controller ตัด Mid',
    planSummary: 'คุม Mid Window/Stairs แล้วแหวกเข้า A Pocket หรือ B พร้อมกัน',
    keyPoints: [
      'Viper + Omen ตัดมุมยิงซ้อน Mid Window และ Stairs',
      'Raze + Sova เคลียร์ A Pocket/Crane ด้วยระเบิดและ Recon',
      'Cypher ล็อก A Link กันทีมศัตรูหมุนไว',
    ],
  },

  // ==================== SUMMIT ====================
  {
    id: 'gen-summit',
    teamTag: 'GEN',
    teamName: 'Gen.G (A Garden Split)',
    mapId: 'summit',
    presetSeedId: 'summit-attack-a',
    side: 'attack',
    agents: ['jett', 'sova', 'kayo', 'omen', 'killjoy'],
    styleLabel: 'สมดุล เปิดข้อมูลก่อนเจาะ',
    planSummary: 'ชิง Mid Fountain แล้วเจาะ A Garden ด้วยแฟลชและควัน',
    keyPoints: [
      'Sova + KAY/O เช็ค Mid Fountain และ B Drop ต้นรอบ',
      'Omen ควัน A Cave/Art และ Paranoia ทะลุ A Link',
      'Jett Dash เข้าไซท์ A หลังข้อมูลเปิดครบ',
    ],
  },
];

export function getPlaybooksForMap(mapId: string): ProPlaybook[] {
  return PRO_PLAYBOOKS.filter((p) => p.mapId === mapId);
}

export function getPlaybookForPlay(playId: string): ProPlaybook | undefined {
  return PRO_PLAYBOOKS.find((p) => p.presetSeedId === playId);
}
