namespace PocketLibrarian.Application.Exceptions;

/// <summary>
/// Thrown when a referenced entity does not exist or does not belong to the current user.
/// The API layer maps this to HTTP 404 Not Found.
/// </summary>
public sealed class NotFoundException(string entityName, object key)
    : Exception($"{entityName} '{key}' was not found or does not belong to the current user.");

