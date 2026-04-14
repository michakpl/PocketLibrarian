using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.Application.Locations.Queries.GetLocations;

public sealed class GetLocationsHandler(IApplicationDbContext db)
    : IQueryHandler<GetLocationsQuery, IReadOnlyList<LocationDto>>
{
    public async ValueTask<IReadOnlyList<LocationDto>> Handle(GetLocationsQuery query, CancellationToken ct)
    {
        var locations = await db.Locations
            .Where(l => l.OwnerId == query.OwnerId)
            .Select(l => new LocationDto(l.Id, l.OwnerId, l.Name, l.Description, l.Code, l.ParentId))
            .ToListAsync(ct);

        return locations;
    }
}

