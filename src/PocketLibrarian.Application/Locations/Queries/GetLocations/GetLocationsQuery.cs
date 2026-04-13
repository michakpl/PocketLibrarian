using Mediator;

namespace PocketLibrarian.Application.Locations.Queries.GetLocations;

public sealed record GetLocationsQuery(Guid OwnerId) : IQuery<IReadOnlyList<LocationDto>>;

