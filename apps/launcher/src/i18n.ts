import type { Locale } from './types';

const messages = {
  en: {
    servers: 'Servers', leaderboard: 'Leaderboards', profiles: 'Profiles', browse: 'Browse mods', downloads: 'Downloads', settings: 'Settings',
    valheim: 'Valheim', play: 'Sync & Play', required: 'Required', optional: 'Optional', extra: 'Extra mods',
    online: 'Online', offline: 'Offline', unknown: 'Unknown', noServers: 'No launcher-ready Valheim servers.',
    syncing: 'Synchronizing profile…', ready: 'Ready. Select your character in Valheim to connect.',
    gameMissing: 'Valheim was not detected. Choose the game executable in Settings.', search: 'Search Thunderstore…',
    install: 'Install', createProfile: 'Create profile', profileName: 'Profile name', save: 'Save settings',
    selectProfile: 'Select a profile before installing a mod.', repair: 'Repair profile', reset: 'Reset profile',
    openFolder: 'Open folder', clearCache: 'Clear cache', noProfiles: 'No profiles yet.', installed: 'Installed',
    mods: 'mods', serverDescriptionFallback: 'A community Valheim server.', noMods: 'No mods required', noModsDescription: 'You can connect without synchronizing additional mods.',
    automaticConnect: 'Automatic connection', readyToPlay: 'Ready to enter the server?', connectDescription: 'The launcher will synchronize this server profile and open Valheim for you.',
    manualConnect: 'Manual connection', manualConnectDescription: 'Use these details if you need to connect from inside the game.', serverAddress: 'Server address', host: 'Host', port: 'Port', password: 'Password', copyAddress: 'Copy server address', copied: 'Address copied',
    loadingPassword: 'Loading…', passwordUnavailable: 'Could not load', copyPassword: 'Copy password', passwordCopied: 'Password copied', retryPassword: 'Retry loading password',
    collapseSidebar: 'Collapse sidebar', expandSidebar: 'Expand sidebar', discoverMore: 'Discover more', relatedResources: 'Related resources',
    website: 'Xóm Nghiện website', websiteDescription: 'News, servers and community activity', discordDescription: 'Chat and play with the community', thunderstoreDescription: 'Explore Valheim mods and packages',
    comingSoon: 'Coming soon', leaderboardComingTitle: 'Community leaderboards are on the way', leaderboardComingDescription: 'Compete, climb the rankings and celebrate the most active Vikings in the community.',
    community: 'Community', heroTitle: 'Join the Xóm Nghiện Discord', heroDescription: 'Meet other players, find a party, follow community events and never miss a server announcement.', viewServers: 'View servers', joinDiscord: 'Join Discord', relatedResourcesDescription: 'Useful links for your adventure.', leaderboardSubtitle: 'Community rankings and weekly activity.',
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening', greetingUser: 'Viking',
    betaWarning: 'Unsigned beta — Windows SmartScreen or macOS Gatekeeper may show a warning.',
  },
  vi: {
    servers: 'Máy chủ', leaderboard: 'Bảng xếp hạng', profiles: 'Hồ sơ', browse: 'Tìm mod', downloads: 'Tải xuống', settings: 'Cài đặt',
    valheim: 'Valheim', play: 'Đồng bộ & Chơi', required: 'Bắt buộc', optional: 'Tùy chọn', extra: 'Mod bổ sung',
    online: 'Trực tuyến', offline: 'Ngoại tuyến', unknown: 'Chưa rõ', noServers: 'Chưa có máy chủ Valheim sẵn sàng cho launcher.',
    syncing: 'Đang đồng bộ hồ sơ…', ready: 'Sẵn sàng. Chọn nhân vật trong Valheim để kết nối.',
    gameMissing: 'Không tìm thấy Valheim. Hãy chọn tệp trò chơi trong Cài đặt.', search: 'Tìm trên Thunderstore…',
    install: 'Cài đặt', createProfile: 'Tạo hồ sơ', profileName: 'Tên hồ sơ', save: 'Lưu cài đặt',
    selectProfile: 'Chọn một hồ sơ trước khi cài mod.', repair: 'Sửa hồ sơ', reset: 'Đặt lại hồ sơ',
    openFolder: 'Mở thư mục', clearCache: 'Xóa bộ nhớ đệm', noProfiles: 'Chưa có hồ sơ.', installed: 'Đã cài',
    betaWarning: 'Bản beta chưa ký — Windows SmartScreen hoặc macOS Gatekeeper có thể hiển thị cảnh báo.',
    mods: 'mod', serverDescriptionFallback: 'Máy chủ Valheim cộng đồng.', noMods: 'Không yêu cầu mod', noModsDescription: 'Bạn có thể kết nối mà không cần đồng bộ thêm mod.',
    automaticConnect: 'Kết nối tự động', readyToPlay: 'Sẵn sàng vào máy chủ?', connectDescription: 'Launcher sẽ đồng bộ hồ sơ máy chủ và mở Valheim cho bạn.',
    manualConnect: 'Kết nối thủ công', manualConnectDescription: 'Dùng thông tin này khi cần kết nối từ trong game.', serverAddress: 'Địa chỉ máy chủ', host: 'Máy chủ', port: 'Cổng', password: 'Mật khẩu', copyAddress: 'Sao chép địa chỉ máy chủ', copied: 'Đã sao chép địa chỉ',
    loadingPassword: 'Đang tải…', passwordUnavailable: 'Không thể tải', copyPassword: 'Sao chép mật khẩu', passwordCopied: 'Đã sao chép mật khẩu', retryPassword: 'Tải lại mật khẩu',
    collapseSidebar: 'Thu gọn thanh bên', expandSidebar: 'Mở rộng thanh bên', discoverMore: 'Khám phá thêm', relatedResources: 'Tài nguyên liên quan',
    website: 'Trang web Xóm Nghiện', websiteDescription: 'Tin tức, máy chủ và hoạt động cộng đồng', discordDescription: 'Trò chuyện và chơi cùng cộng đồng', thunderstoreDescription: 'Khám phá mod và gói Valheim',
    comingSoon: 'Sắp ra mắt', leaderboardComingTitle: 'Bảng xếp hạng cộng đồng đang được chuẩn bị', leaderboardComingDescription: 'Thi đấu, leo hạng và tôn vinh những Viking tích cực nhất trong cộng đồng.',
    community: 'Cộng đồng', heroTitle: 'Tham gia máy chủ Discord Xóm Nghiện', heroDescription: 'Gặp gỡ người chơi, tìm đồng đội, theo dõi sự kiện cộng đồng và không bỏ lỡ thông báo máy chủ.', viewServers: 'Xem máy chủ', joinDiscord: 'Tham gia Discord', relatedResourcesDescription: 'Những liên kết hữu ích cho hành trình của bạn.', leaderboardSubtitle: 'Xếp hạng cộng đồng và hoạt động hàng tuần.',
    goodMorning: 'Chào buổi sáng', goodAfternoon: 'Chào buổi chiều', goodEvening: 'Chào buổi tối', greetingUser: 'Viking',
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export function translator(locale: Locale) {
  return (key: MessageKey) => messages[locale][key] || messages.en[key];
}
