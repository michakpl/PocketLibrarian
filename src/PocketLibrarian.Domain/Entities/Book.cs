namespace PocketLibrarian.Domain.Entities;

public sealed class Book
{
    public Guid Id { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string Author { get; private set; } = string.Empty;

    public string? Isbn13 { get; private set; }
    
    public string? Isbn10 { get; private set; }

    public Guid OwnerId { get; private set; }

    public User Owner { get; private set; } = null!;

    public Guid? LocationId { get; private set; }

    public Location? Location { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    private Book()
    {
    }

    public static Book Create(string title, string author, Guid ownerId, string? isbn13 = null, string? isbn10 = null, Guid? locationId = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(title);
        ArgumentException.ThrowIfNullOrEmpty(author);

        return new Book
        {
            Id = Guid.NewGuid(),
            Title = title,
            Author = author,
            Isbn13 = isbn13,
            Isbn10 = isbn10,
            OwnerId = ownerId,
            LocationId = locationId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(string title, string author, string? isbn13, string? isbn10, Guid? locationId  = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(title);
        ArgumentException.ThrowIfNullOrEmpty(author);

        Title = title;
        Author = author;
        Isbn13 = isbn13;
        Isbn10 = isbn10;
        LocationId = locationId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}