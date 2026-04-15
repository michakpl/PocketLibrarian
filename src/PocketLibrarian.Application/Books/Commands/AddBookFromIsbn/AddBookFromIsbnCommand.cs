using Mediator;

namespace PocketLibrarian.Application.Books.Commands.AddBookFromIsbn;

public sealed record AddBookFromIsbnCommand(Guid OwnerId, string RawIsbn) : ICommand<BookDto>;

