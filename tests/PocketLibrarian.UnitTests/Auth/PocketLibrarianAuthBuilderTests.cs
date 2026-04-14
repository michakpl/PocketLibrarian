using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using PocketLibrarian.API.Extensions;
using PocketLibrarian.Application.Abstractions;

namespace PocketLibrarian.UnitTests.Auth;

public sealed class PocketLibrarianAuthBuilderTests
{
    private static PocketLibrarianAuthBuilder CreateBuilder() =>
        new();

    [Fact]
    public void Build_WithNoProviders_ThrowsInvalidOperationException()
    {
        var builder = CreateBuilder();

        Assert.Throws<InvalidOperationException>(() => builder.Build());
    }

    [Fact]
    public void AddProvider_Generic_AddsProviderToResult()
    {
        var builder = CreateBuilder();
        builder.AddProvider<FakeAuthProvider>();

        var providers = builder.Build();

        Assert.Single(providers);
        Assert.IsType<FakeAuthProvider>(providers.Single());
    }

    [Fact]
    public void AddProvider_Instance_AddsProviderToResult()
    {
        var builder = CreateBuilder();
        var provider = new FakeAuthProvider();
        builder.AddProvider(provider);

        var providers = builder.Build();

        Assert.Single(providers);
        Assert.Same(provider, providers.Single());
    }

    [Fact]
    public void Build_MultipleProviders_ReturnsAll()
    {
        var builder = CreateBuilder();
        builder.AddProvider(new FakeAuthProvider());
        builder.AddProvider(new FakeAuthProvider());

        var providers = builder.Build();

        Assert.Equal(2, providers.Count);
    }

    [Fact]
    public void AddProvider_ReturnsBuilderForChaining()
    {
        var builder = CreateBuilder();

        var result = builder.AddProvider<FakeAuthProvider>();

        Assert.Same(builder, result);
    }

    [Fact]
    public void AddProvider_Instance_ReturnsBuilderForChaining()
    {
        var builder = CreateBuilder();

        var result = builder.AddProvider(new FakeAuthProvider());

        Assert.Same(builder, result);
    }

    private sealed class FakeAuthProvider : IAuthProviderRegistration
    {
        public string SchemaName => "Fake";
        public string IssuerPrefix => "https://fake.example.com/";
        public void RegisterScheme(AuthenticationBuilder builder, IConfiguration configuration) { }
        public IIdentityClaimsMapper CreateMapper() => throw new NotSupportedException();
    }
}
