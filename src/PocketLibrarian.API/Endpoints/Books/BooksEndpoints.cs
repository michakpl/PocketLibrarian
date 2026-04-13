using Mediator;
using Microsoft.AspNetCore.Http.HttpResults;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books;
using PocketLibrarian.Application.Books.Commands.AddBook;
using PocketLibrarian.Application.Books.Queries.GetBooks;

namespace PocketLibrarian.API.Endpoints.Books;

public static class BooksEndpoints
{
    public static RouteGroupBuilder MapBooks(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetBooks)
             .RequireAuthorization("book.read")
             .WithName("GetBooks")
             .WithSummary("Get all books for the current user");

        group.MapPost("/", AddBook)
             .RequireAuthorization("book.write")
             .WithName("AddBook")
             .WithSummary("Manually add a new book for the current user");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<BookDto>>> GetBooks(
        IMediator mediator, CurrentUserContext currentUser, CancellationToken cancellationToken)
    {
        var books = await mediator.Send(new GetBooksQuery(currentUser.OwnerId), cancellationToken);
        return TypedResults.Ok(books);
    }

    private static async Task<Created<BookDto>> AddBook(
        AddBookRequest request,
        IMediator mediator,
        CurrentUserContext currentUser,
        CancellationToken cancellationToken)
    {
        var command = new AddBookCommand(currentUser.OwnerId, request.Title, request.Author, request.Isbn, request.LocationId);
        var book = await mediator.Send(command, cancellationToken);
        return TypedResults.Created($"/api/books/{book.Id}", book);
    }
}

internal sealed record AddBookRequest(string Title, string Author, string? Isbn, Guid? LocationId);
