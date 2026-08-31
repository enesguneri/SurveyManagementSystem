using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SurveyManagement.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionDynamicOptionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OptionFileContent",
                table: "Questions",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionJsonPath",
                table: "Questions",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionSourceType",
                table: "Questions",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "OptionSourceUrl",
                table: "Questions",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionTextProperty",
                table: "Questions",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OptionFileContent",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionJsonPath",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionSourceType",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionSourceUrl",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionTextProperty",
                table: "Questions");
        }
    }
}
