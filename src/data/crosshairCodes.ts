export type CrosshairCategory = 'pro' | 'colorful' | 'fun';

export interface CrosshairPreset {
  id: string;
  name: string;
  subtitle: string;
  category: CrosshairCategory;
  code: string;
  description: string;
  source: string;
}

export const CROSSHAIR_CATEGORIES: { id: 'all' | CrosshairCategory; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'pro', label: 'โปรเพลเยอร์ (Pro)' },
  { id: 'colorful', label: 'สีสันสวยงาม (Colorful)' },
  { id: 'fun', label: 'เป้าตลก / ปั่นเพื่อน (Fun)' },
];

export const CROSSHAIR_PRESETS: CrosshairPreset[] = [
  {
    id: 'tenz',
    name: 'TenZ',
    subtitle: 'Sentinels',
    category: 'pro',
    code: '0;s;1;P;c;5;h;0;m;1;0l;4;0o;2;0a;1;0f;0;1b;0;S;c;5;o;1',
    description: 'เป้าบวกสีฟ้า Cyan เล็กกระชับ ไม่มีขอบ เห็นชัดบนเกือบทุกฉาก',
    source: 'prosettings.net',
  },
  {
    id: 'aspas',
    name: 'Aspas',
    subtitle: 'MIBR',
    category: 'pro',
    code: '0;P;c;5;o;1;f;0;0t;1;0l;2;0o;2;0a;1;0f;0;1b;0',
    description: 'เป้าเล็กบางพิเศษพร้อมขอบดำ เหมาะกับสาย Duelist ที่ต้องการความแม่นยำสูง',
    source: 'prosettings.net',
  },
  {
    id: 'demon1',
    name: 'Demon1',
    subtitle: 'Evil Geniuses',
    category: 'pro',
    code: '0;P;c;1;h;0;0l;3;0o;2;0a;1;0f;0;1b;0',
    description: 'เป้าบวกสีเขียวสั้น ระยะห่างกลางพอดี มองเห็นหัวศัตรูได้ไม่ถูกบัง',
    source: 'vcrdb.net',
  },
  {
    id: 'yay',
    name: 'yay',
    subtitle: 'Cloud9',
    category: 'pro',
    code: '0;P;c;5;h;0;f;0;0l;4;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้าบวกชิดติดกันไม่มีช่องว่างตรงกลาง ช่วยโฟกัสจุดเดียวแบบ Operator main',
    source: 'vcrdb.net',
  },
  {
    id: 'derke',
    name: 'Derke',
    subtitle: 'Fnatic',
    category: 'pro',
    code: '0;P;c;5;h;0;0l;3;0o;2;0a;1;0f;0;1b;0',
    description: 'เป้ามาตรฐานยอดนิยมของสาย Entry เส้นสั้น สีฟ้า ไม่มีขอบ',
    source: 'prosettings.net',
  },
  {
    id: 'something',
    name: 'Something',
    subtitle: 'Paper Rex',
    category: 'pro',
    code: '0;P;h;0;0l;4;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้าบวกสีขาวติดกัน ใช้ง่าย เข้ากับทุกพื้นหลังที่ไม่สว่างจัด',
    source: 'vcrdb.net',
  },
  {
    id: 'dot-pro',
    name: 'Classic Dot',
    subtitle: 'สไตล์ CS / Tarik',
    category: 'pro',
    code: '0;P;c;5;h;1;o;1;d;1;z;3;0b;0;1b;0',
    description: 'เป้าจุดอย่างเดียวพร้อมขอบดำ เคลียร์หน้าจอสุด เหมาะกับคนที่คุมรีคอยล์ดีแล้ว',
    source: 'Valorant Crosshair Database',
  },
  {
    id: 'tactix-red',
    name: 'TACTIX Red',
    subtitle: 'สีแดงเอกลักษณ์ Valorant',
    category: 'colorful',
    code: '0;P;c;8;u;FF4655FF;h;1;t;1;o;1;0t;2;0l;4;0o;2;0a;1;0f;0;1b;0',
    description: 'สีแดงประจำแบรนด์ Valorant พร้อมขอบดำ มองชัดบนฉากสว่าง',
    source: 'TACTIX',
  },
  {
    id: 'sakura-pink',
    name: 'Sakura Pink',
    subtitle: 'ชมพูซากุระ',
    category: 'colorful',
    code: '0;P;c;8;u;FF8AD8FF;h;0;d;1;z;2;0t;1;0l;3;0o;3;0a;1;0f;0;1b;0',
    description: 'เป้าบางพร้อมจุดกลางสีชมพูพาสเทล น่ารักแต่ยังใช้งานได้จริง',
    source: 'vcrdb.net',
  },
  {
    id: 'purple-galaxy',
    name: 'Purple Galaxy',
    subtitle: 'ม่วงกาแล็กซี',
    category: 'colorful',
    code: '0;P;c;8;u;A855F7FF;h;1;t;1;o;0.8;0l;5;0o;2;0a;1;0f;0;1t;1;1l;2;1o;8;1a;0.6;1m;0;1f;0',
    description: 'เป้าสีม่วงสองชั้น เส้นด้านนอกโปร่งแสง ดูหรูและแยกชั้นชัดเจน',
    source: 'reddit.com/r/VALORANT',
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    subtitle: 'ทองคำ',
    category: 'colorful',
    code: '0;P;c;8;u;FBBF24FF;h;1;t;1;o;1;0t;2;0l;3;0o;3;0a;1;0f;0;1b;0',
    description: 'สีทองอำพันพร้อมขอบดำ ตัดกับฉากเขียวและฟ้าได้ดี',
    source: 'vcrdb.net',
  },
  {
    id: 'mint-ice',
    name: 'Mint Ice',
    subtitle: 'มิ้นต์เย็นสดชื่น',
    category: 'colorful',
    code: '0;P;c;8;u;5EEAD4FF;h;0;d;1;z;2;0t;2;0l;2;0o;4;0a;1;0f;0;1b;0',
    description: 'สีมิ้นต์อ่อน เส้นสั้นมีจุดกลาง สบายตาเวลาเล่นนาน',
    source: 'reddit.com/r/VALORANT',
  },
  {
    id: 'tiny-box',
    name: 'กล่องสี่เหลี่ยม',
    subtitle: 'เป้ากรอบกล่อง',
    category: 'fun',
    code: '0;P;c;1;h;0;0t;10;0l;1;0o;5;0a;1;0f;0;1b;0',
    description: 'เส้นหนาสั้นจนกลายเป็นกรอบสี่เหลี่ยม ยิงโดนจริงไหมขึ้นอยู่กับดวง',
    source: 'reddit.com/r/VALORANT',
  },
  {
    id: 'giant-cross',
    name: 'กากบาทยักษ์',
    subtitle: 'บังจอเต็มตา',
    category: 'fun',
    code: '0;P;c;7;h;0;0t;6;0l;20;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้าบวกสีแดงยักษ์ ใส่ให้เพื่อนตอนลุกไปเข้าห้องน้ำ',
    source: 'vcrdb.net',
  },
  {
    id: 'invisible',
    name: 'เป้าล่องหน',
    subtitle: 'สำหรับเทพที่ไม่ต้องเล็ง',
    category: 'fun',
    code: '0;P;h;0;f;0;0b;0;1b;0',
    description: 'ไม่มีเป้าเลยสักนิด ลองเล่นแบบ Instinct ล้วน ๆ หรือแอบเปลี่ยนให้เพื่อน',
    source: 'reddit.com/r/VALORANT',
  },
  {
    id: 'flat-line',
    name: 'เส้นขอบฟ้า',
    subtitle: 'แนวนอนอย่างเดียว',
    category: 'fun',
    code: '0;P;c;4;h;0;0t;1;0l;10;0v;0;0g;1;0o;1;0a;1;0f;0;1b;0',
    description: 'มีแค่เส้นแนวนอนสีเหลือง ช่วยคุมระดับหัวได้แต่ยิงขึ้นลงลำบาก',
    source: 'vcrdb.net',
  },
  {
    id: 'big-dot',
    name: 'จุดยักษ์',
    subtitle: 'ลูกบอลกลางจอ',
    category: 'fun',
    code: '0;P;c;6;h;0;d;1;z;6;a;1;0b;0;1b;0',
    description: 'จุดสีชมพูขนาดใหญ่ที่บังหัวศัตรูมิด ปั่นเพื่อนได้ผลดีมาก',
    source: 'reddit.com/r/VALORANT',
  },
];
