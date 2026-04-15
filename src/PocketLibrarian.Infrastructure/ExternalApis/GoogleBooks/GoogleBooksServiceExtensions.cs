using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;
using Polly;
using PocketLibrarian.Application.IsbnLookup;

namespace PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks;

public static class GoogleBooksServiceExtensions
{
    public static IServiceCollection AddGoogleBooksClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<GoogleBooksOptions>(configuration.GetSection("GoogleBooks"));

        services
            .AddHttpClient<IBookMetadataProvider, GoogleBooksClient>((sp, client) =>
            {
                var opts = sp.GetRequiredService<IOptions<GoogleBooksOptions>>().Value;
                client.BaseAddress = new Uri(opts.BaseUrl);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            })
            .AddResilienceHandler("google-books", pipeline =>
            {
                // Outermost: retry with exponential back-off + jitter
                pipeline.AddRetry(new HttpRetryStrategyOptions
                {
                    MaxRetryAttempts = 3,
                    Delay = TimeSpan.FromMilliseconds(500),
                    BackoffType = DelayBackoffType.Exponential,
                    UseJitter = true
                });

                // Middle: circuit breaker scoped per authority
                pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
                {
                    FailureRatio = 0.5,
                    SamplingDuration = TimeSpan.FromSeconds(30),
                    BreakDuration = TimeSpan.FromSeconds(60)
                });

                // Innermost: per-attempt timeout
                pipeline.AddTimeout(TimeSpan.FromSeconds(10));
            });

        return services;
    }
}


