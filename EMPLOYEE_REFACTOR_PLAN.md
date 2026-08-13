# Kế hoạch Tái cấu trúc: EmployeePage + Quản lý Khách hàng v2

> **Phiên bản:** 1.0 — 06/08/2026  
> **Mục tiêu:** Chuyển EmployeePage từ dạng "cuộn dài" → hệ thống menu/tab. Tách quản lý khách hàng ra tab riêng. Thêm trạng thái thanh toán + bộ lọc nợ. Dùng HashMap tra cứu khách nhanh theo tên.  
> **Nguyên tắc:** Giữ nguyên backend pattern (Controller → Service → Route). Giữ nguyên thiết kế UI dark mode hiện tại.

---

## 1. Tổng quan thay đổi

### Trước (hiện tại)
```
EmployeePage.tsx (~1185 dòng)
├── Thẻ tổng quan (3 cards)
├── Form báo cáo giao gas (gõ tay customerName + GPS inline)
├── Bảng lịch sử Gas lớn
├── Bảng lịch sử Gas lon
├── Form chi phí
├── Form Gas lon
└── Bảng tổng hợp Thu–Chi
```
**Vấn đề:** Quá dài, mọi thứ dồn 1 trang, cuộn mỏi tay, khó tìm.

### Sau (mục tiêu)
```
EmployeePage.tsx (shell nhẹ — chỉ chứa menu + render tab active)
├── Menu bar: [📊 Báo cáo] [👥 Khách hàng] [💰 Chi phí]
│
├── Tab "Báo cáo" (ReportTab.tsx)
│   ├── Thẻ tổng quan (3 cards)
│   ├── Form báo cáo gas lớn (dùng Select + filter chọn khách)
│   │   └── Khi chọn khách → tự điền dữ liệu bill gần nhất
│   ├── Form gas lon
│   ├── Bảng lịch sử Gas lớn + Gas lon
│   ├── Bảng tổng hợp Thu-Chi
│   └── BỘ LỌC NỢ: hiển thị các đơn chưa thanh toán
│
├── Tab "Khách hàng" (CustomerTab.tsx)  ← MỚI
│   ├── Danh sách khách + tìm kiếm
│   ├── Thêm / Sửa / Xóa khách
│   ├── Ghim GPS cho từng khách
│   └── Nút chỉ đường Google Maps
│
└── Tab "Chi phí" (ExpenseTab.tsx)
    ├── Form ghi nhận chi phí
    └── Bảng lịch sử chi phí hôm nay
```

---

## 2. Thay đổi Database (Prisma Schema)

### 2.1. Thêm field `paymentStatus` vào `DeliveryReport`

```prisma
model DeliveryReport {
  // ... giữ nguyên tất cả field hiện tại ...
  
  // THÊM MỚI:
  paymentStatus  String   @default("paid")  // "paid" | "debt"
}
```

> **Giá trị:**  
> - `"paid"` = Đã thanh toán (mặc định)  
> - `"debt"` = Còn nợ  
> 
> Dữ liệu cũ tự động có `paymentStatus = "paid"` nhờ `@default`.

### 2.2. Thêm field `nameHash` vào `Customer` (hỗ trợ tra cứu nhanh + bắt trùng)

```prisma
model Customer {
  // ... giữ nguyên ...
  
  // THÊM MỚI:
  nameHash  String?  @unique  // Hash của tên (lowercase, trim) để lookup O(1)
}
```

> **Tại sao cần hash?** Khi danh sách khách tăng (100+), tra cứu bằng `name.toLowerCase().includes()` trên frontend chậm dần. Dùng hash để:
> 1. Backend: đảm bảo tên unique bằng hash (tránh "Chú Bảy" vs "chú bảy")
> 2. Frontend: build HashMap `{ [nameHash]: Customer }` để lookup O(1)

### 2.3. Hàm hash đề xuất (dùng cả FE + BE)

```typescript
// shared/utils/hashName.ts
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
```

> **Mục đích:** "Chú Bảy", "chú bảy", "Chu Bay" → cùng 1 hash → bắt trùng tên.

---

## 3. Cấu trúc File mới

### 3.1. Frontend

