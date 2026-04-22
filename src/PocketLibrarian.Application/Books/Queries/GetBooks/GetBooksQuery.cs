using Mediator;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed record GetBooksQuery(Guid OwnerId, int Page = 1, int PageSize = 20) : IQuery<PagedResult<BookDto>>;
