using Microsoft.EntityFrameworkCore;
using NSubstitute;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Commands.AddBookFromIsbn;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.IsbnLookup;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Domain.ValueObjects;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Books.Commands;

public sealed class AddBookFromIsbnHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IBookMetadataProvider _provider;
    private readonly AddBookFromIsbnHandler _handler;
    private readonly Guid _ownerId = Guid.NewGuid();

    // Valid ISBN-13 (Dune) used across tests
    private const string ValidIsbn13 = "9780441013593";

    private static UserIdentity SampleIdentity() => new()
    {
        Provider = "EntraId",
        ProviderId = "oid-123",
        DisplayName = "Test User",
        Email = "test@example.com"
    };

    public AddBookFromIsbnHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var userContext = new CurrentUserContext();
        userContext.Resolve(_ownerId, SampleIdentity());
        _db = new AppDbContext(options, userContext);

        _provider = Substitute.For<IBookMetadataProvider>();

        _handler = new AddBookFromIsbnHandler(_db, _provider);
    }

    public void Dispose() => _db.Dispose();

    // ── No existing DB record path ─────────────────────────────────────────────

    [Fact]
    public async Task Handle_NoExistingBook_LooksUpMetadataAndReturnsBookDto()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], "Chilton Books",
            "1965", null, 412, "en", null, ValidIsbn13, null);

        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(_ownerId, result.OwnerId);
        Assert.Equal("Dune", result.Title);
        Assert.Equal("Frank Herbert", result.Author);
        Assert.Equal(ValidIsbn13, result.Isbn13);
        Assert.Null(result.Location);
    }

    [Fact]
    public async Task Handle_NoExistingBook_PersistsBookToDatabase()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], null, null, null, null, null, null, ValidIsbn13, null);

        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Books.IgnoreQueryFilters().SingleAsync(b => b.Id == result.Id);
        Assert.Equal("Dune", saved.Title);
        Assert.Equal(_ownerId, saved.OwnerId);
    }

    [Fact]
    public async Task Handle_NoExistingBook_NotFoundByProvider_ThrowsNotFoundException()
    {
        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns((BookMetadata?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None).AsTask());
    }

    // ── Existing DB record path ────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingBookInDb_DoesNotCallProvider()
    {
        var existingBook = Book.Create("Dune", "Frank Herbert", Guid.NewGuid(), ValidIsbn13);
        _db.Books.Add(existingBook);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        await _provider.DidNotReceive().LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ExistingBookInDb_ReturnsBookDtoFromExistingRecord()
    {
        var existingBook = Book.Create("Dune", "Frank Herbert", Guid.NewGuid(), ValidIsbn13);
        _db.Books.Add(existingBook);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.Equal("Dune", result.Title);
        Assert.Equal("Frank Herbert", result.Author);
        Assert.Equal(_ownerId, result.OwnerId);
    }

    [Fact]
    public async Task Handle_ExistingBookInDb_PersistsNewBookForCurrentOwner()
    {
        var existingBook = Book.Create("Dune", "Frank Herbert", Guid.NewGuid(), ValidIsbn13, "044101359X");
        _db.Books.Add(existingBook);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Books.IgnoreQueryFilters().SingleAsync(b => b.Id == result.Id);
        Assert.Equal(_ownerId, saved.OwnerId);
        Assert.Equal("Dune", saved.Title);
        Assert.Equal("044101359X", saved.Isbn10);
    }

    // ── Author formatting ──────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MultipleAuthors_JoinsAuthorsWithComma()
    {
        var metadata = new BookMetadata("Good Omens", null, ["Terry Pratchett", "Neil Gaiman"],
            null, null, null, null, null, null, ValidIsbn13, null);

        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.Equal("Terry Pratchett, Neil Gaiman", result.Author);
    }

    [Fact]
    public async Task Handle_NoAuthors_UsesUnknownFallback()
    {
        var metadata = new BookMetadata("Untitled", null, [], null, null, null, null, null, null, ValidIsbn13, null);

        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.Equal("Unknown", result.Author);
    }
}
