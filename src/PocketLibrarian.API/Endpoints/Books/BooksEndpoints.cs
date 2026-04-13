using Mediator;
using Microsoft.AspNetCore.Http.HttpResults;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books;
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

        return group;
    }

    private static async Task<Ok<IReadOnlyList<BookDto>>> GetBooks(
        IMediator mediator, CurrentUserContext currentUser, CancellationToken cancellationToken)
    {
        var books = await mediator.Send(new GetBooksQuery(currentUser.OwnerId), cancellationToken);
        return TypedResults.Ok(books);
    }
}
