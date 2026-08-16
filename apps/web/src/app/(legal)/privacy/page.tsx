import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư | Xóm Nghiện',
  description: 'Cách Xóm Nghiện thu thập, sử dụng, lưu giữ và xóa dữ liệu, bao gồm dữ liệu Discord.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Quyền riêng tư"
      title="Chính sách quyền riêng tư"
      description="Chính sách này áp dụng cho website, bot Discord và các tính năng cộng đồng do Xóm Nghiện vận hành."
      updatedAt="21/07/2026"
    >
      <section>
        <h2>1. Dữ liệu chúng tôi thu thập</h2>
        <p>Khi bạn đăng nhập hoặc liên kết tài khoản, chúng tôi có thể lưu mã định danh, tên hiển thị, ảnh đại diện và đường dẫn hồ sơ do Steam, Discord, Google hoặc GitHub cung cấp. Chúng tôi không nhận hoặc lưu mật khẩu của bạn.</p>
        <p>Bot Discord lưu mã máy chủ, mã người dùng, mã kênh, mã tin nhắn, thời điểm hoạt động, trạng thái tham gia kênh thoại, thời lượng đủ điều kiện và số điểm được trao. Bot không yêu cầu quyền <strong>Message Content</strong>, không đọc hoặc lưu nội dung tin nhắn, tệp đính kèm hay nội dung cuộc trò chuyện thoại.</p>
        <p>Liên kết do lệnh <code>/link</code> tạo chứa một mã bí mật dùng một lần. Chúng tôi chỉ lưu bản băm của mã này cùng mã người dùng, tên hiển thị, ảnh đại diện và thời hạn của liên kết.</p>
        <p>Website có thể xử lý cookie phiên đăng nhập, địa chỉ IP và thông tin yêu cầu trong nhật ký bảo mật. Các tính năng trò chơi có thể lưu hồ sơ công khai, thống kê trận đấu và liên kết mạng xã hội do bạn cung cấp. Voice Rooms lưu tạm thời tên phòng, tên hiển thị, ảnh đại diện, mã kết nối ngang hàng và trạng thái hiện diện.</p>
      </section>

      <section>
        <h2>2. Cách chúng tôi sử dụng dữ liệu</h2>
        <p>Chúng tôi sử dụng dữ liệu để xác thực tài khoản, liên kết hồ sơ Discord với hồ sơ Xóm Nghiện, tính điểm hoạt động, hiển thị bảng xếp hạng, chống tính điểm trùng lặp, vận hành tính năng cộng đồng, xử lý hỗ trợ và bảo vệ dịch vụ khỏi lạm dụng.</p>
        <p>Dữ liệu Discord không được dùng để quảng cáo, lập hồ sơ về sở thích hoặc mối quan hệ, bán, cấp phép, huấn luyện mô hình AI hay gửi tin nhắn tiếp thị.</p>
      </section>

      <section>
        <h2>3. Chia sẻ và bên xử lý dữ liệu</h2>
        <p>Chúng tôi không bán dữ liệu cá nhân. Dữ liệu có thể được xử lý bởi nhà cung cấp hạ tầng lưu trữ, cơ sở dữ liệu, bảo mật và báo hiệu kết nối ngang hàng chỉ trong phạm vi cần thiết để vận hành dịch vụ; hoặc được cung cấp khi pháp luật yêu cầu. Khi bạn dùng Discord, PeerJS hoặc một nhà cung cấp đăng nhập, chính sách riêng của nhà cung cấp đó cũng được áp dụng.</p>
        <p>Âm thanh và tin nhắn trong Voice Rooms được truyền trực tiếp giữa các trình duyệt và không được lưu trên máy chủ Xóm Nghiện. Nhà cung cấp báo hiệu và hạ tầng chuyển tiếp mạng có thể xử lý metadata kết nối cần thiết để thiết lập phiên.</p>
      </section>

      <section>
        <h2>4. Lưu giữ và bảo mật</h2>
        <p>Dữ liệu hồ sơ và hoạt động được giữ trong thời gian cần thiết để duy trì tài khoản, điểm và bảng xếp hạng, hoặc cho tới khi bạn yêu cầu xóa. Liên kết <code>/link</code> hết hiệu lực sau 10 phút; bản ghi liên kết hết hạn được dọn khỏi cơ sở dữ liệu. Trạng thái thoại trực tiếp chỉ được dùng để tính thời gian đủ điều kiện.</p>
        <p>Chúng tôi sử dụng biện pháp kiểm soát truy cập, bí mật môi trường, liên kết một lần đã băm và kết nối bảo mật phù hợp với môi trường triển khai. Không có phương thức lưu trữ hoặc truyền dữ liệu nào an toàn tuyệt đối.</p>
      </section>

      <section>
        <h2>5. Lựa chọn và quyền của bạn</h2>
        <p>Bạn có thể ngắt liên kết Discord trong phần Cài đặt. Bạn cũng có thể yêu cầu truy cập, sửa hoặc xóa dữ liệu Discord và dữ liệu tài khoản của mình qua <Link href="/support">trang Hỗ trợ</Link>. Để chúng tôi xác minh đúng chủ thể, yêu cầu nên bao gồm Discord User ID và được gửi từ tài khoản có liên quan.</p>
        <p>Khi một yêu cầu xóa hợp lệ được xác minh, chúng tôi sẽ xóa hoặc ẩn danh dữ liệu API không còn cần thiết, trừ phần bắt buộc phải giữ theo pháp luật. Việc xóa dữ liệu hoạt động có thể làm mất điểm và vị trí trên bảng xếp hạng.</p>
      </section>

      <section>
        <h2>6. Trẻ vị thành niên</h2>
        <p>Dịch vụ không hướng tới trẻ em dưới 13 tuổi hoặc dưới độ tuổi tối thiểu để sử dụng Discord tại quốc gia của người dùng. Nếu bạn cho rằng chúng tôi đã thu thập dữ liệu của trẻ em không hợp lệ, hãy báo ngay qua trang Hỗ trợ.</p>
      </section>

      <section>
        <h2>7. Thay đổi và liên hệ</h2>
        <p>Chúng tôi có thể cập nhật chính sách này khi tính năng hoặc nghĩa vụ pháp lý thay đổi và sẽ sửa ngày cập nhật ở đầu trang. Câu hỏi, báo cáo bảo mật và yêu cầu về quyền riêng tư có thể gửi qua <Link href="/support">trang Hỗ trợ Xóm Nghiện</Link>.</p>
      </section>
    </LegalPage>
  );
}
