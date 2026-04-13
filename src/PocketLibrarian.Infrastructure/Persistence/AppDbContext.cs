using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Domain.Entities;

namespace PocketLibrarian.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    CurrentUserContext currentUser) : DbContext(options), IApplicationDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Location> Locations => Set<Location>();

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

        modelBuilder.Entity<Book>(e =>
        {
            e.HasKey(b => b.Id);
            e.Property(b => b.Title)
                .IsRequired()
                .HasMaxLength(256);
            e.Property(b => b.Author)
                .IsRequired()
                .HasMaxLength(256);
            e.Property(b => b.Isbn)
                .HasMaxLength(50);
            e.HasOne(b => b.Owner)
                .WithMany()
                .HasForeignKey(b => b.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(b => !currentUser.IsAuthenticated || b.OwnerId == currentUser.OwnerId);
        });

        modelBuilder.Entity<Location>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.Name)
                .IsRequired()
                .HasMaxLength(256);
            e.Property(l => l.Code)
                .IsRequired()
                .HasMaxLength(50);
            e.HasOne(l => l.Parent)
                .WithMany()
                .HasForeignKey(l => l.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(l => l.Owner)
                .WithMany()
                .HasForeignKey(l => l.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}