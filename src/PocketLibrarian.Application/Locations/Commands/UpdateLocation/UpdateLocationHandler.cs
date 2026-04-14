using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Locations.Commands.UpdateLocation;

public sealed class UpdateLocationHandler(IApplicationDbContext db)
    : ICommandHandler<UpdateLocationCommand, LocationDto>
{
    public async ValueTask<LocationDto> Handle(UpdateLocationCommand cmd, CancellationToken ct)
    {
        var location = await db.Locations.FirstOrDefaultAsync(l => l.Id == cmd.Id && l.OwnerId == cmd.OwnerId, ct);

        if (location is null)
        {
            throw new NotFoundException(nameof(Location), cmd.Id);
        }

        if (cmd.ParentId.HasValue)
        {
            var parentExists =
                await db.Locations.AnyAsync(l => l.Id == cmd.ParentId.Value && l.OwnerId == cmd.OwnerId, ct);
            
            if (!parentExists)
            {
                throw new NotFoundException(nameof(Location), cmd.ParentId.Value);
            }
        }
        
        location.Update(cmd.Name, cmd.Description, cmd.ParentId);
        await db.SaveChangesAsync(ct);
        
        return new LocationDto(location.Id, location.OwnerId, location.Name, location.Description, location.Code, location.ParentId);
    }
}