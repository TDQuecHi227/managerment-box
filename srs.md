# Software Requirements Specification (SRS)

## Hệ thống quản lý thành viên Box Chat Game

| Thuộc tính | Giá trị |
|---|---|
| Tên dự án | Box Chat Management System (tên tạm) |
| Tài liệu | Software Requirements Specification (SRS) |
| Phiên bản | 0.2 — bản nháp để duyệt |
| Ngày cập nhật | 28/10/2026 |
| Ngôn ngữ | Tiếng Việt |
| Đối tượng triển khai | Codex / nhóm phát triển |
| Trạng thái | **Chưa phê duyệt triển khai** — còn các quyết định tại mục 12 |

> **Quy ước:** `[CONFIRMED]` là yêu cầu người dùng đã xác nhận; `[PROPOSED]` là đề xuất cần xem xét; `[TBD]` là chưa quyết định, **không được tự giả định thành quy tắc nghiệp vụ**. Khi triển khai, dùng những yêu cầu `[CONFIRMED]` làm căn cứ; các yêu cầu `[PROPOSED]` chỉ được thực hiện sau khi người dùng chấp thuận.

---

## 1. Giới thiệu

### 1.1. Mục đích

Website dùng để quản lý thành viên của một box chat thuộc cộng đồng game, quản lý hai hình thức đóng góp (nộp tài khoản Clone hoặc Donate tiền), kiểm duyệt, theo dõi **KPI Clone** và trạng thái Donate, ghi nhận vi phạm KPI Clone và xác định số Clone vượt định mức của những thành viên được Admin chỉ định nhận tiền Donate. **Thành viên Donate không áp dụng KPI.**

Tài liệu xác định yêu cầu nghiệp vụ, chức năng, trạng thái, dữ liệu và phạm vi MVP để làm đầu vào thiết kế UX/UI, database, API và kiểm thử. Tài liệu **không** phải đặc tả kiến trúc hoặc thiết kế database cuối cùng.

### 1.2. Phạm vi và đối tượng sử dụng

- `[CONFIRMED]` Quy mô ban đầu: **dưới 50 thành viên**.
- `[CONFIRMED]` Có người dùng `Member` và `Admin`.
- `[CONFIRMED]` Mỗi Member chọn **một** hình thức đóng góp tại một thời điểm: `CLONE` hoặc `DONATE`; không đồng thời cả hai.
- `[CONFIRMED]` Admin có quyền quản lý thành viên, kiểm duyệt đóng góp, giám sát KPI và quyết định xử lý vi phạm.
- `[CONFIRMED]` Có danh sách thành viên **nhận tiền Donate**, chỉ bao gồm các Member đóng góp Clone và được Admin chỉ định.
- `[TBD]` Tên game, tên box, nhận diện thương hiệu, nền tảng chat và phương thức đăng nhập.

### 1.3. Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| Member Clone | Thành viên chọn nộp danh sách tài khoản Clone. |
| Member Donate | Thành viên chọn Donate tiền. |
| Donation Recipient | Member Clone được Admin chỉ định thuộc danh sách xét nhận tiền Donate; **không phải** một vai trò đăng nhập độc lập. |
| KPI | Chỉ tiêu số tài khoản Clone cần nộp trong một tuần; **không áp dụng cho Donate**. |
| Ghi chú Clone | Chuỗi ghi tắt hoặc khoảng tài khoản, ví dụ `baowibu01-10`; cách diễn giải/kiểm tra chính xác chờ chốt. |
| Clone hợp lệ | Tài khoản Clone trong một lần nộp đã được Admin chấp thuận. |
| Clone vượt mức | `max(0, số Clone hợp lệ của tháng - 100)` theo quy tắc tạm thời. |
| Kỳ KPI | Khoảng thời gian hệ thống dùng để đánh giá đóng góp. |

---

## 2. Vai trò và phân quyền

### 2.1. Mô hình phân quyền

- `systemRole`: `ADMIN` hoặc `MEMBER` (quyền truy cập).
- `contributionType` đối với Member: `CLONE` hoặc `DONATE` (nghĩa vụ đóng góp).
- `isDonationRecipient` / bản ghi chỉ định theo kỳ: chỉ áp dụng cho thành viên có `contributionType=CLONE`.
- `[PROPOSED]` Nếu Admin cũng đóng góp, quyền Admin và hình thức đóng góp được quản lý độc lập; Admin không cần đổi vai trò để nộp.

### 2.2. Ma trận quyền

