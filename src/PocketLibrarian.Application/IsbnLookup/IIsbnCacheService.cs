namespace PocketLibrarian.Application.IsbnLookup;

public interface IIsbnCacheService
{
    ValueTask<(bool IsCached, BookMetadata? Value)> TryGetAsync(string isbn, CancellationToken ct = default);
    ValueTask SetAsync(string isbn, BookMetadata? metadata, CancellationToken ct = default);
}

