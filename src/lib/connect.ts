async function connectToServer(ip: string, port: number | string, password: string) {
  window.location.href = password ? `steam://connect/${ip}:${port}/${password}` : `steam://connect/${ip}:${port}`;
}
