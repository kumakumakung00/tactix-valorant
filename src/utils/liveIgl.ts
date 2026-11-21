import { RoundType, Side } from '../types/tactix';

export interface EconomyIglGuide {
  roundType: RoundType;
  title: string;
  warning: string;
  tactic: string;
  accentTone: 'emerald' | 'amber' | 'rose' | 'cyan';
}

export function getEconomyIglGuide(roundType: RoundType, side: Side): EconomyIglGuide {
  switch (roundType) {
    case 'pistol':
      return {
        roundType,
        title: 'รอบปืนพก (Pistol Round)',
        warning: 'ห้ามกระจายตัวแยกเดี่ยว — รอบแรกยิงแลกกันไวด้วยปืนพก',
        tactic:
          side === 'attack'
            ? 'รวมกลุ่ม 5 คนบุกไซท์เดียวด้วย Ghost/Frenzy + เกราะเล็ก เพื่อเทรดคิลไวและวาง Spike'
            : 'จับคู่ตั้งรับ 2 คนต่อจุดในระยะกลาง-ใกล้ เลี่ยงดวลไกลกับปืน Sheriff/Ghost ของอีกฝั่ง',
        accentTone: 'cyan',
      };
    case 'eco':
      return {
        roundType,
        title: 'รอบประหยัด (Eco / Save)',
        warning: 'แนะนำเล่นรวมกลุ่มซ้อนกัน 2-3 คนเพื่อรุมยิงชิงปืน (ห้ามแจกคิลเดี่ยว)',
        tactic:
          side === 'attack'
            ? 'นัด Stack เจาะมุมแคบ 4-5 คนด้วยปืนสั้น/ลูกซอง รุมเก็บปืน Rifle ศัตรูแล้วค่อยคุมเกม'
            : 'Stack ซ้อน 2-3 คนในจุดอับไซท์เดียว ยิงพร้อมกันเพื่อรุมชิงปืนและทำลายเศรษฐกิจอีกฝั่ง',
        accentTone: 'amber',
      };
    case 'bonus':
      return {
        roundType,
        title: 'รอบโบนัส (Bonus Round)',
        warning: 'อย่าดวลมุมโล่งระยะไกลกับปืน Vandal/Phantom — เน้นตัดเงินศัตรูให้มากที่สุด',
        tactic:
          side === 'attack'
            ? 'ใช้สกิลย่นระยะเข้าประชิดด้วย Spectre/Stinger เพื่อชิงปืนยาวอัปเกรดเข้าทีม'
            : 'ดักมุมประชิด (Close Angle / Off-angle) เก็บ 1-2 คิลแล้วถอยเซฟปืนหรือยื้อเวลา',
        accentTone: 'amber',
      };
    case 'retake':
      return {
        roundType,
        title: 'แผนรีเทคไซท์ (Retake Plan)',
        warning: 'ห้ามโผล่เข้าไปทีละคนเด็ดขาด — รอสกิลและเพื่อนครบก่อนเปิดเข้า',
        tactic:
          side === 'attack'
            ? 'ถ้าเจอดักหนักให้ถอยรวมทีมใหม่ 4-5 คน แล้วย้ายเข้าอีกไซท์พร้อม Smoke/Flash'
            : 'คุมทางออกแล้วนัดเข้าพร้อมกัน 2 ทิศทาง ปา Smoke คลุม Spike ก่อนแตะหลอก',
        accentTone: 'rose',
      };
    case 'full':
    default:
      return {
        roundType: 'full',
        title: 'รอบซื้อเต็ม (Full Buy)',
        warning: 'ใช้สกิลเช็คข้อมูลก่อนแลกปืน — ห้ามเสียปืนยาวฟรีโดยไม่มีคนเทรด',
        tactic:
          side === 'attack'
            ? 'เคลียร์จุดซ่อนด้วย Recon/Drone + ปา Smoke ปิดมุมสูง แล้ว Execute เข้าพร้อมกัน'
            : 'เล่นตามตำแหน่งตัวละคร (Controller คุมควัน / Sentinel ปิดทาง) ยิงแล้วสลับมุมรอซ้อน',
        accentTone: 'emerald',
      };
  }
}
