export function hashCustomerName(name: string): string {
  // Chuẩn hóa: lowercase, bỏ dấu, bỏ khoảng trắng thừa
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');            // Gộp khoảng trắng
  
  // Simple hash (djb2)
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