| Hành động | Member Clone | Member Donate | Admin |
|---|:---:|:---:|:---:|
| Xem hồ sơ và lịch sử của bản thân; KPI chỉ với Clone | ✓ | ✓ (không có KPI) | ✓ |
| Gửi danh sách Clone | ✓ | — | Theo quyền đóng góp cá nhân, nếu có |
| Gửi Donate và ảnh minh chứng | — | ✓ | Theo quyền đóng góp cá nhân, nếu có |
| Xem/duyệt/từ chối đóng góp của người khác | — | — | ✓ |
| Quản lý thành viên và hình thức đóng góp | — | — | ✓ |
| Cấu hình mức KPI | — | — | ✓ |
| Chỉ định danh sách nhận Donate | — | — | ✓ |
| Xem số Clone vượt mức của bản thân | Nếu được chỉ định | — | ✓ toàn bộ |
| Quyết định xử lý vi phạm | — | — | ✓ |
| Xem toàn bộ thông tin thu/chi | — | — | ✓ |

`[PROPOSED]` Thành viên không được xem danh sách tài khoản Clone, ảnh Donate hoặc thông tin nhạy cảm của người khác.

---

## 3. Các quy tắc nghiệp vụ đã xác nhận

| ID | Quy tắc | Trạng thái |
|---|---|---|
| BR-01 | Member chỉ chọn một hình thức `CLONE` hoặc `DONATE` tại cùng một thời điểm. | `[CONFIRMED]` |
| BR-02 | Member Clone nhập **số lượng** và gửi **danh sách/ghi chú tài khoản Clone** cùng một yêu cầu; có thể ghi tắt như `baowibu01-10`. | `[CONFIRMED]` |
| BR-03 | Admin kiểm tra và duyệt danh sách Clone trước khi đóng góp được xác nhận. | `[CONFIRMED]` |
| BR-04 | KPI Clone tối thiểu tạm thời: **25 tài khoản/tuần**; con số có thể thay đổi. Mốc **30** đã được đề cập nhưng chưa phải nghĩa vụ tối thiểu thứ hai. | `[CONFIRMED]` |
| BR-05 | Member Donate **tự chọn/nhập số tiền**, upload ảnh minh chứng và submit. Đây là yêu cầu mới **thay thế** giả định mức Donate cố định trước đó. | `[CONFIRMED]` |
| BR-06 | Admin kiểm tra và duyệt từng yêu cầu Donate. | `[CONFIRMED]` |
| BR-07 | Admin theo dõi **KPI Clone** và quyết định hình thức xử lý khi thành viên Clone không đạt. Không tự động áp dụng hình phạt. | `[CONFIRMED]` |
| BR-08 | Chỉ Member Clone được Admin chỉ định mới có thể thuộc danh sách nhận tiền Donate. | `[CONFIRMED]` |
| BR-09 | Định mức Clone tháng **tạm tính 4 × 25 = 100 tài khoản**. | `[CONFIRMED]` |
| BR-10 | Đối với người được chỉ định, Clone vượt mức = tổng Clone hợp lệ tháng − 100; không có phần vượt dương thì số vượt dùng để xét nhận tiền là 0. | `[CONFIRMED]` + cách chặn về 0 là `[PROPOSED]` |
| BR-11 | Số Clone vượt mức là **căn cứ xét nhận tiền**, không phải số tiền được nhận. Công thức tính và phân phối tiền chưa được cung cấp. | `[CONFIRMED]` |
| BR-12 | Số lượng thành viên ban đầu dưới 50. | `[CONFIRMED]` |
| BR-13 | **Donate không có KPI** và không có ngưỡng KPI tối thiểu. Thành viên nhập số tiền muốn chuyển; Admin đối chiếu số tiền thực nhận với số đã khai báo rồi duyệt/từ chối. | `[CONFIRMED]` |

**Ràng buộc quan trọng:** Không được tự viết công thức trả tiền, áp KPI Donate, tự xử phạt hoặc tự động chuyển tiền khi chưa có quyết định bổ sung. Việc đối chiếu **đúng số tiền** là so giữa số tiền Member đã khai báo và giao dịch thực nhận, **không phải** so với một ngưỡng KPI.

---

## 4. Yêu cầu chức năng — Member

### 4.1. Tài khoản và hồ sơ

- **FR-001** `[PROPOSED]` Có đăng nhập, đăng xuất và kiểm soát phiên truy cập.
- **FR-002** `[PROPOSED]` Hồ sơ hiển thị tên trong box, tên trong game (nếu có), ngày gia nhập, hình thức đóng góp và trạng thái thành viên.
- **FR-003** `[CONFIRMED]` Một thành viên chỉ có một hình thức đóng góp đang hiệu lực.
- **FR-004** `[TBD]` Ai chọn/duyệt việc đổi hình thức đóng góp và thay đổi có hiệu lực từ khi nào.

### 4.2. Nộp Clone

