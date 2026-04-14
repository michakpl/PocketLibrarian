using System.Security.Claims;
using PocketLibrarian.Infrastructure.Auth.Providers;

namespace PocketLibrarian.UnitTests.Auth;

public sealed class EntraIdClaimsMapperTests
{
    private readonly EntraIdClaimsMapper _mapper = new();

    // Claim type constants mirroring Microsoft.Identity.Web.ClaimConstants
    private const string OidClaimType = "oid";
    private const string ObjectIdClaimType = "http://schemas.microsoft.com/identity/claims/objectidentifier";
    private const string NameClaimType = "name";
    private const string PreferredUserNameClaimType = "preferred_username";
    private const string TidClaimType = "tid";
    private const string TenantIdClaimType = "http://schemas.microsoft.com/identity/claims/tenantid";

    [Fact]
    public void CanHandle_WithTidClaim_ReturnsTrue()
    {
        var principal = BuildPrincipal(new Claim(TidClaimType, "tenant-id"));

        Assert.True(_mapper.CanHandle(principal));
    }

    [Fact]
    public void CanHandle_WithLongFormTenantIdClaim_ReturnsTrue()
    {
        var principal = BuildPrincipal(new Claim(TenantIdClaimType, "tenant-id"));

        Assert.True(_mapper.CanHandle(principal));
    }

    [Fact]
    public void CanHandle_WithoutTenantClaims_ReturnsFalse()
    {
        var principal = BuildPrincipal(new Claim(OidClaimType, "oid-value"));

        Assert.False(_mapper.CanHandle(principal));
    }

    [Fact]
    public void Map_WithShortOidClaim_ReturnsMappedIdentity()
    {
        var oid = Guid.NewGuid().ToString();
        var principal = BuildPrincipal(
            new Claim(OidClaimType, oid),
            new Claim(NameClaimType, "Jane Doe"),
            new Claim(PreferredUserNameClaimType, "jane@example.com"));

        var identity = _mapper.Map(principal);

        Assert.Equal("EntraId", identity.Provider);
        Assert.Equal(oid, identity.ProviderId);
        Assert.Equal("Jane Doe", identity.DisplayName);
        Assert.Equal("jane@example.com", identity.Email);
    }

    [Fact]
    public void Map_WithObjectIdClaimType_ReturnsCorrectProviderId()
    {
        var oid = Guid.NewGuid().ToString();
        var principal = BuildPrincipal(new Claim(ObjectIdClaimType, oid));

        var identity = _mapper.Map(principal);

        Assert.Equal(oid, identity.ProviderId);
    }

    [Fact]
    public void Map_PrefersObjectIdOverOid_WhenBothPresent()
    {
        var objectId = Guid.NewGuid().ToString();
        var principal = BuildPrincipal(
            new Claim(ObjectIdClaimType, objectId),
            new Claim(OidClaimType, "other-oid"));

        var identity = _mapper.Map(principal);

        Assert.Equal(objectId, identity.ProviderId);
    }

    [Fact]
    public void Map_WithMissingObjectIdClaims_ThrowsInvalidOperationException()
    {
        var principal = BuildPrincipal(new Claim(NameClaimType, "Jane Doe"));

        Assert.Throws<InvalidOperationException>(() => _mapper.Map(principal));
    }

    [Fact]
    public void Map_WithMissingDisplayName_UsesUnknown()
    {
        var principal = BuildPrincipal(new Claim(OidClaimType, "oid-value"));

        var identity = _mapper.Map(principal);

        Assert.Equal("Unknown", identity.DisplayName);
    }

    [Fact]
    public void Map_WithMissingEmail_UsesEmptyString()
    {
        var principal = BuildPrincipal(new Claim(OidClaimType, "oid-value"));

        var identity = _mapper.Map(principal);

        Assert.Equal(string.Empty, identity.Email);
    }

    private static ClaimsPrincipal BuildPrincipal(params Claim[] claims) =>
        new(new ClaimsIdentity(claims, "Bearer"));
}
