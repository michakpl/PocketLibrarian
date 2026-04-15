namespace PocketLibrarian.Domain.ValueObjects;

public sealed record Isbn
{
    public string Value { get; }

    private Isbn(string value) => Value = value;

    public static bool TryCreate(string? raw, out Isbn? isbn)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            isbn = null;
            return false;
        }

        var digits = raw.Replace("-", "").Replace(" ", "");

        if (digits.Length == 13 && IsValidIsbn13(digits))
        {
            isbn = new Isbn(digits);
            return true;
        }

        if (digits.Length == 10 && IsValidIsbn10(digits))
        {
            isbn = new Isbn(digits);
            return true;
        }

        isbn = null;
        return false;
    }

    private static bool IsValidIsbn13(string digits)
    {
        if (!digits.All(char.IsDigit)) return false;

        var sum = 0;
        for (var i = 0; i < 12; i++)
            sum += (digits[i] - '0') * (i % 2 == 0 ? 1 : 3);

        var check = (10 - sum % 10) % 10;
        return check == digits[12] - '0';
    }

    private static bool IsValidIsbn10(string digits)
    {
        if (!digits[..9].All(char.IsDigit)) return false;
        if (!char.IsDigit(digits[9]) && digits[9] != 'X' && digits[9] != 'x') return false;

        var sum = 0;
        for (var i = 0; i < 9; i++)
            sum += (digits[i] - '0') * (10 - i);

        var last = digits[9];
        sum += last is 'X' or 'x' ? 10 : last - '0';
        return sum % 11 == 0;
    }

    public override string ToString() => Value;
}

