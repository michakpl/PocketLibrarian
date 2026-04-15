using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using PocketLibrarian.Application.IsbnLookup;

namespace PocketLibrarian.Infrastructure.Caching;

public sealed class IsbnCacheService(IDistributedCache cache) : IIsbnCacheService
{
    private static readonly TimeSpan HitTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan MissTtl = TimeSpan.FromHours(1);

    // A JSON-safe sentinel string that can never be valid BookMetadata JSON
    private const string MissSentinel = "__miss__";

    private static string CacheKey(string isbn) => $"isbn:{isbn}";

    public async ValueTask<(bool IsCached, BookMetadata? Value)> TryGetAsync(
        string isbn, CancellationToken ct = default)
    {
        var raw = await cache.GetStringAsync(CacheKey(isbn), ct);

        if (raw is null)
            return (false, null);        // not cached at all

        if (raw == MissSentinel)
            return (true, null);         // cached miss sentinel

        var metadata = JsonSerializer.Deserialize<BookMetadata>(raw);
        return (true, metadata);
    }

    public async ValueTask SetAsync(string isbn, BookMetadata? metadata, CancellationToken ct = default)
    {
        var (value, ttl) = metadata is not null
            ? (JsonSerializer.Serialize(metadata), HitTtl)
            : (MissSentinel, MissTtl);

        var entryOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        };

        await cache.SetStringAsync(CacheKey(isbn), value, entryOptions, ct);
    }
}

