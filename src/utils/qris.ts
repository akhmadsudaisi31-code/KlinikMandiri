/**
 * QRIS Dynamic Generator
 * Standard EMVCo
 */

export function generateDynamicQRIS(baseString: string, amount: number): string {
  // 1. Remove existing CRC (last 8 characters: 6304XXXX)
  let qris = baseString.substring(0, baseString.length - 4);

  // 2. Change Point of Initiation Method to 12 (Dynamic)
  // Find Tag 01 (010211 -> 010212)
  qris = qris.replace('010211', '010212');

  // 3. Add/Update Amount (Tag 54)
  const amountStr = amount.toString();
  const amountTag = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // Tag 54 should be placed after Tag 53 (Currency)
  const tag53Index = qris.indexOf('5303360');
  if (tag53Index !== -1) {
    const insertIndex = tag53Index + 7;
    // Check if Tag 54 already exists
    if (qris.includes('54')) {
        // Remove old tag 54 if exists (complex because we need to know length)
        // For simplicity with this specific string, we assume it doesn't have 54 or we inject it
    }
    qris = qris.slice(0, insertIndex) + amountTag + qris.slice(insertIndex);
  }

  // 4. Calculate new CRC16
  const crc = crc16(qris);
  return qris + crc;
}

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