```
src/app/pages/
├── EmployeePage.tsx          ← Sửa: chỉ còn menu shell + render tab
├── employee/                 ← THƯ MỤC MỚI
│   ├── ReportTab.tsx         ← Tách từ EmployeePage (form báo cáo + lịch sử + tổng hợp)
│   ├── CustomerTab.tsx       ← MỚI (quản lý khách hàng + GPS)
│   └── ExpenseTab.tsx        ← Tách từ EmployeePage (form chi phí + lịch sử)

src/app/types.ts              ← Sửa: thêm paymentStatus vào DeliveryReport
src/app/context/DataContext.tsx ← Sửa: thêm hàm updateCustomer, deleteCustomer, customerHashMap
```

### 3.2. Backend

```
server/modules/customers/
├── customers.service.ts      ← Sửa: thêm logic nameHash
├── customers.controller.ts   ← Sửa: thêm endpoint update full info
└── customers.route.ts        ← Giữ nguyên

server/modules/reports/
├── reports.service.ts        ← Sửa: thêm paymentStatus
├── reports.repository.ts     ← Sửa: thêm paymentStatus
└── reports.route.ts          ← Thêm: PUT /api/reports/:id/payment-status
```

---

## 4. Chi tiết triển khai

### Phase 1: Database + Backend (ước tính ~30 phút)

#### Bước 1: Cập nhật Prisma schema
- Thêm `paymentStatus String @default("paid")` vào `DeliveryReport`
- Thêm `nameHash String? @unique` vào `Customer`
- Chạy `npx prisma db push`

#### Bước 2: Tạo file hash utility
- Tạo `server/utils/hashName.ts` (dùng chung BE)
- Tạo `src/app/lib/hashName.ts` (copy cho FE — hoặc dùng shared)

#### Bước 3: Cập nhật `customers.service.ts`
- Khi tạo Customer → tự tính `nameHash` từ `name`
- Khi search → so sánh bằng hash để bắt trùng chính xác
- Thêm method `updateCustomer(id, { name, phone, address, notes })`

#### Bước 4: Cập nhật `reports.service.ts` + `reports.repository.ts`
- `createReport`: nhận thêm `paymentStatus` (default `"paid"`)
- `updateReport`: cho phép cập nhật `paymentStatus`
- Thêm API endpoint: `PUT /api/reports/:id/payment-status`
  - Body: `{ paymentStatus: "paid" | "debt" }`

---

### Phase 2: Frontend — Hệ thống Menu + Tách Tab (ước tính ~45 phút)

#### Bước 5: Tái cấu trúc `EmployeePage.tsx` → Menu Shell

EmployeePage trở thành **shell nhẹ**, chỉ chứa:
```tsx
// EmployeePage.tsx (rút gọn)
const [activeTab, setActiveTab] = useState<'report' | 'customer' | 'expense'>('report');

return (
  <div>
    <nav> {/* Header giữ nguyên */} </nav>
    
    {/* === MENU BAR === */}
    <div className="flex gap-2 bg-slate-900/80 p-2 rounded-2xl">
      <TabButton active={activeTab === 'report'}   onClick={() => setActiveTab('report')}>
        📊 Báo cáo
      </TabButton>
      <TabButton active={activeTab === 'customer'} onClick={() => setActiveTab('customer')}>
        👥 Khách hàng
      </TabButton>
      <TabButton active={activeTab === 'expense'}  onClick={() => setActiveTab('expense')}>
        💰 Chi phí
      </TabButton>
    </div>
    
    {/* === RENDER TAB === */}
    {activeTab === 'report'   && <ReportTab />}
    {activeTab === 'customer' && <CustomerTab />}
    {activeTab === 'expense'  && <ExpenseTab />}
  </div>
);
```

#### Bước 6: Tạo `ReportTab.tsx`
- Di chuyển (cut) toàn bộ code báo cáo từ EmployeePage cũ
- **Thay đổi chính:**
  - Ô "Tên khách hàng": đổi từ `<input>` gõ tay → **`<select>` + input lọc**
  - Thêm field "Trạng thái thanh toán" (`<select>`: Đã TT / Nợ)
  - Khi chọn khách → auto-fill data từ bill gần nhất
  - Thêm bộ lọc "Xem đơn nợ" trên bảng lịch sử

