using Mediator;
using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Application.IsbnLookup;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Domain.ValueObjects;

namespace PocketLibrarian.Application.Books.Commands.AddBookFromIsbn;

public sealed class AddBookFromIsbnHandler(
    IApplicationDbContext db,
    IBookMetadataProvider provider)
    : ICommandHandler<AddBookFromIsbnCommand, BookDto>
{
    public async ValueTask<BookDto> Handle(AddBookFromIsbnCommand cmd, CancellationToken cancellationToken)
    {
        Isbn.TryCreate(cmd.RawIsbn, out var isbn);
        var normalizedIsbn = isbn!.Value;

        var existingBook = await db.Books.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Isbn13 == normalizedIsbn, cancellationToken);
        
        Book book;
        if (existingBook != null)
        {
            book = Book.Create(existingBook.Title, existingBook.Author, cmd.OwnerId, normalizedIsbn, existingBook.Isbn10);
        }
        else
        {
            var metadata = await provider.LookupAsync(isbn, cancellationToken);

            if (metadata is null)
                throw new NotFoundException("Book", normalizedIsbn);
            
            var author = metadata.Authors.Count > 0
                ? string.Join(", ", metadata.Authors)
                : "Unknown";

            book = Book.Create(metadata.Title, author, cmd.OwnerId, metadata.Isbn13, metadata.Isbn10);
        }

        db.Books.Add(book);
        await db.SaveChangesAsync(cancellationToken);

        return new BookDto(book.Id, book.OwnerId, book.Title, book.Author, book.Isbn13, book.Isbn10, null, []);
    }
}

