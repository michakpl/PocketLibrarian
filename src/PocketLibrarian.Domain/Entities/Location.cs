namespace PocketLibrarian.Domain.Entities;

public sealed class Location
{
    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;
    
    public string Code { get; private set; } = string.Empty;
    
    public Guid? ParentId { get; private set; }
    
    public Location? Parent { get; private set; }
    
    public Guid OwnerId { get; private set; }

    public User Owner { get; private set; } = null!;
    
    public DateTimeOffset CreatedAt { get; private set; }
    
    public DateTimeOffset UpdatedAt { get; private set; }
    
    private Location()
    {
    }
    
    public static Location Create(string name, string description, string code, Guid ownerId, Guid? parentId = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(name);
        ArgumentException.ThrowIfNullOrEmpty(code);

        return new Location
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Code = code,
            OwnerId = ownerId,
            ParentId = parentId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, string description, Guid? parentId)
    {
        ArgumentException.ThrowIfNullOrEmpty(name);

        Name = name;
        Description = description;
        ParentId = parentId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}