import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng | Xóm Nghiện',
  description: 'Điều khoản sử dụng website và bot Discord Xóm Nghiện.',
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Điều khoản"
      title="Điều khoản sử dụng"
      description="Các điều kiện áp dụng khi bạn sử dụng website, bot Discord và tính năng cộng đồng Xóm Nghiện."
      updatedAt="21/07/2026"
    >
      <section>
        <h2>1. Chấp nhận điều khoản</h2>
        <p>Bằng việc sử dụng dịch vụ, đăng nhập hoặc chạy lệnh của bot, bạn đồng ý với các điều khoản này và <Link href="/privacy">Chính sách quyền riêng tư</Link>. Nếu không đồng ý, bạn không nên tiếp tục sử dụng dịch vụ.</p>
      </section>

      <section>
        <h2>2. Điều kiện sử dụng và tài khoản</h2>
        <p>Bạn phải đủ 13 tuổi và đáp ứng độ tuổi tối thiểu áp dụng tại quốc gia của mình. Bạn chịu trách nhiệm bảo vệ tài khoản của mình và chỉ liên kết tài khoản Discord mà bạn sở hữu. Liên kết <code>/link</code> là riêng tư, dùng một lần và không được chia sẻ.</p>
      </section>

      <section>
        <h2>3. Chức năng bot và điểm cộng đồng</h2>
        <p>Bot ghi nhận sự kiện hoạt động đủ điều kiện để trao điểm cộng đồng và cung cấp lệnh liên kết tài khoản. Điểm, bảng xếp hạng và phần thưởng là tính năng cộng đồng; chúng không phải tiền, tài sản, tín dụng hoặc cam kết về một giải thưởng có giá trị. Chúng tôi có thể sửa lỗi tính điểm, loại bỏ hoạt động gian lận hoặc điều chỉnh quy tắc với thông báo hợp lý.</p>
      </section>

      <section>
        <h2>4. Hành vi được phép</h2>
        <p>Bạn không được lạm dụng bot hoặc API, tự động tạo hoạt động giả, khai thác lỗi, truy cập trái phép, làm gián đoạn dịch vụ, quấy rối người khác, đăng nội dung bất hợp pháp hoặc vi phạm Điều khoản dịch vụ và Nguyên tắc cộng đồng của Discord.</p>
      </section>

      <section>
        <h2>5. Kiểm duyệt và chấm dứt</h2>
        <p>Chúng tôi có thể giới hạn hoặc chấm dứt quyền truy cập khi cần bảo vệ cộng đồng, điều tra lạm dụng, tuân thủ pháp luật hoặc thực thi các điều khoản này. Bạn có thể ngừng sử dụng bot, gỡ liên kết tài khoản và yêu cầu xóa dữ liệu theo hướng dẫn tại trang Hỗ trợ.</p>
      </section>

      <section>
        <h2>6. Dịch vụ của bên thứ ba</h2>
        <p>Dịch vụ phụ thuộc vào Discord và có thể liên kết với Steam, Google, GitHub hoặc dịch vụ khác. Việc bạn dùng các nền tảng đó chịu điều khoản riêng của họ. Xóm Nghiện không được Discord tài trợ hoặc xác nhận và Discord không chịu trách nhiệm cho dịch vụ này.</p>
      </section>

      <section>
        <h2>7. Tính sẵn sàng và trách nhiệm</h2>
        <p>Dịch vụ được cung cấp theo hiện trạng và có thể thay đổi, gián đoạn hoặc ngừng hoạt động. Trong phạm vi pháp luật cho phép, chúng tôi không bảo đảm dịch vụ luôn sẵn sàng hoặc không có lỗi và không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ.</p>
      </section>

      <section>
        <h2>8. Thay đổi và hỗ trợ</h2>
        <p>Chúng tôi có thể cập nhật điều khoản và sẽ sửa ngày ở đầu trang. Việc tiếp tục sử dụng sau khi điều khoản mới có hiệu lực thể hiện sự chấp nhận của bạn. Để báo lỗi, báo vi phạm, khiếu nại quyết định hoặc đặt câu hỏi, hãy dùng <Link href="/support">trang Hỗ trợ</Link>.</p>
      </section>
    </LegalPage>
  );
}
