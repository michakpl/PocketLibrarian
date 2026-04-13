using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;

namespace PocketLibrarian.Application.Abstractions;

public interface IAuthProviderRegistration
{
    string SchemaName { get; }
    
    string IssuerPrefix { get; }
    
    void RegisterScheme(AuthenticationBuilder builder, IConfiguration configuration);
    
    IIdentityClaimsMapper CreateMapper();
}