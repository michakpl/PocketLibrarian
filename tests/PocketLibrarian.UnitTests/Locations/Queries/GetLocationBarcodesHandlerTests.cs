using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations.Queries.GetLocationBarcodes;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Locations.Queries;

public sealed class GetLocationBarcodesHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly GetLocationBarcodesHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public GetLocationBarcodesHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new GetLocationBarcodesHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── No-filter queries ────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NoLocationsInDatabase_ReturnsEmptyList()
    {
        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(Guid.NewGuid(), null),
            CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_LocationsExistForOwner_ReturnsAllOwnerLocations()
    {
        _db.Locations.AddRange(
            Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId),
            Location.Create("Shelf B", "Bottom shelf", "SHELF-B", _ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Handle_LocationsExistForDifferentOwnerOnly_ReturnsEmptyList()
    {
        var otherOwnerId = Guid.NewGuid();
        _db.Locations.AddRange(
            Location.Create("Other Shelf 1", "Not mine", "OTHER1", otherOwnerId),
            Location.Create("Other Shelf 2", "Not mine either", "OTHER2", otherOwnerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

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

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("My Shelf", result[0].Name);
    }

    // ── DTO field mapping ────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MapsAllDtoFieldsCorrectly()
    {
        var location = Location.Create("Library", "Home library", "LIB01", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(location.Id, dto.Id);
        Assert.Equal("Library", dto.Name);
        Assert.Equal("LIB01", dto.Code);
    }

    // ── Location path building ───────────────────────────────────────────────

    [Fact]
    public async Task Handle_RootLocation_HasSingleElementLocationPath()
    {
        var location = Location.Create("Library", "Home library", "LIB01", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

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

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

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

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, null),
            CancellationToken.None);

        var boxDto = result.Single(dto => dto.Id == box.Id);
        Assert.Equal(["Study", "Shelf C", "Box 1"], boxDto.LocationPath);
    }

    // ── LocationIds filter ───────────────────────────────────────────────────

    [Fact]
    public async Task Handle_EmptyLocationIdsList_ReturnsAllOwnerLocations()
    {
        _db.Locations.AddRange(
            Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId),
            Location.Create("Shelf B", "Bottom shelf", "SHELF-B", _ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, []),
            CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Handle_LocationIdsFilterProvided_ReturnsOnlyMatchingLocations()
    {
        var included = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        var excluded = Location.Create("Shelf B", "Bottom shelf", "SHELF-B", _ownerId);
        _db.Locations.AddRange(included, excluded);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, [included.Id]),
            CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(included.Id, result[0].Id);
    }

    [Fact]
    public async Task Handle_LocationIdsFilterWithMultipleIds_ReturnsAllMatchingLocations()
    {
        var loc1 = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        var loc2 = Location.Create("Shelf B", "Bottom shelf", "SHELF-B", _ownerId);
        var loc3 = Location.Create("Shelf C", "Middle shelf", "SHELF-C", _ownerId, loc2.Id);
        _db.Locations.AddRange(loc1, loc2, loc3);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, [loc1.Id, loc3.Id]),
            CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, dto => dto.Id == loc1.Id);
        Assert.Contains(result, dto => dto.Id == loc3.Id);
        var loc3Dto = result.Single(dto => dto.Id == loc3.Id);
        Assert.Equal(["Shelf B", "Shelf C"], loc3Dto.LocationPath);
    }

    [Fact]
    public async Task Handle_LocationIdsFilterBelongingToAnotherOwner_ReturnsEmptyList()
    {
        var otherOwnerId = Guid.NewGuid();
        var otherLocation = Location.Create("Other Shelf", "Not mine", "OTHER", otherOwnerId);
        _db.Locations.Add(otherLocation);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, [otherLocation.Id]),
            CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_LocationIdsFilterWithNonExistentId_ReturnsEmptyList()
    {
        _db.Locations.Add(Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(
            new GetLocationBarcodesQuery(_ownerId, [Guid.NewGuid()]),
            CancellationToken.None);

        Assert.Empty(result);
    }
}

