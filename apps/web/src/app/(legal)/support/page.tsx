import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';
import { DiscordInvitationLink } from '@/config/discord';

export const metadata: Metadata = {
  title: 'Hỗ trợ | Xóm Nghiện',
  description: 'Báo lỗi, báo vi phạm và gửi yêu cầu về dữ liệu cho Xóm Nghiện.',
};

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <LegalPage
      eyebrow="Liên hệ"
      title="Hỗ trợ Xóm Nghiện"
      description="Kênh hỗ trợ cho website và bot Discord, bao gồm báo lỗi, báo vi phạm và yêu cầu về dữ liệu."
    >
      <section>
        <h2>Liên hệ hỗ trợ</h2>
        <p>Tham gia máy chủ cộng đồng và liên hệ đội ngũ quản trị để được hỗ trợ. Không gửi mật khẩu, token bot, mã đăng nhập hoặc liên kết <code>/link</code> còn hiệu lực cho bất kỳ ai.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={DiscordInvitationLink} target="_blank" rel="noreferrer" className="rounded-xl bg-[#5865F2] px-5 py-3 font-semibold text-white hover:bg-[#4752C4]">
            Mở Discord Xóm Nghiện
          </a>
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5">
              {supportEmail}
            </a>
          )}
        </div>
      </section>

      <section>
        <h2>Báo lỗi hoặc vi phạm</h2>
        <p>Cho chúng tôi biết điều gì đã xảy ra, thời gian, lệnh hoặc trang liên quan và ảnh chụp màn hình nếu phù hợp. Đối với nội dung nguy hiểm hoặc vi phạm quy định Discord, hãy đồng thời sử dụng công cụ báo cáo chính thức của Discord khi cần.</p>
      </section>

      <section>
        <h2>Yêu cầu truy cập, sửa hoặc xóa dữ liệu</h2>
        <p>Ghi rõ loại yêu cầu và Discord User ID của bạn. Chúng tôi có thể yêu cầu bạn xác minh quyền sở hữu bằng tài khoản đã liên kết trước khi thực hiện. Xóa dữ liệu Discord sẽ xóa lịch sử điểm Discord có thể nhận dạng và có thể thay đổi bảng xếp hạng.</p>
        {!supportEmail && <p><strong>Trước khi gửi ứng dụng để Discord xác minh:</strong> cấu hình biến <code>NEXT_PUBLIC_SUPPORT_EMAIL</code> bằng địa chỉ được theo dõi thường xuyên để trang này có kênh liên hệ độc lập với Discord.</p>}
      </section>

      <section>
        <h2>Tài liệu liên quan</h2>
        <p>Đọc <Link href="/privacy">Chính sách quyền riêng tư</Link> để biết dữ liệu được xử lý như thế nào hoặc <Link href="/terms">Điều khoản sử dụng</Link> để xem quy tắc của dịch vụ.</p>
      </section>
    </LegalPage>
  );
}
