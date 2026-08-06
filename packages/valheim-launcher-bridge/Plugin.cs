using BepInEx;
using BepInEx.Logging;
using HarmonyLib;

namespace XomNghien.ValheimBridge
{
    [BepInPlugin(PluginId, PluginName, PluginVersion)]
    public sealed class Plugin : BaseUnityPlugin
    {
        public const string PluginId = "com.xomnghien.launcher.valheim";
        public const string PluginName = "Xom Nghien Launcher Bridge";
        public const string PluginVersion = "0.1.0";
        internal static ManualLogSource Log = null!;

        private void Awake()
        {
            Log = Logger;
            ConnectionState.LoadContext();
            new Harmony(PluginId).PatchAll();
            Log.LogInfo("Launcher bridge is ready; connection will begin after character selection.");
        }
    }
}
