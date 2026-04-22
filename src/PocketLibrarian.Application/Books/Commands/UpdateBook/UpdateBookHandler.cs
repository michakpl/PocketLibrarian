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
            .FirstOrDefaultAsync(b => b.Id == cmd.BookId && b.OwnerId == cmd.OwnerId, ct);

        if (book is null)
            throw new NotFoundException(nameof(Book), cmd.BookId);

        Location? location = null;
        if (cmd.LocationId.HasValue)
        {
            location = await db.Locations
                .FirstOrDefaultAsync(l => l.Id == cmd.LocationId.Value && l.OwnerId == cmd.OwnerId, ct);

            if (location is null)
                throw new NotFoundException(nameof(Location), cmd.LocationId.Value);
        }

        book.Update(cmd.Title, cmd.Author, cmd.Isbn13, cmd.Isbn10, cmd.LocationId);

        await db.SaveChangesAsync(ct);

        LocationDto? locationDto = location is not null
            ? new LocationDto(location.Id, location.OwnerId, location.Name,
                location.Description, location.Code, location.ParentId)
            : null;

        var locationPath = await BuildLocationPathAsync(db, book.LocationId, cmd.OwnerId, ct);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn13, book.Isbn10, locationDto, locationPath);
    }

    private static async ValueTask<IReadOnlyList<string>> BuildLocationPathAsync(
        IApplicationDbContext db, Guid? locationId, Guid ownerId, CancellationToken ct)
    {
        if (locationId is null) return [];

        var locationMap = await db.Locations
            .Where(l => l.OwnerId == ownerId)
            .Select(l => new { l.Id, l.Name, l.ParentId })
            .ToListAsync(ct)
            .ContinueWith(t => t.Result.ToDictionary(l => l.Id, l => (l.Name, l.ParentId)), ct);

        var path = new List<string>();
        var current = locationId;
        while (current.HasValue && locationMap.TryGetValue(current.Value, out var loc))
        {
            path.Add(loc.Name);
            current = loc.ParentId;
        }
        path.Reverse();
        return path;
    }
}