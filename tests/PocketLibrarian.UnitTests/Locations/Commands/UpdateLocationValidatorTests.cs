using PocketLibrarian.Application.Locations.Commands.UpdateLocation;

namespace PocketLibrarian.UnitTests.Locations.Commands;

public sealed class UpdateLocationValidatorTests
{
    private readonly UpdateLocationValidator _validator = new();

    [Fact]
    public void ValidCommand_WithAllFields_PassesValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), "Living Room", "Main area", Guid.NewGuid());

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidCommand_WithNullParentId_PassesValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), "Bookshelf", "Wooden bookshelf", null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidCommand_WithEmptyDescription_PassesValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), "Garage", string.Empty, null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyOrWhitespaceName_FailsValidation(string name)
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), name, "Description", null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateLocationCommand.Name));
    }

    [Fact]
    public void NameAtMaxLength256_PassesValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), new string('A', 256), "Description", null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void NameExceeding256Characters_FailsValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), new string('A', 257), "Description", null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateLocationCommand.Name));
    }

    [Fact]
    public void DescriptionAtMaxLength1024_PassesValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), "Shelf", new string('D', 1024), null);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void DescriptionExceeding1024Characters_FailsValidation()
    {
        var command = new UpdateLocationCommand(Guid.NewGuid(), Guid.NewGuid(), "Shelf", new string('D', 1025), null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateLocationCommand.Description));
    }
}

