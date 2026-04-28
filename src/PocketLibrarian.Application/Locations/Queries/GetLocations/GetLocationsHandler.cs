using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.Application.Locations.Queries.GetLocations;

public sealed class GetLocationsHandler(IApplicationDbContext db)
    : IQueryHandler<GetLocationsQuery, IReadOnlyList<LocationDto>>
{
    public async ValueTask<IReadOnlyList<LocationDto>> Handle(GetLocationsQuery query, CancellationToken ct)
    {
        var raw = await db.Locations
            .Where(l => l.OwnerId == query.OwnerId)
            .Select(l => new { l.Id, l.OwnerId, l.Name, l.Description, l.Code, l.ParentId })
            .ToListAsync(ct);

        var locationMap = raw.ToDictionary(
            l => l.Id,
            l => (l.Name, l.ParentId));

        var rawById = raw.ToDictionary(l => l.Id);
        var sorted = SortHierarchically(raw.Select(l => (l.Id, l.ParentId)).ToList());

        return sorted
            .Select(id =>
            {
                var l = rawById[id];
                return new LocationDto(l.Id, l.OwnerId, l.Name, l.Description, l.Code, l.ParentId,
                    BuildLocationPath(l.Id, locationMap));
            })
            .ToList();
    }

    private static IReadOnlyList<Guid> SortHierarchically(List<(Guid Id, Guid? ParentId)> items)
    {
        var childrenOf = new Dictionary<Guid, List<Guid>>();
        var roots = new List<Guid>();

        foreach (var (id, parentId) in items)
        {
            if (parentId is null)
            {
                roots.Add(id);
            }
            else
            {
                if (!childrenOf.TryGetValue(parentId.Value, out var list))
                    childrenOf[parentId.Value] = list = [];
                list.Add(id);
            }
        }

        var result = new List<Guid>();

        foreach (var root in roots)
            Visit(root);

        foreach (var item in items.Where(x => !result.Contains(x.Id)))
            result.Add(item.Id);

        return result;

        void Visit(Guid id)
        {
            result.Add(id);
            if (!childrenOf.TryGetValue(id, out var children)) return;
            foreach (var child in children)
                Visit(child);
        }
    }

    private static IReadOnlyList<string> BuildLocationPath(
        Guid locationId,
        Dictionary<Guid, (string Name, Guid? ParentId)> locationMap)
    {
        var path = new List<string>();
        Guid? current = locationId;
        var visited = new HashSet<Guid>();
        while (current.HasValue && visited.Add(current.Value) && locationMap.TryGetValue(current.Value, out var loc))
        {
            path.Add(loc.Name);
            current = loc.ParentId;
        }
        path.Reverse();
        return path;
    }
}

