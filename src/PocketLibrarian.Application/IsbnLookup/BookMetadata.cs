namespace PocketLibrarian.Application.IsbnLookup;

public sealed record BookMetadata(
    string Title,
    string? Subtitle,
    IReadOnlyList<string> Authors,
    string? Publisher,
    string? PublishedDate,
    string? Description,
    int? PageCount,
    string? Language,
    string? ThumbnailUrl,
    string? Isbn13,
    string? Isbn10);