- **FR-010** `[CONFIRMED]` Member Clone nhập số lượng tài khoản và danh sách/ghi chú tài khoản Clone trong một biểu mẫu.
- **FR-011** `[CONFIRMED]` Trường ghi chú/danh sách Clone hỗ trợ cách viết rút gọn như **`baowibu01-10`**, không bắt buộc một tài khoản trên mỗi dòng. Giữ nguyên chuỗi Member đã nhập để Admin đối chiếu. **Chưa tự quy định cú pháp giải mã hoặc tự suy ra số tài khoản từ chuỗi này** (`[TBD]`).
- **FR-012** `[PROPOSED]` Hiển thị số lượng do Member nhập để Admin đối chiếu với ghi chú. Việc tự đếm từ ký pháp dạng khoảng, cảnh báo/chặn nếu lệch chỉ thực hiện khi cú pháp được xác nhận.
- **FR-013** `[PROPOSED]` Kiểm tra ghi chú rỗng và dữ liệu bất thường; kiểm tra trùng tài khoản tự động chỉ sau khi có quy tắc phân tích khoảng và tái sử dụng tài khoản `[TBD]`.
- **FR-014** `[CONFIRMED]` Sau khi submit, yêu cầu ở trạng thái chờ Admin kiểm tra; không tự tính là Clone đã được duyệt.
- **FR-015** `[PROPOSED]` Member xem danh sách những lần nộp của bản thân, số đã duyệt, số bị từ chối và lý do.
- **FR-016** `[PROPOSED]` Một Member có thể nộp nhiều lần trong tuần; KPI tính tổng tài khoản được duyệt của kỳ nếu quy tắc trùng lặp cho phép.
- **FR-017** `[TBD]` Cú pháp ghi chú Clone (ví dụ `baowibu01-10` có nghĩa chính xác là những tài khoản nào, số 0 đầu, nhiều khoảng), danh sách chứa loại định danh nào và có được nộp lại cùng Clone ở tuần khác hay không.

### 4.3. Donate

- **FR-020** `[CONFIRMED]` Member Donate nhập **số tiền VNĐ tự chọn**, đính kèm ảnh minh chứng, submit.
- **FR-021** `[CONFIRMED]` Yêu cầu Donate phải chờ Admin kiểm tra/duyệt.
- **FR-022** `[PROPOSED]` Form hiển thị thông tin thanh toán do Admin cấu hình, ngày nộp và số tiền khai báo.
- **FR-023** `[PROPOSED]` Member xem trạng thái, số tiền được xác nhận, lịch sử và lý do từ chối.
- **FR-024** `[PROPOSED]` Chỉ cộng khoản tiền vào tổng Donate đã nhận khi Admin xác nhận giao dịch thực tế **đúng số tiền Member khai báo**.
- **FR-025** `[CONFIRMED]` Member Donate **không cần đạt KPI**. Không tính % KPI, trạng thái đạt/chưa đạt KPI hay vi phạm KPI cho Donate; chỉ ghi nhận khoản Donate được Admin duyệt khi đối chiếu đúng số tiền đã khai báo. `[TBD]` Có cho gửi nhiều khoản Donate trong tháng hay không.

### 4.4. Dashboard Member

- **FR-030** `[CONFIRMED]` Dashboard theo hình thức đóng góp: Member Clone thấy KPI; Member Donate thấy trạng thái nộp/duyệt Donate, **không có KPI**.
- **FR-031** `[PROPOSED]` Member Clone thấy số đã duyệt, số đang chờ, mức tuần, còn thiếu và thời hạn.
- **FR-032** `[PROPOSED]` Member Donate thấy số tiền đã khai báo, số tiền được xác nhận và trạng thái giao dịch theo tháng; **không hiển thị tiến độ hay kết quả KPI**.
- **FR-033** `[PROPOSED]` Có lịch sử các kỳ KPI và các yêu cầu đã gửi.
- **FR-034** `[PROPOSED]` Member Clone được chỉ định nhận Donate có thể xem số Clone hợp lệ tháng, định mức và số vượt (chưa hiển thị tiền cho đến khi có công thức).

---

## 5. Yêu cầu chức năng — Admin

### 5.1. Dashboard tổng quan

- **FR-100** `[CONFIRMED]` Xem tổng thành viên, thống kê Clone, Donate và tình trạng **KPI Clone**.
- **FR-101** `[PROPOSED]` Xem số yêu cầu Clone/Donate chờ duyệt, số thành viên Clone đạt/chưa đạt KPI và trạng thái Donate, lọc theo kỳ.
- **FR-102** `[PROPOSED]` Tách tổng tiền Donate đã xác nhận và yêu cầu đang chờ; không cộng tiền chưa được xác nhận.

### 5.2. Quản lý thành viên

- **FR-110** `[CONFIRMED]` Admin quản lý danh sách thành viên và hình thức đóng góp.
- **FR-111** `[PROPOSED]` Tìm kiếm, lọc theo hình thức, trạng thái, KPI; xem chi tiết và lịch sử thành viên.
- **FR-112** `[PROPOSED]` Hỗ trợ trạng thái `ACTIVE`, `INACTIVE`, `LEFT` (tên và cơ chế còn duyệt).
- **FR-113** `[TBD]` Quy trình đăng ký/tham gia: tự đăng ký, mã mời hay Admin tạo tài khoản.

