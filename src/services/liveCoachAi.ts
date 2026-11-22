import { Side } from '../types/tactix';

export interface CoachTeamAgentInput {
  slot: number;
  id: string;
  name: string;
  role: string;
  abilities?: string[];
}

export interface CoachEnemyAgentInput {
  name: string;
  role: string;
}

export interface CoachCalloutInput {
  key: string;
  group: string;
  x: number;
  y: number;
}

export interface LiveCoachRequest {
  mapName: string;
  sites: string[];
  side: Side;
  economy: string;
  ourTeam: CoachTeamAgentInput[];
  enemyTeam: CoachEnemyAgentInput[];
  callouts: CoachCalloutInput[];
  situation: string;
  tags: string[];
}

export interface AiAgentOrder {
  slot: number;
  agentId?: string;
  agentName: string;
  callout: string;
  command: string;
  x: number;
  y: number;
  roleTone: 'attack' | 'defense' | 'lurk' | 'warning';
  moveToX?: number;
  moveToY?: number;
}

export interface AiUtilityPlacement {
  kind: 'smoke' | 'flash' | 'recon' | 'molly' | 'wall' | 'spike' | 'pin';
  label: string;
  x: number;
  y: number;
}

export interface AiCoachResponse {
  strategyName: string;
  headline: string;
  agentOrders: AiAgentOrder[];
  utilityPlacements: AiUtilityPlacement[];
}

export interface MapProBlueprint {
  keyChokes: string[];
  smokeSpotsA: string[];
  smokeSpotsB: string[];
  opAngles: string[];
  splitA: string;
  splitB: string;
  retakePlan: string;
  postPlantSpot: string;
  flankWatch: string;
}

