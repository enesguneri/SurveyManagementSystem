using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SurveyManagement.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRespondentEmailSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RespondentEmailSnapshot",
                table: "FormResponses",
                type: "longtext",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RespondentEmailSnapshot",
                table: "FormResponses");
        }
    }
}
