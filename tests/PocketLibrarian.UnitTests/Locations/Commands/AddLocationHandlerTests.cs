using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations.Commands.AddLocation;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Locations.Commands;

public sealed class AddLocationHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AddLocationHandler _handler;
    private readonly CurrentUserContext _userContext;
    
    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public AddLocationHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        // Unresolved context — no global query filter on Locations
        _userContext = new CurrentUserContext();
        _userContext.Resolve(Guid.NewGuid(), SampleIdentity());
        _db = new AppDbContext(options, _userContext);
        _handler = new AddLocationHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_WithoutParentId_ReturnsLocationDtoWithCorrectProperties()
    {
        var ownerId = _userContext.OwnerId;
        var command = new AddLocationCommand(ownerId, "Living Room", "Main living area", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(ownerId, result.OwnerId);
        Assert.Equal("Living Room", result.Name);
        Assert.Equal("Main living area", result.Description);
        Assert.Null(result.ParentId);
    }

    [Fact]
    public async Task Handle_WithoutParentId_PersistsLocationToDatabase()
    {
        var ownerId = _userContext.OwnerId;
        var command = new AddLocationCommand(ownerId, "Bookshelf", "Wooden bookshelf", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Locations.IgnoreQueryFilters().SingleAsync(l => l.Id == result.Id);
        Assert.Equal("Bookshelf", saved.Name);
        Assert.Equal("Wooden bookshelf", saved.Description);
        Assert.Equal(ownerId, saved.OwnerId);
    }

    [Fact]
    public async Task Handle_WithoutParentId_GeneratesNonEmptyCode()
    {
        var command = new AddLocationCommand(_userContext.OwnerId, "Attic", "Top floor storage", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotEmpty(result.Code);
    }

    [Fact]
    public async Task Handle_WithoutParentId_GeneratesUppercaseCode()
    {
        var command = new AddLocationCommand(_userContext.OwnerId, "Basement", "Ground floor storage", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(result.Code, result.Code.ToUpperInvariant());
    }

    [Fact]
    public async Task Handle_WithValidParentId_ReturnsLocationWithParentId()
    {
        var ownerId = _userContext.OwnerId;
        var parent = Location.Create("Floor 1", "First floor", "FLOOR1", ownerId);
        _db.Locations.Add(parent);
        await _db.SaveChangesAsync();

        var command = new AddLocationCommand(ownerId, "Room 101", "First room", parent.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(parent.Id, result.ParentId);
    }

    [Fact]
    public async Task Handle_WithNonExistentParentId_ThrowsInvalidOperationException()
    {
        var command = new AddLocationCommand(_userContext.OwnerId, "Room", "A room", Guid.NewGuid());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithParentIdBelongingToDifferentOwner_ThrowsInvalidOperationException()
    {
        var differentOwnerId = Guid.NewGuid();
        var parent = Location.Create("Other Shelf", "Someone else's shelf", "OTHER", differentOwnerId);
        _db.Locations.Add(parent);
        await _db.SaveChangesAsync();

        var command = new AddLocationCommand(_userContext.OwnerId, "Room", "A room", parent.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_ReturnedDtoId_MatchesPersistedLocation()
    {
        var command = new AddLocationCommand(_userContext.OwnerId, "Office", "Home office", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Locations.IgnoreQueryFilters().SingleAsync(l => l.Id == result.Id);
        Assert.NotNull(saved);
    }
}

