# Smart Map Web System

Hệ thống Dashboard quản lý bản đồ dẫn đường trong nhà (cho trường học, khu du lịch) sử dụng iTag/Beacon và thiết bị ESP32.

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS 3 + React Router + Axios
- **Backend**: Spring Boot 4 (Java 21) + Spring Data JPA + Spring WebSocket
- **Database**: Microsoft SQL Server 2019+
- **Migration**: Flyway

## Cấu trúc thư mục

```
smart_map/
├── src/main/java/com/fpt/edu/vn/smart_map/
│   ├── SmartMapApplication.java
│   ├── common/                  # DTO response chuẩn, exception handler
│   │   ├── dto/ApiResponse.java
│   │   └── exception/
│   │       ├── ApiException.java
│   │       └── GlobalExceptionHandler.java
│   ├── config/                  # CORS, FileStorage config
│   │   ├── CorsConfig.java
│   │   └── FileStorageConfig.java
│   ├── controller/              # REST controllers
│   ├── service/                 # Business logic
│   ├── repository/              # JPA repositories
│   ├── entity/                  # JPA entities
│   └── dto/                     # Request/Response DTOs
│
├── src/main/resources/
│   ├── application.properties   # Config DB, Flyway, Upload
│   └── db/migration/            # Flyway SQL migrations
│       ├── V1__init_schema.sql
│       ├── V2__init_history.sql
│       └── V3__init_sos.sql
│
├── frontend/
│   └── src/
│       ├── api/                 # Axios client + API wrappers
│       │   ├── client.js
│       │   ├── mapApi.js
│       │   └── imageUrl.js
│       ├── components/          # Reusable components
│       │   └── UploadMapModal.jsx
│       ├── layouts/             # Layout components
│       │   └── AdminLayout.jsx
│       ├── pages/               # Trang chính
│       │   ├── DashboardHome.jsx
│       │   └── MapsPage.jsx
│       ├── App.jsx
│       └── main.jsx
│
└── uploads/maps/                # (auto-created) Thư mục lưu ảnh upload
```

## Setup lần đầu (mỗi người trên máy mình)

### 1. Cài SQL Server & tạo database
```sql
CREATE DATABASE smart_map;
```

### 2. Sửa `src/main/resources/application.properties`
Đổi `spring.datasource.username` và `spring.datasource.password` cho đúng máy bạn.

### 3. Chạy backend
```bash
mvn spring-boot:run
```
Lần đầu chạy, Flyway sẽ tự động tạo 4 bảng (`maps`, `stations`, `devices`, `check_in_history`, `sos_alerts`).

### 4. Chạy frontend
```bash
cd frontend
npm install
npm run dev
```
Mở http://localhost:5173

## Quy ước làm việc nhóm (2 người)

### Git branches
- `main` — nhánh chính, luôn chạy được
- `feature/<tên>-<module>` — mỗi người 1 branch
- Ví dụ: `feature/A-module-map`, `feature/B-module-station`

### Khi thêm/sửa database
- **KHÔNG sửa** file `V*.sql` đã commit
- Tạo file mới: `V4__add_xxx.sql`, `V5__add_yyy.sql`
- Commit file mới vào git → cả team pull về DB tự update

### Khi thêm API mới
- Controller trả về `ApiResponse<T>` (wrapper chuẩn)
- Validate input bằng `@Valid` + annotation trong DTO
- Throw `ApiException(code, message)` thay vì `RuntimeException`

### Phân chia module (Sprint 1)
| Module | Người phụ trách |
|--------|-----------------|
| Module 1: Quản lý Bản đồ | Người A |
| Module 2: Quản lý Trạm Beacon | Người B |
| Module 3: Quản lý Thiết bị ESP32 | (Sprint 2) |
| Module 4: Lịch sử & Thống kê | (Sprint 3) |
| Module 5: SOS Real-time | (Sprint 3) |
| Module 6: C++ Code Generator | (Sprint 2) |

## API Endpoints hiện có (Module 1)

| Method | URL | Mô tả |
|--------|-----|--------|
| GET | /api/maps | Danh sách tất cả bản đồ |
| GET | /api/maps/active | Danh sách bản đồ đang active |
| GET | /api/maps/{id} | Chi tiết 1 bản đồ |
| POST | /api/maps | Upload bản đồ mới (multipart) |
| PUT | /api/maps/{id} | Cập nhật thông tin (JSON) |
| PATCH | /api/maps/{id}/image | Thay ảnh mới (multipart) |
| DELETE | /api/maps/{id} | Xóa bản đồ |

Ảnh upload truy cập qua: `http://localhost:8080/files/maps/{filename}`
