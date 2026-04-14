using Mediator;
using Microsoft.AspNetCore.Http.HttpResults;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Locations;
using PocketLibrarian.Application.Locations.Commands.AddLocation;
using PocketLibrarian.Application.Locations.Commands.UpdateLocation;
using PocketLibrarian.Application.Locations.Queries.GetLocations;

namespace PocketLibrarian.API.Endpoints.Locations;

public static class LocationsEndpoints
{
    public static RouteGroupBuilder MapLocations(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetLocations)
             .RequireAuthorization("location.read")
             .WithName("GetLocations")
             .WithSummary("Get all locations for the current user");

        group.MapPost("/", AddLocation)
             .RequireAuthorization("location.write")
             .WithName("AddLocation")
             .WithSummary("Add a new location for the current user");
        
        group.MapPut("/{id:guid}", UpdateLocation)
            .RequireAuthorization("location.write")
            .WithName("UpdateLocation")
            .WithSummary("Update an existing location by ID for the current user");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<LocationDto>>> GetLocations(
        IMediator mediator, CurrentUserContext currentUser, CancellationToken cancellationToken)
    {
        var locations = await mediator.Send(new GetLocationsQuery(currentUser.OwnerId), cancellationToken);
        return TypedResults.Ok(locations);
    }

    private static async Task<Created<LocationDto>> AddLocation(
        AddLocationRequest request,
        IMediator mediator,
        CurrentUserContext currentUser,
        CancellationToken cancellationToken)
    {
        var command = new AddLocationCommand(currentUser.OwnerId, request.Name, request.Description, request.ParentId);
        var location = await mediator.Send(command, cancellationToken);
        return TypedResults.Created($"/api/locations/{location.Id}", location);
    }

    private static async Task<Ok<LocationDto>> UpdateLocation(
        Guid id,
        UpdateLocationRequest request,
        IMediator mediator,
        CurrentUserContext currentUser,
        CancellationToken cancellationToken)
    {
        var command = new UpdateLocationCommand(id, currentUser.OwnerId, request.Name, request.Description, request.ParentId);
        var location = await mediator.Send(command, cancellationToken);
        return TypedResults.Ok(location);
    }
}

internal sealed record AddLocationRequest(string Name, string Description, Guid? ParentId);

internal sealed record UpdateLocationRequest(string Name, string Description, Guid? ParentId);



