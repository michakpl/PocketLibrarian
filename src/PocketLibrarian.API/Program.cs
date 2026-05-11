using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using PocketLibrarian.API.Endpoints.Books;
using PocketLibrarian.API.Endpoints.Locations;
using PocketLibrarian.API.Extensions;
using PocketLibrarian.API.Middleware;
using PocketLibrarian.Application;
using PocketLibrarian.Application.Abstractions;
using PocketLibrarian.Application.Behaviors;
using PocketLibrarian.Application.Exceptions;
using PocketLibrarian.Infrastructure.Auth;
using PocketLibrarian.Infrastructure.Auth.Providers;
using PocketLibrarian.Infrastructure.ExternalApis.GoogleBooks;
using PocketLibrarian.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

builder.Services.AddPocketLibrarianAuth(builder.Configuration,
    auth => { auth.AddProvider(new EntraIdAuthProvider()); });

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

builder.Services.AddMediator(options =>
{
    options.Assemblies = [typeof(AssemblyReference).Assembly];
    options.ServiceLifetime = ServiceLifetime.Scoped;
    options.PipelineBehaviors = [typeof(ValidationBehavior<,>)];
});

builder.Services.AddValidatorsFromAssemblyContaining<AssemblyReference>();

builder.Services.AddGoogleBooksClient(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUserContext>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();


// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var feature = context.Features.Get<IExceptionHandlerFeature>();
    var ex = feature?.Error;

    var (status, title) = ex switch
    {
        ValidationException => (StatusCodes.Status400BadRequest, "Validation Failed"),
        NotFoundException => (StatusCodes.Status404NotFound, "Not Found"),
        _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.")
    };

    context.Response.StatusCode = status;
    context.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
        Status = status,
        Title = title,
        Detail = status == StatusCodes.Status500InternalServerError && !app.Environment.IsDevelopment()
            ? ex?.Message
            : null
    };

    if (ex is ValidationException ve)
    {
        problem.Extensions["errors"] = ve.Errors
            .GroupBy(f => f.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(f => f.ErrorMessage).ToArray());
    }

    await context.Response.WriteAsJsonAsync(problem);
}));

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