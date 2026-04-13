using Mediator;

namespace PocketLibrarian.Application.Locations.Commands.AddLocation;

public sealed record AddLocationCommand(
    Guid OwnerId,
    string Name,
    string Description,
    Guid? ParentId) : ICommand<LocationDto>;


