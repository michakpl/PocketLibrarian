using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.Locations.Queries.GetLocationById;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Locations.Queries;

public sealed class GetLocationByIdHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly GetLocationByIdHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public GetLocationByIdHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new GetLocationByIdHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_LocationExists_ReturnsCorrectLocationDto()
    {
        var location = Location.Create("Library", "Home library", "LIB01", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationByIdQuery(location.Id, _ownerId), CancellationToken.None);

        Assert.Equal(location.Id, result.Id);
        Assert.Equal(_ownerId, result.OwnerId);
        Assert.Equal("Library", result.Name);
        Assert.Equal("Home library", result.Description);
        Assert.Equal(location.Code, result.Code);
        Assert.Null(result.ParentId);
    }

    [Fact]
    public async Task Handle_LocationDoesNotExist_ThrowsNotFoundException()
    {
        var query = new GetLocationByIdQuery(Guid.NewGuid(), _ownerId);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _handler.Handle(query, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_LocationBelongsToDifferentOwner_ThrowsNotFoundException()
    {
        var otherOwnerId = Guid.NewGuid();
        var location = Location.Create("Their Shelf", "Not mine", "OTHER", otherOwnerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(
            () => _handler.Handle(new GetLocationByIdQuery(location.Id, _ownerId), CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_RootLocation_ReturnsSingleElementLocationPath()
    {
        var location = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationByIdQuery(location.Id, _ownerId), CancellationToken.None);

        Assert.Equal(["Shelf A"], result.LocationPath);
    }

    [Fact]
    public async Task Handle_ChildLocation_ReturnsTwoElementLocationPath()
    {
        var parent = Location.Create("Shelf", "A shelf", "SHELF", _ownerId);
        _db.Locations.Add(parent);
        await _db.SaveChangesAsync();

        var child = Location.Create("Section A", "Section on shelf", "SEC-A", _ownerId, parent.Id);
        _db.Locations.Add(child);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationByIdQuery(child.Id, _ownerId), CancellationToken.None);

        Assert.Equal(parent.Id, result.ParentId);
        Assert.Equal(["Shelf", "Section A"], result.LocationPath);
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

        var result = await _handler.Handle(new GetLocationByIdQuery(box.Id, _ownerId), CancellationToken.None);

        Assert.Equal(["Study", "Shelf C", "Box 1"], result.LocationPath);
    }

    [Fact]
    public async Task Handle_MultipleLocations_ReturnsOnlyRequestedLocation()
    {
        var locationA = Location.Create("Shelf A", "First shelf", "SHELF-A", _ownerId);
        var locationB = Location.Create("Shelf B", "Second shelf", "SHELF-B", _ownerId);
        _db.Locations.AddRange(locationA, locationB);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetLocationByIdQuery(locationA.Id, _ownerId), CancellationToken.None);

        Assert.Equal(locationA.Id, result.Id);
        Assert.Equal("Shelf A", result.Name);
    }
}

