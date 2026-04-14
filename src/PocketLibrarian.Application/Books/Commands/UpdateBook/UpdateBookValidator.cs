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

        RuleFor(x => x.Isbn)
            .MaximumLength(50)
            .When(x => x.Isbn is not null);
    }
}

