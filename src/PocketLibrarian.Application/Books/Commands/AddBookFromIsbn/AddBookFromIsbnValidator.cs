using FluentValidation;
using PocketLibrarian.Domain.ValueObjects;

namespace PocketLibrarian.Application.Books.Commands.AddBookFromIsbn;

public sealed class AddBookFromIsbnValidator : AbstractValidator<AddBookFromIsbnCommand>
{
    public AddBookFromIsbnValidator()
    {
        RuleFor(x => x.OwnerId)
            .NotEmpty();

        RuleFor(x => x.RawIsbn)
            .NotEmpty()
            .Must(isbn => Isbn.TryCreate(isbn, out _))
            .WithMessage("'{PropertyValue}' is not a valid ISBN-10 or ISBN-13.");
    }
}

