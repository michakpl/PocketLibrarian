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
    public async ValueTask<BookDto> Handle(UpdateBookCommand cmd, CancellationToken ct)
    {
        var book = await db.Books
            .Include(b => b.Location)
            .FirstOrDefaultAsync(b => b.Id == cmd.BookId && b.OwnerId == cmd.OwnerId, ct);

        if (book is null)
            throw new NotFoundException(nameof(Book), cmd.BookId);

        if (cmd.LocationId.HasValue)
        {
            var locationExists = await db.Locations
                .AnyAsync(l => l.Id == cmd.LocationId.Value && l.OwnerId == cmd.OwnerId, ct);

            if (!locationExists)
                throw new NotFoundException(nameof(Location), cmd.LocationId.Value);
        }

        book.Update(cmd.Title, cmd.Author, cmd.Isbn13, cmd.Isbn10, cmd.LocationId);

        await db.SaveChangesAsync(ct);

        LocationDto? locationDto = book.Location is not null
            ? new LocationDto(book.Location.Id, book.Location.OwnerId, book.Location.Name,
                book.Location.Description, book.Location.Code, book.Location.ParentId)
            : null;

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn13, book.Isbn10, locationDto);
    }
}