#### Bước 7: Tạo `CustomerTab.tsx` (hoàn toàn mới)
- Danh sách khách hàng dạng card/table
- Form thêm / sửa khách (tên, SĐT, địa chỉ, ghi chú)
- Nút ghim GPS cho từng khách
- Nút chỉ đường Google Maps
- Tìm kiếm khách nhanh (dùng HashMap)

#### Bước 8: Tạo `ExpenseTab.tsx`
- Di chuyển (cut) form chi phí + bảng chi phí từ EmployeePage cũ
- Không thay đổi logic, chỉ tách file

---

### Phase 3: Frontend — Select + Filter khách hàng trong Report (ước tính ~40 phút)

#### Bước 9: Xây dựng Customer Select + Filter

Thay thế input gõ tay bằng component chọn khách:

```tsx
{/* === CHỌN KHÁCH HÀNG (Select + Filter) === */}
<div className="relative">
  <label>Khách hàng</label>
  
  {/* Input filter — luôn hiện */}
  <input
    type="text"
    value={customerFilter}
    onChange={(e) => setCustomerFilter(e.target.value)}
    placeholder="🔍 Tìm tên khách hàng..."
  />
  
  {/* Danh sách khách (dropdown, lọc theo filter) */}
  <div className="dropdown">
    {filteredCustomers.map(c => (
      <div key={c.id} onClick={() => handleSelectCustomer(c)}>
        <span>{c.name}</span>
        {c.latitude && <MapPin />}          {/* Có GPS */}
        {getDebtCount(c.id) > 0 && <Badge>Nợ {getDebtCount(c.id)}</Badge>}
      </div>
    ))}
  </div>
</div>
```

**Logic lọc:** Dùng HashMap lookup nhanh, fallback sang `includes()` nếu cần fuzzy search.

#### Bước 10: Auto-fill từ bill gần nhất

Khi nhân viên chọn 1 khách hàng từ select:

```typescript
const handleSelectCustomer = (customer: Customer) => {
  setSelectedCustomerId(customer.id);
  setFormData(prev => ({ ...prev, customerName: customer.name }));
  
  // Tìm bill gần nhất của khách này
  const lastBill = deliveryReports
    .filter(r => r.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    [0];
  
  if (lastBill) {
    // Tự động điền dữ liệu từ bill cũ
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      containerType: lastBill.containerType,
      quantity: String(lastBill.quantity),
      unitPrice: String(lastBill.unitPrice),
      // actualReceived KHÔNG auto-fill (mỗi lần khác nhau)
    }));
    toast.info(`Đã điền từ đơn gần nhất (${lastBill.date})`);
  }
};
```

> **Lợi ích:** Khách quen mua cùng loại bình, cùng giá → nhân viên chỉ cần chọn khách, kiểm tra, sửa nếu khác, rồi submit. Tiết kiệm 80% thời gian nhập liệu.

#### Bước 11: Trạng thái thanh toán + Bộ lọc nợ

**Trong form báo cáo — thêm field:**
```tsx
<div>
  <label>Trạng thái thanh toán</label>
  <select value={formData.paymentStatus} onChange={...}>
    <option value="paid">✅ Đã thanh toán</option>
    <option value="debt">🔴 Nợ</option>
  </select>
</div>
```

**Trong bảng lịch sử — thêm cột + bộ lọc:**
```tsx
{/* Bộ lọc */}
<div className="flex gap-2 mb-4">
  <button onClick={() => setDebtFilter('all')}>Tất cả</button>
  <button onClick={() => setDebtFilter('debt')}>🔴 Chỉ xem nợ</button>
  <button onClick={() => setDebtFilter('paid')}>✅ Đã thanh toán</button>
</div>

{/* Bảng — thêm cột "Trạng thái" */}
<th>Trạng thái</th>
...
<td>
  <span className={report.paymentStatus === 'debt' ? 'text-red-500' : 'text-green-500'}>
    {report.paymentStatus === 'debt' ? '🔴 Nợ' : '✅ Đã TT'}
  </span>
  {/* Nút chuyển trạng thái nhanh */}
  <button onClick={() => togglePaymentStatus(report.id)}>
    {report.paymentStatus === 'debt' ? 'Đánh dấu đã trả' : 'Đánh dấu nợ'}
  </button>
</td>
```

