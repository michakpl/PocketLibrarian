using PocketLibrarian.Application.Books.Commands.UpdateBook;

namespace PocketLibrarian.UnitTests.Books.Commands;

public sealed class UpdateBookValidatorTests
{
    private readonly UpdateBookValidator _validator = new();

    [Fact]
    public void ValidCommand_WithAllFields_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Dune", "Frank Herbert",
            "9780441013593", "1954839243", Guid.NewGuid());

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidCommand_WithNullIsbnAndNullLocation_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void EmptyBookId_FailsValidation()
    {
        var command = new UpdateBookCommand(Guid.Empty, Guid.NewGuid(), "Title", "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.BookId));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyOrWhitespaceTitle_FailsValidation(string title)
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), title, "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Title));
    }

    [Fact]
    public void TitleExceeding256Characters_FailsValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), new string('A', 257), "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Title));
    }

    [Fact]
    public void TitleAtMaxLength_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), new string('A', 256), "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyOrWhitespaceAuthor_FailsValidation(string author)
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", author, null, null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Author));
    }

    [Fact]
    public void AuthorExceeding256Characters_FailsValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", new string('B', 257), null, null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Author));
    }

    [Fact]
    public void AuthorAtMaxLength_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", new string('B', 256), null, null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Isbn13Exceeding50Characters_FailsValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", new string('9', 51), null, null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Isbn13));
    }

    [Fact]
    public void Isbn13AtMaxLength_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", new string('9', 50), null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void NullIsbn13_SkipsLengthValidation_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Isbn13));
    }

    [Fact]
    public void Isbn10Exceeding50Characters_FailsValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", null, new string('9', 51), null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Isbn10));
    }

    [Fact]
    public void Isbn10AtMaxLength_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", null, new string('9', 50), null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void NullIsbn10_SkipsLengthValidation_PassesValidation()
    {
        var command = new UpdateBookCommand(Guid.NewGuid(), Guid.NewGuid(), "Title", "Author", null, null, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == nameof(UpdateBookCommand.Isbn10));
    }
}
