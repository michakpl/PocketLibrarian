using PocketLibrarian.Application.Books.Queries.GetBooks;

namespace PocketLibrarian.UnitTests.Books.Queries;

public sealed class GetBooksValidatorTests
{
    private readonly GetBooksValidator _validator = new();

    [Fact]
    public async Task Validate_DefaultQuery_IsValid()
    {
        var query = new GetBooksQuery(Guid.NewGuid());

        var result = await _validator.ValidateAsync(query);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(50)]
    [InlineData(100)]
    public async Task Validate_ValidPageAndPageSize_IsValid(int pageSize)
    {
        var query = new GetBooksQuery(Guid.NewGuid(), Page: 1, PageSize: pageSize);

        var result = await _validator.ValidateAsync(query);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public async Task Validate_PageLessThanOrEqualToZero_IsInvalid(int page)
    {
        var query = new GetBooksQuery(Guid.NewGuid(), Page: page);

        var result = await _validator.ValidateAsync(query);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetBooksQuery.Page));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-50)]
    public async Task Validate_PageSizeLessThanOrEqualToZero_IsInvalid(int pageSize)
    {
        var query = new GetBooksQuery(Guid.NewGuid(), PageSize: pageSize);

        var result = await _validator.ValidateAsync(query);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetBooksQuery.PageSize));
    }

    [Theory]
    [InlineData(101)]
    [InlineData(200)]
    [InlineData(1000)]
    public async Task Validate_PageSizeGreaterThan100_IsInvalid(int pageSize)
    {
        var query = new GetBooksQuery(Guid.NewGuid(), PageSize: pageSize);

        var result = await _validator.ValidateAsync(query);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetBooksQuery.PageSize));
    }

    [Fact]
    public async Task Validate_BothPageAndPageSizeInvalid_ReturnsBothErrors()
    {
        var query = new GetBooksQuery(Guid.NewGuid(), Page: 0, PageSize: 0);

        var result = await _validator.ValidateAsync(query);

        Assert.False(result.IsValid);
        Assert.Equal(2, result.Errors.Count);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetBooksQuery.Page));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetBooksQuery.PageSize));
    }
}

