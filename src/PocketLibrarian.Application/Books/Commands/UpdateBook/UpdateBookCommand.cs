using Mediator;

namespace PocketLibrarian.Application.Books.Commands.UpdateBook;

public sealed record UpdateBookCommand(
    Guid BookId,
    Guid OwnerId,
    string Title,
    string Author,
    string? Isbn,
    Guid? LocationId) : ICommand<BookDto>;