// ฐานข้อมูลกลยุทธ์ระดับ VCT ครบ 11 แผนที่ (เจาะลึกจุด Smoke, มุม Op, แผน Split, จุด Post-Plant)
export const VCT_MAP_BLUEPRINTS: Record<string, MapProBlueprint> = {
  ascent: {
    keyChokes: ['Mid Market', 'A Main', 'B Main', 'Tiles', 'Catwalk'],
    smokeSpotsA: ['A Heaven และ A Tree (Door)', 'A Hell และ Heaven'],
    smokeSpotsB: ['B Market และ CT Spawn', 'B Stairs และ Market'],
    opAngles: ['Mid Top / Catwalk', 'A Heaven', 'B Main Long'],
    splitA: 'ยึด Mid Market + Catwalk เพื่อบีบเข้า A Tree พร้อมกัน 2 ทิศทาง (A Main + Tree)',
    splitB: 'คุม Mid Market แล้วยิงทะลุเข้า B Market ประกบตัวเฝ้า B Site พร้อมทีมจาก B Main',
    retakePlan: 'รวมพลเข้าพร้อมกันทาง A Heaven + A Tree (หรือ B Market + CT) พร้อมแฟลชเปิดทาง',
    postPlantSpot: 'วาง Spike เปิดมุมให้คนยืนคุมจาก A Main หรือ B Main (Default Open Plant)',
    flankWatch: 'วางกับดักคุม Tiles / A Lobby และ B Lobby กันตัวอ้อมหลัง',
  },
  haven: {
    keyChokes: ['Garage', 'Mid Window', 'A Long', 'C Long', 'A Short (Sewers)'],
    smokeSpotsA: ['A Heaven และ CT Spawn', 'A Hell และ Heaven'],
    smokeSpotsB: ['C Garage และ CT Spawn', 'C Platform และ CT'],
    opAngles: ['C Long', 'A Long', 'Mid Window'],
    splitA: 'แบ่งทีมคุม A Short (Sewers) และ A Long นับถอยหลังปาควันเข้าพร้อมกัน 2 ทาง',
    splitB: 'เจาะทะลุ Garage เพื่อบีบเข้า C Site พร้อมทีมหลักที่ดันมาจาก C Long',
    retakePlan: 'ตีโอบพร้อมกันจาก CT Spawn และ Garage/Short ห้ามทยอยเดินเข้าทีละคน',
    postPlantSpot: 'วาง Spike เปิดมุมให้ยิงคุมได้จาก C Long หรือ A Long (Safe Long Plant)',
    flankWatch: 'วางกับดักคุม Mid Courtyard และฝั่งตรงข้ามจุดบุกกันตัวลอบอ้อม',
  },
  bind: {
    keyChokes: ['A Short', 'B Hookah', 'A Showers (Bath)', 'B Long', 'U-Hall (Lamps)'],
    smokeSpotsA: ['A Heaven และ U-Hall (Lamps)', 'A Triple Box และ Heaven'],
    smokeSpotsB: ['B Elbow และ CT Spawn', 'B Hookah Window และ Elbow'],
    opAngles: ['B Long', 'A Showers', 'A Heaven'],
    splitA: 'ยึด A Showers + A Short พร้อมกัน ปาควันปิด Heaven แล้วรุมเคลียร์ U-Hall ก่อนวาง Spike',
    splitB: 'คุม B Long คู่กับ B Hookah โดดลงไซต์พร้อมกัน 2 ระดับ (บน-ล่าง)',
    retakePlan: 'ปาควันปิดทางเชื่อมหลักแล้วเข้าพร้อมกันจาก CT และ A Heaven/Elbow',
    postPlantSpot: 'วาง Spike ชิดขอบให้ตัวใน Showers หรือ B Long ยิงคุมได้จากระยะไกล',
    flankWatch: 'ระวังเสียงวาร์ป Teleporter และวางกับดักคุม A Cave / B Fountain',
  },
  split: {
    keyChokes: ['Mid Mail', 'B Heaven', 'A Ramps', 'Sewers', 'Vents'],
    smokeSpotsA: ['A Heaven และ Screens', 'A Ramps และ Heaven'],
    smokeSpotsB: ['B Heaven และ CT Spawn', 'B Alley และ Heaven'],
    opAngles: ['Mid Top / Mail', 'A Ramps', 'B Main'],
    splitA: 'คุม Mid Mail เพื่อดันขึ้น Vents ออกไปประกบ A Heaven พร้อมทีมที่ดัน A Main',
    splitB: 'ยึด Mid Mail แล้วยิงทะลุเข้า B Heaven บีบตัวเฝ้า B Site จากด้านบน',
    retakePlan: 'ต้องยึดพื้นที่ Heaven คืนให้ได้ก่อน แล้วค่อยกระโดดลงเคลียร์มุมล่างพร้อมกัน',
    postPlantSpot: 'วาง Spike จุดเปิดที่คนบน Heaven หรือ A Main/B Main ยิงช่วยได้',
    flankWatch: 'วางกับดักคุม Sewers และ A Lobby กันตัวลอบตุ๋ยหลัง',
  },
  lotus: {
    keyChokes: ['A Rubble', 'B Pillars', 'C Mound', 'A Tree', 'A Link'],
    smokeSpotsA: ['A Heaven และ A Stairs', 'A Drop และ Heaven'],
    smokeSpotsB: ['C Waterfall และ CT Spawn', 'C Hall และ Waterfall'],
    opAngles: ['C Mound', 'A Main / Rubble', 'B Main'],
    splitA: 'เปิดประตูหมุน A Link เพื่อบีบเข้า B Site หรือย้อนเข้า A Tree พร้อมกัน',
    splitB: 'คุม B Pillars แล้วยิงทะลุ C Link เพื่อประกบตัวเฝ้า C Site',
    retakePlan: 'กดเปิดประตูหมุนสร้างเสียงหลอก แล้วบุกเข้าพร้อมกัน 2 ทิศทาง',
    postPlantSpot: 'วาง Spike เปิดมุมให้คนยืนคุมจาก C Mound หรือ A Rubble ได้ชัดเจน',
    flankWatch: 'วางกับดักคุม A Root และ C Lobby เพื่อดักตัวหมุนอ้อมหลัง',
  },
  sunset: {
    keyChokes: ['Mid Tiles', 'A Elbow', 'B Market', 'B Main', 'Mid Courtyard'],
    smokeSpotsA: ['A Alley และ A Link', 'A Elbow และ Alley'],
    smokeSpotsB: ['B Market และ CT Spawn', 'B Boba และ Market'],
    opAngles: ['Mid Top / Tiles', 'B Main Long', 'A Main'],
    splitA: 'คุม Mid Tiles เพื่อดันเข้า A Link ตัดหลังตัวเฝ้า A Site พร้อมทีมจาก A Elbow',
    splitB: 'ยึด Mid Tiles แล้วยิงเข้า B Market เพื่อปิดล้อม B Site จาก 2 ทาง',
    retakePlan: 'ต้องยึด B Market หรือ A Link คืนให้ได้ก่อน เพื่อสร้างมุมยิงครอสไฟร์',
    postPlantSpot: 'วาง Spike เปิดมุมให้ยิงคุมได้จาก B Main หรือ A Elbow',
    flankWatch: 'วางกับดักคุม Mid Bottom และทางเข้าฝั่งตรงข้ามกันตัวอ้อมหลัง',
  },
  icebox: {
    keyChokes: ['Mid Boiler', 'A Belt / Pipes', 'B Green', 'Kitchen', 'Tube'],
    smokeSpotsA: ['A Screens และ Rafters', 'A Maze และ Screens'],
    smokeSpotsB: ['B Orange และ Snowman', 'B Hall และ Orange'],
    opAngles: ['Mid Boiler', 'B Green Long', 'A Pipes'],
    splitA: 'ดันผ่าน Tube ขึ้นไปตัดตัวซ้อนบน Rafters พร้อมทีมหลักที่บุก A Belt',
    splitB: 'ดันผ่าน Kitchen ขึ้นไปประกบ B Orange ตัดตัวซ้อนด้านหลังไซต์',
    retakePlan: 'ปาควันบังจุดวาง Spike แล้วยิงสกิลไล่ตัวแคมป์มุมสูงบน Rafters/Yellow',
    postPlantSpot: 'วาง Spike จุดเปิดบนชั้นล่างหรือชั้นบนให้คนใน Belt/Green ยิงคุมได้',
    flankWatch: 'วางกับดักคุม Mid Blue และทางเชื่อม Kitchen กันตัวลอบตุ๋ย',
  },
  breeze: {
    keyChokes: ['Mid Doors', 'A Cave', 'B Elbow', 'Mid Nest', 'Mid Cannon'],
    smokeSpotsA: ['A Stairs และ Bridge', 'A Back Site และ Stairs'],
    smokeSpotsB: ['B Wall และ CT Spawn', 'B Tunnel และ Wall'],
    opAngles: ['Mid Nest / Window', 'A Cave Long', 'B Main'],
    splitA: 'ยึด Mid Doors เพื่อดันขึ้น Bridge ตัดมุมสูงพร้อมทีมที่เข้าทาง A Cave',
    splitB: 'คุม Mid Doors แล้วยิงเข้า B Tunnel ประกบตัวเฝ้า B Site พร้อมทีมจาก B Main',
    retakePlan: 'ปาควันตัดเส้นเล็งระยะไกลก่อนวิ่งเข้าประชิดตัวถือ Spike พร้อมแฟลช',
    postPlantSpot: 'วาง Spike เปิดมุมให้ยิงคุมระยะไกลได้จาก A Cave หรือ B Main',
    flankWatch: 'วางกับดักคุม Mid Cannon และ A Lobby กันตัวอ้อมหลังระยะไกล',
  },
  fracture: {
    keyChokes: ['A Dish', 'B Arcade', 'A Main', 'B Main', 'A Rope'],
    smokeSpotsA: ['A Rope และ CT Spawn', 'A Drop และ Rope'],
    smokeSpotsB: ['B Canteen และ Generator', 'B Tower และ Canteen'],
    opAngles: ['B Main', 'A Hall', 'B Arcade'],
    splitA: 'แบ่งทีม 2 ฝั่ง (A Main + A Dish) นับถอยหลังปาควันพุ่งเข้าพร้อมกัน 2 ทิศทาง',
    splitB: 'แบ่งทีมเข้าพร้อมกันทาง B Main และ B Arcade เพื่อบีบมุมยิงตัวในไซต์',
    retakePlan: 'รวมกลุ่ม 4-5 คนบุกทลายจากฝั่ง Spawn เพื่อบีบพื้นที่พร้อมกัน',
    postPlantSpot: 'วาง Spike จุดเปิดที่ทั้งฝั่ง Main และฝั่ง Dish/Arcade ยิงช่วยกันได้',
    flankWatch: 'เช็กเสียงฝีเท้าใต้สะพาน (Underpass) ตลอดเวลา',
  },
  pearl: {
    keyChokes: ['Mid Plaza', 'A Art', 'B Ramp', 'Mid Connector', 'A Link'],
    smokeSpotsA: ['A Secret และ Dugout', 'A Flowers และ Secret'],
    smokeSpotsB: ['B Hall และ Tower', 'B Link และ Tower'],
    opAngles: ['B Ramp Long', 'Mid Plaza', 'A Main'],
    splitA: 'ยึด Mid Art เพื่อบีบเข้า A Link ตัดหลังตัวเฝ้า A Site พร้อมทีมจาก A Main',
    splitB: 'คุม Mid Plaza แล้วยิงเข้า B Link ประกบตัวเฝ้า B Site พร้อมทีมจาก B Ramp',
    retakePlan: 'ปาควันปิด B Long แล้วรวมพลเข้าพร้อมกันทาง B Tower และ CT Spawn',
    postPlantSpot: 'วาง Spike เปิดมุมให้คนใน B Ramp หรือ A Main ยิงคุมจากระยะปลอดภัย',
    flankWatch: 'วางกับดักคุม Mid Shops และทางเชื่อมฝั่งตรงข้าม',
  },
  abyss: {
    keyChokes: ['Mid Catwalk', 'A Bridge', 'B Danger', 'Mid Library', 'A Security'],
    smokeSpotsA: ['A Heaven และ Tower', 'A Back Site และ Heaven'],
    smokeSpotsB: ['B Nest และ CT Spawn', 'B Danger และ Nest'],
    opAngles: ['B Main Long', 'Mid Catwalk', 'A Bridge'],
    splitA: 'คุม Mid Library เพื่อบีบเข้า A Security พร้อมทีมหลักที่เข้าทาง A Main',
    splitB: 'ยึด Mid Catwalk แล้วยิงเข้า B Link ประกบตัวเฝ้า B Site พร้อมกัน',
    retakePlan: 'ใช้สกิลไล่มุมริมเหวและปาควันบังจุดกู้ Spike ก่อนพุ่งเข้าพร้อมกัน',
    postPlantSpot: 'วาง Spike ชิดขอบปลอดภัยให้คนใน B Main หรือ A Main ยิงคุมได้',
    flankWatch: 'วางกับดักคุม Mid Bottom และระวังตัวลอบกระโดดข้ามจุดเสี่ยง',
  },
};
export interface AgentProPlaybook {
  attackExec: string[];
  attackSplit: string[];
  defenseHold: string[];
  defenseRetake: string[];
  utilName: string;
}

