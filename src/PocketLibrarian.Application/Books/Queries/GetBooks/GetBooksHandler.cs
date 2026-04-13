using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed class GetBooksHandler(IApplicationDbContext db)
    : IQueryHandler<GetBooksQuery, IReadOnlyList<BookDto>>
{
    public async ValueTask<IReadOnlyList<BookDto>> Handle(GetBooksQuery query, CancellationToken cancellationToken)
    {
        var books = await db.Books
            .Where(b => b.OwnerId == query.OwnerId)
            .Select(b => new BookDto(b.Id, b.OwnerId, b.Title, b.Author, b.Isbn, b.LocationId))
            .ToListAsync(cancellationToken);

        return books;
    }
}
