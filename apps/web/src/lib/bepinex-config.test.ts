import { describe, expect, it } from 'vitest';
import { parseBepInExConfig, updateBepInExConfigValue } from './bepinex-config';

const sample = `## Settings file was created by plugin Example

[General]

## Enables the feature.
# Setting type: Boolean
# Default value: true
Enabled = true

# Setting type: String
# Default value: Normal
# Acceptable values: Easy, Normal, Hard
Difficulty = Normal
`;

describe('BepInEx config editing', () => {
  it('discovers sections, descriptions, booleans, and acceptable values', () => {
    const [section] = parseBepInExConfig(sample);
    expect(section.name).toBe('General');
    expect(section.entries[0]).toMatchObject({
      key: 'Enabled', value: 'true', description: 'Enables the feature.', control: 'boolean',
    });
    expect(section.entries[1]).toMatchObject({
      key: 'Difficulty', control: 'select', acceptableValues: ['Easy', 'Normal', 'Hard'],
    });
  });

  it('updates only the value while preserving the file layout', () => {
    const entry = parseBepInExConfig(sample)[0].entries[0];
    const updated = updateBepInExConfigValue(sample, entry.lineIndex, 'false');
    expect(updated).toContain('# Default value: true\nEnabled = false');
    expect(updated.replace('Enabled = false', 'Enabled = true')).toBe(sample);
  });
});