### 5.3. Kiểm duyệt Clone

- **FR-120** `[CONFIRMED]` Admin xem danh sách yêu cầu và kiểm tra dữ liệu tài khoản Clone.
- **FR-121** `[CONFIRMED]` Admin có thể duyệt hoặc từ chối yêu cầu nộp.
- **FR-122** `[PROPOSED]` Cho phép duyệt một phần danh sách (ví dụ 8/10 tài khoản), đánh dấu từng tài khoản hợp lệ/không hợp lệ kèm lý do.
- **FR-123** `[PROPOSED]` Ghi thời gian, người duyệt, kết quả và lý do; không sửa âm thầm bản ghi gốc.
- **FR-124** `[PROPOSED]` Sau khi duyệt, hệ thống cập nhật tổng Clone hợp lệ kỳ tuần và tháng tương ứng.

### 5.4. Kiểm duyệt Donate

- **FR-130** `[CONFIRMED]` Admin xem số tiền khai báo và ảnh minh chứng của yêu cầu Donate.
- **FR-131** `[CONFIRMED]` Admin duyệt hoặc từ chối.
- **FR-132** `[CONFIRMED]` Admin đối chiếu **số tiền thực nhận** với **số tiền Member tự khai báo** trước khi duyệt; có thể ghi chú lý do từ chối. Không sử dụng mức Donate KPI cố định.
- **FR-133** `[PROPOSED]` Các giao dịch đã duyệt tạo bản ghi thu tiền để theo dõi tổng quỹ; không cho cùng một giao dịch được ghi nhận hai lần.

### 5.5. KPI và vi phạm

- **FR-140** `[CONFIRMED]` Theo dõi trạng thái hoàn thành **KPI Clone theo tuần**; Donate chỉ theo dõi giao dịch và số tiền được duyệt theo tháng, **không đánh giá KPI**.
- **FR-141** `[CONFIRMED]` Admin có thể thay đổi mức KPI Clone; mức tạm thời là 25/tuần.
- **FR-142** `[PROPOSED]` Các thay đổi cấu hình chỉ có hiệu lực từ kỳ tương lai, lưu lại ngưỡng áp dụng cho từng kỳ cũ.
- **FR-143** `[PROPOSED]` Tách `IN_PROGRESS` (kỳ còn mở, chưa đủ), `ACHIEVED` (đã đạt), `MISSED` (kỳ kết thúc không đạt), `EXEMPT` (được miễn nếu tính năng này được thông qua).
- **FR-144** `[CONFIRMED]` Admin chọn hình thức xử lý vi phạm; hệ thống không tự áp dụng hình phạt.
- **FR-145** `[PROPOSED]` Lưu quyết định xử lý, lý do, thời điểm và người quyết định.
- **FR-146** `[TBD]` Quy tắc kỳ KPI Clone (thứ bắt đầu/kết thúc), nghỉ phép, nộp bù, thành viên mới giữa kỳ và quy tắc khi Admin duyệt trễ.

### 5.6. Danh sách nhận tiền Donate

- **FR-150** `[CONFIRMED]` Admin chỉ định và quản lý danh sách thành viên nhận tiền Donate.
- **FR-151** `[CONFIRMED]` Chỉ thành viên thuộc hình thức `CLONE` mới được chỉ định.
- **FR-152** `[CONFIRMED]` Định mức tháng ban đầu: 100 Clone = 4 × 25.
- **FR-153** `[CONFIRMED]` Hệ thống tính tổng Clone đã duyệt trong tháng cho từng người được chỉ định, sau đó xác định phần vượt định mức.
- **FR-154** `[PROPOSED]` Hiển thị `monthlyApprovedClones`, `baselineClones=100`, `excessClones=max(0, monthlyApprovedClones-baselineClones)`.
- **FR-155** `[PROPOSED]` Ghi thời gian bắt đầu/kết thúc chỉ định để có thể kiểm tra lịch sử.
- **FR-156** `[TBD]` Khi người được chỉ định đạt số Clone vượt mức, **không** tự tính số VNĐ, không tự ghi nhận công nợ, không chi trả tự động.
- **FR-157** `[TBD]` Công thức tiền, quỹ phân phối, làm tròn, ngày chốt, đối soát và trạng thái chi trả sẽ bổ sung sau.

### 5.7. Quản lý quỹ và báo cáo

