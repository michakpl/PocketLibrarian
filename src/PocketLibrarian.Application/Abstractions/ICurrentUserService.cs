namespace PocketLibrarian.Application.Abstractions;

public interface ICurrentUserService
{
    Guid OwnerId { get; }
    
    UserIdentity? Identity { get; }
}