> **Bộ lọc nợ** cho phép nhân viên nhanh chóng biết **ai nợ tiền** → nhắc khi giao lần sau.

---

### Phase 4: Tab Khách hàng (ước tính ~35 phút)

#### Bước 12: Xây dựng `CustomerTab.tsx`

```
┌─────────────────────────────────────────────────┐
│  👥 Quản lý Khách hàng                         │
│  ┌──────────────────────────────────────────┐   │
│  │ 🔍 Tìm kiếm khách hàng...               │   │
│  └──────────────────────────────────────────┘   │
│  [+ Thêm khách mới]                            │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ 📋 Chú Bảy           📍 ☑️              │ │
│  │    SĐT: 0909xxx | Ghi chú: KH quen       │ │
│  │    [✏️ Sửa] [📍 Ghim GPS] [🗺️ Chỉ đường]│ │
│  ├────────────────────────────────────────────┤ │
│  │ 📋 Cô Năm            📍 ❌              │ │
│  │    SĐT: — | Ghi chú: —                   │ │
│  │    [✏️ Sửa] [📍 Ghim GPS]                │ │
│  ├────────────────────────────────────────────┤ │
│  │ ...                                       │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Tính năng:**
- **Tìm kiếm** real-time bằng HashMap + fuzzy fallback
- **Thêm khách**: Modal/inline form — validate tên unique bằng hash
- **Sửa khách**: Edit tên, SĐT, địa chỉ, ghi chú
- **Ghim GPS**: Nút lấy `navigator.geolocation` → lưu vào Customer
- **Chỉ đường**: Mở Google Maps (chỉ hiện khi đã có GPS)
- **Xóa khách**: Confirm → gỡ liên kết report → xóa

---

## 5. Cập nhật `DataContext.tsx`

### Thêm mới:

```typescript
interface DataContextType {
  // ... giữ nguyên ...
  
  // THÊM MỚI:
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; message?: string }>;
  updateReportPaymentStatus: (id: string, status: 'paid' | 'debt') => Promise<void>;
  customerMap: Map<string, Customer>;  // HashMap tra cứu nhanh theo nameHash
}
```

### `customerMap` — HashMap tra cứu:

```typescript
// Build HashMap mỗi khi customers thay đổi
const customerMap = useMemo(() => {
  const map = new Map<string, Customer>();
  customers.forEach(c => {
    map.set(hashCustomerName(c.name), c);
  });
  return map;
}, [customers]);

// Sử dụng: lookup O(1)
const findCustomer = (name: string): Customer | undefined => {
  return customerMap.get(hashCustomerName(name));
};
```

---

## 6. Cập nhật `types.ts`

```typescript
export interface DeliveryReport {
  // ... giữ nguyên ...
  paymentStatus: 'paid' | 'debt';   // THÊM MỚI
}

