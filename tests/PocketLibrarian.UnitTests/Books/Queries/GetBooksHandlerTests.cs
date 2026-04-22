using System.Collections.ObjectModel;
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

        Assert.Empty(result.Items);
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

        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, dto => Assert.Equal(ownerId, dto.OwnerId));
    }
    
    [Fact]
    public async Task Handle_BooksExistForOwner_ReturnsLastPageOwnerBooks()
    {
        var ownerId = _userContext.OwnerId;
        Collection<Book> books = [];
        for (var i = 0; i < 50; i++)
        {
            books.Add(Book.Create($"Book {i + 1}", $"Author {i + 1}", ownerId));
        }
        _db.Books.AddRange(books);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId, 3), CancellationToken.None);

        Assert.Equal(10, result.Items.Count);
        Assert.Equal(50, result.TotalCount);
        Assert.Equal(3, result.Page);
        Assert.All(result.Items, dto => Assert.Equal(ownerId, dto.OwnerId));
    }
    
    [Fact]
    public async Task Handle_BooksExistForOwner_ReturnsPaginatedOwnerBooks()
    {
        var ownerId = _userContext.OwnerId;
        Collection<Book> books = [];
        for (var i = 0; i < 50; i++)
        {
            books.Add(Book.Create($"Book {i + 1}", $"Author {i + 1}", ownerId));
        }
        _db.Books.AddRange(books);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Equal(20, result.Items.Count);
        Assert.Equal(50, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.All(result.Items, dto => Assert.Equal(ownerId, dto.OwnerId));
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

        Assert.Empty(result.Items);
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

        Assert.Single(result.Items);
        Assert.Equal("My Book", result.Items[0].Title);
        Assert.Equal(ownerId, result.Items[0].OwnerId);
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

        Assert.Single(result.Items);
        var dto = result.Items[0];
        Assert.Equal(book.Id, dto.Id);
        Assert.Equal(ownerId, dto.OwnerId);
        Assert.Equal("Dune", dto.Title);
        Assert.Equal("Frank Herbert", dto.Author);
        Assert.Equal("9780441013593", dto.Isbn13);
        Assert.Equal("1954839243", dto.Isbn10);
        Assert.Equal(location.Id, dto.Location?.Id);
        Assert.Equal(["Library"], dto.LocationPath);
    }

    [Fact]
    public async Task Handle_BookWithNullIsbnAndNoLocation_MapsDtoWithNulls()
    {
        var ownerId = _userContext.OwnerId;
        _db.Books.Add(Book.Create("Minimal Book", "Minimal Author", ownerId));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Null(result.Items[0].Isbn13);
        Assert.Null(result.Items[0].Location);
        Assert.Empty(result.Items[0].LocationPath);
    }

    [Fact]
    public async Task Handle_BookWithNestedLocations_ReturnsFullLocationPath()
    {
        var ownerId = _userContext.OwnerId;
        var shelf = Location.Create("Shelf A", "Shelf desc", "SHELF-A", ownerId);
        _db.Locations.Add(shelf);
        await _db.SaveChangesAsync();

        var section = Location.Create("Section 1", "Section desc", "SEC-1", ownerId, shelf.Id);
        _db.Locations.Add(section);
        var book = Book.Create("Nested Book", "An Author", ownerId, null, null, section.Id);
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(new GetBooksQuery(ownerId), CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(["Shelf A", "Section 1"], result.Items[0].LocationPath);
    }
}
