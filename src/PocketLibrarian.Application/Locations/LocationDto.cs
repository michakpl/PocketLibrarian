namespace PocketLibrarian.Application.Locations;

public sealed record LocationDto(Guid Id, Guid OwnerId, string Name, string Description, string Code, Guid? ParentId, IReadOnlyList<string>? LocationPath = null);

