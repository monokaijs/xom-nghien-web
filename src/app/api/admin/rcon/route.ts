import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { servers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Rcon from 'rcon';

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { serverId, command } = body;

    if (!serverId || !command) {
      return NextResponse.json(
        { error: 'Server ID and command are required' },
        { status: 400 }
      );
    }

    const serverResult = await db
      .select()
      .from(servers)
      .where(eq(servers.id, parseInt(serverId)))
      .limit(1);

    if (serverResult.length === 0) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    const server = serverResult[0];

    if (!server.rcon_password) {
      return NextResponse.json(
        { error: 'Server does not have RCON password configured' },
        { status: 400 }
      );
    }

    const [host, portStr] = server.address.split(':');
    const port = parseInt(portStr || '27015');

    return new Promise((resolve) => {
      const responses: string[] = [];
      let isResolved = false;

      const conn = new Rcon(host, port, server.rcon_password!);

      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          conn.disconnect();
          resolve(
            NextResponse.json({
              success: false,
              error: 'RCON connection timeout',
              responses: responses.length > 0 ? responses : ['Connection timeout'],
            })
          );
        }
      }, 10000);

      conn.on('auth', () => {
        conn.send(command);
      });

      conn.on('response', (str: string) => {
        responses.push(str);
        resolve(
          NextResponse.json({
            success: true,
            responses,
          })
        );
      });

      conn.on('error', (err: Error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          conn.disconnect();
          resolve(
            NextResponse.json({
              success: false,
              error: err.message,
              responses: responses.length > 0 ? responses : [err.message],
            })
          );
        }
      });

      conn.on('end', () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          resolve(
            NextResponse.json({
              success: true,
              responses: responses.length > 0 ? responses : ['Command executed (no response)'],
            })
          );
        }
      });

      try {
        conn.connect();
      } catch (err: any) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          resolve(
            NextResponse.json({
              success: false,
              error: err.message,
              responses: [err.message],
            })
          );
        }
      }
    });
  } catch (error: any) {
    console.error('Error executing RCON command:', error);
    return NextResponse.json(
      { error: 'Failed to execute RCON command', details: error.message },
      { status: 500 }
    );
  }
});

