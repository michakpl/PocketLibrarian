using Mediator;

namespace PocketLibrarian.Application.Books.Queries.GetBooks;

public sealed class GetBooksHandler : IQueryHandler<GetBooksQuery, IReadOnlyList<BookDto>>
{
    public ValueTask<IReadOnlyList<BookDto>> Handle(GetBooksQuery query, CancellationToken cancellationToken)
    {
        // Dummy data — replace with real EF Core query once the Books entity is added
        IReadOnlyList<BookDto> books =
        [
            new BookDto(Guid.NewGuid(), query.OwnerId, "The Pragmatic Programmer", "David Thomas", "9780135957059"),
            new BookDto(Guid.NewGuid(), query.OwnerId, "Clean Architecture", "Robert C. Martin", "9780134494166"),
        ];

        return ValueTask.FromResult(books);
    }
}
