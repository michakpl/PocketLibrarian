using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.Locations;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Books.Commands.AddBook;

public sealed class AddBookHandler(IApplicationDbContext db)
    : ICommandHandler<AddBookCommand, BookDto>
{
    public async ValueTask<BookDto> Handle(AddBookCommand cmd, CancellationToken ct)
    {
        Location? location = null;
        if (cmd.LocationId.HasValue)
        {
            location = await db.Locations
                .SingleOrDefaultAsync(l => l.Id == cmd.LocationId.Value && l.OwnerId == cmd.OwnerId, ct);

            if (location is null)
                throw new NotFoundException(nameof(Location), cmd.LocationId.Value);
        }

        var book = Book.Create(cmd.Title, cmd.Author, cmd.OwnerId, cmd.Isbn, cmd.LocationId);

        db.Books.Add(book);
        await db.SaveChangesAsync(ct);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn,
            location != null
                ? new LocationDto(location.Id, location.OwnerId, location.Name, location.Description, location.Code,
                    location.ParentId)
                : null);
    }
}