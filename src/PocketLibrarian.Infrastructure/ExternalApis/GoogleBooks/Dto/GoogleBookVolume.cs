using System.Text.Json.Serialization;

namespace PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks.Dto;

public sealed class GoogleBookVolume
{
    [JsonPropertyName("volumeInfo")]
    public VolumeInfo? VolumeInfo { get; init; }
}

public sealed class VolumeInfo
{
    [JsonPropertyName("title")]
    public string? Title { get; init; }

    [JsonPropertyName("subtitle")]
    public string? Subtitle { get; init; }

    [JsonPropertyName("authors")]
    public IReadOnlyList<string>? Authors { get; init; }

    [JsonPropertyName("publisher")]
    public string? Publisher { get; init; }

    [JsonPropertyName("publishedDate")]
    public string? PublishedDate { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("pageCount")]
    public int? PageCount { get; init; }

    [JsonPropertyName("language")]
    public string? Language { get; init; }

    [JsonPropertyName("industryIdentifiers")]
    public IReadOnlyList<IndustryIdentifier>? IndustryIdentifiers { get; init; }

    [JsonPropertyName("imageLinks")]
    public ImageLinks? ImageLinks { get; init; }
}

public sealed class IndustryIdentifier
{
    [JsonPropertyName("type")]
    public string? Type { get; init; }

    [JsonPropertyName("identifier")]
    public string? Identifier { get; init; }
}

public sealed class ImageLinks
{
    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; init; }

    [JsonPropertyName("smallThumbnail")]
    public string? SmallThumbnail { get; init; }
}

