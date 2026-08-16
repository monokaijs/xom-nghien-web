export type BepInExControl = 'boolean' | 'select' | 'multi-select' | 'text';

export interface BepInExConfigEntry {
  id: string;
  section: string;
  key: string;
  value: string;
  description: string;
  settingType: string | null;
  acceptableValues: string[];
  control: BepInExControl;
  lineIndex: number;
}

export interface BepInExConfigSection {
  name: string;
  entries: BepInExConfigEntry[];
}

const PROPERTY = /^\s*([^#;][^=]*?)\s*=\s*(.*)$/;
const SECTION = /^\s*\[([^\]]+)]\s*$/;

export function parseBepInExConfig(contents: string): BepInExConfigSection[] {
  const lines = contents.split(/\r?\n/);
  const sections = new Map<string, BepInExConfigEntry[]>();
  let section = 'General';
  let comments: string[] = [];

  for (const [lineIndex, line] of lines.entries()) {
    const sectionMatch = line.match(SECTION);
    if (sectionMatch) {
      section = sectionMatch[1].trim() || 'General';
      comments = [];
      continue;
    }

    if (/^\s*#/.test(line)) {
      comments.push(line.replace(/^\s*#+\s?/, '').trim());
      continue;
    }

    const propertyMatch = line.match(PROPERTY);
    if (!propertyMatch) {
      if (line.trim()) comments = [];
      continue;
    }

    const key = propertyMatch[1].trim();
    const value = propertyMatch[2];
    const settingType = metadata(comments, 'Setting type');
    const acceptableValues = splitValues(metadata(comments, 'Acceptable values'));
    const multipleValues = comments.some((comment) => /multiple values|separat(?:e|ed).*comma/i.test(comment));
    const control: BepInExControl = /^bool(?:ean)?$/i.test(settingType || '')
      ? 'boolean'
      : acceptableValues.length > 0
        ? multipleValues ? 'multi-select' : 'select'
        : 'text';
    const description = comments
      .filter((comment) => !/^(Setting type|Default value|Acceptable values):/i.test(comment))
      .filter((comment) => !/multiple values|separat(?:e|ed).*comma/i.test(comment))
      .join(' ');
    const entry: BepInExConfigEntry = {
      id: `${section}\u0000${key}\u0000${lineIndex}`,
      section,
      key,
      value,
      description,
      settingType,
      acceptableValues,
      control,
      lineIndex,
    };
    sections.set(section, [...(sections.get(section) || []), entry]);
    comments = [];
  }

  return [...sections].map(([name, entries]) => ({ name, entries }));
}

export function updateBepInExConfigValue(contents: string, lineIndex: number, value: string) {
  const newline = contents.includes('\r\n') ? '\r\n' : '\n';
  const lines = contents.split(/\r?\n/);
  const line = lines[lineIndex];
  const match = line?.match(/^(\s*[^#;][^=]*?\s*=\s*).*$/);
  if (!match) return contents;
  lines[lineIndex] = `${match[1]}${value}`;
  return lines.join(newline);
}

function metadata(comments: string[], name: string) {
  const prefix = `${name}:`;
  return comments.find((comment) => comment.toLowerCase().startsWith(prefix.toLowerCase()))
    ?.slice(prefix.length).trim() || null;
}

function splitValues(value: string | null) {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
