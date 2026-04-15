using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using PocketLibrarian.Application.IsbnLookup;
using PocketLibrarian.Domain.ValueObjects;
using PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks.Dto;

namespace PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks;

public sealed class GoogleBooksClient(HttpClient http, IOptions<GoogleBooksOptions> options)
    : IBookMetadataProvider
{
    public async Task<BookMetadata?> LookupAsync(Isbn isbn, CancellationToken ct = default)
    {
        var apiKey = options.Value.ApiKey;
        var url = $"volumes?q=isbn:{isbn.Value}&key={apiKey}&maxResults=1";

        var response = await http.GetFromJsonAsync<GoogleBooksSearchResponse>(url, ct);

        if (response is null || response.TotalItems == 0 || response.Items is not { Count: > 0 })
            return null;

        return GoogleBooksMapper.ToBookMetadata(response.Items[0]);
    }
}

