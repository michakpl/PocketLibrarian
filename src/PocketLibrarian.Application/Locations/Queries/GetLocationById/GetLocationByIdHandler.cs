using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Locations.Queries.GetLocationById;

public sealed class GetLocationByIdHandler(IApplicationDbContext db)
    : IQueryHandler<GetLocationByIdQuery, LocationDto>
{
    public async ValueTask<LocationDto> Handle(GetLocationByIdQuery query, CancellationToken cancellationToken)
    {
        var location = await db.Locations
            .SingleOrDefaultAsync(l => l.Id == query.Id && l.OwnerId == query.OwnerId, cancellationToken);

        if (location is null)
        {
            throw new NotFoundException(nameof(Location), query.Id);
        }

        var locationPath = await LocationDtoFactory.BuildLocationPathAsync(db, location.Id, location.OwnerId, cancellationToken);

        return new LocationDto(
            location.Id,
            location.OwnerId,
            location.Name,
            location.Description,
            location.Code,
            location.ParentId,
            locationPath);
    }
}

