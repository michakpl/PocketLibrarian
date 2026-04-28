using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations.Queries.GetLocations;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Locations.Queries;

public sealed class GetLocationsHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly GetLocationsHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public GetLocationsHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new GetLocationsHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_NoLocationsInDatabase_ReturnsEmptyList()
    {
        var result = await _handler.Handle(new GetLocationsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_LocationsExistForOwner_ReturnsAllOwnerLocations()
    {
        _db.Locations.AddRange(
            Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId),
            Location.Create("Shelf B", "Bottom shelf", "SHELF-B", _ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, dto => Assert.Equal(_ownerId, dto.OwnerId));
    }

    [Fact]
    public async Task Handle_LocationsExistForDifferentOwnerOnly_ReturnsEmptyList()
    {
        var otherOwnerId = Guid.NewGuid();
        _db.Locations.AddRange(
            Location.Create("Other Shelf 1", "Not mine", "OTHER1", otherOwnerId),
            Location.Create("Other Shelf 2", "Not mine either", "OTHER2", otherOwnerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_MixedOwners_ReturnsOnlyRequestingOwnerLocations()
    {
        var otherOwnerId = Guid.NewGuid();
        _db.Locations.AddRange(
            Location.Create("My Shelf", "Mine", "MINE", _ownerId),
            Location.Create("Their Shelf", "Theirs", "THEIRS", otherOwnerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("My Shelf", result[0].Name);
        Assert.Equal(_ownerId, result[0].OwnerId);
    }

    [Fact]
    public async Task Handle_MapsAllDtoFieldsCorrectly()
    {
        var location = Location.Create("Library", "Home library", "LIB01", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(location.Id, dto.Id);
        Assert.Equal(_ownerId, dto.OwnerId);
        Assert.Equal("Library", dto.Name);
        Assert.Equal("Home library", dto.Description);
        Assert.Equal(location.Code, dto.Code);
        Assert.Null(dto.ParentId);
    }

    [Fact]
    public async Task Handle_LocationWithParentId_MapsDtoWithParentId()
    {
        var parent = Location.Create("Floor 1", "First floor", "FLOOR1", _ownerId);
        _db.Locations.Add(parent);
        await _db.SaveChangesAsync();

        var child = Location.Create("Room 101", "Room on floor 1", "ROOM101", _ownerId, parent.Id);
        _db.Locations.Add(child);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        var childDto = result.Single(dto => dto.Id == child.Id);
        Assert.Equal(parent.Id, childDto.ParentId);
    }

    [Fact]
    public async Task Handle_LocationWithNullParentId_MapsDtoWithNullParentId()
    {
        var location = Location.Create("Standalone", "No parent", "STAND", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        Assert.Single(result);
        Assert.Null(result[0].ParentId);
    }

    [Fact]
    public async Task Handle_RootLocation_HasSingleElementLocationPath()
    {
        var location = Location.Create("Library", "Home library", "LIB01", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(["Library"], result[0].LocationPath);
    }

    [Fact]
    public async Task Handle_ChildLocation_HasTwoElementLocationPath()
    {
        var parent = Location.Create("Shelf", "A shelf", "SHELF", _ownerId);
        _db.Locations.Add(parent);
        await _db.SaveChangesAsync();

        var child = Location.Create("Section A", "Section on shelf", "SEC-A", _ownerId, parent.Id);
        _db.Locations.Add(child);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        var childDto = result.Single(dto => dto.Id == child.Id);
        Assert.Equal(["Shelf", "Section A"], childDto.LocationPath);
    }

    [Fact]
    public async Task Handle_ThreeLevelHierarchy_ReturnsFullLocationPath()
    {
        var room = Location.Create("Study", "Study room", "STUDY", _ownerId);
        _db.Locations.Add(room);
        await _db.SaveChangesAsync();

        var shelf = Location.Create("Shelf C", "Shelf in study", "SHELF-C", _ownerId, room.Id);
        _db.Locations.Add(shelf);
        await _db.SaveChangesAsync();

        var box = Location.Create("Box 1", "First box", "BOX-1", _ownerId, shelf.Id);
        _db.Locations.Add(box);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        var boxDto = result.Single(dto => dto.Id == box.Id);
        Assert.Equal(["Study", "Shelf C", "Box 1"], boxDto.LocationPath);
    }

    [Fact]
    public async Task Handle_HierarchicalLocations_ReturnedInParentBeforeChildOrder()
    {
        var parent = Location.Create("Parent", "Parent location", "PARENT", _ownerId);
        _db.Locations.Add(parent);
        await _db.SaveChangesAsync();

        var child = Location.Create("Child", "Child location", "CHILD", _ownerId, parent.Id);
        _db.Locations.Add(child);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationsQuery(_ownerId), CancellationToken.None);

        var parentIndex = result.ToList().FindIndex(dto => dto.Id == parent.Id);
        var childIndex = result.ToList().FindIndex(dto => dto.Id == child.Id);
        Assert.True(parentIndex < childIndex);
    }
}