export interface Customer {
  // ... giữ nguyên ...
  nameHash?: string;   // THÊM MỚI
}
```

---

## 7. Lộ trình thực hiện

| Bước | Công việc | Thời gian | File liên quan |
|:----:|-----------|:---------:|----------------|
| **1** | Cập nhật Prisma schema (`paymentStatus`, `nameHash`) + `db push` | 5 min | `prisma/schema.prisma` |
| **2** | Tạo hash utility (`hashName.ts`) cho cả BE + FE | 10 min | `server/utils/`, `src/app/lib/` |
| **3** | Cập nhật `customers.service.ts` (hash + updateCustomer full) | 10 min | `server/modules/customers/` |
| **4** | Cập nhật reports backend (paymentStatus CRUD) | 10 min | `server/modules/reports/` |
| **5** | Sửa `types.ts` + `DataContext.tsx` | 15 min | `src/app/types.ts`, `DataContext.tsx` |
| **6** | Tái cấu trúc `EmployeePage.tsx` → menu shell | 15 min | `src/app/pages/EmployeePage.tsx` |
| **7** | Tạo `ExpenseTab.tsx` (tách từ EmployeePage) | 10 min | `src/app/pages/employee/ExpenseTab.tsx` |
| **8** | Tạo `ReportTab.tsx` (tách + sửa select/filter/payment) | 30 min | `src/app/pages/employee/ReportTab.tsx` |
| **9** | Tạo `CustomerTab.tsx` (hoàn toàn mới) | 25 min | `src/app/pages/employee/CustomerTab.tsx` |
| **10** | Test + fix responsive + mobile | 15 min | — |
| | **Tổng** | **~2.5 giờ** | |

---

## 8. Tóm tắt thay đổi quan trọng

| # | Thay đổi | Lý do |
|---|----------|-------|
| 1 | EmployeePage → Menu + Tab | Giao diện gọn, không cuộn dài |
| 2 | Tab Khách hàng riêng | Quản lý khách + GPS tập trung, không lẫn với báo cáo |
| 3 | Form báo cáo dùng Select + Filter | Chọn khách nhanh, không gõ tay → tránh trùng tên |
| 4 | Auto-fill từ bill gần nhất | Tiết kiệm 80% thời gian nhập liệu cho khách quen |
| 5 | Hash tra cứu khách | O(1) lookup, bắt trùng tên (dù khác hoa/thường/dấu) |
| 6 | `paymentStatus` (paid/debt) | Theo dõi công nợ từng đơn |
| 7 | Bộ lọc nợ | Nhân viên biết ai nợ → nhắc khi giao lần sau |
| 8 | `name @unique` (giữ nguyên) | Tên khách không trùng → mỗi khách 1 hồ sơ duy nhất |

---

## 9. Checklist xác nhận

- [ ] OK: Menu 3 tab (Báo cáo / Khách hàng / Chi phí)?
- [ ] OK: Báo cáo dùng Select + Filter thay gõ tay?
- [ ] OK: Chọn khách → auto-fill bill gần nhất?
- [ ] OK: Trạng thái thanh toán (Đã TT / Nợ)?
- [ ] OK: Bộ lọc nợ trên bảng lịch sử?
- [ ] OK: Tab Khách hàng riêng (CRUD + GPS + Maps)?
- [ ] OK: HashMap tra cứu khách theo tên?
- [ ] Xác nhận → Bắt đầu code từ Bước 1?

---

## 10. HƯỚNG DẪN THỰC HIỆN CHI TIẾT (dành cho AI)

> **Mục đích:** Cung cấp hướng dẫn cụ thể từng bước để AI (Gemini, v.v.) có thể thực hiện chính xác, không sai sót, không bỏ sót.

### ⚠️ QUY TẮC BẮT BUỘC

1. **LUÔN đọc file trước khi sửa.** Không đoán nội dung — dùng `view_file` đọc toàn bộ.
2. **Thực hiện TUẦN TỰ theo bước.** Không nhảy bước, không làm song song nhiều file cùng lúc.
3. **Sau mỗi bước backend, kiểm tra server còn chạy.** Nếu crash → đọc log, fix ngay.
4. **Giữ nguyên TOÀN BỘ UI style hiện tại** (dark mode, glassmorphism, font, color, border). Chỉ thay đổi logic/structure.
5. **KHÔNG xóa comment tiếng Việt** trong code hiện tại.
6. **Mỗi file mới tạo phải có đầy đủ import.** Kiểm tra lại trước khi lưu.

### 📁 FILE MAP — Vị trí chính xác các file cần sửa/tạo

```
d:\Gas Delivery Management System\
├── prisma\schema.prisma                          ← BƯỚC 1: Thêm paymentStatus + nameHash
├── server\
│   ├── utils\hashName.ts                         ← BƯỚC 2: TẠO MỚI — hàm hash
│   ├── modules\customers\
│   │   ├── customers.service.ts                  ← BƯỚC 3: SỬA — thêm hash logic
│   │   ├── customers.controller.ts               ← BƯỚC 3: SỬA — thêm update/delete endpoint
│   │   └── customers.route.ts                    ← BƯỚC 3: Kiểm tra route đủ chưa
│   └── modules\reports\
│       ├── reports.service.ts                    ← BƯỚC 4: SỬA — thêm paymentStatus
│       ├── reports.repository.ts                 ← BƯỚC 4: SỬA — thêm paymentStatus vào data
│       └── reports.route.ts                      ← BƯỚC 4: SỬA — thêm route payment-status
├── src\app\
│   ├── lib\hashName.ts                           ← BƯỚC 2: TẠO MỚI — copy hash cho FE
│   ├── types.ts                                  ← BƯỚC 5: SỬA — thêm paymentStatus, nameHash
│   ├── context\DataContext.tsx                    ← BƯỚC 5: SỬA — thêm hàm mới + customerMap
│   └── pages\
│       ├── EmployeePage.tsx                       ← BƯỚC 6: SỬA — rút gọn thành menu shell
│       └── employee\                              ← BƯỚC 7-9: TẠO THƯ MỤC + 3 file
│           ├── ReportTab.tsx                      ← BƯỚC 8: TẠO MỚI
│           ├── CustomerTab.tsx                    ← BƯỚC 9: TẠO MỚI  
│           └── ExpenseTab.tsx                     ← BƯỚC 7: TẠO MỚI
```

---

### BƯỚC 1: Prisma Schema

**File:** `prisma/schema.prisma`  
**Hành động:** Thêm 2 field

```prisma
# Trong model DeliveryReport — thêm SAU dòng "receiptUrl":
  paymentStatus  String   @default("paid")  // "paid" | "debt"

