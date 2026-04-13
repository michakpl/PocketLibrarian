using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Books.Commands.AddBook;

public sealed class AddBookHandler(IApplicationDbContext db)
    : ICommandHandler<AddBookCommand, BookDto>
{
    public async ValueTask<BookDto> Handle(AddBookCommand cmd, CancellationToken ct)
    {
        if (cmd.LocationId.HasValue)
        {
            var locationExists = await db.Locations
                .AnyAsync(l => l.Id == cmd.LocationId.Value && l.OwnerId == cmd.OwnerId, ct);

            if (!locationExists)
                throw new InvalidOperationException(
                    $"Location '{cmd.LocationId}' was not found or does not belong to the current user.");
        }

        var book = Book.Create(cmd.Title, cmd.Author, cmd.OwnerId, cmd.Isbn, cmd.LocationId);

        db.Books.Add(book);
        await db.SaveChangesAsync(ct);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn, book.LocationId);
    }
}

