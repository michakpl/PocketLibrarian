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

        var book = Book.Create(cmd.Title, cmd.Author, cmd.OwnerId, cmd.Isbn13, cmd.Isbn10, cmd.LocationId);

        db.Books.Add(book);
        await db.SaveChangesAsync(ct);

        var locationPath = await BuildLocationPathAsync(db, cmd.LocationId, cmd.OwnerId, ct);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn13, book.Isbn10,
            location != null
                ? new LocationDto(location.Id, location.OwnerId, location.Name, location.Description, location.Code,
                    location.ParentId)
                : null,
            locationPath);
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