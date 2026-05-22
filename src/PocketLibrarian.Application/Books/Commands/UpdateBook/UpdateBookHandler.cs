using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.Locations;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Books.Commands.UpdateBook;

public sealed class UpdateBookHandler(IApplicationDbContext db)
    : ICommandHandler<UpdateBookCommand, BookDto>
{
    public async ValueTask<BookDto> Handle(UpdateBookCommand cmd, CancellationToken cancellationToken)
    {
        var book = await db.Books
            .FirstOrDefaultAsync(b => b.Id == cmd.BookId && b.OwnerId == cmd.OwnerId, cancellationToken);

        if (book is null)
            throw new NotFoundException(nameof(Book), cmd.BookId);

        Location? location = null;
        if (cmd.LocationId.HasValue)
        {
            location = await db.Locations
                .FirstOrDefaultAsync(l => l.Id == cmd.LocationId.Value && l.OwnerId == cmd.OwnerId, cancellationToken);

            if (location is null)
                throw new NotFoundException(nameof(Location), cmd.LocationId.Value);
        }

        book.Update(cmd.Title, cmd.Author, cmd.Isbn13, cmd.Isbn10, cmd.LocationId);

        await db.SaveChangesAsync(cancellationToken);

        LocationDto? locationDto = LocationDtoFactory.ToLocationDto(location);

        var locationPath = await LocationDtoFactory.BuildLocationPathAsync(db, book.LocationId, cmd.OwnerId, cancellationToken);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn13, book.Isbn10, locationDto,
            locationPath);
    }
}