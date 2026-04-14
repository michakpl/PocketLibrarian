using FluentValidation;

namespace PocketLibrarian.Application.Locations.Commands.AddLocation;

public sealed class AddLocationValidator : AbstractValidator<AddLocationCommand>
{
    public AddLocationValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.Description)
            .NotNull()
            .MaximumLength(1024);
    }
}

