using Microsoft.IdentityModel.JsonWebTokens;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.API.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddPocketLibrarianAuth(this IServiceCollection services, IConfiguration config, Action<PocketLibrarianAuthBuilder> configure)
    {
        const string policyScheme = "PocketLibrarian";

        var builder = new PocketLibrarianAuthBuilder(services, config);
        configure(builder);

        var providers = builder.Build();

        foreach (var provider in providers)
        {
            services.AddSingleton(provider.CreateMapper());
        }

        var authBuilder = services.AddAuthentication(options =>
        {
            options.DefaultScheme = policyScheme;
            options.DefaultChallengeScheme = policyScheme;
        })
        .AddPolicyScheme(policyScheme, displayName: null, options =>
        {
            options.ForwardDefaultSelector = context =>
            {
                var authorization = context.Request.Headers.Authorization.ToString();

                if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var token = authorization["Bearer ".Length..].Trim();
                    var handler = new JsonWebTokenHandler();

                    if (handler.CanReadToken(token))
                    {
                        var issuer = handler.ReadJsonWebToken(token).Issuer;
                        var matchingProvider = providers.FirstOrDefault(p => issuer.StartsWith(p.IssuerPrefix, StringComparison.OrdinalIgnoreCase));
                        
                        if (matchingProvider is not null)
                        {
                            return matchingProvider.SchemaName;
                        }
                    }
                }

                return providers.First().SchemaName;
            };
        });

        foreach (var provider in providers)
        {
            provider.RegisterScheme(authBuilder, config);
        }
        
        return services;
    }
}

public sealed class PocketLibrarianAuthBuilder(IServiceCollection services, IConfiguration configuration)
{
    private readonly List<IAuthProviderRegistration> _providers = [];

    public PocketLibrarianAuthBuilder AddProvider<TProvider>() where TProvider : IAuthProviderRegistration, new()
    {
        _providers.Add(new TProvider());
        return this;
    }
    
    public PocketLibrarianAuthBuilder AddProvider(IAuthProviderRegistration provider)
    {
        _providers.Add(provider);
        return this;
    }

    public IReadOnlyCollection<IAuthProviderRegistration> Build()
    {
        if (_providers.Count == 0)
        {
            throw new InvalidOperationException("At least one authentication provider must be registered.");
        }
        
        return _providers.AsReadOnly();
    }
}