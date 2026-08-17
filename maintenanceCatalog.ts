export interface MaintenancePreset {
  id: string;
  category: 'gas_system' | 'documents' | 'fluids_engine' | 'brakes_tires_suspension' | 'ac_electric' | 'general';
  categoryLabel: string;
  name: string;
  description: string;
  recommendedInterval: string; // e.g. "ทุก 1 ปี", "ทุก 20,000 กม."
  defaultCost: number;
  isDualFuelSpecific?: boolean; // ระบบแก๊ส 2 เชื้อเพลิง
}

export const MAINTENANCE_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด', icon: 'Wrench' },
  { id: 'gas_system', label: '🛢️ ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)', icon: 'Fuel' },
  { id: 'documents', label: '📄 ภาษี / พ.ร.บ. / ประกันภัย', icon: 'FileText' },
  { id: 'fluids_engine', label: '⚙️ เครื่องยนต์ & ของเหลว', icon: 'Cog' },
  { id: 'brakes_tires_suspension', label: '🛑 เบรก / ยาง / ช่วงล่าง', icon: 'Disc' },
  { id: 'ac_electric', label: '❄️ ระบบแอร์ & ระบบไฟ', icon: 'Zap' },
  { id: 'general', label: '🔧 งานซ่อมทั่วไป / อื่นๆ', icon: 'Hammer' },
] as const;

