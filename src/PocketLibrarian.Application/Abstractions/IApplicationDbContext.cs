using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<Book> Books { get; }
    DbSet<Location> Locations { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

