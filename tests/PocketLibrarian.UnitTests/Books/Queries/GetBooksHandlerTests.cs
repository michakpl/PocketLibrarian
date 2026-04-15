using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Queries.GetBooks;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Books.Queries;

public sealed class GetBooksHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly GetBooksHandler _handler;
    private readonly CurrentUserContext _userContext;

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public GetBooksHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userContext = new CurrentUserContext();
        _userContext.Resolve(Guid.NewGuid(), SampleIdentity());
        _db = new AppDbContext(options, _userContext);
        _handler = new GetBooksHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Handle_NoBooksInDatabase_ReturnsEmptyList()
    {
        var result = await _handler.Handle(new GetBooksQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_BooksExistForOwner_ReturnsAllOwnerBooks()
    {
        var ownerId = _userContext.OwnerId;
        _db.Books.AddRange(
            Book.Create("Book One", "Author A", ownerId),
            Book.Create("Book Two", "Author B", ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, dto => Assert.Equal(ownerId, dto.OwnerId));
    }

    [Fact]
    public async Task Handle_BooksExistForDifferentOwnerOnly_ReturnsEmptyList()
    {
        var otherOwnerId = Guid.NewGuid();
        _db.Books.AddRange(
            Book.Create("Other Book 1", "Author X", otherOwnerId),
            Book.Create("Other Book 2", "Author Y", otherOwnerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(_userContext.OwnerId), CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_MixedOwners_ReturnsOnlyRequestingOwnerBooks()
    {
        var ownerId = _userContext.OwnerId;
        var otherOwnerId = Guid.NewGuid();
        _db.Books.AddRange(
            Book.Create("My Book", "My Author", ownerId),
            Book.Create("Their Book", "Their Author", otherOwnerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("My Book", result[0].Title);
        Assert.Equal(ownerId, result[0].OwnerId);
    }

    [Fact]
    public async Task Handle_MapsAllDtoFieldsCorrectly()
    {
        var ownerId = _userContext.OwnerId;
        var location = Location.Create("Library", "Home library", "LIB01", ownerId);
        _db.Locations.Add(location);
        var book = Book.Create("Dune", "Frank Herbert", ownerId, "9780441013593", "1954839243", location.Id);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(book.Id, dto.Id);
        Assert.Equal(ownerId, dto.OwnerId);
        Assert.Equal("Dune", dto.Title);
        Assert.Equal("Frank Herbert", dto.Author);
        Assert.Equal("9780441013593", dto.Isbn13);
        Assert.Equal("1954839243", dto.Isbn10);
        Assert.Equal(location.Id, dto.Location?.Id);
    }

    [Fact]
    public async Task Handle_BookWithNullIsbnAndNoLocation_MapsDtoWithNulls()
    {
        var ownerId = _userContext.OwnerId;
        _db.Books.Add(Book.Create("Minimal Book", "Minimal Author", ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Single(result);
        Assert.Null(result[0].Isbn13);
        Assert.Null(result[0].Location);
    }
}

