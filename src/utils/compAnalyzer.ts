import { Agent, AgentRole } from '../types/tactix';

export interface CompComboSuggestion {
  agents: [Agent, Agent];
  title: string;
  detail: string;
}

export interface CompAnalysis {
  pickedCount: number;
  roleCounts: Record<AgentRole, number>;
  archetype: string;
  playStyle: string;
  attackTip: string;
  defenseTip: string;
  recommendedCombo: CompComboSuggestion | null;
  warnings: string[];
  strengths: string[];
  enemyCounters: string[];
}

const FLASH_AGENTS = new Set([
  'phoenix',
  'reyna',
  'yoru',
  'breach',
  'skye',
  'kayo',
  'omen',
  'gekko',
  'vyse',
]);

interface SpecificComboRule {
  pair: [string, string];
  title: string;
  detail: string;
}

const SPECIFIC_COMBO_RULES: SpecificComboRule[] = [
  {
    pair: ['sova', 'jett'],
    title: 'สแกนทะลุควัน + Dash เข้าปิดคิล',
    detail: 'ให้ Sova ยิง Recon Bolt หรือ Owl Drone เปิดตำแหน่งหลังไซท์ ก่อน Jett โยน Cloudburst แล้ว Dash เข้าเก็บเป้าหมายทันที',
  },
  {
    pair: ['breach', 'jett'],
    title: 'สตั๊นเปิดพื้นที่ + พุ่งปิดมุม',
    detail: 'ให้ Breach กด Fault Line และ Flashpoint ทะลุกำแพงบีบคนหลังกล่อง แล้วให้ Jett Dash เข้าไปเทรดคิลขณะที่ศัตรูติดสตั๊น',
  },
  {
    pair: ['breach', 'raze'],
    title: 'Fault Line + Paint Shells / Satchel',
    detail: 'คอมโบทำดาเมจหนัก: Breach สตั๊นศัตรูในมุมแคบให้ขยับหนีไม่ได้ แล้ว Raze โยนระเบิด Paint Shells หรือพุ่ง Satchel ซ้ำทันที',
  },
  {
    pair: ['breach', 'neon'],
    title: 'Stun + High Gear Slide',
    detail: 'Breach สตั๊นหรือแฟลชเคลียร์แนวรับไซท์ให้โล่ง แล้ว Neon วิ่ง Slide เข้าไปแยกไฟต์หลังไซท์ก่อนควันจะหมด',
  },
  {
    pair: ['fade', 'raze'],
    title: 'Seize ดึงรวบ + ระเบิด Paint Shells',
    detail: 'Fade โยน Seize ล่ามศัตรูให้อยู่ในวงเดียวกับ Paint Shells ของ Raze เพื่อการันตีคิลหรือบังคับเสียพื้นที่ทันที',
  },
  {
    pair: ['fade', 'jett'],
    title: 'Haunt เปิดข้อมูล + Prowler ไล่มุม',
    detail: 'ให้ Fade ส่ง Haunt ขึ้นหลังคาแล้วปล่อย Prowler ไล่มุมอับ เพื่อให้ Jett เลือกมุม Dash เข้าปะทะได้อย่างแม่นยำ',
  },
  {
    pair: ['omen', 'jett'],
    title: 'Paranoia บังตา + Dash ทะลุควัน',
    detail: 'Omen ลง Smoke ปิดมุมหมุนแล้วกด Paranoia ทะลุแนวหน้า ก่อน Jett พุ่งเข้าไปตัดหลังศัตรูที่หูดับและตาบอด',
  },
  {
    pair: ['kayo', 'jett'],
    title: 'ZERO/point ปิดสกิล + Pop Flash Entry',
    detail: 'KAY/O ปามีด Suppress ปิดกับดักและสกิลหนีของ Sentinel จากนั้นปา FLASH/drive ข้ามหัวให้ Jett พุ่งเข้าไซท์',
  },
  {
    pair: ['skye', 'jett'],
    title: 'นกแฟลชเช็กข้อมูล + Entry ทันควัน',
    detail: 'Skye ปล่อยนก Guiding Light ระเบิดมุมเปิดพร้อมบอกจำนวนศัตรู แล้วให้ Jett เข้าเก็บจังหวะแฟลชแตกทันที',
  },
  {
    pair: ['astra', 'raze'],
    title: 'Gravity Well ดูดรวบ + ระเบิดซ้ำ',
    detail: 'Astra กดดูดศัตรูตรงมุมฮิตด้วย Gravity Well เพื่อรวบเป้าหมายให้โดน Paint Shells ของ Raze เต็มๆ',
  },
  {
    pair: ['astra', 'sova'],
    title: 'Gravity Well + Shock Bolt',
    detail: 'คอมโบหยุดกู้/ปิดมุม: Astra ดูดรวบตำแหน่ง Spike หรือมุมแคบ แล้ว Sova ยิง Shock Bolt สองนัดซ้อนใส่จุดเดียวกัน',
  },
  {
    pair: ['viper', 'killjoy'],
    title: 'กัดกร่อน + Nanoswarm Post-Plant',
    detail: 'ให้ Viper โยน Snake Bite ลดเลือดศัตรูพร้อม Vulnerability แล้วเปิด Nanoswarm ของ Killjoy เผาจุดกู้ Spike ต่อเนื่อง',
  },
  {
    pair: ['harbor', 'viper'],
    title: 'Double Wall ตัดขาดทั้งไซท์',
    detail: 'กางกำแพง High Tide และ Toxic Screen สลับเวลาเพื่อคุมพื้นที่ยาวทั้งเกมบุกและเกมรับโดยไม่ให้ศัตรูเห็นข้อมูล',
  },
  {
    pair: ['gekko', 'neon'],
    title: 'Dizzy แฟลชฟ้า + สไลด์เก็บคิล',
    detail: 'Gekko โยน Dizzy ขึ้นสูงให้ศัตรูต้องเงยหน้ายิงหรือติดบอด แล้ว Neon สไลด์เข้ายิงสวนจังหวะที่เป้าศัตรูหลุดระดับหัว',
  },
  {
    pair: ['cypher', 'omen'],
    title: 'One-way Cage + Paranoia สวน',
    detail: 'Cypher เปิด Cyber Cage ดักยิงขาคนบุก หากศัตรูฝืนดันเข้ามาให้ Omen สวน Paranoia ตัดจังหวะทั้งทีม',
  },
  {
    pair: ['deadlock', 'brimstone'],
    title: 'GravNet ตะครุบ + Incendiary / Orbital',
    detail: 'Deadlock โยน GravNet บังคับศัตรูให้นั่งเดินช้า แล้ว Brimstone ลงไฟ Molotov หรือ Orbital Strike ปิดพื้นที่ทันที',
  },
];

