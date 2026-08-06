using BepInEx;
using HarmonyLib;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;

namespace XomNghien.ValheimBridge
{
    public sealed class ConnectionContext
    {
        [JsonProperty("port")] public int Port { get; set; }
        [JsonProperty("nonce")] public string Nonce { get; set; } = string.Empty;
        [JsonProperty("expires_at")] public DateTimeOffset ExpiresAt { get; set; }

        public static ConnectionContext Parse(string json) =>
            JsonConvert.DeserializeObject<ConnectionContext>(json) ?? throw new InvalidDataException("Connection context is empty");

        public bool IsValid(DateTimeOffset now) =>
            Port > 0 && Port <= 65535 && Nonce.Length == 64 && ExpiresAt > now;
    }

    internal sealed class Credentials
    {
        [JsonProperty("host")] public string Host { get; set; } = string.Empty;
        [JsonProperty("port")] public int Port { get; set; }
        [JsonProperty("password")] public string Password { get; set; } = string.Empty;
    }

    internal static class ConnectionState
    {
        private static readonly object Sync = new object();
        private static ConnectionContext? context;
        private static string? password;
        private static bool attempted;

        public static void LoadContext()
        {
            var path = ContextPath();
            try
            {
                if (!File.Exists(path)) return;
                var parsed = ConnectionContext.Parse(File.ReadAllText(path));
                if (!parsed.IsValid(DateTimeOffset.UtcNow))
                {
                    File.Delete(path);
                    Plugin.Log.LogWarning("Discarded an expired launcher connection request.");
                    return;
                }
                context = parsed;
            }
            catch (Exception error)
            {
                Plugin.Log.LogError($"Could not read launcher connection context: {error}");
            }
        }

        public static void ConnectAfterCharacterSelection()
        {
            lock (Sync)
            {
                if (attempted || context == null) return;
                attempted = true;
            }
            try
            {
                var credentials = FetchCredentials(context);
                password = credentials.Password;
                var address = ResolveIpv4(credentials.Host);
                var matchmakingType = AccessTools.TypeByName("ZSteamMatchmaking") ?? throw new MissingMemberException("ZSteamMatchmaking");
                var instance = AccessTools.Property(matchmakingType, "instance")?.GetValue(null, null)
                    ?? AccessTools.Field(matchmakingType, "instance")?.GetValue(null)
                    ?? throw new MissingMemberException("ZSteamMatchmaking.instance");
                var queueJoin = AccessTools.Method(matchmakingType, "QueueServerJoin", new[] { typeof(string) })
                    ?? throw new MissingMethodException("ZSteamMatchmaking.QueueServerJoin");
                queueJoin.Invoke(instance, new object[] { $"{address}:{credentials.Port}" });
                Plugin.Log.LogInfo($"Connecting to {credentials.Host}:{credentials.Port}");
            }
            catch (Exception error)
            {
                password = null;
                Plugin.Log.LogError($"Automatic connection failed: {error}");
            }
            finally
            {
                context = null;
                TryDeleteContext();
            }
        }

        public static string? TakePassword()
        {
            lock (Sync)
            {
                var value = password;
                password = null;
                return value;
            }
        }

        private static Credentials FetchCredentials(ConnectionContext value)
        {
            using (var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) })
            {
                client.DefaultRequestHeaders.ConnectionClose = true;
                var json = client.GetStringAsync($"http://127.0.0.1:{value.Port}/connect/{value.Nonce}").GetAwaiter().GetResult();
                var credentials = JsonConvert.DeserializeObject<Credentials>(json) ?? throw new InvalidDataException("Credential response is empty");
                if (string.IsNullOrWhiteSpace(credentials.Host) || credentials.Port <= 0 || credentials.Port > 65535 || string.IsNullOrEmpty(credentials.Password))
                    throw new InvalidDataException("Credential response is incomplete");
                return credentials;
            }
        }

        private static IPAddress ResolveIpv4(string host)
        {
            if (IPAddress.TryParse(host, out var parsed) && parsed.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork) return parsed;
            return Dns.GetHostAddresses(host).First(address => address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
        }

        private static string ContextPath() => Path.Combine(Paths.ConfigPath, "xom-launcher-connection.json");
        private static void TryDeleteContext() { try { File.Delete(ContextPath()); } catch { } }
    }
}
