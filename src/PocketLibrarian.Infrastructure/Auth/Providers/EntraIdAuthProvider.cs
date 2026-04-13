using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using PocketLibrarian.Application.Abstractions;
using Microsoft.Identity.Web;

namespace PocketLibrarian.Infrastructure.Auth.Providers;

public sealed class EntraIdAuthProvider : IAuthProviderRegistration
{
    public string SchemaName => "EntraId";
    public string IssuerPrefix => "https://login.microsoftonline.com/";

    public void RegisterScheme(AuthenticationBuilder builder, IConfiguration configuration)
    {
        builder.AddMicrosoftIdentityWebApi(
            configuration.GetSection("Auth:Providers:EntraId"),
            jwtBearerScheme: SchemaName);
    }

    public IIdentityClaimsMapper CreateMapper() => new EntraIdClaimsMapper();
}

public sealed class EntraIdClaimsMapper : IIdentityClaimsMapper
{
    public bool CanHandle(ClaimsPrincipal principal) => principal.HasClaim(c =>
        c.Type is "tid" or "http://schemas.microsoft.com/identity/claims/tenantid");

    public UserIdentity Map(ClaimsPrincipal principal)
    {
        var oid = principal.FindFirstValue(ClaimConstants.ObjectId) ?? principal.FindFirstValue(ClaimConstants.Oid) ??
            throw new InvalidOperationException("Missing ObjectId claim.");
        
        return new UserIdentity
        {
            Provider = "EntraId",
            ProviderId = oid,
            DisplayName = principal.FindFirstValue(ClaimConstants.Name) ?? "Unknown",
            Email = principal.FindFirstValue(ClaimConstants.PreferredUserName) ?? string.Empty
        };
    }
}