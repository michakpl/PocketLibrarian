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
        var book = await db.Books.SingleOrDefaultAsync(b => b.Id == query.Id && b.OwnerId == query.OwnerId, cancellationToken);
        if (book is null)
        {
            throw new NotFoundException(nameof(Book), query.Id);
        }

        var location = await db.Locations.FindAsync([book.LocationId], cancellationToken);
        
        LocationDto? locationDto = BookDtoFactory.ToLocationDto(location);

        var locationPath = await BookDtoFactory.BuildLocationPathAsync(db, book.LocationId, book.OwnerId, cancellationToken);

        return new BookDto(
            book.Id,
            book.OwnerId,
            book.Title,
            book.Author,
            book.Isbn13,
            book.Isbn10,
            locationDto,
            locationPath);
    }
}