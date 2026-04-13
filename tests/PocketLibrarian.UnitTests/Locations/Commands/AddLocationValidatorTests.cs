using PocketLibrarian.Application.Locations.Commands.AddLocation;

namespace PocketLibrarian.UnitTests.Locations.Commands;

public sealed class AddLocationValidatorTests
{
    private readonly AddLocationValidator _validator = new();

    [Fact]
    public void ValidCommand_WithoutParentId_PassesValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), "Living Room", "Main area", null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidCommand_WithParentId_PassesValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), "Shelf A", "Top shelf", Guid.NewGuid());

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidCommand_WithEmptyDescription_PassesValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), "Garage", string.Empty, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyOrWhitespaceName_FailsValidation(string name)
    {
        var command = new AddLocationCommand(Guid.NewGuid(), name, "Description", null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddLocationCommand.Name));
    }

    [Fact]
    public void NameAtMaxLength256_PassesValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), new string('A', 256), "Description", null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void NameExceeding256Characters_FailsValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), new string('A', 257), "Description", null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddLocationCommand.Name));
    }

    [Fact]
    public void DescriptionAtMaxLength1024_PassesValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), "Shelf", new string('D', 1024), null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void DescriptionExceeding1024Characters_FailsValidation()
    {
        var command = new AddLocationCommand(Guid.NewGuid(), "Shelf", new string('D', 1025), null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddLocationCommand.Description));
    }
}

