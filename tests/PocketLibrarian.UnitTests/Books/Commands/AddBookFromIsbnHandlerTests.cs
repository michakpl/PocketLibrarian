using Microsoft.EntityFrameworkCore;
using NSubstitute;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Commands.AddBookFromIsbn;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.IsbnLookup;
using PocketLibrarian.Domain.ValueObjects;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.UnitTests.Books.Commands;

public sealed class AddBookFromIsbnHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IBookMetadataProvider _provider;
    private readonly IIsbnCacheService _cache;
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
        _cache = Substitute.For<IIsbnCacheService>();

        _handler = new AddBookFromIsbnHandler(_db, _provider, _cache);
    }

    public void Dispose() => _db.Dispose();

    // ── Cache miss path ────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CacheMiss_LooksUpMetadataAndReturnsBookDto()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], "Chilton Books",
            "1965", null, 412, "en", null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((false, (BookMetadata?)null));
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
    public async Task Handle_CacheMiss_PersistsBookToDatabase()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], null, null, null, null, null, null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((false, (BookMetadata?)null));
        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        _db.ChangeTracker.Clear();
        var saved = await _db.Books.IgnoreQueryFilters().SingleAsync(b => b.Id == result.Id);
        Assert.Equal("Dune", saved.Title);
        Assert.Equal(_ownerId, saved.OwnerId);
    }

    [Fact]
    public async Task Handle_CacheMiss_SetsCache()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], null, null, null, null, null, null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((false, (BookMetadata?)null));
        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        await _cache.Received(1).SetAsync(Arg.Any<string>(), metadata, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CacheMiss_NotFoundByProvider_ThrowsNotFoundException()
    {
        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((false, (BookMetadata?)null));
        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns((BookMetadata?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None).AsTask());
    }

    // ── Cache hit path ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CacheHit_DoesNotCallProvider()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], null, null, null, null, null, null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((true, metadata));

        await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        await _provider.DidNotReceive().LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsBookDtoFromCachedMetadata()
    {
        var metadata = new BookMetadata("Dune", null, ["Frank Herbert"], null, null, null, null, null, null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((true, metadata));

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.Equal("Dune", result.Title);
        Assert.Equal("Frank Herbert", result.Author);
    }

    [Fact]
    public async Task Handle_CacheHitWithNullSentinel_ThrowsNotFoundException()
    {
        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((true, (BookMetadata?)null));

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None).AsTask());
    }

    // ── Author formatting ──────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MultipleAuthors_JoinsAuthorsWithComma()
    {
        var metadata = new BookMetadata("Good Omens", null, ["Terry Pratchett", "Neil Gaiman"],
            null, null, null, null, null, null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((false, (BookMetadata?)null));
        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.Equal("Terry Pratchett, Neil Gaiman", result.Author);
    }

    [Fact]
    public async Task Handle_NoAuthors_UsesUnknownFallback()
    {
        var metadata = new BookMetadata("Untitled", null, [], null, null, null, null, null, null, ValidIsbn13, null);

        _cache.TryGetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
              .Returns((false, (BookMetadata?)null));
        _provider.LookupAsync(Arg.Any<Isbn>(), Arg.Any<CancellationToken>())
                 .Returns(metadata);

        var result = await _handler.Handle(new AddBookFromIsbnCommand(_ownerId, ValidIsbn13), CancellationToken.None);

        Assert.Equal("Unknown", result.Author);
    }
}
