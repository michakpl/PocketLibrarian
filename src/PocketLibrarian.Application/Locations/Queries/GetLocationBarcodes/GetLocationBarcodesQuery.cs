using Mediator;

namespace PocketLibrarian.Application.Locations.Queries.GetLocationBarcodes;

public sealed record GetLocationBarcodesQuery(
    Guid OwnerId,
    IReadOnlyList<Guid>? LocationIds) : IQuery<IReadOnlyList<LocationBarcodeDto>>;

