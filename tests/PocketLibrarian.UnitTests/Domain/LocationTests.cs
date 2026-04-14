using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.UnitTests.Domain;

public sealed class LocationTests
{
    [Fact]
    public void Create_SetsAllPropertiesCorrectly()
    {
        var ownerId = Guid.NewGuid();
        var parentId = Guid.NewGuid();

        var location = Location.Create("Shelf A", "Top shelf", "SHELF-A", ownerId, parentId);

        Assert.Equal("Shelf A", location.Name);
        Assert.Equal("Top shelf", location.Description);
        Assert.Equal("SHELF-A", location.Code);
        Assert.Equal(ownerId, location.OwnerId);
        Assert.Equal(parentId, location.ParentId);
    }

    [Fact]
    public void Create_AssignsNonEmptyId()
    {
        var location = Location.Create("Shelf", "A shelf", "SHELF", Guid.NewGuid());

        Assert.NotEqual(Guid.Empty, location.Id);
    }

    [Fact]
    public void Create_EachCallProducesDistinctId()
    {
        var ownerId = Guid.NewGuid();

        var location1 = Location.Create("Shelf A", "Shelf 1", "SHELF-A", ownerId);
        var location2 = Location.Create("Shelf B", "Shelf 2", "SHELF-B", ownerId);

        Assert.NotEqual(location1.Id, location2.Id);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var location = Location.Create("Shelf", "A shelf", "SHELF", Guid.NewGuid());
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(location.CreatedAt, before, after);
        Assert.InRange(location.UpdatedAt, before, after);
    }

    [Fact]
    public void Create_WithNullParentId_SetsParentIdToNull()
    {
        var location = Location.Create("Shelf", "A shelf", "SHELF", Guid.NewGuid(), parentId: null);

        Assert.Null(location.ParentId);
    }

    [Fact]
    public void Create_WithParentId_SetsParentIdCorrectly()
    {
        var parentId = Guid.NewGuid();

        var location = Location.Create("Child Shelf", "A child shelf", "CHILD", Guid.NewGuid(), parentId);

        Assert.Equal(parentId, location.ParentId);
    }

    [Fact]
    public void Create_WithEmptyDescription_SetsDescriptionToEmpty()
    {
        var location = Location.Create("Shelf", string.Empty, "SHELF", Guid.NewGuid());

        Assert.Equal(string.Empty, location.Description);
    }

    [Theory]
    [InlineData(null, typeof(ArgumentNullException))]
    [InlineData("", typeof(ArgumentException))]
    public void Create_WithNullOrEmptyName_ThrowsArgumentException(string? name, Type expectedException)
    {
        Assert.Throws(expectedException, () =>
            Location.Create(name!, "Description", "CODE", Guid.NewGuid()));
    }

    [Theory]
    [InlineData(null, typeof(ArgumentNullException))]
    [InlineData("", typeof(ArgumentException))]
    public void Create_WithNullOrEmptyCode_ThrowsArgumentException(string? code, Type expectedException)
    {
        Assert.Throws(expectedException, () =>
            Location.Create("Name", "Description", code!, Guid.NewGuid()));
    }
}

