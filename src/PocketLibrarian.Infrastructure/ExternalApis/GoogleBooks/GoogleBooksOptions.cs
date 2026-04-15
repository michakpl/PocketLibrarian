namespace PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks;

public sealed class GoogleBooksOptions
{
    public string BaseUrl { get; init; } = "https://www.googleapis.com/books/v1/";
    public string ApiKey { get; init; } = string.Empty;
}