export const PRO_AGENT_PLAYBOOK: Record<string, AgentProPlaybook> = {
  jett: {
    attackExec: [
      'ปา Cloudburst ตัดมุมสูงแล้วกด Tailwind พุ่งเข้าสร้างพื้นที่ลึกในไซต์ให้เพื่อนตามเทรดคิลทันที',
      'ใช้ Updraft เช็กมุมสูงดึงเป้า Operator ศัตรู แล้วยิงเปิดจังหวะแรกก่อนเพื่อนเดินเข้า',
    ],
    attackSplit: [
      'รอสัญญาณทีมแยกบีบอีกทาง แล้วพุ่งตัดเข้าไซต์พร้อมกันเพื่อบังคับให้ศัตรูหันหลัง',
    ],
    defenseHold: [
      'ยืนมุม Off-angle ยิงเปิด 1 นัดแล้วกด Tailwind หนีเข้าที่กำบังทันที ห้ามยืนดวลแช่',
    ],
    defenseRetake: [
      'รอแฟลชจากเพื่อนแล้วพุ่งเข้าเคลียร์มุมอับหลังกล่องให้ทีมเดินเข้ากู้ Spike ได้ปลอดภัย',
    ],
    utilName: 'Cloudburst + Tailwind',
  },
  raze: {
    attackExec: [
      'ปล่อย Boom Bot เคลียร์มุมอับใกล้ตัว แล้วปา Paint Shells ไล่ตัวแคมป์หลังกล่องก่อนเข้า',
      'ใช้ Blast Pack สองจังหวะพุ่งตัดหน้าเข้าประชิดตัวเฝ้าไซต์พร้อมเพื่อนตามติดระยะเทรด',
    ],
    attackSplit: [
      'ปา Paint Shells ตัดทางหนีและทางหมุนเสริมของศัตรูระหว่างที่เพื่อนกำลังบีบเข้าอีกฝั่ง',
    ],
    defenseHold: [
      'ปา Paint Shells ตัดขบวนหน้าทางเข้าทันทีที่ได้ยินเสียงฝีเท้าวิ่งชาร์จ 5 คน',
    ],
    defenseRetake: [
      'ปาระเบิด Paint Shells ใส่จุดวาง Spike บังคับให้ศัตรูออกจากที่ซ่อนก่อนพุ่งเข้าเคลียร์',
    ],
    utilName: 'Boom Bot + Paint Shells',
  },
  reyna: {
    attackExec: [
      'ปา Leer ขึ้นมุมสูงบังจอศัตรู 2 มุมพร้อมกันให้เพื่อนเดินเข้าเทรดคิลอย่างปลอดภัย',
    ],
    attackSplit: [
      'เดินตามหลังตัวเปิดระยะ 1 ก้าว รอเก็บคิลแรกแล้วกด Dismiss ย้ายมุมยิงตัวถัดไป',
    ],
    defenseHold: [
      'ยืนซ้อนมุมครอสไฟร์กับเพื่อน ปา Leer สวนจังหวะศัตรูโผล่แล้วกด Dismiss ถอยเข้าที่กำบัง',
    ],
    defenseRetake: [
      'ปา Leer เปิดมุมกว้างเข้าพร้อมทีม เก็บคิลแรกแล้วใช้ Devour ฟื้นเลือดสู้ต่อจนจบ',
    ],
    utilName: 'Leer บังสายตา',
  },
  waylay: {
    attackExec: [
      'วางจุด Refract ไว้ที่ปลอดภัย แล้วกด Lightspeed พุ่งเข้าเช็กมุมอันตรายดึงเป้าศัตรู',
    ],
    attackSplit: [
      'ปาสกิล Saturate ตัดจังหวะตัวซ้อนหลังไซต์ไม่ให้วิ่งมาช่วยเพื่อนอีกฝั่งได้ทัน',
    ],
    defenseHold: [
      'วางจุด Refract ไว้หลังที่กำบัง ยิงเปิดจังหวะแรกแล้วกดวาร์ปกลับจุดปลอดภัยทันที',
    ],
    defenseRetake: [
      'ปา Saturate ใส่จุดที่ศัตรูแอบซ่อนหลังวาง Spike เพื่อตัดความเร็วการยิงและหลบหนี',
    ],
    utilName: 'Saturate + Lightspeed',
  },
  neon: {
    attackExec: [
      'กาง Fast Lane (กำแพงสายฟ้า) ผ่าครึ่งไซต์ตัดเส้นเล็ง แล้วปา Relay Bolt สตันมุมซ้อน',
    ],
    attackSplit: [
      'ใช้ High Gear วิ่งอ้อมเปลี่ยนจังหวะเข้าตีขนาบข้างพร้อมกับกลุ่มบุกหลัก',
    ],
    defenseHold: [
      'ยิง Relay Bolt สตันหน้าทางเข้าชะลอเกมบุก แล้วใช้ High Gear วิ่งหมุนไปซ้อนเพื่อนอีกฝั่งได้ไว',
    ],
    defenseRetake: [
      'กางกำแพงสายฟ้าบังเส้นเล็งระยะไกลให้เพื่อนวิ่งเข้าประชิดจุดกู้ Spike ได้ปลอดภัย',
    ],
    utilName: 'Fast Lane + Relay Bolt',
  },
  iso: {
    attackExec: [
      'เปิด Double Tap แล้วปล่อย Contingency (กำแพงกันกระสุน) เดินนำหน้าทีมตัดเส้นเล็ง Op',
    ],
    attackSplit: [
      'ปล่อย Contingency บังทางเดินเปิดให้กลุ่มแยกเข้าประชิดไซต์โดยไม่เสียเลือด',
    ],
    defenseHold: [
      'ยืนมุมครอสไฟร์เปิด Double Tap เก็บคิลแรกแล้วใช้เกราะกันกระสุนดวลตัวถัดไป',
    ],
    defenseRetake: [
      'ปล่อย Contingency บังมุมสไนเปอร์ให้ทีมเดินเข้าพื้นที่ไซต์ได้ฟรีพร้อมเปิด Double Tap',
    ],
    utilName: 'Contingency + Undercut',
  },
  yoru: {
    attackExec: [
      'ส่ง Gatecrash (วาร์ป) ข้ามไปหลังไซต์ ปา Blindside แฟลชเด้งกำแพงแล้ววาร์ปไปยิงตัดหลัง',
    ],
    attackSplit: [
      'ส่ง Gatecrash ไปอีกไซต์เพื่อสร้างเสียงหลอกให้ศัตรูหมุนหนี แล้ววาร์ปกลับมาเข้าพร้อมทีม',
    ],
    defenseHold: [
      'วาง Gatecrash ไว้จุดปลอดภัยอีกฝั่ง ยิงเปิดต้นรอบแล้ววาร์ปหนีข้ามฝั่งทันที',
    ],
    defenseRetake: [
      'ปา Blindside แฟลชเด้งมุมสูงเปิดทางให้เพื่อนเข้าไซต์ พร้อมส่งวาร์ปไปตัดหลังตัวคุม Spike',
    ],
    utilName: 'Blindside + Gatecrash',
  },
  phoenix: {
    attackExec: [
      'กาง Blaze (กำแพงไฟ) ตัดมุมยิงแล้วปา Curveball แฟลชเลี้ยวโค้งเปิดทางให้เพื่อนตาม',
    ],
    attackSplit: [
      'นำกลุ่มแยกปา Curveball แฟลชเปิดมุมอับและใช้กำแพงไฟปิดทางเสริมของศัตรู',
    ],
    defenseHold: [
      'ปา Hot Hands เผาพื้นหน้าทางเข้าเพื่อชะลอเกมบุกเร็ว และเก็บ Curveball ไว้แฟลชสวน',
    ],
    defenseRetake: [
      'ปา Curveball แฟลชเลี้ยวเข้าไซต์พร้อมเพื่อน และปาไฟไล่ตัวซ้อนหลังกล่อง',
    ],
    utilName: 'Curveball + Blaze',
  },
  omen: {
    attackExec: [
      'ปา Dark Cover ปิดมุมสูงและทางเชื่อม 2 จุดพร้อมกัน แล้วใช้ Paranoia แฟลชทะลุกำแพงเปิดทางให้ Duelist',
      'ปาควันปิดเส้นเล็ง Operator แล้วยืนคุมแนวหลังคอยปาควันลูกที่ 2 เสริมตอนวาง Spike',
    ],
    attackSplit: [
      'ปา Dark Cover ปิดสายตาตัวซ้อนตรงกลาง แล้วใช้ Shrouded Step ย้ายขึ้นมุมสูงดักยิงตัวหมุน',
    ],
    defenseHold: [
      'ปา Dark Cover ปิดปากทางเข้าหลักทันทีที่ได้ยินเสียงวิ่ง พร้อมถือ Paranoia สวนทะลุควัน',
    ],
    defenseRetake: [
      'ปา Dark Cover บังจุดกู้ Spike และยิง Paranoia ทะลุกำแพงใส่จุดที่ศัตรูแอบซ่อนตัว',
    ],
    utilName: 'Dark Cover + Paranoia',
  },
  brimstone: {
    attackExec: [
      'กาง Sky Smoke ปิดมุมสูงและทางเชื่อม 3 จุดพร้อมกัน แล้วยิง Incendiary กันตัวซ้อนหลังไซต์',
      'ปา Stim Beacon เร่งความเร็วให้ทีมวิ่งเข้าไซต์พร้อมกันในจังหวะเดียวหลังควันลงครบ',
    ],
    attackSplit: [
      'ปา Sky Smoke ปิดจุดเชื่อมตรงกลางและมุมสูง แล้วเปิด Stim Beacon นำกลุ่มเจาะเข้าไซต์',
    ],
    defenseHold: [
      'ปา Sky Smoke ตัดหน้าทางเข้าแล้วตามด้วย Incendiary เผาพื้นถ่วงเวลา 7 วินาทีให้เพื่อนหมุนมาช่วย',
    ],
    defenseRetake: [
      'ปา Sky Smoke ปิดทางเสริมของศัตรู แล้วเปิด Stim Beacon นำทีมวิ่งรีเทคพร้อมกัน',
    ],
    utilName: 'Sky Smoke + Incendiary',
  },
  clove: {
    attackExec: [
      'ปา Ruse ปิดมุมอันตราย 2 จุดแล้วโยน Meddle ตัดเลือดศัตรูหลังที่กำบังก่อนทีมพุ่งเข้า',
      'เดินนำหน้ากลุ่มเทรดคิลพร้อม Duelist แม้ล้มลงยังปาควันซัพพอร์ตเพื่อนต่อได้ทันที',
    ],
    attackSplit: [
      'เดินนำกลุ่มแยกเจาะเข้าไซต์ ใช้ Meddle ตัดเลือดตัวซ้อนแล้วเปิด Pick-me-up เร่งสปีดยิงต่อ',
    ],
    defenseHold: [
      'ปา Ruse ปิดปากทางเข้าหลัก แล้วยืนตำแหน่งใกล้จุดปะทะเพื่อปาควันช่วยเพื่อนอีกฝั่งได้',
    ],
    defenseRetake: [
      'โยน Meddle ใส่จุดวาง Spike เพื่อตัดเลือดศัตรูก่อนเพื่อนพุ่งเข้ายิง และปาควันบังจุดกู้',
    ],
    utilName: 'Ruse Smoke + Meddle',
  },
  viper: {
    attackExec: [
      'กาง Toxic Screen ผ่าครึ่งไซต์ตัดเส้นเล็ง Operator แล้วยิง Snake Bite ไล่มุมอับหลังกล่อง',
    ],
    attackSplit: [
      'เปิด Toxic Screen หลอกอีกฝั่ง เพื่อดึงตัวเฝ้าไซต์ให้หมุนหนีออกจากจุดบุกจริงของทีม',
    ],
    defenseHold: [
      'เปิด Toxic Screen + Poison Cloud เผาเกราะศัตรูที่พยายามดันผ่านทางแคบ',
    ],
    defenseRetake: [
      'ยิง Snake Bite ไล่ตัวแคมป์หลังกล่อง แล้วกางม่านพิษตัดเส้นเล็งบังตัวเข้ากู้ Spike',
    ],
    utilName: 'Toxic Screen + Snake Bite',
  },
  astra: {
    attackExec: [
      'วางดาว Nebula ปิดมุมสูง 2 จุด และใช้ Nova Pulse สตันตัวดักยิงในมุมอับจังหวะทีมพุ่งเข้า',
    ],
    attackSplit: [
      'ใช้ Gravity Well ดูดดึงตัวเฝ้าไซต์ออกจากมุมยิงจังหวะทีมประกบเข้า 2 ทิศทางพร้อมกัน',
    ],
    defenseHold: [
      'วางดาวดักหน้าทางเข้า เปิด Gravity Well + Smoke ตัดขบวนบุกเร็วของศัตรูไม่ให้ผ่านเข้ามาได้',
    ],
    defenseRetake: [
      'วางดาวสตันจุดซ่อนตัวหลังไซต์ แล้วดึงควันหลอกบังจุดกู้ Spike ให้เพื่อนเข้ากดกู้',
    ],
    utilName: 'Nebula + Gravity Well',
  },
  harbor: {
    attackExec: [
      'กาง High Tide โค้งปิดมุมยิงรอบไซต์ แล้วโยน Cove (ควันกันกระสุน) ให้เพื่อนวาง Spike ได้ทันที',
    ],
    attackSplit: [
      'กาง High Tide ตัดแบ่งครึ่งไซต์ช่วยให้กลุ่มแยกเข้าประกบข้างได้โดยไม่โดนยิงข้ามฝั่ง',
    ],
    defenseHold: [
      'ปล่อย Cascade สโลว์ศัตรูหน้าทางเข้า แล้วยืนซ้อนหลังคลื่นน้ำสลับมุมยิงถ่วงเวลา',
    ],
    defenseRetake: [
      'โยน Cove คลุมจุดกู้ Spike เพื่อกันกระสุนระหว่างที่เพื่อนคอยยิงคุ้มกันรอบไซต์',
    ],
    utilName: 'High Tide + Cove',
  },
  // ==================== INITIATORS ====================
  sova: {
    attackExec: [
      'ยิง Recon Bolt เปิดตำแหน่งตัวแคมป์หลังไซต์ แล้วใช้ Owl Drone เคลียร์มุมใกล้ก่อนทีมพุ่งเข้า',
      'ยิง Shock Bolt 2 ลูกซ้อนทำลายกับดักหรือไล่ศัตรูออกจากหลังกล่องในไซต์',
    ],
    attackSplit: [
      'ใช้ Owl Drone บินนำหน้ากลุ่มแยกเพื่อสแกนเช็กมุมอับก่อนเข้าประกบไซต์พร้อมกัน',
    ],
    defenseHold: [
      'ยิง Recon Bolt เช็กจำนวนศัตรูต้นรอบ เพื่อสั่งเพื่อนหมุนเกมตั้งรับได้ทันท่วงที',
    ],
    defenseRetake: [
      'ใช้ Owl Drone บินสแกนเคลียร์มุมในไซต์ก่อนให้เพื่อนพุ่งตามเข้าไปยิงเก็บคิล',
    ],
    utilName: 'Recon Bolt + Owl Drone',
  },
  kayo: {
    attackExec: [
      'ปา ZERO/point ใบ้สกิลตัวเฝ้าไซต์ แล้วโยน FLASH/drive สวนให้ Duelist พุ่งเข้าเปิดพื้นที่',
      'ปา FRAG/ment ทำลายกับดัก Cypher/KJ หรือบังคับตัวแคมป์ให้ออกจากมุมแคบ',
    ],
    attackSplit: [
      'โยน FLASH/drive เด้งมุมสูงเปิดทางให้กลุ่มแยกเข้าประกบข้างโดยไม่ทำให้เพื่อนตาบอด',
    ],
    defenseHold: [
      'ปา ZERO/point ต้นรอบเช็กจุดรวมพลศัตรู และเก็บแฟลชไว้ปาสวนทะลุควันจังหวะศัตรูดัน',
    ],
    defenseRetake: [
      'ปา ZERO/point เช็กตัวซ้อนในไซต์ แล้วโยน FLASH/drive เปิดทางให้ทีมเข้าพร้อมกัน',
    ],
    utilName: 'ZERO/point + FLASH/drive',
  },
  skye: {
    attackExec: [
      'ปล่อย Trailblazer (หมา) วิ่งเช็กมุมประชิด ตามด้วย Guiding Light แฟลชเปิดทางให้เพื่อนตาม',
    ],
    attackSplit: [
      'เดินตามกลุ่มเจาะคอยปาแฟลชเช็กมุมและใช้ Regrowth ฮีลเพื่อนหลังปะทะจังหวะแรก',
    ],
    defenseHold: [
      'ปา Guiding Light เช็กข้อมูลต้นรอบ ถ้าไม่เจอใครให้เตรียมหมุนไปซ้อนช่วยเพื่อนอีกฝั่ง',
    ],
    defenseRetake: [
      'ปล่อย Trailblazer ไล่เช็กมุมอับในไซต์ก่อนนำทีมบุกเข้ากู้ Spike พร้อมกัน',
    ],
    utilName: 'Guiding Light + Trailblazer',
  },
  breach: {
    attackExec: [
      'ยิง Fault Line สตันแนวหลังไซต์ แล้วกด Flashpoint ทะลุกำแพงให้เพื่อนพุ่งเข้ายึดพื้นที่',
    ],
    attackSplit: [
      'ยิง Aftershock ทำลายกับดักหรือไล่ตัวแคมป์มุมแคบให้ออกมาโดนยิงระหว่างทีมบีบเข้า 2 ทาง',
    ],
    defenseHold: [
      'ยิง Fault Line สตันหน้าทางเข้าทันทีที่ได้ยินเสียงวิ่งชาร์จ 5 คนเพื่อตัดจังหวะบุก',
    ],
    defenseRetake: [
      'ยิง Fault Line + Flashpoint ทะลุกำแพงเปิดทางให้ทีมวิ่งเข้าไซต์พร้อมกันในจังหวะเดียว',
    ],
    utilName: 'Fault Line + Flashpoint',
  },
  fade: {
    attackExec: [
      'ปา Haunt ขึ้นหลังคาเปิดตำแหน่งศัตรู แล้วปล่อย Prowler ไล่กัดมุมอับในไซต์',
    ],
    attackSplit: [
      'โยน Seize มัดตัวศัตรูในมุมแคบแล้วให้เพื่อนปาระเบิดหรือยิงซ้ำทันที',
    ],
    defenseHold: [
      'ปา Haunt เช็กข้อมูลต้นรอบ แล้วยืนซ้อนหลังที่กำบังพร้อมปล่อย Prowler ชะลอเกมบุก',
    ],
    defenseRetake: [
      'ปา Haunt ขึ้นมุมสูงเปิดตำแหน่งตัวซ้อนในไซต์ก่อนนำทีมพุ่งเข้าเคลียร์',
    ],
    utilName: 'Haunt + Prowler',
  },
  gekko: {
    attackExec: [
      'ปา Dizzy ขึ้นฟ้าเปิดตำแหน่งศัตรู แล้วส่ง Wingman วิ่งไปวาง Spike ให้ทีมถือปืนคุมรอบไซต์',
    ],
    attackSplit: [
      'โยน Mosh Pit ไล่ตัวแคมป์มุมแคบหรือทำลายกับดักหน้าทางเข้าไซต์พร้อมเก็บลูกบอลใช้ซ้ำ',
    ],
    defenseHold: [
      'ปา Dizzy เช็กข้อมูลต้นรอบ เก็บลูกบอลกลับมาใช้ซ้ำได้เรื่อยๆ เพื่อถ่วงเวลารอเพื่อน',
    ],
    defenseRetake: [
      'ส่ง Wingman วิ่งไปกู้ Spike ล่อเป้าศัตรู ระหว่างที่ทีมคอยดักยิงตัวที่โผล่ออกมา',
    ],
    utilName: 'Dizzy + Wingman',
  },
  tejo: {
    attackExec: [
      'ยิง Guided Salvo (มิสไซล์) ถล่มจุดดักยิงยอดฮิตในไซต์ และปล่อย Stealth Drone เคลียร์มุมอับ',
    ],
    attackSplit: [
      'โยน Special Delivery ระเบิดสตันตัดจังหวะตัวซ้อนหลังไซต์ระหว่างทีมเข้าประกบ 2 ทาง',
    ],
    defenseHold: [
      'ยิง Guided Salvo ตัดขบวนหน้าทางเข้าชะลอเกมบุกเร็ว และส่งโดรนเช็กข้อมูลต้นรอบ',
    ],
    defenseRetake: [
      'ยิงมิสไซล์ไล่ตัวแคมป์หลังกล่องในไซต์ แล้วส่งโดรนสแกนเปิดทางให้ทีมเข้ากู้ Spike',
    ],
    utilName: 'Guided Salvo + Stealth Drone',
  },
  // ==================== SENTINELS ====================
  killjoy: {
    attackExec: [
      'วาง Alarmbot + Turret กันตุ๋ยหลังให้สนิท แล้ววาง Nanoswarm 2 ลูกกันตัวรีเทคตรงจุดวาง Spike',
    ],
    attackSplit: [
      'คุมพื้นที่กลางแผนที่ด้วย Turret คอยดักตัดตัวหมุนเกมของศัตรูไม่ให้วิ่งข้ามฝั่งได้',
    ],
    defenseHold: [
      'วาง Turret มุมกว้างแจ้งเตือน และซ่อน Nanoswarm รอเปิดพร้อมกันตอนศัตรูติด Alarmbot',
    ],
    defenseRetake: [
      'วาง Turret คุมหลังทางเข้าและช่วยยิงเบี่ยงเบนความสนใจจังหวะเพื่อนพุ่งเข้าไซต์',
    ],
    utilName: 'Turret + Nanoswarm',
  },
  cypher: {
    attackExec: [
      'วาง Trapwire ปิดทางอ้อมหลังให้ครบ แล้วใช้ Spycam ส่องเช็กมุมอับในไซต์ก่อนวาง Spike',
    ],
    attackSplit: [
      'ปา Cyber Cage บังเส้นเล็งสไนเปอร์ขณะเพื่อนเดินเข้าวาง Spike และคุมข้อมูลหลังทีม',
    ],
    defenseHold: [
      'วาง Trapwire + Cyber Cage ดักทางเข้า รอศัตรูติดเส้นแล้วเปิดควันยิงทะลุแบบไม่เห็นตัว',
    ],
    defenseRetake: [
      'ใช้ Spycam ส่องเช็กมุมอับในไซต์ก่อนนำทีมเดินเข้าเคลียร์ทีละจุดอย่างปลอดภัย',
    ],
    utilName: 'Trapwire + Spycam',
  },
  chamber: {
    attackExec: [
      'วาง Trademark กันหลังให้ทีม แล้วถือ Headhunter คุมมุมยาวกันตัวดันสวนจากอีกฝั่ง',
    ],
    attackSplit: [
      'คุมพื้นที่ Mid คอยดักยิงตัวหมุนเกมที่วิ่งข้ามไปช่วยเพื่อนอีกไซต์จากระยะไกล',
    ],
    defenseHold: [
      'วาง Rendezvous ไว้จุดหนี ถือ Operator/Headhunter ยิงเปิด 1 นัดแล้ววาร์ปหนีทันที ห้ามยืนแช่',
    ],
    defenseRetake: [
      'ถือ Headhunter คุมมุมยาวกันตัวแอบซ่อนนอกไซต์ระหว่างเพื่อนเข้ากู้ Spike',
    ],
    utilName: 'Trademark + Rendezvous',
  },
  sage: {
    attackExec: [
      'กาง Barrier Orb ปิดทางเสริมของศัตรูขณะเพื่อนกำลังวาง Spike เพื่อสร้างพื้นที่ปลอดภัย',
    ],
    attackSplit: [
      'ปา Slow Orb ตัดขากันศัตรูวิ่งสวน และคอยฮีลเพื่อนที่เปิดพื้นที่จังหวะแรก',
    ],
    defenseHold: [
      'ปา Slow Orb ทันทีที่ได้ยินเสียงวิ่ง แล้วกาง Barrier Orb ปิดทางเข้าหลักถ่วงเวลาให้เพื่อนหมุน',
    ],
    defenseRetake: [
      'กางกำแพงบังตัวกู้ Spike หรือชุบชีวิตเพื่อนเพื่อเพิ่มจำนวนคนเข้าเคลียร์ไซต์',
    ],
    utilName: 'Barrier Orb + Slow Orb',
  },
  deadlock: {
    attackExec: [
      'กาง Barrier Mesh ปิดทางเสริมหลังวาง Spike และวาง Sonic Sensor ดักเสียงตัวรีเทค',
    ],
    attackSplit: [
      'โยน GravNet บังคับให้ตัวแคมป์นั่งยองๆ ขยับหนีไม่ได้แล้วให้เพื่อนยิงซ้ำทันที',
    ],
    defenseHold: [
      'วาง Sonic Sensor ดักเสียงวิ่งหน้าทางเข้า แล้วยิง GravNet สวนจังหวะศัตรูบุกชาร์จ',
    ],
    defenseRetake: [
      'โยน GravNet ใส่จุดซ่อนตัวในไซต์เพื่อตรึงศัตรูให้อยู่กับที่ก่อนพุ่งเข้ายิง',
    ],
    utilName: 'GravNet + Barrier Mesh',
  },
  vyse: {
    attackExec: [
      'วาง Arc Rose แฟลชเช็กมุมหลังที่กำบัง และวาง Shear กันตัวอ้อมหลังให้เพื่อนวาง Spike',
    ],
    attackSplit: [
      'โยน Razorvine สโลว์และสร้างความเสียหายตัดทางหนีของศัตรูในไซต์จังหวะทีมเข้าพร้อมกัน',
    ],
    defenseHold: [
      'ซ่อนกำแพง Shear ตัดแยกตัวหน้าออกจากกลุ่มเพื่อน แล้วเปิด Arc Rose แฟลชยิงฟรี',
    ],
    defenseRetake: [
      'แปะ Arc Rose ทะลุกำแพงแล้วกดแฟลชเปิดทางให้เพื่อนพุ่งเข้าไซต์พร้อมกันในจังหวะเดียว',
    ],
    utilName: 'Arc Rose + Shear',
  },
};
type TacticalIntent =
  | 'anti_op'
  | 'split_trade'
  | 'anti_rush'
  | 'mid_control'
  | 'anti_flank'
  | 'break_traps'
  | 'clear_corners'
  | 'retake_sync'
  | 'post_plant_loss'
  | 'anti_fake'
  | 'eco_stack'
  | 'man_down'
  | 'fast_exec';

