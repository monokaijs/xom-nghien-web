using HarmonyLib;
using System;
using System.Reflection;

namespace XomNghien.ValheimBridge
{
    [HarmonyPatch]
    internal static class CharacterStartPatch
    {
        private static MethodBase TargetMethod() =>
            AccessTools.Method("FejdStartup:OnCharacterStart") ?? throw new MissingMethodException("FejdStartup.OnCharacterStart");

        private static void Postfix() => ConnectionState.ConnectAfterCharacterSelection();
    }

    [HarmonyPatch]
    internal static class PasswordHandshakePatch
    {
        private static MethodBase TargetMethod() =>
            AccessTools.Method("ZNet:RPC_ClientHandshake") ?? throw new MissingMethodException("ZNet.RPC_ClientHandshake");

        private static bool Prefix(object __instance, object rpc, bool needPassword, string serverPasswordSalt)
        {
            var password = ConnectionState.TakePassword();
            if (password == null || !needPassword) return true;
            try
            {
                var type = __instance.GetType();
                AccessTools.Field(type, "m_serverPasswordSalt")?.SetValue(null, serverPasswordSalt);
                var sendPeerInfo = AccessTools.Method(type, "SendPeerInfo") ?? throw new MissingMethodException("ZNet.SendPeerInfo");
                sendPeerInfo.Invoke(__instance, new[] { rpc, password });
                Plugin.Log.LogInfo("Server password supplied by launcher.");
                return false;
            }
            catch (Exception error)
            {
                Plugin.Log.LogError($"Could not supply server password: {error}");
                return true;
            }
        }
    }
}
