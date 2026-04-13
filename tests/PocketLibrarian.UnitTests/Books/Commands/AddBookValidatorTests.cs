using PocketLibrarian.Application.Books.Commands.AddBook;

namespace PocketLibrarian.UnitTests.Books.Commands;

public sealed class AddBookValidatorTests
{
    private readonly AddBookValidator _validator = new();

    [Fact]
    public void ValidCommand_WithIsbnAndLocation_PassesValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "The Great Gatsby", "F. Scott Fitzgerald",
            "978-0-7432-7356-5", Guid.NewGuid());

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidCommand_WithNullIsbnAndNullLocation_PassesValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", "Author", null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyOrWhitespaceTitle_FailsValidation(string title)
    {
        var command = new AddBookCommand(Guid.NewGuid(), title, "Author", null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddBookCommand.Title));
    }

    [Fact]
    public void TitleExceeding256Characters_FailsValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), new string('A', 257), "Author", null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddBookCommand.Title));
    }

    [Fact]
    public void TitleAtMaxLength_PassesValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), new string('A', 256), "Author", null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyOrWhitespaceAuthor_FailsValidation(string author)
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", author, null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddBookCommand.Author));
    }

    [Fact]
    public void AuthorExceeding256Characters_FailsValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", new string('B', 257), null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddBookCommand.Author));
    }

    [Fact]
    public void AuthorAtMaxLength_PassesValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", new string('B', 256), null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void IsbnExceeding50Characters_FailsValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", "Author", new string('9', 51), null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddBookCommand.Isbn));
    }

    [Fact]
    public void IsbnAtMaxLength_PassesValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", "Author", new string('9', 50), null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void NullIsbn_SkipsLengthValidation_PassesValidation()
    {
        var command = new AddBookCommand(Guid.NewGuid(), "Title", "Author", null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == nameof(AddBookCommand.Isbn));
    }
}

