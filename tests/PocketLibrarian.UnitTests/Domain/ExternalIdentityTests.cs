using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.UnitTests.Domain;

public sealed class ExternalIdentityTests
{
    [Fact]
    public void Create_SetsAllProperties()
    {
        var userId = Guid.NewGuid();
        var before = DateTime.UtcNow;

        var identity = ExternalIdentity.Create(userId, "EntraId", "oid-123");

        var after = DateTime.UtcNow;

        Assert.NotEqual(Guid.Empty, identity.Id);
        Assert.Equal(userId, identity.UserId);
        Assert.Equal("EntraId", identity.Provider);
        Assert.Equal("oid-123", identity.ProviderId);
        Assert.InRange(identity.LinkedAt, before, after);
    }

    [Fact]
    public void Create_EachCallProducesDistinctId()
    {
        var userId = Guid.NewGuid();

        var id1 = ExternalIdentity.Create(userId, "EntraId", "oid-1");
        var id2 = ExternalIdentity.Create(userId, "EntraId", "oid-2");

        Assert.NotEqual(id1.Id, id2.Id);
    }

    [Fact]
    public void Create_WithEmptyProvider_ThrowsArgumentException()
    {
        var userId = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() =>
            ExternalIdentity.Create(userId, string.Empty, "oid-123"));
    }

    [Fact]
    public void Create_WithNullProvider_ThrowsArgumentNullException()
    {
        var userId = Guid.NewGuid();

        Assert.Throws<ArgumentNullException>(() =>
            ExternalIdentity.Create(userId, null!, "oid-123"));
    }

    [Fact]
    public void Create_WithEmptyProviderId_ThrowsArgumentException()
    {
        var userId = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() =>
            ExternalIdentity.Create(userId, "EntraId", string.Empty));
    }

    [Fact]
    public void Create_WithNullProviderId_ThrowsArgumentNullException()
    {
        var userId = Guid.NewGuid();

        Assert.Throws<ArgumentNullException>(() =>
            ExternalIdentity.Create(userId, "EntraId", null!));
    }
}
