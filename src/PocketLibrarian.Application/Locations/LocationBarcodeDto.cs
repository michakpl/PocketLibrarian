namespace PocketLibrarian.Application.Locations;

public sealed record LocationBarcodeDto(
    Guid Id,
    string Name,
    string Code,
    IReadOnlyList<string> LocationPath);