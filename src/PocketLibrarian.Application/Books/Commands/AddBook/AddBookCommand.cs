using Mediator;
namespace PocketLibrarian.Application.Books.Commands.AddBook;
public sealed record AddBookCommand(
    Guid OwnerId,
    string Title,
    string Author,
    string? Isbn,
    Guid? LocationId) : ICommand<BookDto>;
