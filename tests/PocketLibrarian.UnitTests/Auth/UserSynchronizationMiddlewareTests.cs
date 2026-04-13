using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using PocketLibrarian.API.Middleware;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Auth;

public sealed class UserSynchronizationMiddlewareTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly CurrentUserContext _userContext;

    public UserSynchronizationMiddlewareTests()
    {
        _userContext = new CurrentUserContext();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options, _userContext);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task InvokeAsync_UnauthenticatedUser_CallsNextWithoutResolvingContext()
    {
        bool nextCalled = false;
        var middleware = new UserSynchronizationMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        await middleware.InvokeAsync(UnauthenticatedContext(), [], _userContext, _db);

        Assert.True(nextCalled);
        Assert.False(_userContext.IsAuthenticated);
    }

    [Fact]
    public async Task InvokeAsync_NoMatchingMapper_ThrowsInvalidOperationException()
    {
        var mapper = Substitute.For<IIdentityClaimsMapper>();
        mapper.CanHandle(Arg.Any<ClaimsPrincipal>()).Returns(false);

        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            middleware.InvokeAsync(AuthenticatedContext(), [mapper], _userContext, _db));
    }

    [Fact]
    public async Task InvokeAsync_NewUser_CreatesUserInDatabase()
    {
        var identity = MakeIdentity("new-oid-111");
        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(identity)], _userContext, _db);

        _db.ChangeTracker.Clear();
        var user = await _db.Users.SingleAsync();
        Assert.Equal("Test User", user.DisplayName);
        Assert.Equal("test@example.com", user.Email);
    }

    [Fact]
    public async Task InvokeAsync_NewUser_CreatesLinkedExternalIdentity()
    {
        var identity = MakeIdentity("new-oid-222");
        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(identity)], _userContext, _db);

        _db.ChangeTracker.Clear();
        var externalId = await _db.ExternalIdentities.SingleAsync();
        Assert.Equal("EntraId", externalId.Provider);
        Assert.Equal("new-oid-222", externalId.ProviderId);
    }

    [Fact]
    public async Task InvokeAsync_NewUser_ResolvesContextWithNewOwnerId()
    {
        var identity = MakeIdentity("new-oid-333");
        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(identity)], _userContext, _db);

        Assert.True(_userContext.IsAuthenticated);
        _db.ChangeTracker.Clear();
        var user = await _db.Users.SingleAsync();
        Assert.Equal(user.Id, _userContext.OwnerId);
    }

    [Fact]
    public async Task InvokeAsync_NewUser_CallsNextAfterCreation()
    {
        var identity = MakeIdentity("new-oid-444");
        bool nextCalled = false;
        var middleware = new UserSynchronizationMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(identity)], _userContext, _db);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_ExistingUser_UpdatesDisplayNameAndEmail()
    {
        var providerId = "existing-oid-555";
        var (user, _) = User.CreateForProvider("EntraId", providerId, "Old Name", "old@example.com");
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var updatedIdentity = new UserIdentity
        {
            Provider = "EntraId",
            ProviderId = providerId,
            DisplayName = "New Name",
            Email = "new@example.com"
        };
        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(updatedIdentity)], _userContext, _db);

        _db.ChangeTracker.Clear();
        var updatedUser = await _db.Users.FindAsync(user.Id);
        Assert.Equal("New Name", updatedUser!.DisplayName);
        Assert.Equal("new@example.com", updatedUser.Email);
    }

    [Fact]
    public async Task InvokeAsync_ExistingUser_ResolvesContextWithExistingOwnerId()
    {
        var providerId = "existing-oid-666";
        var (user, _) = User.CreateForProvider("EntraId", providerId, "Name", "email@example.com");
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var identity = MakeIdentity(providerId);
        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(identity)], _userContext, _db);

        Assert.True(_userContext.IsAuthenticated);
        Assert.Equal(user.Id, _userContext.OwnerId);
    }

    [Fact]
    public async Task InvokeAsync_ExistingUser_DoesNotCreateDuplicateUser()
    {
        var providerId = "existing-oid-777";
        var (user, _) = User.CreateForProvider("EntraId", providerId, "Name", "email@example.com");
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var identity = MakeIdentity(providerId);
        var middleware = new UserSynchronizationMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(AuthenticatedContext(), [MapperFor(identity)], _userContext, _db);

        _db.ChangeTracker.Clear();
        Assert.Equal(1, await _db.Users.CountAsync());
    }

    private static UserIdentity MakeIdentity(string providerId) => new()
    {
        Provider = "EntraId",
        ProviderId = providerId,
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    private static IIdentityClaimsMapper MapperFor(UserIdentity identity)
    {
        var mapper = Substitute.For<IIdentityClaimsMapper>();
        mapper.CanHandle(Arg.Any<ClaimsPrincipal>()).Returns(true);
        mapper.Map(Arg.Any<ClaimsPrincipal>()).Returns(identity);
        return mapper;
    }

    private static HttpContext AuthenticatedContext()
    {
        var claimsIdentity = new ClaimsIdentity([], "Bearer");
        var principal = new ClaimsPrincipal(claimsIdentity);
        return new DefaultHttpContext { User = principal };
    }

    private static HttpContext UnauthenticatedContext() => new DefaultHttpContext();
}