# Trong model Customer — thêm SAU dòng "notes":
  nameHash  String?  @unique  // Hash tên để lookup nhanh + bắt trùng
```

**Sau khi sửa:** Chạy `npx prisma db push` tại thư mục gốc project.  
**Kiểm tra:** Không có lỗi. Server tự restart nếu đang watch.

---

### BƯỚC 2: Hash Utility

**Tạo 2 file với NỘI DUNG GIỐNG HỆT NHAU:**

**File 1:** `server/utils/hashName.ts`  
**File 2:** `src/app/lib/hashName.ts`

```typescript
export function hashCustomerName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
  
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
```

---

### BƯỚC 3: Cập nhật Customer Backend

**File:** `server/modules/customers/customers.service.ts`

**Thay đổi:**
- Import `hashCustomerName` từ `../../utils/hashName.js`
- Trong `createCustomer()`: tính `nameHash = hashCustomerName(data.name)` rồi lưu kèm
- Trong `updateCustomer()`: nếu đổi tên → tính lại nameHash
- Trong `findOrCreateByName()`: dùng hash để tìm thay vì tìm bằng name
- Đảm bảo `deleteCustomer()` hoạt động (đã có sẵn)

**File:** `server/modules/customers/customers.controller.ts`  
- Đảm bảo có handler cho `updateCustomer` và `deleteCustomer` (đã có sẵn — kiểm tra)

**File:** `server/modules/customers/customers.route.ts`  
- Đảm bảo có đủ route: GET, POST, PUT /:id, PUT /:id/location, DELETE /:id (đã có sẵn — kiểm tra)

---

### BƯỚC 4: Cập nhật Reports Backend

**File:** `server/modules/reports/reports.service.ts`

**Thay đổi trong `createReport()`:**
```typescript
paymentStatus: data.paymentStatus || 'paid',
```

**Thay đổi trong `updateReport()`:**
```typescript
paymentStatus: data.paymentStatus || existingReport.paymentStatus,
```

**File:** `server/modules/reports/reports.repository.ts`
- Đảm bảo `paymentStatus` được include trong data khi create/update

**File:** `server/modules/reports/reports.route.ts`
- Thêm route mới:
```typescript
router.put('/:id/payment-status', authenticateToken, reportsController.updatePaymentStatus);
```
- Thêm handler `updatePaymentStatus` trong controller

---

### BƯỚC 5: Cập nhật Frontend Types + DataContext

**File:** `src/app/types.ts`
- Thêm `paymentStatus: 'paid' | 'debt';` vào interface `DeliveryReport`
- Thêm `nameHash?: string;` vào interface `Customer`

**File:** `src/app/context/DataContext.tsx`
- Import `hashCustomerName` từ `../lib/hashName`
- Import `useMemo` từ `react`
- Thêm vào interface: `updateCustomer`, `deleteCustomer`, `updateReportPaymentStatus`, `customerMap`
- Thêm `customerMap` bằng `useMemo`:
```typescript
const customerMap = useMemo(() => {
  const map = new Map<string, Customer>();
  customers.forEach(c => map.set(hashCustomerName(c.name), c));
  return map;
}, [customers]);
```
- Thêm hàm `updateCustomer(id, data)` — gọi `PUT /api/customers/:id`
- Thêm hàm `deleteCustomer(id)` — gọi `DELETE /api/customers/:id`
- Thêm hàm `updateReportPaymentStatus(id, status)` — gọi `PUT /api/reports/:id/payment-status`
- Đưa tất cả vào Provider value

---

### BƯỚC 6: Tái cấu trúc EmployeePage.tsx → Menu Shell

**File:** `src/app/pages/EmployeePage.tsx`

**QUAN TRỌNG:** 
- **ĐỌC TOÀN BỘ file trước** (1185 dòng). Hiểu cấu trúc.
- **GIỮ NGUYÊN:** Header (nav), background glowing, logout button
- **XÓA:** Toàn bộ form/table/card bên trong — sẽ chuyển sang tab components
- **THÊM:** Menu bar + conditional render 3 tab

**Cấu trúc mới (khoảng ~80 dòng):**
```
EmployeePage.tsx
├── Import: ReportTab, CustomerTab, ExpenseTab
├── State: activeTab = 'report' | 'customer' | 'expense'
├── Giữ: nav header + background + logout
├── Thêm: Menu bar (3 nút tab)
└── Render: {activeTab === 'xxx' && <XxxTab />}
```

**Style menu bar:** Dùng class Tailwind giống nav hiện tại (dark, glassmorphism, border-white/10). Tab active dùng gradient highlight.

---

### BƯỚC 7: Tạo ExpenseTab.tsx (dễ nhất — làm trước)

**File:** `src/app/pages/employee/ExpenseTab.tsx`

**Cách làm:** 
1. Copy toàn bộ phần "FORM CHI PHÍ" + bảng chi phí trong bảng tổng hợp từ EmployeePage cũ
2. Bọc trong `export function ExpenseTab() { ... }`
3. Import useAuth, useData, useState, toast, icons cần thiết
4. Lấy state + handler từ EmployeePage cũ (expenseForm, handleExpenseSubmit, v.v.)

**LƯU Ý:** Giữ nguyên 100% UI style. Chỉ tách file, không đổi giao diện.

---

### BƯỚC 8: Tạo ReportTab.tsx (phức tạp nhất)

**File:** `src/app/pages/employee/ReportTab.tsx`

**Cách làm:**
1. Copy: 3 cards tổng quan + form báo cáo gas lớn + form gas lon + bảng lịch sử + bảng tổng hợp Thu-Chi
2. **THAY ĐỔI CHÍNH:**

**a) Thay input customerName bằng Select + Filter:**
```tsx
// State mới
const [customerFilter, setCustomerFilter] = useState('');
const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

