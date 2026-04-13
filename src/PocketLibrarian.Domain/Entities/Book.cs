namespace PocketLibrarian.Domain.Entities;

public sealed class Book
{
    public Guid Id { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string Author { get; private set; } = string.Empty;

    public string? Isbn { get; private set; }

    public Guid OwnerId { get; private set; }

    public User Owner { get; private set; } = null!;

    public Guid? LocationId { get; private set; }

    public Location? Location { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    private Book()
    {
    }

    public static Book Create(string title, string author, Guid ownerId, string? isbn = null, Guid? locationId = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(title);
        ArgumentException.ThrowIfNullOrEmpty(author);

        return new Book
        {
            Id = Guid.NewGuid(),
            Title = title,
            Author = author,
            Isbn = isbn,
            OwnerId = ownerId,
            LocationId = locationId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}