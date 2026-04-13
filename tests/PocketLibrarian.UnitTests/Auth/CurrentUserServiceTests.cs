using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Infrastructure.Auth;

namespace PocketLibrarian.UnitTests.Auth;

public sealed class CurrentUserServiceTests
{
    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    [Fact]
    public void OwnerId_DelegatesToContext()
    {
        var userContext = new CurrentUserContext();
        var ownerId = Guid.NewGuid();
        userContext.Resolve(ownerId, SampleIdentity());
        var service = new CurrentUserService(userContext);

        Assert.Equal(ownerId, service.OwnerId);
    }

    [Fact]
    public void Identity_DelegatesToContext()
    {
        var userContext = new CurrentUserContext();
        var identity = SampleIdentity();
        userContext.Resolve(Guid.NewGuid(), identity);
        var service = new CurrentUserService(userContext);

        Assert.Equal(identity, service.Identity);
    }

    [Fact]
    public void OwnerId_WhenContextNotResolved_ThrowsInvalidOperationException()
    {
        var service = new CurrentUserService(new CurrentUserContext());

        Assert.Throws<InvalidOperationException>(() => service.OwnerId);
    }

    [Fact]
    public void Identity_WhenContextNotResolved_ThrowsInvalidOperationException()
    {
        var service = new CurrentUserService(new CurrentUserContext());

        Assert.Throws<InvalidOperationException>(() => service.Identity);
    }
}
