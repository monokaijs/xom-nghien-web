export const Games = [{
  id: 'cs2',
  name: 'Counter-Strike 2',
  image: '/logos/cs2.webp',
  href: '/cs2',
  serverCard: {
    coverImage: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
    playerCount: 'online-total',
    showMap: true,
  },
}, {
  id: 'valheim',
  name: 'Valheim',
  image: '/logos/valheim.jpeg',
  href: '/valheim',
  serverCard: {
    coverImage: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/892970/header.jpg',
    playerCount: 'online',
    showMap: false,
  },
}, {
  id: 'palworld',
  name: 'Palworld',
  image: '/logos/palworld.jpg',
  href: '/palworld',
  serverCard: {
    coverImage: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1623730/header.jpg',
    playerCount: 'online',
    showMap: false,
  },
}] as const;

export type GameId = (typeof Games)[number]['id'];

export const GameHubs = Games.filter((game) => game.href !== null);

export function getGame(gameId: string) {
  return Games.find((game) => game.id === gameId);
}
