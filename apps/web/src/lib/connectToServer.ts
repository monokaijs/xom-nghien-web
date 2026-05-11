export async function connectToServer(
    ip: string,
    port: number | string,
    password: string = '',
    game: string = '730'
) {
    const p = String(port);

    const baseCmd = `+connect ${ip}:${p}`;
    const cmd = password
        ? `${baseCmd};+password ${password}`
        : baseCmd;

    window.location.href = `steam://run/${game}//${cmd}`;
}
