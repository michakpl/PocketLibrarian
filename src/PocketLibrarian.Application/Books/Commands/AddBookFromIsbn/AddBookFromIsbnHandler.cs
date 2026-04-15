using Mediator;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.IsbnLookup;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Domain.ValueObjects;

namespace PocketLibrarian.Application.Books.Commands.AddBookFromIsbn;

public sealed class AddBookFromIsbnHandler(
    IApplicationDbContext db,
    IBookMetadataProvider provider,
    IIsbnCacheService cache)
    : ICommandHandler<AddBookFromIsbnCommand, BookDto>
{
    public async ValueTask<BookDto> Handle(AddBookFromIsbnCommand cmd, CancellationToken ct)
    {
        // Validator guarantees this succeeds
        Isbn.TryCreate(cmd.RawIsbn, out var isbn);
        var normalizedIsbn = isbn!.Value;

        var (isCached, cached) = await cache.TryGetAsync(normalizedIsbn, ct);

        BookMetadata? metadata;
        if (isCached)
        {
            if (cached is null)
                throw new NotFoundException("Book", normalizedIsbn);

            metadata = cached;
        }
        else
        {
            metadata = await provider.LookupAsync(isbn, ct);

            // Cache both hits (24 h) and misses (1 h sentinel)
            await cache.SetAsync(normalizedIsbn, metadata, ct);

            if (metadata is null)
                throw new NotFoundException("Book", normalizedIsbn);
        }

        var author = metadata.Authors.Count > 0
            ? string.Join(", ", metadata.Authors)
            : "Unknown";

        var book = Book.Create(metadata.Title, author, cmd.OwnerId, metadata.Isbn13, metadata.Isbn10);

        db.Books.Add(book);
        await db.SaveChangesAsync(ct);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn13, book.Isbn10, null);
    }
}

