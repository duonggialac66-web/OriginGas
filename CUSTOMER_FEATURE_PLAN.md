# Kế hoạch Triển khai: Quản lý Khách hàng & Ghim Định vị GPS

> **Phiên bản:** 3.0 — Cập nhật 04/08/2026
> **Mục tiêu:** Xây dựng hệ thống danh bạ khách hàng tích hợp định vị GPS, giúp nhân viên giao gas tìm đường nhanh hơn, giảm nhập liệu trùng lặp.
> **Nguyên tắc UX:** Giữ nguyên cách nhập liệu hiện tại (input gõ tay), chỉ bổ sung gợi ý thông minh + tự động lưu khách mới.

---

## 1. Bối cảnh hiện tại

### Vấn đề đang gặp
- Mỗi lần tạo báo cáo giao gas, nhân viên phải **gõ lại tên khách hàng** từ đầu (`<input>` thường).
- Không có cách nào lưu **vị trí nhà khách hàng** → nhân viên mới hoặc đi thay phải hỏi đường.
- Tên khách gõ không nhất quán (VD: "Chú Bảy", "chú bảy", "Chu Bay") → khó thống kê.

### Kiến trúc hiện tại cần nắm rõ
| Thành phần | File / Thư mục | Ghi chú |
|---|---|---|
| Database Schema | `prisma/schema.prisma` | PostgreSQL, 7 model hiện có |
| Backend modules | `server/modules/{auth,reports,expenses,...}` | Pattern: Controller → Service → Route |
| Server entry | `server/server-core.ts` | Mount route tại đây |
| Frontend state | `src/app/context/DataContext.tsx` | Context tập trung, fetch bằng `fetch()` |
| Frontend types | `src/app/types.ts` | Interface cho tất cả entity |
| Trang nhân viên | `src/app/pages/EmployeePage.tsx` | ~1007 dòng, form báo cáo + chi phí |
| Trang admin | `src/app/pages/AdminPage.tsx` | Xem tất cả báo cáo theo nhân viên |

---

## 2. Thiết kế Cơ sở dữ liệu

### 2.1. Model mới: `Customer`

```prisma
model Customer {
  id          String   @id @default(uuid())
  name        String   @unique              // Tên khách hàng — key nhận diện chính
  phone       String?                       // SĐT (tùy chọn, không bắt buộc)
  address     String?                       // Địa chỉ dạng text (ghi chú)
  latitude    Float?                        // Vĩ độ GPS
  longitude   Float?                        // Kinh độ GPS
  notes       String?                       // Ghi chú thêm
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reports     DeliveryReport[]
}
```

> **Thay đổi quan trọng so với plan cũ:** `name` là `@unique` (thay vì `phone`), vì nhân viên nhận diện khách bằng tên, không phải số điện thoại. SĐT trở thành optional.

### 2.2. Cập nhật model `DeliveryReport`

```prisma
model DeliveryReport {
  // ... giữ nguyên tất cả field hiện tại ...
  customerName   String                    // GIỮ LẠI — backward-compatible
  
  // THÊM MỚI:
  customerId     String?                   // Nullable — dữ liệu cũ sẽ = null
  customer       Customer? @relation(fields: [customerId], references: [id])
}
```

> **Nguyên tắc:** `customerName` vẫn là field hiển thị chính. `customerId` là liên kết tùy chọn dùng để truy cập vị trí GPS. Dữ liệu lịch sử không bị ảnh hưởng.

---

## 3. Luồng UX (User Experience) End-to-End

### 3.1. Luồng chính: Nhân viên giao gas (GIỮ NGUYÊN cách nhập hiện tại)

```
Nhân viên mở form "Báo cáo giao gas"
  → Gõ tên khách vào ô input (GIỮ NGUYÊN ô input cũ)
  → Khi gõ, dropdown gợi ý xuất hiện BÊN DƯỚI ô input
     (hiển thị các khách hàng cũ có tên chứa từ đang gõ)
  → Nếu thấy đúng khách → Bấm chọn → Tự điền tên vào input
  → Nếu là khách mới → Cứ gõ tên mới, KHÔNG cần làm gì thêm
  → Nhập số lượng, đơn giá, thực nhận...
  → Ở CUỐI FORM có mục: "📍 Thêm vị trí khách hàng"
     • Bấm nút → Trình duyệt lấy GPS hiện tại
     • Hiện tọa độ xác nhận → Lưu vào Customer
     • (Tùy chọn, không bắt buộc — có thể bỏ qua)
  → Bấm "Gửi báo cáo"
  → HỆ THỐNG TỰ ĐỘNG:
     • Nếu tên khách đã tồn tại → liên kết customerId
     • Nếu tên khách CHƯA tồn tại → TẠO Customer mới → liên kết
     • Nếu có tọa độ GPS → lưu kèm vào Customer
```

