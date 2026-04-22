using Mediator;

namespace PocketLibrarian.Application.Books.Queries.GetBookById;

public sealed record GetBookByIdQuery(Guid Id, Guid OwnerId) : IQuery<BookDto>;