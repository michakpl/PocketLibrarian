using System.Text.Json.Serialization;

namespace PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks.Dto;

public sealed class GoogleBooksSearchResponse
{
    [JsonPropertyName("kind")]
    public string? Kind { get; init; }

    [JsonPropertyName("totalItems")]
    public int TotalItems { get; init; }

    [JsonPropertyName("items")]
    public IReadOnlyList<GoogleBookVolume>? Items { get; init; }
}

