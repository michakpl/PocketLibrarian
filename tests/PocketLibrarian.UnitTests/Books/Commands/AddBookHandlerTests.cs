using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Commands.AddBook;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Books.Commands;

public sealed class AddBookHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AddBookHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();
    
    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public AddBookHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        // Unresolved context → global query filter passes all rows (!IsAuthenticated = true)
        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new AddBookHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_WithoutLocationId_ReturnsBookDtoWithCorrectProperties()
    {
        var command = new AddBookCommand(_ownerId, "Dune", "Frank Herbert", "9780441013593", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(_ownerId, result.OwnerId);
        Assert.Equal("Dune", result.Title);
        Assert.Equal("Frank Herbert", result.Author);
        Assert.Equal("9780441013593", result.Isbn);
        Assert.Null(result.Location);
    }

    [Fact]
    public async Task Handle_WithoutLocationId_PersistsBookToDatabase()
    {
        var command = new AddBookCommand(_ownerId, "1984", "George Orwell", null, null);

        var result = await _handler.Handle(command, CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Books.IgnoreQueryFilters().SingleAsync(b => b.Id == result.Id);
        Assert.Equal("1984", saved.Title);
        Assert.Equal("George Orwell", saved.Author);
        Assert.Equal(_ownerId, saved.OwnerId);
    }

    [Fact]
    public async Task Handle_WithNullIsbn_ReturnsNullIsbnInDto()
    {
        var command = new AddBookCommand(_ownerId, "Title", "Author", null, null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Null(result.Isbn);
    }

    [Fact]
    public async Task Handle_WithValidLocationId_CreatesBookWithLocationId()
    {
        var location = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new AddBookCommand(_ownerId, "Fahrenheit 451", "Ray Bradbury", null, location.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(location.Id, result.Location?.Id);
    }

    [Fact]
    public async Task Handle_WithNonExistentLocationId_ThrowsInvalidOperationException()
    {
        var command = new AddBookCommand(_ownerId, "Title", "Author", null, Guid.NewGuid());

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithLocationIdBelongingToDifferentOwner_ThrowsInvalidOperationException()
    {
        var differentOwnerId = Guid.NewGuid();
        var location = Location.Create("Shelf B", "Bottom shelf", "SHELF-B", differentOwnerId);
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        var command = new AddBookCommand(_ownerId, "Title", "Author", null, location.Id);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_ReturnedDtoId_MatchesPersistedBook()
    {
        var command = new AddBookCommand(_ownerId, "Brave New World", "Aldous Huxley", null, null);

        var result = await _handler.Handle(command, CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Books.IgnoreQueryFilters().SingleAsync(b => b.Id == result.Id);
        Assert.NotNull(saved);
    }
}