- **FR-160** `[CONFIRMED]` Admin xem và quản lý các khoản Donate đã được duyệt.
- **FR-161** `[PROPOSED]` Bảng thu Donate có thể lọc theo tháng, thành viên, trạng thái.
- **FR-162** `[PROPOSED]` Về sau bổ sung sổ chi/phân phối để phân biệt tổng thu, tổng chi và số dư; **chưa đưa thuật toán phân phối vào MVP**.
- **FR-163** `[PROPOSED]` Xuất Excel/CSV và báo cáo nâng cao ở giai đoạn sau.

---

## 6. Luồng nghiệp vụ và trạng thái

### 6.1. Luồng nộp Clone

1. Member Clone mở biểu mẫu của kỳ hiện tại.
2. Nhập số lượng và danh sách/ghi chú tài khoản (có thể dùng `baowibu01-10`); gửi yêu cầu.
3. Hệ thống tạo `CloneSubmission` trạng thái `PENDING`, lưu nguyên văn ghi chú. Việc tách thành từng tài khoản chỉ thực hiện nếu quy tắc cú pháp được duyệt.
4. Admin kiểm tra, duyệt/từ chối (duyệt từng dòng là đề xuất).
5. Chỉ tài khoản hợp lệ được duyệt được tính vào tiến độ KPI.
6. Tổng tháng của Member Clone cập nhật từ các bản ghi hợp lệ, không lấy trực tiếp số Member khai báo.

**Trạng thái đề xuất:** `PENDING`, `APPROVED`, `PARTIALLY_APPROVED`, `REJECTED`. Trạng thái từng dòng: `PENDING`, `APPROVED`, `REJECTED`.

### 6.2. Luồng Donate

1. Member Donate nhập số tiền VNĐ và upload ảnh chứng minh.
2. Gửi yêu cầu; trạng thái `PENDING`.
3. Admin đối chiếu giao dịch thực nhận, đặc biệt là **số tiền phải khớp số tiền Member nhập**.
4. Duyệt `APPROVED` hoặc từ chối `REJECTED` kèm lý do.
5. Chỉ giao dịch `APPROVED` được tính vào tổng thu.

**Trạng thái đề xuất:** `PENDING`, `APPROVED`, `REJECTED`. Không sử dụng trạng thái `OVERDUE` hay `MISSED_KPI` cho Donate.

### 6.3. Luồng KPI

- Với Clone: tổng số tài khoản hợp lệ thuộc kỳ tuần so với ngưỡng tuần.
- Với Donate: **không áp dụng KPI**. Hệ thống chỉ hiển thị yêu cầu Donate và tổng tiền đã duyệt; số tiền chuyển thực tế phải khớp số tiền Member khai báo.
- Khi kỳ KPI Clone đóng: lưu kết quả kỳ; Admin xem trường hợp không đạt, rồi lựa chọn xử lý.
- `[TBD]` Định nghĩa chính xác kỳ tuần/tháng, múi giờ, thời điểm ghi nhận (ngày nộp hay ngày duyệt).

### 6.4. Luồng danh sách nhận Donate

1. Admin chọn một Member Clone và thêm vào danh sách được nhận Donate.
2. Hệ thống tổng hợp Clone hợp lệ trong tháng của người này.
3. Hiển thị định mức tạm thời 100 Clone, số Clone đã duyệt và số vượt.
4. **Dừng tại kết quả Clone vượt**. Không hiển thị tiền nhận, không tính chi trả khi chưa có công thức.

**Ví dụ (giả định tất cả Clone đã được duyệt):**

| Member | Được chỉ định | Clone tháng | Số vượt dùng để xét |
|---|---|---:|---:|
| A | Có | 150 | 50 |
| B | Có | 120 | 20 |
| C | Không | 130 | Không thuộc danh sách xét nhận |
| D | Có | 90 | 0 |

---

## 7. Màn hình và điều hướng dự kiến

### 7.1. Member

1. Đăng nhập / truy cập tài khoản (`[PROPOSED]` phương thức).
2. Dashboard cá nhân: KPI tuần cho Clone **hoặc** trạng thái Donate, các yêu cầu chờ duyệt và lịch sử.
3. Nộp Clone (chỉ Member Clone): số lượng + danh sách/ghi chú dạng `baowibu01-10`.
4. Nộp Donate (chỉ Member Donate): số tiền + upload ảnh.
5. Lịch sử đóng góp và trạng thái kiểm duyệt.
6. Hồ sơ cá nhân.
7. `[PROPOSED]` Phần tổng hợp Clone vượt tháng khi được Admin chỉ định.

### 7.2. Admin

1. Dashboard: số thành viên, các yêu cầu chờ, Clone/Donate, **KPI Clone**.
2. Quản lý thành viên, phân loại đóng góp.
3. Hàng đợi kiểm duyệt Clone.
4. Hàng đợi kiểm duyệt Donate và tổng thu.
5. Quản lý KPI, kỳ và vi phạm.
6. Danh sách thành viên nhận Donate và tổng Clone vượt.
7. Cấu hình các ngưỡng KPI.

