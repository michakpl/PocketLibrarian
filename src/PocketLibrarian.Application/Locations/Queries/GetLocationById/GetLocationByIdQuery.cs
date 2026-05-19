using Mediator;

namespace PocketLibrarian.Application.Locations.Queries.GetLocationById;

public sealed record GetLocationByIdQuery(Guid Id, Guid OwnerId) : IQuery<LocationDto>;

