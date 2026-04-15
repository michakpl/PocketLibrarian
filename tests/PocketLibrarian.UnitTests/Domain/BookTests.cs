using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.UnitTests.Domain;

public sealed class BookTests
{
    [Fact]
    public void Create_SetsAllPropertiesCorrectly()
    {
        var ownerId = Guid.NewGuid();
        var locationId = Guid.NewGuid();

        var book = Book.Create("The Great Gatsby", "F. Scott Fitzgerald", ownerId, "9780743273565", "1954839243", locationId);

        Assert.Equal("The Great Gatsby", book.Title);
        Assert.Equal("F. Scott Fitzgerald", book.Author);
        Assert.Equal(ownerId, book.OwnerId);
        Assert.Equal("9780743273565", book.Isbn13);
        Assert.Equal("1954839243", book.Isbn10);
        Assert.Equal(locationId, book.LocationId);
    }

    [Fact]
    public void Create_AssignsNonEmptyId()
    {
        var book = Book.Create("Title", "Author", Guid.NewGuid());

        Assert.NotEqual(Guid.Empty, book.Id);
    }

    [Fact]
    public void Create_EachCallProducesDistinctId()
    {
        var ownerId = Guid.NewGuid();

        var book1 = Book.Create("Title 1", "Author 1", ownerId);
        var book2 = Book.Create("Title 2", "Author 2", ownerId);

        Assert.NotEqual(book1.Id, book2.Id);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var book = Book.Create("Title", "Author", Guid.NewGuid());
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(book.CreatedAt, before, after);
        Assert.InRange(book.UpdatedAt, before, after);
    }

    [Fact]
    public void Create_WithNullIsbn_SetsIsbnToNull()
    {
        var book = Book.Create("Title", "Author", Guid.NewGuid(), isbn13: null, null);

        Assert.Null(book.Isbn13);
        Assert.Null(book.Isbn10);
    }

    [Fact]
    public void Create_WithNullLocationId_SetsLocationIdToNull()
    {
        var book = Book.Create("Title", "Author", Guid.NewGuid(), locationId: null);

        Assert.Null(book.LocationId);
    }

    [Theory]
    [InlineData(null, typeof(ArgumentNullException))]
    [InlineData("", typeof(ArgumentException))]
    public void Create_WithNullOrEmptyTitle_ThrowsArgumentException(string? title, Type expectedException)
    {
        Assert.Throws(expectedException, () => Book.Create(title!, "Author", Guid.NewGuid()));
    }

    [Theory]
    [InlineData(null, typeof(ArgumentNullException))]
    [InlineData("", typeof(ArgumentException))]
    public void Create_WithNullOrEmptyAuthor_ThrowsArgumentException(string? author, Type expectedException)
    {
        Assert.Throws(expectedException, () => Book.Create("Title", author!, Guid.NewGuid()));
    }
}

