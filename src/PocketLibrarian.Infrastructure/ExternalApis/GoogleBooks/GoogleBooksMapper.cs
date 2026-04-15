using PocketLibrarian.Application.IsbnLookup;
using PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks.Dto;

namespace PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks;

internal static class GoogleBooksMapper
{
    public static BookMetadata? ToBookMetadata(GoogleBookVolume? volume)
    {
        var info = volume?.VolumeInfo;
        if (info is null || string.IsNullOrEmpty(info.Title))
            return null;

        var isbn13 = info.IndustryIdentifiers?
            .FirstOrDefault(x => x.Type == "ISBN_13")?.Identifier;
        var isbn10 = info.IndustryIdentifiers?
            .FirstOrDefault(x => x.Type == "ISBN_10")?.Identifier;

        var thumbnail = info.ImageLinks?.Thumbnail ?? info.ImageLinks?.SmallThumbnail;
        if (thumbnail is not null)
            thumbnail = thumbnail.Replace("http://", "https://", StringComparison.OrdinalIgnoreCase);

        return new BookMetadata(
            Title: info.Title,
            Subtitle: info.Subtitle,
            Authors: (IReadOnlyList<string>?)info.Authors ?? [],
            Publisher: info.Publisher,
            PublishedDate: info.PublishedDate,
            Description: info.Description,
            PageCount: info.PageCount,
            Language: info.Language,
            ThumbnailUrl: thumbnail,
            Isbn13: isbn13,
            Isbn10: isbn10);
    }
}

