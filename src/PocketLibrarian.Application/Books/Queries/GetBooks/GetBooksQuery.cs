using Mediator;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed record GetBooksQuery(Guid OwnerId) : IQuery<IReadOnlyList<BookDto>>;
