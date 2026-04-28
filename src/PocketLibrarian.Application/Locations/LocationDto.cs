namespace PocketLibrarian.Application.Locations;

public sealed record LocationDto
{
    public Guid Id { get; init; }
    public Guid OwnerId { get; init; }
    public string Name { get; init; }
    public string Description { get; init; }
    public string Code { get; init; }
    public Guid? ParentId { get; init; }
    public IReadOnlyList<string> LocationPath { get; init; }
    public LocationDto(Guid Id, Guid OwnerId, string Name, string Description, string Code, Guid? ParentId)
        : this(Id, OwnerId, Name, Description, Code, ParentId, [])
    {
    }
    public LocationDto(Guid Id, Guid OwnerId, string Name, string Description, string Code, Guid? ParentId, IReadOnlyList<string>? LocationPath)
    {
        this.Id = Id;
        this.OwnerId = OwnerId;
        this.Name = Name;
        this.Description = Description;
        this.Code = Code;
        this.ParentId = ParentId;
        this.LocationPath = LocationPath ?? [];
    }
}