// Lọc khách (dùng hashMap hoặc includes)
const filteredCustomers = customers.filter(c =>
  c.name.toLowerCase().includes(customerFilter.toLowerCase())
);

// UI: Input filter + dropdown list
<div className="relative">
  <input value={customerFilter} onChange={...} placeholder="🔍 Tìm khách..." />
  {showCustomerDropdown && (
    <div className="absolute dropdown">
      {filteredCustomers.map(c => <div onClick={() => handleSelectCustomer(c)}>...</div>)}
    </div>
  )}
  {selectedCustomerId && <div>Đã chọn: {formData.customerName}</div>}
</div>
```

**b) Auto-fill từ bill gần nhất khi chọn khách:**
```typescript
const handleSelectCustomer = (customer: Customer) => {
  setSelectedCustomerId(customer.id);
  setCustomerFilter(customer.name);
  setShowCustomerDropdown(false);
  
  const lastBill = deliveryReports
    .filter(r => r.customerId === customer.id && r.containerType !== 'Gas lon')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  if (lastBill) {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      containerType: lastBill.containerType,
      quantity: String(lastBill.quantity),
      unitPrice: String(lastBill.unitPrice),
    }));
    toast.info(`Đã điền từ đơn gần nhất (${lastBill.date})`);
  } else {
    setFormData(prev => ({ ...prev, customerName: customer.name }));
  }
};
```

**c) Thêm select Trạng thái thanh toán vào form:**
```tsx
<select value={formData.paymentStatus} onChange={...}>
  <option value="paid">✅ Đã thanh toán</option>
  <option value="debt">🔴 Nợ</option>
</select>
```

**d) Thêm bộ lọc nợ trên bảng lịch sử:**
```tsx
const [debtFilter, setDebtFilter] = useState<'all' | 'debt' | 'paid'>('all');

