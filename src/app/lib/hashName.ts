export function hashCustomerName(name: string): string {
  // Chuẩn hóa: lowercase, bỏ dấu, bỏ khoảng trắng thừa
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');            // Gộp khoảng trắng
  
  return normalized;
}
