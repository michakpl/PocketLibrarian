using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
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
                throw new InvalidOperationException(
                    $"Parent location '{cmd.ParentId}' was not found or does not belong to the current user.");
        }

        var code = Guid.NewGuid().ToString("N").ToUpperInvariant();
        var location = Location.Create(cmd.Name, cmd.Description, code, cmd.OwnerId, cmd.ParentId);

        db.Locations.Add(location);
        await db.SaveChangesAsync(ct);

        return new LocationDto(location.Id, location.OwnerId!.Value, location.Name, location.Description, location.Code, location.ParentId);
    }
}


