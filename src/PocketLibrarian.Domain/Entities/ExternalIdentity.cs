namespace PocketLibrarian.Domain.Entities;

public sealed class ExternalIdentity
{
    public Guid Id { get; private set; }
    
    public string Provider { get; private set; } = string.Empty;
    
    public string ProviderId { get; private set; } = string.Empty;
    
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    
    public DateTime LinkedAt { get; private set; }
    
    private ExternalIdentity()
    {
    }

    public static ExternalIdentity Create(Guid userId, string provider, string providerId)
    {
        ArgumentException.ThrowIfNullOrEmpty(provider);
        ArgumentException.ThrowIfNullOrEmpty(providerId);

        return new ExternalIdentity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = provider,
            ProviderId = providerId,
            LinkedAt = DateTime.UtcNow
        };
    }
}