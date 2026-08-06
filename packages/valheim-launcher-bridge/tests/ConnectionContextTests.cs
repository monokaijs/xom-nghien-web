using System;
using Xunit;

namespace XomNghien.ValheimBridge.Tests
{
    public class ConnectionContextTests
    {
        [Fact]
        public void ParsesAndValidatesOneTimeContext()
        {
            var expiry = DateTimeOffset.UtcNow.AddMinutes(5);
            var json = $"{{\"port\":43121,\"nonce\":\"{new string('a', 64)}\",\"expires_at\":\"{expiry:O}\"}}";
            var context = ConnectionContext.Parse(json);
            Assert.True(context.IsValid(DateTimeOffset.UtcNow));
        }

        [Fact]
        public void RejectsExpiredContext()
        {
            var context = new ConnectionContext { Port = 43121, Nonce = new string('a', 64), ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(-1) };
            Assert.False(context.IsValid(DateTimeOffset.UtcNow));
        }
    }
}