export const MAINTENANCE_CATALOG: MaintenancePreset[] = [
  // ==========================================
  // หมวดที่ 1: ระบบแก๊ส 2 เชื้อเพลิง (LPG / NGV Dual Fuel)
  // ==========================================
  {
    id: 'gas_cert',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ตรวจสภาพ & ใบรับรองวิศวกรแก๊สประจำปี (กรมการขนส่งฯ)',
    description: 'ตรวจเช็คระบบแก๊ส LPG/NGV โดยวิศวกรที่ได้รับความเห็นชอบจากกรมการขนส่งทางบก พร้อมออกใบรับรองเพื่อใช้ต่อภาษีประจำปี',
    recommendedInterval: 'ทุก 1 ปี (ภาคบังคับต่อภาษี)',
    defaultCost: 800,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_tank',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ตรวจเช็คถังแก๊ส & วาล์วนิรภัย (Multivalve / Solenoid Valve)',
    description: 'ตรวจสอบสภาพถังแก๊ส วันหมดอายุถัง (10 ปี), วาล์วหัวถัง, ระบบตัดแก๊สฉุกเฉิน และขาจับยึดถัง',
    recommendedInterval: 'ทุก 1 ปี (อายุถัง 10 ปี)',
    defaultCost: 1200,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_filter_vapor',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'เปลี่ยนกรองแก๊สไอ (Gas Vapor Filter)',
    description: 'เปลี่ยนกรองแก๊สไอระหว่างหม้อต้มกับรางหัวฉีดแก๊ส ป้องกันสิ่งสกปรกและไอน้ำมันอุดตันหัวฉีดแก๊ส',
    recommendedInterval: 'ทุก 20,000 - 30,000 กม.',
    defaultCost: 650,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_filter_liquid',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'เปลี่ยนกรองแก๊สแรงดันสูง (High-Pressure Liquid Filter)',
    description: 'เปลี่ยนไส้กรองแก๊สสถานะของเหลวที่หม้อต้มหรือโซลินอยด์วาล์วหน้าเครื่อง',
    recommendedInterval: 'ทุก 40,000 กม.',
    defaultCost: 850,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_regulator',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ล้าง/โอเวอร์ฮอลหม้อต้มแก๊ส & ปรับจูนแรงดัน (Gas Reducer / Regulator)',
    description: 'ตรวจเช็คผ้าปั๊มหม้อต้ม ล้างคราบยางมะตอย เช็คแรงดันจ่ายแก๊สและระบบท่อน้ำอุ่นหม้อต้ม',
    recommendedInterval: 'ทุก 40,000 - 60,000 กม.',
    defaultCost: 1800,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_hoses',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ตรวจสอบและเปลี่ยนท่อยางส่งแก๊ส / แคล้มป์รัด (Gas Hoses & Clamps)',
    description: 'ตรวจเช็คท่อยางแก๊ส ท่อน้ำอุ่น ท่อ Vacuum ป้องกันการแตกลายงา แข็งกรอบ และหลุดรั่ว',
    recommendedInterval: 'ทุก 1-2 ปี หรือ 50,000 กม.',
    defaultCost: 950,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_injectors',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ปรับจูนกล่อง ECU แก๊ส & เช็คหัวฉีดแก๊ส (Gas Injector Calibration)',
    description: 'ต่อคอมพิวเตอร์ปรับจูนกราฟจ่ายแก๊ส เช็คค่า Short/Long Term Fuel Trim และล้างรางหัวฉีดแก๊ส',
    recommendedInterval: 'ทุก 20,000 กม. / เมื่อเครื่องสะดุด',
    defaultCost: 1200,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_leak_test',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ตรวจเช็คจุดรั่วซึมแก๊สตามแนวท่อและห้องเครื่อง (Gas Leak Detection Test)',
    description: 'ใช้เครื่องตรวจวัดก๊าซรั่วอิเล็กทรอนิกส์และน้ำสบู่ตรวจเช็คทุกข้อต่อ วาล์ว และท่อใต้ท้องรถ',
    recommendedInterval: 'ทุก 6 เดือน / ทุกรอบถ่ายน้ำมันเครื่อง',
    defaultCost: 500,
    isDualFuelSpecific: true,
  },
  {
    id: 'gas_switch_sensor',
    category: 'gas_system',
    categoryLabel: 'ระบบแก๊ส 2 เชื้อเพลิง (Dual Fuel)',
    name: 'ตรวจเช็คสวิตช์สลับน้ำมัน-แก๊ส & เซนเซอร์วัดแรงดัน/อุณหภูมิ (MAP Sensor)',
    description: 'ตรวจเช็คการตัดสลับน้ำมันเป็นแก๊สอัตโนมัติ การเตือนแก๊สหมด และการทำงานของ MAP / Temp Sensor',
    recommendedInterval: 'เมื่อพบอาการตัดสลับสะดุดหรือไม่ตัดแก๊ส',
    defaultCost: 1500,
    isDualFuelSpecific: true,
  },

  // ==========================================
  // หมวดที่ 2: เอกสาร พ.ร.บ., ภาษี, ประกันภัย
  // ==========================================
  {
    id: 'tax',
    category: 'documents',
    categoryLabel: 'ภาษี / พ.ร.บ. / ประกันภัย',
    name: 'ภาษีประจำปี (ป้ายวงกลม / ชำระภาษีรถยนต์)',
    description: 'ต่ออายุภาษีรถยนต์ประจำปี ณ กรมการขนส่งทางบก (ต้องมี พ.ร.บ. และใบรับรองตรวจแก๊ส/ตรอ. แนบ)',
    recommendedInterval: 'ทุก 1 ปี',
    defaultCost: 1600,
  },
  {
    id: 'act',
    category: 'documents',
    categoryLabel: 'ภาษี / พ.ร.บ. / ประกันภัย',
    name: 'พ.ร.บ. คุ้มครองผู้ประสบภัยจากรถ (ภาคบังคับ)',
    description: 'ประกันภัยภาคบังคับตามกฎหมาย คุ้มครองค่ารักษาพยาบาลและการบาดเจ็บจากอุบัติเหตุ',
    recommendedInterval: 'ทุก 1 ปี',
    defaultCost: 645,
  },
  {
    id: 'insurance',
    category: 'documents',
    categoryLabel: 'ภาษี / พ.ร.บ. / ประกันภัย',
    name: 'ประกันภัยรถยนต์ภาคสมัครใจ (ชั้น 1 / 2+ / 3+)',
    description: 'ต่ออายุกรมธรรม์ประกันภัยรถยนต์ OGA Fleet คุ้มครองความเสียหายตัวรถและบุคคลภายนอก',
    recommendedInterval: 'ทุก 1 ปี',
    defaultCost: 18500,
  },
  {
    id: 'inspection_toror',
    category: 'documents',
    categoryLabel: 'ภาษี / พ.ร.บ. / ประกันภัย',
    name: 'ตรวจสภาพรถ ตรอ. (สำหรับรถยนต์อายุเกิน 7 ปี)',
    description: 'ตรวจสภาพความพร้อม เบรก ไฟส่องสว่าง และควันดำ/มลพิษ ณ สถานตรวจสภาพรถเอกชน (ตรอ.)',
    recommendedInterval: 'ทุก 1 ปี (รถอายุเกิน 7 ปี)',
    defaultCost: 200,
  },

  // ==========================================
  // หมวดที่ 3: ระบบเครื่องยนต์และของเหลว (Dual Fuel Engine)
  // ==========================================
  {
    id: 'oil_change',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์ & ไส้กรอง (เกรดรองรับรถ 2 เชื้อเพลิง/LPG)',
    description: 'ถ่ายน้ำมันเครื่องสังเคราะห์ 100% เกรดทนความร้อนสูงสำหรับเครื่องยนต์ใช้แก๊ส พร้อมเปลี่ยนกรองน้ำมันเครื่องแท้',
    recommendedInterval: 'ทุก 10,000 กม. หรือ 6 เดือน',
    defaultCost: 2400,
  },
  {
    id: 'spark_plugs',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'เปลี่ยนหัวเทียน (Spark Plugs เกรดทนความร้อนสูง/อิริเดียมสำหรับระบบแก๊ส)',
    description: 'เปลี่ยนหัวเทียนชุดใหม่ 4-6 หัว เพื่อการจุดระเบิดที่สมบูรณ์ ป้องกันอาการเครื่องสะดุดและแบ็คไฟร์',
    recommendedInterval: 'ทุก 20,000 - 40,000 กม.',
    defaultCost: 1600,
    isDualFuelSpecific: true,
  },
  {
    id: 'valve_clearance',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'ตรวจเช็คและตั้งระยะห่างวาล์วเครื่องยนต์ (Valve Clearance Adjustment)',
    description: 'ตรวจเช็คและปรับตั้งระยะห่างวาล์วไอดี-ไอเสีย เพื่อป้องกันปัญหาวาล์วยัน/วาล์วทรุดจากความร้อนสะสมของระบบแก๊ส',
    recommendedInterval: 'ทุก 40,000 กม. (สำคัญสำหรับรถติดแก๊ส)',
    defaultCost: 1500,
    isDualFuelSpecific: true,
  },
  {
    id: 'coolant_flush',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'เปลี่ยนถ่ายน้ำหล่อเย็นหม้อน้ำ & เช็คปั๊มน้ำ/วาล์วน้ำ (Coolant Flush)',
    description: 'ถ่ายน้ำยาหล่อเย็นหม้อน้ำสูตร Long Life ป้องกันความร้อนขึ้นสูงและช่วยรักษาอุณหภูมิหม้อต้มแก๊ส',
    recommendedInterval: 'ทุก 40,000 กม. หรือ 2 ปี',
    defaultCost: 950,
  },
  {
    id: 'air_cabin_filter',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'เปลี่ยนกรองอากาศเครื่องยนต์ & กรองแอร์ห้องโดยสาร (Air & Cabin Filter)',
    description: 'เปลี่ยนกรองอากาศเพื่อให้อัตราส่วนผสมอากาศ-เชื้อเพลิงสมบูรณ์ และเปลี่ยนกรองแอร์ PM2.5',
    recommendedInterval: 'ทุก 20,000 กม.',
    defaultCost: 850,
  },
  {
    id: 'drive_belt',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'เปลี่ยนสายพานหน้าเครื่อง / สายพานไทม์มิ่ง (Drive Belt / Timing Belt)',
    description: 'ตรวจเช็คและเปลี่ยนสายพานไดชาร์จ สายพานแอร์ สายพานปั๊มน้ำ และลูกรอกตั้งสายพาน',
    recommendedInterval: 'ทุก 80,000 - 100,000 กม.',
    defaultCost: 2200,
  },
  {
    id: 'fuel_pump_filter',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'ตรวจเช็คปั๊มติ๊กน้ำมันเบนซิน & เปลี่ยนกรองเบนซิน (Fuel Pump & Petrol Filter)',
    description: 'ตรวจสอบแรงดันปั๊มน้ำมันเบนซินและเปลี่ยนกรองเบนซิน ป้องกันปั๊มติ๊กไหม้จากการตัดสลับแก๊ส',
    recommendedInterval: 'ทุก 40,000 - 60,000 กม.',
    defaultCost: 1800,
    isDualFuelSpecific: true,
  },
  {
    id: 'transmission_oil',
    category: 'fluids_engine',
    categoryLabel: 'เครื่องยนต์ & ของเหลว',
    name: 'เปลี่ยนถ่ายน้ำมันเกียร์ออโต้ & น้ำมันเฟืองท้าย (ATF / Differential Fluid)',
    description: 'เปลี่ยนถ่ายน้ำมันเกียร์อัตโนมัติ CVT/ATF และทำความสะอาดอ่างเกียร์',
    recommendedInterval: 'ทุก 40,000 กม.',
    defaultCost: 2200,
  },

  // ==========================================
  // หมวดที่ 4: ระบบเบรก, ยาง, ช่วงล่าง และระบบไฟฟ้า
  // ==========================================
  {
    id: 'brake_service',
    category: 'brakes_tires_suspension',
    categoryLabel: 'เบรก / ยาง / ช่วงล่าง',
    name: 'ตรวจเช็คเปลี่ยนผ้าเบรก จานเบรก และถ่ายน้ำมันเบรก (Brake System)',
    description: 'ตรวจสอบความหนาผ้าเบรกหน้า-หลัง เจียรจานเบรก และเปลี่ยนถ่ายน้ำมันเบรก DOT4',
    recommendedInterval: 'ทุก 20,000 กม.',
    defaultCost: 2800,
  },
  {
    id: 'tire_rotation',
    category: 'brakes_tires_suspension',
    categoryLabel: 'เบรก / ยาง / ช่วงล่าง',
    name: 'สลับยาง ถ่วงล้อ และตั้งศูนย์ล้อ (Tire Rotation & Wheel Alignment)',
    description: 'สลับตำแหน่งยาง 4 ล้อ ตรวจเช็คลมยาง ถ่วงล้อ และปรับตั้งศูนย์ล้อหน้า-หลัง',
    recommendedInterval: 'ทุก 10,000 กม.',
    defaultCost: 800,
  },
  {
    id: 'new_tires',
    category: 'brakes_tires_suspension',
    categoryLabel: 'เบรก / ยาง / ช่วงล่าง',
    name: 'เปลี่ยนยางรถยนต์ชุดใหม่ (New Tires Set 4 เส้น)',
    description: 'เปลี่ยนยางรถยนต์คุณภาพสูง 4 เส้น พร้อมถ่วงล้อ ตั้งศูนย์ และจุ๊บลมใหม่',
    recommendedInterval: 'ทุก 50,000 กม. หรือ 3-4 ปี',
    defaultCost: 14500,
  },
  {
    id: 'battery_check',
    category: 'ac_electric',
    categoryLabel: 'ระบบแอร์ & ระบบไฟ',
    name: 'ตรวจเช็คแบตเตอรี่ ไดชาร์จ และไดสตาร์ท (Battery & Alternator Test)',
    description: 'ตรวจวัดค่า CCA แรงดันไดชาร์จ และเปลี่ยนแบตเตอรี่ใหม่เมื่อเสื่อมสภาพ',
    recommendedInterval: 'ทุก 6 เดือน / แบตเตอรี่ทุก 2 ปี',
    defaultCost: 2600,
  },
  {
    id: 'suspension_check',
    category: 'brakes_tires_suspension',
    categoryLabel: 'เบรก / ยาง / ช่วงล่าง',
    name: 'ตรวจเช็คระบบช่วงล่าง โช้คอัพ ลูกหมาก และยางแท่นเครื่อง (Suspension & Bushings)',
    description: 'ตรวจสอบโช้คอัพ ลูกหมากปีกนก ยางกันโคลง และยางแท่นเครื่อง-แท่นเกียร์',
    recommendedInterval: 'ทุก 20,000 กม.',
    defaultCost: 3500,
  },
  {
    id: 'ac_service',
    category: 'ac_electric',
    categoryLabel: 'ระบบแอร์ & ระบบไฟ',
    name: 'ล้างระบบแอร์ เติมน้ำยาแอร์ และเปลี่ยนไดเออร์ (A/C Cleaning & Refill)',
    description: 'ล้างตู้แอร์แบบไม่ถอดคอนโซล อบโอโซนฆ่าเชื้อ เติมน้ำยาแอร์ R134a และน้ำมันคอมเพรสเซอร์',
    recommendedInterval: 'ทุก 1 ปี หรือ 20,000 กม.',
    defaultCost: 1800,
  },

  // ==========================================
  // หมวดที่ 5: กำหนดเอง / อื่นๆ
  // ==========================================
  {
    id: 'custom_repair',
    category: 'general',
    categoryLabel: 'งานซ่อมทั่วไป / อื่นๆ',
    name: 'รายการส่งซ่อม/ตรวจเช็คอื่นๆ (ระบุเพิ่มเติมได้เองอิสระ)',
    description: 'งานซ่อมบำรุงเฉพาะทาง การเคลมประกัน ตัวถังและสี หรือรายการซ่อมฉุกเฉินนอกรอบ',
    recommendedInterval: 'ตามความจำเป็น',
    defaultCost: 0,
  },
];

// Helper: Calculate days remaining between today and target date string (DD/MM/YYYY or YYYY-MM-DD or Thai Buddhist format)
export function calculateDaysRemaining(dateStr: string): number {
  if (!dateStr) return 0;

  try {
    let year: number, month: number, day: number;

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 3) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
        if (year > 2400) {
          year -= 543; // Convert Thai Buddhist Year to Gregorian
        }
      } else {
        return 30;
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
        if (year > 2400) {
          year -= 543;
        }
      } else {
        return 30;
      }
    } else {
      return 30;
    }

    const targetDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (e) {
    return 30;
  }
}

// Helper: Determine status (critical, warning, normal) based on days remaining
export function getStatusFromDaysRemaining(days: number): 'critical' | 'warning' | 'normal' {
  if (days <= 0) return 'critical';
  if (days <= 30) return 'warning';
  return 'normal';
}

// Format date to Thai Buddhist string DD/MM/YYYY
export function formatToThaiDateString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}
