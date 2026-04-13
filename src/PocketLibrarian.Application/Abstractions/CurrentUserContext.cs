namespace PocketLibrarian.Application.Abstractions;

public sealed class CurrentUserContext
{
    private Guid? _ownerId;
    private UserIdentity? _identity;
    
    public bool IsAuthenticated => _ownerId.HasValue;
    
    public Guid OwnerId => _ownerId ?? throw new InvalidOperationException("User OwnerId is not resolved.");
    
    public UserIdentity Identity => _identity ?? throw new InvalidOperationException("User Identity is not resolved.");
    
    public void Resolve(Guid ownerId, UserIdentity identity)
    {
        if (_ownerId.HasValue)
        {
            throw new InvalidOperationException("User context is already resolved.");
        }
        
        _ownerId = ownerId;
        _identity = identity;
    }
}