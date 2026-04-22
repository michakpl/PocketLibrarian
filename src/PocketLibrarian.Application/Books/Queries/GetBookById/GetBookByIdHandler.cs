using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.Locations;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Books.Queries.GetBookById;

public sealed class GetBookByIdHandler(IApplicationDbContext db) : IQueryHandler<GetBookByIdQuery, BookDto>
{
    public async ValueTask<BookDto> Handle(GetBookByIdQuery query, CancellationToken cancellationToken)
    {
        var book = await db.Books.SingleAsync(b => b.Id == query.Id && b.OwnerId == query.OwnerId, cancellationToken);
        if (book is null)
        {
            throw new NotFoundException(nameof(Book), query.Id);
        }

        var location = await db.Locations.FindAsync([book.LocationId], cancellationToken);

        var locationMap = await db.Locations
            .Where(l => l.OwnerId == query.OwnerId)
            .Select(l => new { l.Id, l.Name, l.ParentId })
            .ToListAsync(cancellationToken)
            .ContinueWith(t => t.Result.ToDictionary(l => l.Id, l => (l.Name, l.ParentId)), cancellationToken);

        return new BookDto(
            book.Id,
            book.OwnerId,
            book.Title,
            book.Author,
            book.Isbn13,
            book.Isbn10,
            location is null ? null : new LocationDto(location.Id, location.OwnerId, location.Name, location.Description, location.Code, location.ParentId),
            BookDto.BuildLocationPath(book.LocationId, locationMap));
    }
}