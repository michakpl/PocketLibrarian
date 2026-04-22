using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed class GetBooksHandler(IApplicationDbContext db)
    : IQueryHandler<GetBooksQuery, PagedResult<BookDto>>
{
    public async ValueTask<PagedResult<BookDto>> Handle(GetBooksQuery query, CancellationToken cancellationToken)
    {
        var baseQuery = db.Books.Where(b => b.OwnerId == query.OwnerId);

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var locationMap = await db.Locations
            .Where(l => l.OwnerId == query.OwnerId)
            .Select(l => new { l.Id, l.Name, l.ParentId })
            .ToListAsync(cancellationToken)
            .ContinueWith(t => t.Result.ToDictionary(l => l.Id, l => (l.Name, l.ParentId)), cancellationToken);

        var rawBooks = await baseQuery
            .OrderBy(b => b.Title)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(b => new
            {
                b.Id, b.OwnerId, b.Title, b.Author, b.Isbn13, b.Isbn10,
                Location = b.Location != null
                    ? new LocationDto(b.Location.Id, b.Location.OwnerId, b.Location.Name,
                        b.Location.Description, b.Location.Code, b.Location.ParentId)
                    : null,
                LocationId = b.LocationId
            })
            .ToListAsync(cancellationToken);

        var books = rawBooks.Select(b => new BookDto(
            b.Id, b.OwnerId, b.Title, b.Author, b.Isbn13, b.Isbn10,
            b.Location,
            BookDto.BuildLocationPath(b.LocationId, locationMap))).ToList();

        return new PagedResult<BookDto>(books, query.Page, query.PageSize, totalCount);
    }
}
