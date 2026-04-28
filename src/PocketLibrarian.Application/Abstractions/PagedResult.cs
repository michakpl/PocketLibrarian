namespace PocketLibrarian.Application.Abstractions;

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount)
{
    public int TotalPages
    {
        get
        {
            if (PageSize < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(PageSize));
            }
            
            return (int) Math.Ceiling(TotalCount / (double) PageSize);
        }
    }
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}