// Lọc báo cáo theo trạng thái
const filteredReports = gasReportsToday.filter(r => {
  if (debtFilter === 'all') return true;
  return r.paymentStatus === debtFilter;
});
```

**e) Thêm cột "Trạng thái" trong bảng + nút toggle nhanh**

---

### BƯỚC 9: Tạo CustomerTab.tsx (hoàn toàn mới)

**File:** `src/app/pages/employee/CustomerTab.tsx`

**Tính năng cần có:**
1. **Thanh tìm kiếm** — input filter real-time
2. **Nút "Thêm khách mới"** — mở inline form (tên, SĐT, địa chỉ, ghi chú)
3. **Danh sách khách** — card hoặc table, mỗi khách hiện:
   - Tên (bold), SĐT, địa chỉ, ghi chú
   - Badge GPS (📍 nếu có tọa độ, ❌ nếu chưa)
   - Nút: [✏️ Sửa] [📍 Ghim GPS] [🗺️ Chỉ đường] [🗑️ Xóa]
4. **Ghim GPS** — `navigator.geolocation.getCurrentPosition()` → gọi `updateCustomerLocation()`
5. **Chỉ đường** — `<a href="https://www.google.com/maps/search/?api=1&query={lat},{lng}">`
6. **Sửa khách** — inline edit hoặc modal
7. **Xóa khách** — confirm dialog → gọi `deleteCustomer()`

**Style:** Giống style cards/tables hiện tại (bg-white/90, rounded-3xl, shadow-2xl, border). Dark mode header.

**Validate khi thêm/sửa khách:**
```typescript
// Kiểm tra tên trùng bằng hash
const existingHash = customerMap.get(hashCustomerName(newName));
if (existingHash && existingHash.id !== editingId) {
  toast.error('Tên khách hàng đã tồn tại (có thể khác hoa/thường/dấu)');
  return;
}
```

---

### BƯỚC 10: Test

**Checklist test:**
- [ ] Menu 3 tab hoạt động, click chuyển tab mượt
- [ ] Tab Báo cáo: Select + Filter chọn khách → auto-fill bill cũ
- [ ] Tab Báo cáo: Trạng thái thanh toán lưu đúng (paid/debt)
- [ ] Tab Báo cáo: Bộ lọc nợ hoạt động
- [ ] Tab Báo cáo: Nút toggle trạng thái nhanh hoạt động
- [ ] Tab Khách hàng: CRUD đầy đủ (thêm/sửa/xóa)
- [ ] Tab Khách hàng: Ghim GPS hoạt động
- [ ] Tab Khách hàng: Chỉ đường Google Maps mở đúng
- [ ] Tab Khách hàng: Tìm kiếm nhanh hoạt động
- [ ] Tab Khách hàng: Bắt trùng tên (hash) hoạt động
- [ ] Tab Chi phí: Form + bảng hoạt động bình thường
- [ ] Responsive: Mobile hiển thị đúng
- [ ] Export Zalo: Vẫn hoạt động bình thường

---

### 🚨 LỖI THƯỜNG GẶP — CÁCH TRÁNH

| Lỗi | Nguyên nhân | Cách tránh |
|-----|-------------|------------|
| `Cannot find module './employee/ReportTab'` | Thiếu `.tsx` extension hoặc sai path | Import dùng relative path không có extension: `./employee/ReportTab` |
| `Property 'paymentStatus' does not exist` | Chưa sửa types.ts | Sửa types.ts TRƯỚC khi sửa component |
| `customerMap is not a function` | Chưa export từ DataContext | Kiểm tra Provider value có `customerMap` |
| Prisma lỗi khi push | Field mới conflict data cũ | Dùng `@default()` cho field mới, nullable cho optional |
| GPS không hoạt động | HTTPS required trên mobile | Test trên localhost (OK) hoặc deploy HTTPS |
| Dropdown bị ẩn sau element khác | Thiếu `z-50` | Thêm `className="z-50"` cho dropdown container |
| Hash collision (2 tên khác nhau cùng hash) | djb2 collision rate thấp nhưng có thể | Luôn verify bằng `name` sau khi lookup bằng hash |

  TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA DATA VÌ DATA ĐANG DÙNG CHUNG VỚI PRODUCTION