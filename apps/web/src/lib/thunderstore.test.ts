import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchThunderstoreMods } from './thunderstore';

const pendingPackage = {
  namespace: 'Creaton',
  name: 'Valheim_Viet_Hoa',
  package_url: 'https://thunderstore.io/package/Creaton/Valheim_Viet_Hoa/',
  rating_score: -1,
  is_pinned: false,
  is_deprecated: false,
  total_downloads: -1,
  latest: {
    name: 'Valheim_Viet_Hoa',
    description: 'Bản Việt hóa Valheim',
    icon: 'https://gcdn.thunderstore.io/live/repository/icons/example.png',
    version_number: '0.2.0',
    downloads: 0,
    is_active: true,
  },
  community_listings: [{
    community: 'valheim',
    has_nsfw_content: false,
    review_status: 'unreviewed',
  }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchThunderstoreMods', () => {
  it('finds an unreviewed package from its dependency string', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(pendingPackage)));
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchThunderstoreMods('valheim', 'Creaton-Valheim_Viet_Hoa');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      namespace: 'Creaton',
      packageName: 'Valheim_Viet_Hoa',
      versionNumber: '0.2.0',
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://thunderstore.io/api/experimental/package/Creaton/Valheim_Viet_Hoa/',
      expect.any(Object),
    );
  });

  it('does not expose a rejected direct package', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...pendingPackage,
        community_listings: [{
          ...pendingPackage.community_listings[0],
          review_status: 'rejected',
        }],
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify([])));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchThunderstoreMods('palworld', 'Creaton-Valheim_Viet_Hoa')).resolves.toEqual([]);
  });
});
