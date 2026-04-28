using FluentValidation;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed class GetBooksValidator: AbstractValidator<GetBooksQuery>
{
    public GetBooksValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0);

        RuleFor(x => x.PageSize)
            .GreaterThan(0)
            .LessThanOrEqualTo(100);
    }
}