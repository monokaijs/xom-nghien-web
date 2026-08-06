import type { Locale } from './types';

const messages = {
  en: {
    servers: 'Servers', profiles: 'Profiles', browse: 'Browse mods', downloads: 'Downloads', settings: 'Settings',
    valheim: 'Valheim', play: 'Sync & Play', required: 'Required', optional: 'Optional', extra: 'Extra mods',
    online: 'Online', offline: 'Offline', unknown: 'Unknown', noServers: 'No launcher-ready Valheim servers.',
    syncing: 'Synchronizing profile…', ready: 'Ready. Select your character in Valheim to connect.',
    gameMissing: 'Valheim was not detected. Choose the game executable in Settings.', search: 'Search Thunderstore…',
    install: 'Install', createProfile: 'Create profile', profileName: 'Profile name', save: 'Save settings',
    selectProfile: 'Select a profile before installing a mod.', repair: 'Repair profile', reset: 'Reset profile',
    openFolder: 'Open folder', clearCache: 'Clear cache', noProfiles: 'No profiles yet.', installed: 'Installed',
    betaWarning: 'Unsigned beta — Windows SmartScreen or macOS Gatekeeper may show a warning.',
  },
  vi: {
    servers: 'Máy chủ', profiles: 'Hồ sơ', browse: 'Tìm mod', downloads: 'Tải xuống', settings: 'Cài đặt',
    valheim: 'Valheim', play: 'Đồng bộ & Chơi', required: 'Bắt buộc', optional: 'Tùy chọn', extra: 'Mod bổ sung',
    online: 'Trực tuyến', offline: 'Ngoại tuyến', unknown: 'Chưa rõ', noServers: 'Chưa có máy chủ Valheim sẵn sàng cho launcher.',
    syncing: 'Đang đồng bộ hồ sơ…', ready: 'Sẵn sàng. Chọn nhân vật trong Valheim để kết nối.',
    gameMissing: 'Không tìm thấy Valheim. Hãy chọn tệp trò chơi trong Cài đặt.', search: 'Tìm trên Thunderstore…',
    install: 'Cài đặt', createProfile: 'Tạo hồ sơ', profileName: 'Tên hồ sơ', save: 'Lưu cài đặt',
    selectProfile: 'Chọn một hồ sơ trước khi cài mod.', repair: 'Sửa hồ sơ', reset: 'Đặt lại hồ sơ',
    openFolder: 'Mở thư mục', clearCache: 'Xóa bộ nhớ đệm', noProfiles: 'Chưa có hồ sơ.', installed: 'Đã cài',
    betaWarning: 'Bản beta chưa ký — Windows SmartScreen hoặc macOS Gatekeeper có thể hiển thị cảnh báo.',
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export function translator(locale: Locale) {
  return (key: MessageKey) => messages[locale][key] || messages.en[key];
}