Các mục có thể là trang, tab hoặc modal; **chưa bắt buộc một URL cho mỗi chức năng**.

---

## 8. Mô hình dữ liệu khái niệm (chưa phải schema cuối)

| Entity | Nội dung cốt lõi |
|---|---|
| `User` | ID, tên hiển thị, thông tin đăng nhập, `systemRole`, trạng thái. |
| `MemberProfile` | `userId`, thông tin game, `contributionType`, ngày tham gia. |
| `KPISetting` | KPI **Clone**, giá trị, đơn vị, ngày/kỳ hiệu lực, người cấu hình. |
| `KPIPeriod` | ID kỳ KPI Clone, thời gian tuần bắt đầu/kết thúc, ngưỡng áp dụng, trạng thái. |
| `CloneSubmission` | ID, người nộp, kỳ, số khai báo, **ghi chú gốc** (vd `baowibu01-10`), thời gian nộp, trạng thái, người duyệt. |
| `CloneSubmissionItem` | `[PROPOSED]` Chỉ tạo khi có quy tắc tách ghi chú được chốt: ID, `submissionId`, định danh tài khoản, trạng thái, lý do từ chối. |
| `DonationSubmission` | ID, người nộp, số tiền VNĐ, tham chiếu ảnh, kỳ, trạng thái, thời điểm/nhân sự duyệt. |
| `DonationRecipientAssignment` | ID, người được chỉ định, Admin chỉ định, thời điểm hiệu lực và kết thúc. |
| `MonthlyCloneSummary` | `userId`, kỳ tháng, tổng Clone được duyệt, định mức chốt, số Clone vượt. Có thể là dữ liệu tính toán, chưa chắc cần lưu. |
| `KPIResult` | `userId` của Member Clone, kỳ KPI tuần, số thực hiện, ngưỡng, trạng thái. **Không tạo KPIResult cho Donate.** |
| `ViolationAction` | `userId`, kỳ, loại quyết định, ghi chú, Admin, thời điểm. |
| `AuditLog` | Chủ thể, hành động, đối tượng, dữ liệu thay đổi phù hợp, thời điểm. |

**Các quan hệ chính:** `User` 1–1 `MemberProfile`; `User` 1–N `CloneSubmission` hoặc `DonationSubmission`; `CloneSubmission` 1–N `CloneSubmissionItem`; `User` 1–N `DonationRecipientAssignment` theo thời gian; `User` 1–N `KPIResult`.

**Không cần lưu** mật khẩu tài khoản game trong `CloneSubmissionItem`; chỉ nên lưu mã/UID cần thiết sau khi xác định định dạng danh sách.

---

## 9. Yêu cầu phi chức năng và an toàn dữ liệu

> Phần này là **đề xuất kỹ thuật** nhằm hỗ trợ triển khai an toàn, chưa phải các SLA người dùng đã chốt.

- **NFR-01** `[PROPOSED]` Giao diện responsive, ưu tiên thao tác trên điện thoại.
- **NFR-02** `[PROPOSED]` Chỉ người có quyền được truy cập API quản trị; không chỉ ẩn nút trên UI.
- **NFR-03** `[PROPOSED]` Ảnh minh chứng thanh toán được lưu riêng tư; giới hạn định dạng/dung lượng, kiểm tra loại tệp, dùng URL truy cập có kiểm soát.
- **NFR-04** `[PROPOSED]` Không lưu mật khẩu hoặc thông tin xác thực tài khoản Clone; tránh công khai UID/tên tài khoản ngoài người có quyền.
- **NFR-05** `[PROPOSED]` Mọi thao tác duyệt/từ chối, đổi KPI, thêm/xóa người nhận Donate và sửa giao dịch đều có audit log.
- **NFR-06** `[PROPOSED]` API xử lý gửi/duyệt bảo đảm không ghi nhận trùng khi nhấn Submit hoặc retry.
- **NFR-07** `[PROPOSED]` Giá trị tiền dùng số nguyên VNĐ; không dùng số thực để cộng/trừ tiền.
- **NFR-08** `[PROPOSED]` Lưu timestamp nhất quán; hiển thị ngày giờ theo `Asia/Ho_Chi_Minh`, nếu đây là múi giờ vận hành của box.
- **NFR-09** `[PROPOSED]` Sao lưu dữ liệu định kỳ, có khả năng phục hồi dữ liệu.
- **NFR-10** `[PROPOSED]` Không làm thay đổi kết quả các kỳ đã chốt chỉ vì cấu hình KPI mới.
- **NFR-11** `[TBD]` Nhà cung cấp hosting, frontend/backend/database, uptime và chính sách lưu/xóa bằng chứng thanh toán.

---

## 10. Phạm vi triển khai (đề xuất)

### 10.1. MVP — ưu tiên sau khi duyệt SRS