> **Điểm mấu chốt:** Mọi thứ nằm trong 1 form duy nhất. Nhân viên gõ tên, nhập số liệu, ghim vị trí (nếu muốn), rồi submit. Xong.

### 3.2. Luồng Chỉ đường (lần giao sau)

```
Nhân viên xem bảng "Lịch sử giao Gas lớn" trên EmployeePage
  → Bên cạnh tên khách hàng, nếu khách ĐÃ có tọa độ GPS:
     Hiện icon 🗺️ (nhỏ, bên cạnh tên)
  → Bấm vào icon → Tự mở Google Maps → Chỉ đường tới nhà khách
  → Trên điện thoại: mở thẳng app Google Maps
  → Trên PC: mở tab Google Maps mới
```

> **Chức năng chỉ đường CHỈ DÀNH CHO NHÂN VIÊN.** Admin không cần tính năng này.

### 3.3. Trang Admin — Không thay đổi gì đáng kể

- Admin vẫn xem báo cáo bình thường
- Không hiện nút ghim vị trí hay chỉ đường
- (Tùy chọn Phase 2: Admin có thể xem danh sách khách hàng tổng quan)

---

## 4. Backend API

### 4.1. Module mới: `server/modules/customers/`

Tạo 3 file theo pattern hiện có:

```
server/modules/customers/
├── customers.controller.ts
├── customers.service.ts
└── customers.route.ts
```

### 4.2. Danh sách API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| `GET` | `/api/customers?search=xxx` | Tìm kiếm theo tên hoặc SĐT (Prisma `contains`, case-insensitive). Trả về tối đa 20 kết quả. | ✅ |
| `GET` | `/api/customers` | Lấy toàn bộ danh sách (cho tab Danh bạ). Hỗ trợ pagination nếu cần. | ✅ |
| `POST` | `/api/customers` | Tạo khách hàng mới. Body: `{ name, phone, address?, notes? }`. Validate `phone` unique. | ✅ |
| `PUT` | `/api/customers/:id` | Cập nhật thông tin khách (tên, SĐT, địa chỉ, ghi chú). | ✅ |
| `PUT` | `/api/customers/:id/location` | Cập nhật tọa độ GPS. Body: `{ latitude, longitude }`. API riêng biệt vì logic khác. | ✅ |
| `DELETE` | `/api/customers/:id` | Xóa khách hàng. Kiểm tra nếu có `DeliveryReport` liên kết thì set `customerId = null` thay vì block. | ✅ |

### 4.3. Cập nhật `server-core.ts`

```typescript
import customerRoutes from './modules/customers/customers.route.js';
// ...
app.use('/api/customers', customerRoutes);
```

### 4.4. Cập nhật Reports Service

Khi tạo `DeliveryReport` mới, nếu frontend gửi kèm `customerId`, service sẽ lưu kèm field này:

```typescript
// reports.service.ts — trong hàm createReport
customerId: data.customerId || null,
```

---

## 5. Frontend

### 5.1. Cập nhật `src/app/types.ts`

```typescript
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
}

// Cập nhật DeliveryReport:
export interface DeliveryReport {
  // ... giữ nguyên ...
  customerId?: string | null;
}
```

### 5.2. Cập nhật `DataContext.tsx`

Thêm vào context:

```typescript
// State
const [customers, setCustomers] = useState<Customer[]>([]);

// Functions
searchCustomers: (query: string) => Promise<Customer[]>;
addCustomer: (data: { name, phone, address?, notes? }) => Promise<Customer>;
updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
updateCustomerLocation: (id: string, lat: number, lng: number) => Promise<void>;
deleteCustomer: (id: string) => Promise<void>;
```

Fetch danh sách `customers` trong `fetchAllData()` cùng lúc với reports, employees, etc.

### 5.3. Gợi ý Autocomplete trên Input hiện tại

Không tạo component mới. **Sửa trực tiếp** ô input `customerName` hiện có trong `EmployeePage.tsx`:

