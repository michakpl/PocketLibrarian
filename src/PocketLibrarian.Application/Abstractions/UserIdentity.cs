namespace PocketLibrarian.Application.Abstractions;

public sealed record UserIdentity
{
    public required string Provider;
    
    public required string ProviderId;
    
    public required string DisplayName;
    
    public required string Email;
}