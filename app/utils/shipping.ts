// utils/shipping.ts

/**
 * 1. ฟังก์ชันตรวจสอบบริษัทขนส่งอัตโนมัติจากรูปแบบเลขพัสดุ (Regex)
 */
export const detectCarrier = (trackingNo: string): string => {
  if (!trackingNo) return 'ไม่พบข้อมูลขนส่ง';
  
  // ตัดช่องว่างทิ้ง และทำให้เป็นตัวพิมพ์ใหญ่
  const tracking = trackingNo.trim().toUpperCase();

  /**
   * 🚩 เงื่อนไขที่ 1: ไปรษณีย์ไทย (ต้องแม่นยำที่สุด)
   * รูปแบบ: อักษร 2 ตัว + เลข 9 ตัว + ลงท้ายด้วย TH เสมอ (รวม 13 หลัก)
   * ตัวอย่าง: RI123456789TH, ED123456789TH
   */
  if (/^[A-Z]{2}\d{9}TH$/.test(tracking)) {
    return 'ไปรษณีย์ไทย';
  }

  /**
   * 🚩 เงื่อนไขที่ 2: Flash Express
   * รูปแบบ: ต้องขึ้นต้นด้วย TH เสมอ และตามด้วยตัวเลข 10-12 หลัก 
   * และที่สำคัญ "ต้องไม่ลงท้ายด้วย TH" (เพื่อป้องกันการทับซ้อนกับไปรษณีย์ไทย)
   */
  if (/^TH\d{10,12}$/.test(tracking) && !tracking.endsWith('TH')) {
    return 'Flash Express';
  }

  // กรณีพิเศษ: บางครั้ง Flash ไม่มีคำว่า TH นำหน้า (เป็นเลข 12 หลักที่ขึ้นต้นด้วย 27 หรือ 28)
  if (/^2[78]\d{10}$/.test(tracking)) {
    return 'Flash Express';
  }

  /**
   * 🚩 เงื่อนไขที่ 3: Kerry Express
   * รูปแบบ: ตัวเลขล้วน 10, 11 หรือ 12 หลัก หรือขึ้นต้นด้วยรหัส SHP / KER / DON
   */
  if (/^(SHP|KER|DON)\d+$/.test(tracking) || /^\d{10,12}$/.test(tracking)) {
    return 'Kerry Express';
  }

  /**
   * 🚩 เงื่อนไขที่ 4: J&T Express
   * รูปแบบ: ตัวเลขล้วน 12 หลัก (มักเริ่มด้วย 82, 84, 86)
   */
  if (/^8[246]\d{10}$/.test(tracking)) {
    return 'J&T Express';
  }

  return 'ไม่พบข้อมูลขนส่ง';
};

/**
 * 2. ฟังก์ชันสร้างลิงก์สำหรับคลิกไปเช็คพัสดุ
 */
export const getTrackingLink = (trackingNo: string): string => {
  if (!trackingNo) return '#';

  const carrier = detectCarrier(trackingNo);
  const tracking = trackingNo.trim().toUpperCase();

  switch (carrier) {
    case 'ไปรษณีย์ไทย':
      return `https://track.thailandpost.co.th/?trackNumber=${tracking}`;
    case 'Flash Express':
      return `https://www.flashexpress.co.th/tracking/?track=${tracking}`;
    case 'Kerry Express':
      return `https://th.kerryexpress.com/th/track/?track=${tracking}`;
    case 'J&T Express':
      return `https://www.jtexpress.co.th/index/query/gzquery.html?billCode=${tracking}`;
    default:
      return `https://www.google.com/search?q=tracking+${tracking}`;
  }
};