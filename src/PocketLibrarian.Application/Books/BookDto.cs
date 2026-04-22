using PocketLibrarian.Application.Locations;

namespace PocketLibrarian.Application.Books;

public sealed record BookDto(Guid Id, Guid OwnerId, string Title, string Author, string? Isbn13, string? Isbn10, LocationDto? Location, IReadOnlyList<string> LocationPath)
{
    public static IReadOnlyList<string> BuildLocationPath(
        Guid? locationId,
        Dictionary<Guid, (string Name, Guid? ParentId)> locationMap)
    {
        if (locationId is null) return [];

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
