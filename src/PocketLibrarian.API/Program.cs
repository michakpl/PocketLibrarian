using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using PocketLibrarian.API.Endpoints.Books;
using PocketLibrarian.API.Endpoints.Locations;
using PocketLibrarian.API.Extensions;
using PocketLibrarian.API.Middleware;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Books.Queries.GetBooks;
using PocketLibrarian.Infrastructure.Auth;
using PocketLibrarian.Infrastructure.Auth.Providers;
using PocketLibrarian.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

builder.Services.AddPocketLibrarianAuth(builder.Configuration, auth =>
{
    auth.AddProvider(new EntraIdAuthProvider());
});

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;
    options.AddPolicy("book.read", policy =>
        policy.RequireAuthenticatedUser()
              .RequireScope("book.read"));
    options.AddPolicy("book.write", policy =>
        policy.RequireAuthenticatedUser()
              .RequireScope("book.write"));
    options.AddPolicy("location.read", policy =>
        policy.RequireAuthenticatedUser()
              .RequireScope("location.read"));
    options.AddPolicy("location.write", policy =>
        policy.RequireAuthenticatedUser()
              .RequireScope("location.write"));
});
builder.Services.AddRequiredScopeAuthorization();

builder.Services.AddMediator((MediatorOptions options) =>
{
    options.Assemblies = [typeof(GetBooksQuery).Assembly];
    options.ServiceLifetime = ServiceLifetime.Scoped;
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUserContext>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<UserSynchronizationMiddleware>();

var api = app.MapGroup("/api");
api.MapGroup("/books").MapBooks();
api.MapGroup("/locations").MapLocations();

app.Run();