function buildComboSuggestion(ourAgents: Agent[]): CompComboSuggestion | null {
  if (ourAgents.length < 2) return null;

  const byId = new Map(ourAgents.map((a) => [a.id, a]));
  for (const rule of SPECIFIC_COMBO_RULES) {
    const a1 = byId.get(rule.pair[0]);
    const a2 = byId.get(rule.pair[1]);
    if (a1 && a2) {
      return {
        agents: [a1, a2],
        title: rule.title,
        detail: rule.detail,
      };
    }
  }

  // Smart role-based pairing fallback using actual picked agents
  const initiator = ourAgents.find((a) => a.role === 'initiator');
  const duelist = ourAgents.find((a) => a.role === 'duelist');
  const controller = ourAgents.find((a) => a.role === 'controller');
  const sentinel = ourAgents.find((a) => a.role === 'sentinel');

  if (initiator && duelist) {
    const initSkill = initiator.abilities[1]?.name ?? initiator.abilities[0]?.name ?? 'สกิลหาข้อมูล';
    const duelSkill = duelist.abilities[1]?.name ?? duelist.abilities[0]?.name ?? 'สกิลเข้าทำ';
    return {
      agents: [initiator, duelist],
      title: `เปิดข้อมูลด้วย ${initiator.name} + พุ่งเข้าทำ`,
      detail: `ให้ ${initiator.name} ใช้ ${initSkill} เช็ก/แฟลชมุมสำคัญก่อน เพื่อเปิดทางให้ ${duelist.name} ใช้ ${duelSkill} พุ่งเข้าเก็บพื้นที่`,
    };
  }

  if (controller && duelist) {
    const ctrlSkill = controller.abilities[1]?.name ?? controller.abilities[0]?.name ?? 'Smoke';
    return {
      agents: [controller, duelist],
      title: `ตัดสายตาด้วยควัน + แยกไฟต์ 1v1`,
      detail: `ให้ ${controller.name} วาง ${ctrlSkill} ปิดมุมสไนเปอร์และจุดซ้อน จากนั้น ${duelist.name} เปิดมุมปะทะทีละฝั่ง`,
    };
  }

  if (initiator && controller) {
    return {
      agents: [initiator, controller],
      title: `สแกน/แฟลชทะลุควันคุมพื้นที่`,
      detail: `${controller.name} ลงควันปิดทางหมุน แล้ว ${initiator.name} จ่ายสกิลเปิดข้อมูลทะลุควันเพื่อหาจังหวะยิงฟรีหรือรีเทค`,
    };
  }

  if (sentinel && controller) {
    return {
      agents: [sentinel, controller],
      title: `ล็อกไซท์ด้วยกับดัก + ควันถ่วงเวลา`,
      detail: `${sentinel.name} ตั้งกับดักจับคนเข้า ส่วน ${controller.name} ลงควันชะลอตัวบุกให้ทีมซ้อนช่วยทันเวลา`,
    };
  }

  const first = ourAgents[0];
  const second = ourAgents[1];
  const s1 = first.abilities[0]?.name ?? 'สกิลหลัก';
  const s2 = second.abilities[0]?.name ?? 'สกิลซัพพอร์ต';
  return {
    agents: [first, second],
    title: `ประสานสกิลเทรดคู่ ${first.name} + ${second.name}`,
    detail: `สลับกันใช้ ${s1} ของ ${first.name} คู่กับ ${s2} ของ ${second.name} เพื่อเปิดมุมปะทะและยืนเทรดคิลให้กันตลอดรอบ`,
  };
}

