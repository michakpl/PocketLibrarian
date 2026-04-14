using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed class GetBooksHandler(IApplicationDbContext db)
    : IQueryHandler<GetBooksQuery, IReadOnlyList<BookDto>>
{
    public async ValueTask<IReadOnlyList<BookDto>> Handle(GetBooksQuery query, CancellationToken cancellationToken)
    {
        var books = await db.Books
            .Where(b => b.OwnerId == query.OwnerId)
            .Select(b => new BookDto(b.Id, b.OwnerId, b.Title, b.Author, b.Isbn,
                b.Location != null
                    ? new LocationDto(b.Location.Id, b.Location.OwnerId, b.Location.Name,
                        b.Location.Description, b.Location.Code, b.Location.ParentId)
                    : null))
            .ToListAsync(cancellationToken);

        return books;
    }
}
