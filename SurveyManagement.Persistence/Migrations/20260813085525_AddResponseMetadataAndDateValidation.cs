using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SurveyManagement.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddResponseMetadataAndDateValidation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "DateValue",
                table: "ResponseAnswers",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "MaxDate",
                table: "QuestionValidations",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "MinDate",
                table: "QuestionValidations",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowRespondentIdentity",
                table: "Forms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RespondentIpAddress",
                table: "FormResponses",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RespondentNameSnapshot",
                table: "FormResponses",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateValue",
                table: "ResponseAnswers");

            migrationBuilder.DropColumn(
                name: "MaxDate",
                table: "QuestionValidations");

            migrationBuilder.DropColumn(
                name: "MinDate",
                table: "QuestionValidations");

            migrationBuilder.DropColumn(
                name: "ShowRespondentIdentity",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "RespondentIpAddress",
                table: "FormResponses");

            migrationBuilder.DropColumn(
                name: "RespondentNameSnapshot",
                table: "FormResponses");
        }
    }
}