export function analyzeComposition(
  ourTeam: (string | null)[],
  enemyTeam: (string | null)[],
  agents: Agent[]
): CompAnalysis {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const ourAgents = ourTeam
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((a): a is Agent => !!a);
  const enemyAgents = enemyTeam
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((a): a is Agent => !!a);

  const roleCounts: Record<AgentRole, number> = {
    duelist: 0,
    initiator: 0,
    controller: 0,
    sentinel: 0,
  };

  for (const a of ourAgents) {
    roleCounts[a.role] += 1;
  }

  const pickedCount = ourAgents.length;
  const warnings: string[] = [];
  const strengths: string[] = [];
  const hasFlash = ourAgents.some((a) => FLASH_AGENTS.has(a.id));

  if (pickedCount > 0) {
    if (roleCounts.controller === 0) {
      warnings.push('ขาด Controller (ไม่มีควัน) — เสี่ยงโดนสไนเปอร์และมุมไกลยิงตัดก่อนเข้าไซท์');
    }
    if (!hasFlash) {
      warnings.push('ขาดตัวมีสกิล Flash / Blind — เปิดมุมแคบและผลักศัตรูออกจากมุมซ่อนได้ยาก');
    }
    if (roleCounts.sentinel === 0) {
      warnings.push('ขาด Sentinel เฝ้าหลัง — ต้องระวังโดนล้วง/ตุ๋ยหลัง (Flank) และกันไซท์คนเดียวยาก');
    }
    if (roleCounts.initiator === 0) {
      warnings.push('ขาด Initiator หาข้อมูล — ต้องเดินเช็กมุมเองและเคลียร์กับดักก่อนเข้าไซท์ลำบาก');
    }
    if (roleCounts.duelist === 0 && pickedCount >= 3) {
      warnings.push('ขาด Duelist เปิดพื้นที่ — จังหวะพุ่งเข้าไซท์ต้องให้ Controller/Initiator ช่วยเปิดทาง');
    }
    if (roleCounts.duelist >= 3) {
      warnings.push('Duelist 3+ ตัว — ยูทิลิตี้คุมพื้นที่และสกิลช่วยรีเทคท้ายรอบอาจไม่พอ');
    }
  }

  // 1. Playstyle classification
  let playStyle = 'สมดุลมาตรฐาน';
  let archetype = 'Standard Balanced';

  if (pickedCount === 0) {
    playStyle = 'ยังไม่ได้เลือกตัวละครในทีม';
    archetype = 'ยังไม่ได้จัดทีม';
  } else if (roleCounts.sentinel >= 2) {
    playStyle = 'สายตั้งรับเหนียวแน่น / คุมพื้นที่ชัวร์';
    archetype = 'Double Sentinel Anchor';
  } else if (roleCounts.duelist >= 3) {
    playStyle = 'สายบุกเดือด / เน้นสกอร์และปะทะเร็ว';
    archetype = 'Triple Duelist Aggro';
  } else if (roleCounts.duelist === 2) {
    playStyle = 'สายบุกเร็ว / เน้นปะทะเปิดพื้นที่';
    archetype = 'Double Duelist Dive';
  } else if (roleCounts.controller >= 2) {
    playStyle = 'สายคุมจังหวะ / ปิดวิสัยทัศน์ (Double Smoke)';
    archetype = 'Double Controller Control';
  } else if (roleCounts.initiator >= 2) {
    playStyle = 'สายเปิดข้อมูล / รีเทคประสานสกิล';
    archetype = 'Double Initiator Info';
  } else {
    playStyle = 'สมดุลมาตรฐาน (ยืดหยุ่นทั้งบุกและรับ)';
    archetype = 'Balanced 4-Role';
  }

  // 2. Attack & Defense 2-bullet summary
  let attackTip = 'เลือกตัวละครเพื่อดูแนวทางการเล่นฝั่งบุกและฝั่งรับอัตโนมัติ';
  let defenseTip = 'รองรับการวิเคราะห์ครบทั้งคอมโบ 2 ตัว และจุดอ่อนที่ต้องระวัง';

  if (pickedCount > 0) {
    if (roleCounts.sentinel >= 2) {
      attackTip =
        'ฝั่งบุก: เล่น Default กระจายคุมเลนและล็อกทางล้วงหลัง แล้วค่อยรวมตัวเจาะไซท์ที่ศัตรูซ้อนบาง';
      defenseTip =
        'ฝั่งรับ: วางกับดักล็อกไซท์คนเดียวได้หลายจุด เพื่อดึงเพื่อนไปซ้อน Mid หรือรอเล่น Retake เต็มทีม';
      strengths.push('Double Sentinel — กันไซท์แน่นหนาและตัดการ Flank ได้ดีมาก');
    } else if (roleCounts.duelist >= 2) {
      attackTip =
        'ฝั่งบุก: ใช้ Duelist 2 ตัวพุ่ง Dive หรือ Split เข้าไซท์พร้อมกันทันทีหลังลงควันและแฟลช';
      defenseTip =
        'ฝั่งรับ: ดันชิงพื้นที่หน้าด่าน (Aggro Peek) เพื่อเอาคิลแรกแล้วถอยมาตั้งรับแบบได้เปรียบคน';
      strengths.push('Double Duelist — กดดันแนวรับและเปิดพื้นที่เข้าไซท์ได้เร็ว');
    } else if (roleCounts.controller >= 2) {
      attackTip =
        'ฝั่งบุก: ลงควัน 2 ชั้นตัดการหมุนและเล่นแผนหลอก (Fake) เพื่อดึงศัตรูออกจากไซท์หลัก';
      defenseTip =
        'ฝั่งรับ: สลับวาง Smoke ถ่วงเวลาหน้าทางเข้าต่อเนื่องจนศัตรูเสียจังหวะเข้าทำ';
      strengths.push('Double Controller — คุมวิสัยทัศน์และตัดสายตาศัตรูได้ตลอดรอบ');
    } else if (roleCounts.initiator >= 2) {
      attackTip =
        'ฝั่งบุก: จ่ายสแกน+แฟลชสลับกัน 2 จังหวะ เพื่อเคลียร์มุมอับให้สะอาดก่อนเข้าวาง Spike';
      defenseTip =
        'ฝั่งรับ: ถอยยืนมุมปลอดภัยรอรีเทคด้วยคอมโบสแกน-สตั๊น-แฟลชพร้อมกันทั้ง 5 คน';
      strengths.push('Double Initiator — ข้อมูลแน่นและคอมโบเปิดมุมปะทะได้ต่อเนื่อง');
    } else {
      attackTip =
        'ฝั่งบุก: วาง Smoke ปิดมุมลึก + เช็กข้อมูลด้วย Initiator ก่อนส่ง Duelist เปิดไซท์ โดยมี Sentinel กันหลัง';
      defenseTip =
        'ฝั่งรับ: แบ่งคุมโซนตามบทบาทให้ Sentinel เฝ้าไซท์เดี่ยว แล้วใช้เพื่อนที่เหลือคอยซ้อน Mid และ Retake';
      if (pickedCount >= 4) {
        strengths.push('สมดุลครบเครื่อง — ปรับแผนได้ทั้งบุกเร็วและเล่นช้า');
      }
    }
  }

  // 3. Recommended 2-Agent Skill Combo
  const recommendedCombo = buildComboSuggestion(ourAgents);

  const enemyCounters: string[] = [];
  const enemyIds = new Set(enemyAgents.map((a) => a.id));

  if (enemyIds.has('cypher') || enemyIds.has('killjoy') || enemyIds.has('vyse')) {
    enemyCounters.push(
      'ศัตรูมี Sentinel วางกับดัก (Cypher/Killjoy/Vyse) — ใช้ Sova/Raze/KAY/O ทำลายสายก่อนเข้า'
    );
  }
  if (enemyIds.has('jett') || enemyIds.has('chamber')) {
    enemyCounters.push(
      'ศัตรูมี Operator Threat (Jett/Chamber) — ต้องใช้ Smoke หรือแฟลชไล่มุมเปิดก่อนเสมอ'
    );
  }
  if (enemyIds.has('omen') || enemyIds.has('clove') || enemyIds.has('yoru')) {
    enemyCounters.push(
      'ศัตรูเล่นหลอก/วาร์ปไว — ระวังการเล่น One-way Smoke หรือแอบซ้อนมุมแคบ'
    );
  }
  if (enemyIds.has('viper') || enemyIds.has('brimstone') || enemyIds.has('gekko')) {
    enemyCounters.push(
      'ศัตรูมีสกิลถ่วงเวลา/Lineup — รีบเคลียร์พื้นที่หลังไซท์และกดดันก่อน Spike จะหมดเวลา'
    );
  }
  if (enemyIds.has('breach') || enemyIds.has('tejo') || enemyIds.has('fade')) {
    enemyCounters.push(
      'ศัตรูมีสกิลสตั๊น/เปิดพื้นที่หนัก — อย่ายืนรวมกลุ่มในมุมอับจุดเดียวกัน'
    );
  }

  return {
    pickedCount,
    roleCounts,
    archetype,
    playStyle,
    attackTip,
    defenseTip,
    recommendedCombo,
    warnings,
    strengths,
    enemyCounters,
  };
}