```tsx
// GIỮ NGUYÊN input cũ, chỉ thêm logic gợi ý:
<div className="relative">
  <input
    type="text"
    value={formData.customerName}
    onChange={(e) => {
      setFormData({ ...formData, customerName: e.target.value });
      // Lọc gợi ý từ danh sách customers đã fetch sẵn
    }}
    placeholder="Nhập tên khách hàng"
    required
  />
  
  {/* Dropdown gợi ý — chỉ hiện khi đang gõ VÀ có kết quả */}
  {showSuggestions && filteredCustomers.length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
      {filteredCustomers.map(c => (
        <div key={c.id} onClick={() => selectCustomer(c)}
             className="px-4 py-3 hover:bg-orange-50 cursor-pointer">
          <span className="font-bold">{c.name}</span>
          {c.phone && <span className="text-gray-500 ml-2">({c.phone})</span>}
        </div>
      ))}
    </div>
  )}
</div>
```

**Logic lọc:** Lọc trực tiếp từ `customers` state (đã fetch sẵn khi load trang), không cần gọi API mỗi lần gõ. Đơn giản, nhanh, không lag.

### 5.4. Sửa `handleSubmit` — Tự động lưu khách mới + tọa độ GPS

Trong hàm `handleSubmit` của form báo cáo, thêm logic:

```typescript
// Sau khi validate form, trước khi gọi addDeliveryReport:
const existingCustomer = customers.find(
  c => c.name.toLowerCase() === formData.customerName.trim().toLowerCase()
);

let customerId: string | null = null;

if (existingCustomer) {
  // Khách quen → dùng ID có sẵn
  customerId = existingCustomer.id;
  // Nếu vừa ghim vị trí mới → cập nhật GPS cho khách cũ
  if (pinnedLocation) {
    await updateCustomerLocation(customerId, pinnedLocation.lat, pinnedLocation.lng);
  }
} else {
  // Khách mới → tự tạo Customer ngầm (kèm GPS nếu có)
  const newCustomer = await addCustomer({
    name: formData.customerName.trim(),
    latitude: pinnedLocation?.lat || null,
    longitude: pinnedLocation?.lng || null,
  });
  customerId = newCustomer.id;
}

// Gửi báo cáo kèm customerId
await addDeliveryReport({ ...reportData, customerId });
```

> **Nhân viên không cần biết:** Gõ tên → Nhập số liệu → Ghim vị trí (nếu muốn) → Submit → Xong.

### 5.5. Thêm mục "📍 Thêm vị trí" ở CUỐI form báo cáo

Đặt ngay trên nút "Gửi báo cáo", sau ô "Ghi chú":

```tsx
{/* === MỤC GHIM VỊ TRÍ KHÁCH HÀNG (cuối form) === */}
<div className="border-t border-gray-200 pt-5 mt-2">
  <label className="block text-sm font-bold text-gray-800 mb-2">
    📍 Vị trí khách hàng (tùy chọn)
  </label>
  
  {pinnedLocation ? (
    // Đã ghim → hiện tọa độ + nút xóa
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      <span className="text-green-700 font-bold">✅ Đã ghim:</span>
      <span className="text-green-900">
        {pinnedLocation.lat.toFixed(5)}, {pinnedLocation.lng.toFixed(5)}
      </span>
      <button onClick={() => setPinnedLocation(null)}>
        ❌ Bỏ ghim
      </button>
    </div>
  ) : (
    // Chưa ghim → nút lấy vị trí
    <button type="button" onClick={handleGetLocation}
      className="... bg-blue-50 border border-blue-200 ...">
      📍 Ghim vị trí hiện tại
    </button>
  )}
</div>

{/* NÚT GỬI BÁO CÁO (giữ nguyên) */}
<button type="submit">Gửi báo cáo</button>
```

> **State mới cần thêm:** `const [pinnedLocation, setPinnedLocation] = useState<{lat: number, lng: number} | null>(null);`

### 5.6. Hiện icon 🗺️ Chỉ đường trong bảng Lịch sử

Trong bảng "Lịch sử giao Gas lớn" hiện có, sửa cột "Khách hàng":

```tsx
// CŨ:
<td>{report.customerName}</td>

// MỚI:
<td className="flex items-center gap-2">
  <span>{report.customerName}</span>
  {report.customer?.latitude && report.customer?.longitude && (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${report.customer.latitude},${report.customer.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Chỉ đường tới nhà khách"
      className="text-blue-500 hover:text-blue-700"
    >
      🗺️
    </a>
  )}
</td>
```

