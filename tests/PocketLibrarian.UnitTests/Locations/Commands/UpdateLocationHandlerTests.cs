using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.Locations.Commands.UpdateLocation;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Locations.Commands;

public sealed class UpdateLocationHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly UpdateLocationHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public UpdateLocationHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new UpdateLocationHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsUpdatedLocationDto()
    {
        var location = Location.Create("Old Name", "Old description", "OLD", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "New Name", "New description", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(location.Id, result.Id);
        Assert.Equal(_ownerId, result.OwnerId);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("New description", result.Description);
        Assert.Null(result.ParentId);
    }

    [Fact]
    public async Task Handle_WithValidCommand_PersistsChangesToDatabase()
    {
        var location = Location.Create("Old Name", "Old description", "OLD", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "Updated Name", "Updated description", null);

        await _handler.Handle(command, CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Locations.IgnoreQueryFilters().SingleAsync(l => l.Id == location.Id);
        Assert.Equal("Updated Name", saved.Name);
        Assert.Equal("Updated description", saved.Description);
    }

    [Fact]
    public async Task Handle_WithNonExistentLocationId_ThrowsNotFoundException()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), _ownerId, "Name", "Description", null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithLocationBelongingToDifferentOwner_ThrowsNotFoundException()
    {
        var differentOwnerId = Guid.NewGuid();
        var location = Location.Create("Shelf", "A shelf", "SHELF", differentOwnerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "New Name", "New description", null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithValidParentId_ReturnsLocationDtoWithParentId()
    {
        var parent = Location.Create("Floor 1", "First floor", "FLOOR1", _ownerId);
        _db.Locations.Add(parent);
        var location = Location.Create("Room 101", "First room", "ROOM101", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "Room 101", "First room", parent.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(parent.Id, result.ParentId);
    }

    [Fact]
    public async Task Handle_WithNonExistentParentId_ThrowsNotFoundException()
    {
        var location = Location.Create("Room", "A room", "ROOM", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "Room", "A room", Guid.NewGuid());

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithParentIdBelongingToDifferentOwner_ThrowsNotFoundException()
    {
        var differentOwnerId = Guid.NewGuid();
        var parent = Location.Create("Other Floor", "Someone else's floor", "OTHER", differentOwnerId);
        _db.Locations.Add(parent);
        var location = Location.Create("Room", "A room", "ROOM", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "Room", "A room", parent.Id);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_ClearingParentId_ReturnsLocationDtoWithNullParentId()
    {
        var parent = Location.Create("Floor 1", "First floor", "FLOOR1", _ownerId);
        _db.Locations.Add(parent);
        var location = Location.Create("Room 101", "First room", "ROOM101", _ownerId, parent.Id);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "Room 101", "First room", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Null(result.ParentId);
    }

    [Fact]
    public async Task Handle_WithValidCommand_PreservesCode()
    {
        var location = Location.Create("Shelf", "A shelf", "SHELF-001", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new UpdateLocationCommand(location.Id, _ownerId, "Updated Shelf", "An updated shelf", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal("SHELF-001", result.Code);
    }
}

