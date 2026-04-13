using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    CurrentUserContext currentUser) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ExternalIdentity>(e =>
        {
            e.HasKey(i => i.Id);
            e.HasIndex(i => new { i.Provider, i.ProviderId })
                .IsUnique();
            e.Property(i => i.Provider)
                .IsRequired()
                .HasMaxLength(256);
            e.Property(i => i.ProviderId)
                .IsRequired()
                .HasMaxLength(256);
            e.HasOne(i => i.User)
                .WithMany(u => u.Identities)
                .HasForeignKey(i => i.UserId);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.DisplayName)
                .IsRequired()
                .HasMaxLength(256);
            e.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);
        });
    }
}