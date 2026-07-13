export const Games = [{
  id: 'cs2',
  name: 'Counter-Strike 2',
  image: '/logos/cs2.webp',
  href: '/cs2',
}, {
  id: 'valheim',
  name: 'Valheim',
  image: '/logos/valheim.jpeg',
  href: '/valheim',
}, {
  id: 'palworld',
  name: 'Palworld',
  image: '/logos/palworld.jpg',
  href: '/palworld',
}] as const;

export type GameId = (typeof Games)[number]['id'];

export const GameHubs = Games.filter((game) => game.href !== null);

export function getGame(gameId: string) {
  return Games.find((game) => game.id === gameId);
}
