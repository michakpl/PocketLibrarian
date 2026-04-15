using FluentValidation;

namespace PocketLibrarian.Application.Books.Commands.UpdateBook;

public sealed class UpdateBookValidator : AbstractValidator<UpdateBookCommand>
{
    public UpdateBookValidator()
    {
        RuleFor(x => x.BookId)
            .NotEmpty();

        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.Author)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(x => x.Isbn13)
            .MaximumLength(50)
            .When(x => x.Isbn13 is not null);

        RuleFor(x => x.Isbn10)
            .MaximumLength(50)
            .When(x => x.Isbn10 is not null);
    }
}

