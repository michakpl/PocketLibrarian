using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Books;

public static class BookDtoFactory
{
    public static LocationDto? ToLocationDto(Location? location) =>
        location is null
            ? null
            : new LocationDto(location.Id, location.OwnerId, location.Name,
                location.Description, location.Code, location.ParentId);

    public static IReadOnlyList<string> BuildLocationPath(
        Guid? locationId,
        Dictionary<Guid, (string Name, Guid? ParentId)> locationMap)
    {
        if (locationId is null) return [];

        var path = new List<string>();
        var current = locationId;
        var visited = new HashSet<Guid>();
        while (current.HasValue && visited.Add(current.Value) && locationMap.TryGetValue(current.Value, out var loc))
        {
            path.Add(loc.Name);
            current = loc.ParentId;
        }
        path.Reverse();
        return path;
    }

    public static async ValueTask<IReadOnlyList<string>> BuildLocationPathAsync(
        IApplicationDbContext db, Guid? locationId, Guid ownerId, CancellationToken ct)
    {
        if (locationId is null) return [];

        var locationMap = (await db.Locations
                .Where(l => l.OwnerId == ownerId)
                .Select(l => new { l.Id, l.Name, l.ParentId })
                .ToListAsync(ct))
            .ToDictionary(l => l.Id, l => (l.Name, l.ParentId));

        return BuildLocationPath(locationId, locationMap);
    }
}

