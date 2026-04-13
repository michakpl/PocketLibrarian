using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.Infrastructure.Auth;

public sealed class CurrentUserService(CurrentUserContext context) : ICurrentUserService
{
    public Guid OwnerId => context.OwnerId;
    public UserIdentity Identity => context.Identity;
}