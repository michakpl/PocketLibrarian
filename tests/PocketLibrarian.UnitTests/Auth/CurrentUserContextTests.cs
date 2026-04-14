using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.UnitTests.Auth;

public sealed class CurrentUserContextTests
{
    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    [Fact]
    public void IsAuthenticated_BeforeResolve_ReturnsFalse()
    {
        var context = new CurrentUserContext();

        Assert.False(context.IsAuthenticated);
    }

    [Fact]
    public void IsAuthenticated_AfterResolve_ReturnsTrue()
    {
        var context = new CurrentUserContext();
        context.Resolve(Guid.NewGuid(), SampleIdentity());

        Assert.True(context.IsAuthenticated);
    }

    [Fact]
    public void OwnerId_BeforeResolve_ThrowsInvalidOperationException()
    {
        var context = new CurrentUserContext();

        Assert.Throws<InvalidOperationException>(() => context.OwnerId);
    }

    [Fact]
    public void Identity_BeforeResolve_ThrowsInvalidOperationException()
    {
        var context = new CurrentUserContext();

        Assert.Throws<InvalidOperationException>(() => context.Identity);
    }

    [Fact]
    public void Resolve_SetsOwnerIdAndIdentity()
    {
        var context = new CurrentUserContext();
        var ownerId = Guid.NewGuid();
        var identity = SampleIdentity();

        context.Resolve(ownerId, identity);

        Assert.Equal(ownerId, context.OwnerId);
        Assert.Equal(identity, context.Identity);
    }

    [Fact]
    public void Resolve_CalledTwice_ThrowsInvalidOperationException()
    {
        var context = new CurrentUserContext();
        context.Resolve(Guid.NewGuid(), SampleIdentity());

        Assert.Throws<InvalidOperationException>(() => context.Resolve(Guid.NewGuid(), SampleIdentity()));
    }
}
