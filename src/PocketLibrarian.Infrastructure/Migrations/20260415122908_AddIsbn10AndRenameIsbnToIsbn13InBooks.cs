using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PocketLibrarian.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsbn10AndRenameIsbnToIsbn13InBooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Isbn",
                table: "Books",
                newName: "Isbn13");

            migrationBuilder.AddColumn<string>(
                name: "Isbn10",
                table: "Books",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Isbn10",
                table: "Books");

            migrationBuilder.RenameColumn(
                name: "Isbn13",
                table: "Books",
                newName: "Isbn");
        }
    }
}
