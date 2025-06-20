import { GameDig } from 'gamedig';

export async function GET() {
  const response = await GameDig.query({
    type: 'counterstrike2',
    host: '160.25.82.90',
    port: 27021,
  })
  return Response.json(response);
}
