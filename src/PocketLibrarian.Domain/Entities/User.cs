namespace PocketLibrarian.Domain.Entities;

public sealed class User
{
    public Guid Id { get; private init; }

    public string DisplayName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset LastSeenAt { get; private set; }

    private readonly List<ExternalIdentity> _identities = [];

    public IReadOnlyCollection<ExternalIdentity> Identities => _identities.AsReadOnly();

    private User()
    {
    }

    public static (User, ExternalIdentity) CreateForProvider(
        string provider, string providerId, string displayName, string email
    )
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            DisplayName = displayName,
            Email = email,
            CreatedAt = DateTimeOffset.UtcNow,
            LastSeenAt = DateTimeOffset.UtcNow
        };
        
        var externalIdentity = ExternalIdentity.Create(user.Id, provider, providerId);
        user._identities.Add(externalIdentity);
        
        return (user, externalIdentity);
    }
    
    public void RecordLogin(string displayName, string email)
    {
        DisplayName = displayName;
        Email = email;
        LastSeenAt = DateTimeOffset.UtcNow;
    }
}