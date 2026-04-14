using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Commands.UpdateBook;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Books.Commands;

public sealed class UpdateBookHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly UpdateBookHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public UpdateBookHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new UpdateBookHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsUpdatedBookDto()
    {
        var book = Book.Create("Old Title", "Old Author", _ownerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "New Title", "New Author", "9780441013593", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(book.Id, result.Id);
        Assert.Equal(_ownerId, result.OwnerId);
        Assert.Equal("New Title", result.Title);
        Assert.Equal("New Author", result.Author);
        Assert.Equal("9780441013593", result.Isbn);
        Assert.Null(result.Location);
    }

    [Fact]
    public async Task Handle_WithValidCommand_PersistsChangesToDatabase()
    {
        var book = Book.Create("Old Title", "Old Author", _ownerId, "0000000000");
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "Updated Title", "Updated Author", null, null);

        await _handler.Handle(command, CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Books.IgnoreQueryFilters().SingleAsync(b => b.Id == book.Id);
        Assert.Equal("Updated Title", saved.Title);
        Assert.Equal("Updated Author", saved.Author);
        Assert.Null(saved.Isbn);
    }

    [Fact]
    public async Task Handle_WithNonExistentBookId_ThrowsNotFoundException()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), _ownerId, "Title", "Author", null, null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithBookBelongingToDifferentOwner_ThrowsNotFoundException()
    {
        var differentOwnerId = Guid.NewGuid();
        var book = Book.Create("Title", "Author", differentOwnerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "New Title", "New Author", null, null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithValidLocationId_ReturnsBookDtoWithLocation()
    {
        var location = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        _db.Locations.Add(location);
        var book = Book.Create("Title", "Author", _ownerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "Title", "Author", null, location.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result.Location);
        Assert.Equal(location.Id, result.Location.Id);
        Assert.Equal("Shelf A", result.Location.Name);
    }

    [Fact]
    public async Task Handle_WithNonExistentLocationId_ThrowsNotFoundException()
    {
        var book = Book.Create("Title", "Author", _ownerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "Title", "Author", null, Guid.NewGuid());

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_WithLocationIdBelongingToDifferentOwner_ThrowsNotFoundException()
    {
        var differentOwnerId = Guid.NewGuid();
        var location = Location.Create("Shelf B", "Bottom shelf", "SHELF-B", differentOwnerId);
        _db.Locations.Add(location);
        var book = Book.Create("Title", "Author", _ownerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "Title", "Author", null, location.Id);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_ClearingLocation_ReturnsBookDtoWithNullLocation()
    {
        var location = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        _db.Locations.Add(location);
        var book = Book.Create("Title", "Author", _ownerId, null, location.Id);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var command = new UpdateBookCommand(book.Id, _ownerId, "Title", "Author", null, null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Null(result.Location);
    }
}