function analyzeTacticalIntent(
  tags: string[],
  situation: string,
  economy: string,
  isAttack: boolean
): TacticalIntent {
  const q = `${tags.join(' ')} ${situation}`.toLowerCase();
  const ecoLow = economy.toLowerCase().includes('eco') || economy.toLowerCase().includes('pistol');

  if (q.includes('op') || q.includes('สไน') || q.includes('operator')) return 'anti_op';
  if (q.includes('รุม') || q.includes('ซ้อน') || q.includes('ครอส') || q.includes('เทรดไม่ทัน')) return 'split_trade';
  if (q.includes('บุกเร็ว') || q.includes('5 คน') || q.includes('ดันสวน') || q.includes('rush')) return 'anti_rush';
  if (q.includes('mid') || q.includes('กลาง')) return 'mid_control';
  if (q.includes('ตุ๋ย') || q.includes('หลัง') || q.includes('flank')) return 'anti_flank';
  if (q.includes('cypher') || q.includes('kj') || q.includes('กับดัก') || q.includes('ป้อม')) return 'break_traps';
  if (q.includes('มุม') || q.includes('ดักยิง') || q.includes('แคมป์') || q.includes('เข้าไซต์ไม่ได้')) return 'clear_corners';
  if (q.includes('retake') || q.includes('รีเทค') || q.includes('กู้')) return 'retake_sync';
  if (q.includes('post-plant') || q.includes('วางแล้วแพ้') || q.includes('กันสไปค์')) return 'post_plant_loss';
  if (q.includes('fake') || q.includes('หลอก') || q.includes('หมุน')) return 'anti_fake';
  if (q.includes('4v5') || q.includes('เสียคน') || q.includes('น้อยกว่า')) return 'man_down';
  if (ecoLow || q.includes('eco') || q.includes('force') || q.includes('เงินน้อย')) return 'eco_stack';

  return isAttack ? 'fast_exec' : 'anti_rush';
}

