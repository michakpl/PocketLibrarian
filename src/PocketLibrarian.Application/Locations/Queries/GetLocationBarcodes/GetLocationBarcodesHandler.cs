using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.Application.Locations.Queries.GetLocationBarcodes;

public sealed class GetLocationBarcodesHandler(IApplicationDbContext db)
    : IQueryHandler<GetLocationBarcodesQuery, IReadOnlyList<LocationBarcodeDto>>
{
    public async ValueTask<IReadOnlyList<LocationBarcodeDto>> Handle(
        GetLocationBarcodesQuery query,
        CancellationToken cancellationToken)
    {
        var ownerLocationsQuery = db.Locations.Where(l => l.OwnerId == query.OwnerId);
        
        var locationMap = (await ownerLocationsQuery
            .Select(l => new {l.Id, l.Name, l.ParentId})
            .ToListAsync(cancellationToken)).ToDictionary(l => l.Id, l => (l.Name, l.ParentId));

        var locationsQuery = ownerLocationsQuery;

        if (query.LocationIds is { Count: > 0 })
            locationsQuery = locationsQuery.Where(l => query.LocationIds.Contains(l.Id));

        var raw = await locationsQuery
            .Select(l => new { l.Id, l.Name, l.Code })
            .ToListAsync(cancellationToken);
        
        return raw
            .Select(l => new LocationBarcodeDto(
                l.Id,
                l.Name,
                l.Code,
                LocationDtoFactory.BuildLocationPath(l.Id, locationMap)))
            .ToList();
    }
}