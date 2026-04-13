using Microsoft.EntityFrameworkCore;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Domain.Entities;
using PocketLibrarian.Infrastructure.Persistence;

namespace PocketLibrarian.API.Middleware;

public sealed class UserSynchronizationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IEnumerable<IIdentityClaimsMapper> mappers,
        CurrentUserContext userContext, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var mapper = mappers.FirstOrDefault(m => m.CanHandle(context.User)) ??
                     throw new InvalidOperationException("No identity mapper found.");

        var identity = mapper.Map(context.User);

        var externalId = await db.ExternalIdentities
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Provider == identity.Provider && e.ProviderId == identity.ProviderId,
                context.RequestAborted);
        
        Guid ownerId;

        if (externalId is null)
        {
            var (user, _) = User.CreateForProvider(
                identity.Provider, identity.ProviderId, identity.DisplayName, identity.Email);
            
            db.Users.Add(user);
            await db.SaveChangesAsync(context.RequestAborted);
            
            ownerId = user.Id;
        }
        else
        {
            externalId.User.RecordLogin(identity.DisplayName, identity.Email);
            await db.SaveChangesAsync(context.RequestAborted);
            ownerId = externalId.UserId;
        }
        
        userContext.Resolve(ownerId, identity);
        
        await next(context);
    }
}