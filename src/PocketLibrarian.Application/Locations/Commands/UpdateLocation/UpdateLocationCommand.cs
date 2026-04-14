using Mediator;

namespace PocketLibrarian.Application.Locations.Commands.UpdateLocation;

public record UpdateLocationCommand(Guid Id, Guid OwnerId, string Name, string Description, Guid? ParentId)
    : ICommand<LocationDto>;