> **Chỉ hiện icon khi khách đã có tọa độ GPS.** Click vào → mở Google Maps trên điện thoại.

### 5.6. Xử lý Edge Cases cho Geolocation

```typescript
const handlePinLocation = async (customerId: string) => {
  // 1. Kiểm tra browser có hỗ trợ không
  if (!navigator.geolocation) {
    toast.error('Trình duyệt không hỗ trợ định vị GPS');
    return;
  }

  // 2. Lấy tọa độ với timeout
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await updateCustomerLocation(customerId, latitude, longitude);
      toast.success(`Đã ghim vị trí: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    },
    (error) => {
      // 3. Xử lý từng loại lỗi
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật GPS trong cài đặt trình duyệt.');
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error('Không thể xác định vị trí. Hãy thử ra ngoài trời.');
          break;
        case error.TIMEOUT:
          toast.error('Hết thời gian chờ GPS. Vui lòng thử lại.');
          break;
      }
    },
    {
      enableHighAccuracy: true,  // Dùng GPS chính xác cao
      timeout: 15000,            // Chờ tối đa 15 giây
      maximumAge: 0              // Không dùng cache cũ
    }
  );
};
```

### 5.7. Nút Chỉ đường (Google Maps)

```tsx
{customer.latitude && customer.longitude && (
  <a
    href={`https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`}
    target="_blank"
    rel="noopener noreferrer"
    className="... button styles ..."
  >
    🗺️ Chỉ đường
  </a>
)}
```
> Link này tự động mở app Google Maps trên điện thoại, không cần API key.

---

## 6. Migration dữ liệu cũ

### Chiến lược: Không bắt buộc migrate

- Các `DeliveryReport` cũ giữ `customerId = null`, chỉ hiển thị `customerName` như bình thường.
- **Tùy chọn (Phase 2):** Viết script gom nhóm các `customerName` trùng nhau → tự tạo `Customer` và liên kết ngược lại. Nhưng đây là optional, không cần làm ngay.

---

## 7. Lộ trình Thực hiện (Chi tiết)

| Bước | Công việc | Thời gian | File liên quan |
|------|-----------|-----------|----------------|
| **1** | Thêm model `Customer` + cập nhật `DeliveryReport` trong Prisma schema, chạy `prisma db push` | 10 min | `prisma/schema.prisma` |
| **2** | Tạo module backend: `customers.service.ts`, `customers.controller.ts`, `customers.route.ts` | 30 min | `server/modules/customers/*` |
| **3** | Mount route mới vào `server-core.ts`, cập nhật `reports.service.ts` | 5 min | `server/server-core.ts`, `reports.service.ts` |
| **4** | Cập nhật `types.ts` (thêm interface `Customer`, sửa `DeliveryReport`) | 5 min | `src/app/types.ts` |
| **5** | Cập nhật `DataContext.tsx` (thêm state + hàm cho customers) | 20 min | `src/app/context/DataContext.tsx` |
| **6** | Sửa form báo cáo: thêm dropdown gợi ý + mục ghim vị trí cuối form | 35 min | `src/app/pages/EmployeePage.tsx` |
| **7** | Sửa `handleSubmit`: tự tạo Customer + lưu GPS khi submit | 15 min | `src/app/pages/EmployeePage.tsx` |
| **8** | Thêm icon 🗺️ chỉ đường trong bảng lịch sử (bên cạnh tên khách) | 15 min | `src/app/pages/EmployeePage.tsx` |
| **9** | Cập nhật backend `reports` để include customer data khi trả về | 10 min | `server/modules/reports/reports.service.ts` |
| **10** | Test trên điện thoại thực tế (GPS, Google Maps, responsive) | 20 min | — |
| | **Tổng ước tính** | **~2.5 giờ** | |

> **Lưu ý:** AdminPage KHÔNG cần sửa. Chức năng vị trí/chỉ đường chỉ trên EmployeePage.

---

## 8. Checklist trước khi bắt tay code

- [x] ~~SĐT là key nhận diện?~~ → **Không, dùng Tên (`name`) làm key.** SĐT là optional.
- [x] ~~Chỉ đường cho Admin?~~ → **Không, chỉ dành cho Nhân viên.**
- [x] ~~Tab Danh bạ riêng?~~ → **Không, tích hợp trực tiếp vào form báo cáo + bảng lịch sử.**
- [ ] Xác nhận: Plan OK → Bắt đầu code từ Bước 1?