function clamp(n: number): number {
  return Math.min(92, Math.max(8, Math.round(n)));
}

function normalizeRole(role: string): 'duelist' | 'controller' | 'initiator' | 'sentinel' {
  const r = role.toLowerCase();
  if (r.includes('duel')) return 'duelist';
  if (r.includes('control') || r.includes('smoke')) return 'controller';
  if (r.includes('init')) return 'initiator';
  return 'sentinel';
}

export async function requestLiveCoachAdvice(
  input: LiveCoachRequest
): Promise<AiCoachResponse> {
  const mapName = input.mapName.trim();
  const situation = input.situation.trim();
  const tags = input.tags.filter((t) => t.trim().length > 0);

  if (!mapName) throw new Error('กรุณาระบุชื่อแผนที่');
  if (!situation && tags.length === 0) {
    throw new Error('กรุณาเลือก Tag ด่วน หรือพิมพ์สถานการณ์สั้นๆ ก่อนขอคำสั่ง');
  }

  await new Promise((r) => setTimeout(r, 180));

  const isAttack = input.side === 'attack';
  const targetSite = input.sites?.at(0) || 'A';
  const altSite = input.sites?.at(1) || 'B';
  const mapKey = mapName.toLowerCase().replace(/[^a-z]/g, '');

  const mapInfo: MapProBlueprint = VCT_MAP_BLUEPRINTS[mapKey] || {
    keyChokes: [`${targetSite} Main`, 'Mid', `${altSite} Main`],
    smokeSpotsA: [`${targetSite} Heaven & CT`],
    smokeSpotsB: [`${altSite} Heaven & CT`],
    opAngles: [`${targetSite} Long`, 'Mid'],
    splitA: `คุมพื้นที่ Mid เพื่อบีบเข้า ${targetSite} พร้อมกัน 2 ทิศทาง`,
    splitB: `คุมพื้นที่ Mid เพื่อบีบเข้า ${altSite} พร้อมกัน 2 ทิศทาง`,
    retakePlan: `รวมพลเข้าพร้อมกันจาก CT และทางเชื่อม ${targetSite}`,
    postPlantSpot: `วาง Spike จุดเปิดที่ยิงคุมจากระยะไกลได้`,
    flankWatch: `วางกับดักคุมทางอ้อมหลังให้ครบก่อนเดินหน้า`,
  };

  const intent = analyzeTacticalIntent(tags, situation, input.economy, isAttack);
  const smokeTarget = targetSite.toUpperCase() === 'B' ? mapInfo.smokeSpotsB.at(0)! : mapInfo.smokeSpotsA.at(0)!;
  const splitTarget = targetSite.toUpperCase() === 'B' ? mapInfo.splitB : mapInfo.splitA;

  const enemyNames = input.enemyTeam.map((e) => e.name.toLowerCase());
  const hasEnemyOp = enemyNames.some((n) => n.includes('jett') || n.includes('chamber'));
  const hasEnemySentinel = enemyNames.some((n) => n.includes('cypher') || n.includes('killjoy') || n.includes('vyse'));

  const planMeta: Record<
    TacticalIntent,
    { name: string; headline: string; mode: keyof Omit<AgentProPlaybook, 'utilName'> }
  > = {
    anti_op: {
      name: `แผนปิดมุม Operator (${mapName} · ${targetSite})`,
      headline: `ห้ามเดินเช็กมุม ${mapInfo.opAngles.at(0)} ตัวเปล่า ให้ปา Smoke ปิด ${smokeTarget} ก่อนเข้ายึดพื้นที่`,
      mode: isAttack ? 'attackExec' : 'defenseHold',
    },
    split_trade: {
      name: `แผนแยกบีบ 2 ทิศทาง (VCT Split Execute)`,
      headline: `แก้ทางศัตรูยืนรุมยิงด้วยการ ${splitTarget} และเดินเกาะคู่ระยะเทรดคิล`,
      mode: isAttack ? 'attackSplit' : 'defenseHold',
    },
    anti_rush: {
      name: `แผนตั้งรับชะลอเกมบุกเร็ว (Anti-Rush ${mapName})`,
      headline: `ถอยตั้งหลักลึกในไซต์ ใช้สกิลตัดขบวนตรงจุด ${mapInfo.keyChokes.at(0)} และ ${mapInfo.keyChokes.at(1)}`,
      mode: 'defenseHold',
    },
    mid_control: {
      name: `แผนชิงพื้นที่กลางแผนที่ (Mid Control Protocol)`,
      headline: `รวม 3 คนใช้แฟลช+สแกนยึดพื้นที่ ${mapInfo.keyChokes.at(0)} คืน เพื่อตัดเส้นทางหมุนเกมของศัตรู`,
      mode: isAttack ? 'attackSplit' : 'defenseHold',
    },
    anti_flank: {
      name: `แผนล็อกหลังและดักตุ๋ย (Anti-Flank Setup)`,
      headline: `${mapInfo.flankWatch} และจัดตัวดักเก็บศัตรูที่แอบตุ๋ยจาก ${mapInfo.keyChokes.at(0)}`,
      mode: isAttack ? 'attackExec' : 'defenseHold',
    },
    break_traps: {
      name: `แผนทำลายกับดักก่อนเจาะไซต์ (Anti-Sentinel Breach)`,
      headline: `ห้ามวิ่งชนกับดักหน้าทางเข้า ${targetSite} ให้ยิงสกิลทำลายกับดักให้หมดก่อนเปิดเกมบุก`,
      mode: 'attackExec',
    },
    clear_corners: {
      name: `แผนเคลียร์มุมอับเป็นระบบ (Systematic Clear · ${targetSite})`,
      headline: `แก้ทางศัตรูดักยิงตามมุมด้วยสกิลสแกน/ระเบิดไล่มุม และปาควันปิดจุดซ้อน ${smokeTarget}`,
      mode: 'attackExec',
    },
    retake_sync: {
      name: `แผนรวมพลรีเทคพร้อมกัน (5-Man VCT Retake)`,
      headline: `ห้ามทยอยเข้าไปตายทีละคน ให้รอรวมตัวแล้ว ${mapInfo.retakePlan}`,
      mode: 'defenseRetake',
    },
    post_plant_loss: {
      name: `แผนคุม Spike หลังวาง (VCT Post-Plant Setup)`,
      headline: `${mapInfo.postPlantSpot} แล้วถอยออกมายืนมุมครอสไฟร์นอกไซต์ ห้ามยืนรวมกันในที่แคบ`,
      mode: 'attackExec',
    },
    anti_fake: {
      name: `แผนจับทางหลอก (Anti-Fake Info Hold)`,
      headline: `ห้ามรีบหมุนหมดทีมจนกว่าจะเห็นตัวถือ Spike ให้ทิ้งตัวเช็กข้อมูลไว้จุด ${mapInfo.keyChokes.at(0)}`,
      mode: 'defenseHold',
    },
    eco_stack: {
      name: `แผนปืนพก/ประหยัดงบ (Close-Range Stack & Trade)`,
      headline: `งบจำกัดห้ามดวลระยะไกล รวมกลุ่ม 3 คนซุ่มมุมแคบตรง ${mapInfo.keyChokes.at(0)} เพื่อรุมยิงชิงปืน`,
      mode: isAttack ? 'attackSplit' : 'defenseHold',
    },
    man_down: {
      name: `แผนแก้เกมเสียเปรียบคน (4v5 Fast Hit · ${targetSite})`,
      headline: `เสียเปรียบจำนวนคนต้องเล่นเร็ว รวมกลุ่ม 3-4 คนทุ่มสกิลทั้งหมดเจาะเข้า ${targetSite} ทันที`,
      mode: isAttack ? 'attackExec' : 'defenseRetake',
    },
    fast_exec: {
      name: `แผนเข้าทำเร็วมาตรฐานโปร (Fast ${targetSite} Execute)`,
      headline: `ปาควันปิด ${smokeTarget} สแกนเช็กมุมอับ แล้วพุ่งเข้ายึดพื้นที่ ${targetSite} พร้อมกันใน 5 วินาที`,
      mode: 'attackExec',
    },
  };
  const selectedPlan = planMeta[intent];

  const siteCallouts = input.callouts.filter((c) => c.group.toUpperCase().includes(targetSite.toUpperCase()));
  const midCallouts = input.callouts.filter((c) => c.group.toLowerCase().includes('mid'));
  const altCallouts = input.callouts.filter((c) => c.group.toUpperCase().includes(altSite.toUpperCase()));
  const basePool = siteCallouts.length >= 3 ? siteCallouts : input.callouts;

  const activeTeam = input.ourTeam.slice(0, 5);

  const agentOrders: AiAgentOrder[] = activeTeam.map((agent, idx) => {
    const agentKey = agent.name.toLowerCase().replace(/[^a-z]/g, '');
    const roleKey = normalizeRole(agent.role);
    const playbook = PRO_AGENT_PLAYBOOK[agentKey];

    const pool =
      roleKey === 'sentinel' && !isAttack && altCallouts.length > 0
        ? altCallouts
        : roleKey === 'controller' && midCallouts.length > 0
        ? midCallouts
        : basePool;

    const spot =
      pool.length > 0
        ? pool.at((idx * 2) % pool.length)!
        : {
            key: mapInfo.keyChokes.at(idx % mapInfo.keyChokes.length) || 'แนวหน้า',
            x: 30 + idx * 10,
            y: 40 + (idx % 2) * 15,
          };

    const nextSpot =
      basePool.length > 0
        ? basePool.at((idx * 2 + 1) % basePool.length)!
        : { key: targetSite, x: clamp(spot.x + 8), y: clamp(spot.y - 8) };

    let commandText = '';
    if (playbook) {
      const list = playbook[selectedPlan.mode];
      commandText = list.at((idx + situation.length) % list.length) || list.at(0)!;
    } else {
      const roleDefault: Record<typeof roleKey, string> = {
        duelist: 'ใช้สกิลเคลื่อนที่เปิดพื้นที่เข้าปะทะพร้อมเพื่อนตามเทรดคิล',
        controller: `ปาควันปิดจุด ${smokeTarget} แล้วคุมพื้นที่ตรงกลาง`,
        initiator: 'ใช้สกิลสแกนหรือแฟลชเช็กมุมอับก่อนเพื่อนเดินเข้า',
        sentinel: 'วางกับดักคุมพื้นที่และยืนมุมครอสไฟร์คอยช่วยเพื่อน',
      };
      commandText = roleDefault[roleKey];
    }

    if (roleKey === 'controller' && isAttack) {
      commandText = `${commandText} (เน้นปิด ${smokeTarget})`;
    } else if (roleKey === 'initiator' && hasEnemySentinel && isAttack) {
      commandText = `${commandText} + เช็ก/ทำลายกับดักก่อนเข้า`;
    } else if (idx === 0 && hasEnemyOp) {
      commandText = `${commandText} (ระวังมุม Op ตรง ${mapInfo.opAngles.at(0)})`;
    } else if (idx === 1 && situation) {
      commandText = `${commandText} — ปรับตามจุด ${spot.key}`;
    }

    const tone: AiAgentOrder['roleTone'] =
      roleKey === 'duelist'
        ? 'attack'
        : roleKey === 'sentinel'
        ? 'lurk'
        : isAttack
        ? 'attack'
        : 'defense';

    return {
      slot: agent.slot,
      agentId: agent.id,
      agentName: agent.name,
      callout: spot.key,
      command: commandText,
      x: clamp(spot.x),
      y: clamp(spot.y),
      roleTone: tone,
      moveToX: clamp(nextSpot.x),
      moveToY: clamp(nextSpot.y),
    };
  });

  const utilityPlacements: AiUtilityPlacement[] = activeTeam.slice(0, 3).map((agent, idx) => {
    const agentKey = agent.name.toLowerCase().replace(/[^a-z]/g, '');
    const roleKey = normalizeRole(agent.role);
    const skillLabel = PRO_AGENT_PLAYBOOK[agentKey]?.utilName || `${agent.name} สกิลหลัก`;
    const spot =
      basePool.length > 0
        ? basePool.at((idx + 1) % basePool.length)!
        : { key: 'จุดวางสกิล', x: 45 + idx * 8, y: 38 + idx * 8 };

    const kind: AiUtilityPlacement['kind'] =
      roleKey === 'controller'
        ? 'smoke'
        : roleKey === 'initiator'
        ? 'recon'
        : roleKey === 'sentinel'
        ? 'pin'
        : 'flash';

    return {
      kind,
      label: `${skillLabel} (${spot.key})`,
      x: clamp(spot.x + 3),
      y: clamp(spot.y - 3),
    };
  });

  if (isAttack && intent !== 'anti_rush' && intent !== 'retake_sync') {
    const plantSpot = basePool.at(0) || { key: targetSite, x: 50, y: 45 };
    utilityPlacements.push({
      kind: 'spike',
      label: `จุดวาง Spike (${plantSpot.key})`,
      x: clamp(plantSpot.x),
      y: clamp(plantSpot.y),
    });
  }

  return {
    strategyName: selectedPlan.name,
    headline: selectedPlan.headline,
    agentOrders,
    utilityPlacements,
  };
}
