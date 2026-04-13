namespace PocketLibrarian.Application.Abstractions;

using System.Security.Claims;

public interface IIdentityClaimsMapper
{
    bool CanHandle(ClaimsPrincipal principal);
    
    UserIdentity Map(ClaimsPrincipal principal);
}