using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Locations.Commands.AddLocation;

public sealed class AddLocationHandler(IApplicationDbContext db)
    : ICommandHandler<AddLocationCommand, LocationDto>
{
    public async ValueTask<LocationDto> Handle(AddLocationCommand cmd, CancellationToken ct)
    {
        if (cmd.ParentId.HasValue)
        {
            var parentExists = await db.Locations
                .AnyAsync(l => l.Id == cmd.ParentId.Value && l.OwnerId == cmd.OwnerId, ct);

            if (!parentExists)
                throw new NotFoundException(nameof(Location), cmd.ParentId.Value);
        }

        var code = Guid.NewGuid().ToString("N").ToUpperInvariant();
        var location = Location.Create(cmd.Name, cmd.Description, code, cmd.OwnerId, cmd.ParentId);

        db.Locations.Add(location);
        await db.SaveChangesAsync(ct);

        return new LocationDto(location.Id, location.OwnerId, location.Name, location.Description, location.Code, location.ParentId);
    }
}