1. Đăng nhập và phân quyền Admin/Member.
2. Hồ sơ thành viên và một hình thức đóng góp hiệu lực.
3. Member Clone: nhập số lượng, danh sách/ghi chú như `baowibu01-10`, submit, xem lịch sử.
4. Admin: xem và duyệt/từ chối Clone; ghi nhận số hợp lệ.
5. Member Donate: nhập số tiền, upload ảnh, submit, xem lịch sử.
6. Admin: xem và duyệt/từ chối Donate; tổng hợp tiền đã xác nhận.
7. KPI Clone tuần và dashboard thống kê đạt/chưa đạt; Donate chỉ hiển thị lịch sử và trạng thái giao dịch, **không có KPI**.
8. Admin quản lý thành viên, theo dõi và ghi nhận quyết định xử lý vi phạm.
9. Admin chỉ định Member Clone nhận Donate, xem tổng Clone hợp lệ tháng và số vượt mốc 100.
10. Cấu hình mức Clone; lưu lịch sử kiểm duyệt và quyền truy cập phù hợp.

### 10.2. Giai đoạn sau — ngoài MVP

- Công thức chia/quy đổi tiền Donate cho thành viên nhận tiền, ghi nhận chi trả và đối soát quỹ.
- Bot nhắc KPI, thông báo qua ứng dụng chat.
- Xin nghỉ/miễn KPI và thay đổi hình thức đóng góp bằng workflow.
- Export Excel/CSV, báo cáo nâng cao.
- Tự động đối soát chuyển khoản.
- Xếp hạng, thưởng/phạt tự động (chỉ khi có quy định rõ).

---

## 11. Tiêu chí nghiệm thu mức nghiệp vụ (Acceptance Criteria)

### AC-01 — Nộp Clone và duyệt

**Given** Member thuộc nhóm Clone, **when** gửi số lượng và ghi chú/danh sách như `baowibu01-10`, **then** hệ thống lưu nguyên văn ghi chú và tạo yêu cầu chờ duyệt. KPI chưa tăng trước khi Admin duyệt.

### AC-02 — Tổng Clone hợp lệ

**Given** một yêu cầu khai báo 10 tài khoản với ghi chú rút gọn, **when** Admin xác nhận 8 tài khoản hợp lệ và từ chối 2 (nếu duyệt từng tài khoản được chấp thuận), **then** KPI chỉ tăng 8 và có lý do cho 2 tài khoản không hợp lệ. Hệ thống chưa tự suy ra danh sách từ cú pháp rút gọn khi chưa chốt quy tắc.

### AC-03 — Donate chờ kiểm duyệt

**Given** Member Donate nhập số tiền và gửi ảnh, **when** submit thành công, **then** yêu cầu có trạng thái chờ duyệt và chưa tăng tổng tiền Donate đã nhận.

### AC-04 — Duyệt Donate

**Given** Member khai báo Donate 50.000 VNĐ và Admin đã đối chiếu **thực nhận đúng 50.000 VNĐ**, **when** duyệt, **then** tổng tiền Donate được xác nhận tăng đúng 50.000 VNĐ một lần; nếu không khớp hoặc từ chối thì không cộng.

### AC-04a — Donate không có KPI

**Given** Member thuộc hình thức Donate, **when** xem dashboard tháng hoặc sau khi Donate được duyệt, **then** chỉ hiển thị số tiền và trạng thái giao dịch; **không** có ngưỡng KPI, phần trăm KPI, trạng thái đạt/chưa đạt KPI hoặc vi phạm KPI.

### AC-05 — KPI Clone tuần

**Given** mức KPI tuần là 25, **when** tổng Clone hợp lệ trong kỳ đạt 25, **then** hiển thị đã đạt. Nếu kỳ còn mở và dưới 25, hiển thị đang tiến hành/chưa đủ chứ không tự gắn vi phạm.

### AC-06 — Quyền chỉ định người nhận Donate

**Given** Admin chỉ định Member Clone vào danh sách nhận, **then** thành viên xuất hiện trong danh sách. Hệ thống không cho chỉ định Member Donate.

### AC-07 — Clone vượt mức tháng

**Given** người được chỉ định có 150 Clone hợp lệ trong tháng và định mức là 100, **then** số vượt hiển thị là 50. Với 90 Clone, hiển thị 0. Không tính ra VNĐ.

### AC-08 — Không được tự chi trả

**Given** chưa có công thức phân phối, **when** Admin xem danh sách nhận Donate, **then** không có số tiền trả tự suy ra hay thao tác chuyển tiền tự động.

### AC-09 — Quyền truy cập

**Given** Member thường, **when** cố truy cập endpoint duyệt hoặc dữ liệu cá nhân của người khác, **then** máy chủ từ chối.

### AC-10 — Xử lý vi phạm

