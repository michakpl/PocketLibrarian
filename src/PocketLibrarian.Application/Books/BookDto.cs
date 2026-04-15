using PocketLibrarian.Application.Locations;

namespace PocketLibrarian.Application.Books;

public sealed record BookDto(Guid Id, Guid OwnerId, string Title, string Author, string? Isbn13, string? Isbn10, LocationDto? Location);
