using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Queries.GetBookById;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Books.Queries;

public sealed class GetBookByIdHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly GetBookByIdHandler _handler;
    private readonly Guid _ownerId;

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public GetBookByIdHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        _ownerId = Guid.NewGuid();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);
        _handler = new GetBookByIdHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_BookExists_ReturnsCorrectBookDto()
    {
        var book = Book.Create("Dune", "Frank Herbert", _ownerId, "9780441013593", "1954839243");
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBookByIdQuery(book.Id, _ownerId), CancellationToken.None);

        Assert.Equal(book.Id, result.Id);
        Assert.Equal(_ownerId, result.OwnerId);
        Assert.Equal("Dune", result.Title);
        Assert.Equal("Frank Herbert", result.Author);
        Assert.Equal("9780441013593", result.Isbn13);
        Assert.Equal("1954839243", result.Isbn10);
        Assert.Null(result.Location);
        Assert.Empty(result.LocationPath);
    }

    [Fact]
    public async Task Handle_BookDoesNotExist_ThrowsNotFoundException()
    {
        var query = new GetBookByIdQuery(Guid.NewGuid(), _ownerId);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _handler.Handle(query, CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_BookBelongsToDifferentOwner_ThrowsNotFoundException()
    {
        var otherOwnerId = Guid.NewGuid();
        var book = Book.Create("Their Book", "Their Author", otherOwnerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(
            () => _handler.Handle(new GetBookByIdQuery(book.Id, _ownerId), CancellationToken.None).AsTask());
    }

    [Fact]
    public async Task Handle_BookWithLocation_ReturnsDtoWithLocationAndSingleElementPath()
    {
        var location = Location.Create("Bookshelf", "Main bookshelf", "BS01", _ownerId);
        _db.Locations.Add(location);
        var book = Book.Create("Foundation", "Isaac Asimov", _ownerId, null, null, location.Id);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBookByIdQuery(book.Id, _ownerId), CancellationToken.None);

        Assert.NotNull(result.Location);
        Assert.Equal(location.Id, result.Location.Id);
        Assert.Equal("Bookshelf", result.Location.Name);
        Assert.Equal(["Bookshelf"], result.LocationPath);
    }

    [Fact]
    public async Task Handle_BookWithNestedLocation_ReturnsDtoWithFullLocationPath()
    {
        var shelf = Location.Create("Shelf A", "Top shelf", "SHELF-A", _ownerId);
        _db.Locations.Add(shelf);
        await _db.SaveChangesAsync();

        var section = Location.Create("Section 1", "First section", "SEC-1", _ownerId, shelf.Id);
        _db.Locations.Add(section);
        var book = Book.Create("Neuromancer", "William Gibson", _ownerId, null, null, section.Id);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBookByIdQuery(book.Id, _ownerId), CancellationToken.None);

        Assert.Equal(section.Id, result.Location?.Id);
        Assert.Equal(["Shelf A", "Section 1"], result.LocationPath);
    }

    [Fact]
    public async Task Handle_BookWithDeepNestedLocation_ReturnsDtoWithFullThreeLevelPath()
    {
        var room = Location.Create("Study", "Study room", "STUDY", _ownerId);
        _db.Locations.Add(room);
        await _db.SaveChangesAsync();

        var shelf = Location.Create("Shelf B", "Shelf in study", "SHELF-B", _ownerId, room.Id);
        _db.Locations.Add(shelf);
        await _db.SaveChangesAsync();

        var box = Location.Create("Box 3", "Third box", "BOX-3", _ownerId, shelf.Id);
        _db.Locations.Add(box);
        var book = Book.Create("Snow Crash", "Neal Stephenson", _ownerId, null, null, box.Id);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBookByIdQuery(book.Id, _ownerId), CancellationToken.None);

        Assert.Equal(["Study", "Shelf B", "Box 3"], result.LocationPath);
    }

    [Fact]
    public async Task Handle_BookWithNoIsbnAndNoLocation_MapsDtoWithNulls()
    {
        var book = Book.Create("Minimal Book", "Some Author", _ownerId);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBookByIdQuery(book.Id, _ownerId), CancellationToken.None);

        Assert.Null(result.Isbn13);
        Assert.Null(result.Isbn10);
        Assert.Null(result.Location);
        Assert.Empty(result.LocationPath);
    }

    [Fact]
    public async Task Handle_MultipleBooks_ReturnsOnlyRequestedBook()
    {
        var bookA = Book.Create("Book A", "Author A", _ownerId);
        var bookB = Book.Create("Book B", "Author B", _ownerId);
        _db.Books.AddRange(bookA, bookB);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBookByIdQuery(bookA.Id, _ownerId), CancellationToken.None);

        Assert.Equal(bookA.Id, result.Id);
        Assert.Equal("Book A", result.Title);
    }
}