**Given** kỳ KPI đã kết thúc và Member không đạt, **then** Admin có thể ghi nhận quyết định xử lý; hệ thống không tự áp hình phạt ngoài quyết định của Admin.

---

## 12. Danh sách quyết định cần chốt trước hoặc trong lúc thiết kế

### Ưu tiên cao — có thể ảnh hưởng đến cấu trúc dữ liệu, API và cách tính KPI

| ID | Vấn đề chưa chốt | Tác động |
|---|---|---|
| TBD-01 | Cú pháp ghi chú `baowibu01-10` có nghĩa chính xác thế nào? Có cần tự tách/đếm từ ghi chú, và có được nộp lại tài khoản ở tuần khác? | Cách đối chiếu số lượng, kiểm tra trùng Clone; hiện chỉ lưu nguyên ghi chú. |
| TBD-03 | Kỳ tuần bắt đầu/kết thúc ngày nào? Tháng tính 4 tuần cố định hay theo tháng lịch, xử lý tuần thứ 5 ra sao? | KPI tuần, định mức 100 Clone/tháng. |
| TBD-04 | Clone được tính vào kỳ theo lúc Member gửi hay lúc Admin duyệt? Admin duyệt trễ xử lý thế nào? | Tính đúng KPI và số vượt tháng. |
| TBD-05 | Công thức tiền nhận, nguồn quỹ, tỷ lệ, điều kiện và thời điểm chi trả. | Chức năng phân phối tiền chưa được triển khai. |
| TBD-06 | Khi nào hiệu lực của việc Admin chỉ định/bỏ chỉ định nhận Donate? | Cách lập danh sách theo từng tháng. |

### Ưu tiên trung bình

| ID | Vấn đề chưa chốt |
|---|---|
| TBD-07 | Thành viên đổi hình thức Clone/Donate có được không? Cần Admin duyệt? |
| TBD-08 | Thành viên vào/ra nhóm giữa kỳ có phải hoàn thành toàn bộ KPI? |
| TBD-09 | Có cho phép duyệt một phần danh sách Clone và nộp bù không? |
| TBD-10 | Trạng thái, quy tắc và mẫu xử lý vi phạm cụ thể. |
| TBD-11 | Đăng nhập bằng tài khoản riêng, mã mời hoặc kết nối nền tảng chat nào? |
| TBD-12 | Có cho thành viên xem tổng quỹ, lịch sử chi và thông tin người nhận khác không? |
| TBD-13 | Cách thông báo kết quả duyệt và xử lý minh chứng/ảnh tồn tại bao lâu. |
| TBD-14 | Tech stack, hosting, tên ứng dụng và nhận diện giao diện. |
| TBD-15 | Donate có cho phép nộp nhiều lần trong một tháng không? Vẫn không áp KPI. |

---

## 13. Hướng dẫn cho Codex khi bắt đầu triển khai

1. **Đọc toàn bộ SRS trước khi viết mã.** Xác nhận những mục `[TBD]` ảnh hưởng trực tiếp đến business logic thay vì tự đặt quy định.
2. Đưa ra mô hình dữ liệu, API contract, sơ đồ luồng và danh sách trang trước; chỉ code sau khi người dùng đồng ý phạm vi.
3. Giữ `systemRole`, `contributionType` và tư cách Donation Recipient là **ba khái niệm khác nhau**.
4. Dùng dữ liệu Clone đã kiểm duyệt làm nguồn để tính KPI, không dùng số khai báo chưa duyệt.
5. **Không áp KPI cho Donate.** Dùng giao dịch Donate đã kiểm duyệt (đúng số tiền Member khai báo) làm nguồn tính tổng quỹ; không dùng ảnh hoặc số người dùng khai báo làm bằng chứng tự động thanh toán thành công.
6. Mọi thuật toán tính tiền người nhận Donate để ở ngoài phạm vi cho tới khi có công thức và quy tắc phân phối chính thức.
7. Phân biệt **quy tắc đã xác nhận** với đề xuất UI/kỹ thuật; không được biến `[PROPOSED]` thành nghiệp vụ bắt buộc mà không hỏi.
8. Ưu tiên bản MVP vận hành được cho nhóm dưới 50 người, giao diện đơn giản và dùng tốt trên điện thoại.

---

## 14. Lịch sử tài liệu

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 0.1 | 28/10/2026 | Tổng hợp lần đầu từ trao đổi: hai hình thức Clone/Donate, kiểm duyệt, KPI, vi phạm, Admin chỉ định người nhận Donate, mốc Clone tháng 100 và các quy tắc chưa chốt. |
| 0.2 | 28/10/2026 | Cho phép ghi chú Clone dạng rút gọn `baowibu01-10`; xác nhận Donate không có KPI và Admin chỉ duyệt khi tiền thực nhận đúng số tiền đã khai báo; cập nhật các FR, BR, luồng, dữ liệu, nghiệm thu và TBD liên quan. |

