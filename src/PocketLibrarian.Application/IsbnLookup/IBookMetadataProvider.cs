using PocketLibrarian.Domain.ValueObjects;

namespace PocketLibrarian.Application.IsbnLookup;

public interface IBookMetadataProvider
{
    Task<BookMetadata?> LookupAsync(Isbn isbn, CancellationToken ct = default);
}

