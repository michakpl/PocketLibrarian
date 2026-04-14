using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.UnitTests.Domain;

public sealed class UserTests
{
    [Fact]
    public void CreateForProvider_SetsDisplayNameAndEmail()
    {
        var (user, _) = User.CreateForProvider("EntraId", "oid-123", "Jane Doe", "jane@example.com");

        Assert.Equal("Jane Doe", user.DisplayName);
        Assert.Equal("jane@example.com", user.Email);
    }

    [Fact]
    public void CreateForProvider_AssignsNonEmptyId()
    {
        var (user, _) = User.CreateForProvider("EntraId", "oid-123", "Jane Doe", "jane@example.com");

        Assert.NotEqual(Guid.Empty, user.Id);
    }

    [Fact]
    public void CreateForProvider_SetsCreatedAtAndLastSeenAtToUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var (user, _) = User.CreateForProvider("EntraId", "oid-123", "Jane Doe", "jane@example.com");
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(user.CreatedAt, before, after);
        Assert.InRange(user.LastSeenAt, before, after);
    }

    [Fact]
    public void CreateForProvider_CreatesLinkedExternalIdentity()
    {
        var (user, externalId) = User.CreateForProvider("EntraId", "oid-123", "Jane Doe", "jane@example.com");

        Assert.Single(user.Identities);
        Assert.Same(externalId, user.Identities.Single());
    }

    [Fact]
    public void CreateForProvider_ExternalIdentityHasCorrectProviderAndProviderId()
    {
        var (user, externalId) = User.CreateForProvider("EntraId", "oid-123", "Jane Doe", "jane@example.com");

        Assert.Equal("EntraId", externalId.Provider);
        Assert.Equal("oid-123", externalId.ProviderId);
        Assert.Equal(user.Id, externalId.UserId);
    }

    [Fact]
    public void CreateForProvider_EachCallProducesDistinctId()
    {
        var (user1, _) = User.CreateForProvider("EntraId", "oid-1", "User 1", "u1@example.com");
        var (user2, _) = User.CreateForProvider("EntraId", "oid-2", "User 2", "u2@example.com");

        Assert.NotEqual(user1.Id, user2.Id);
    }

    [Fact]
    public void RecordLogin_UpdatesDisplayNameAndEmail()
    {
        var (user, _) = User.CreateForProvider("EntraId", "oid-123", "Old Name", "old@example.com");

        user.RecordLogin("New Name", "new@example.com");

        Assert.Equal("New Name", user.DisplayName);
        Assert.Equal("new@example.com", user.Email);
    }

    [Fact]
    public void RecordLogin_UpdatesLastSeenAt()
    {
        var (user, _) = User.CreateForProvider("EntraId", "oid-123", "Name", "email@example.com");
        var before = DateTimeOffset.UtcNow;

        user.RecordLogin("Name", "email@example.com");

        var after = DateTimeOffset.UtcNow;
        Assert.InRange(user.LastSeenAt, before, after);
    }

    [Fact]
    public void RecordLogin_DoesNotChangeCreatedAt()
    {
        var (user, _) = User.CreateForProvider("EntraId", "oid-123", "Name", "email@example.com");
        var createdAt = user.CreatedAt;

        user.RecordLogin("Name", "email@example.com");

        Assert.Equal(createdAt, user.CreatedAt);
    }
}
