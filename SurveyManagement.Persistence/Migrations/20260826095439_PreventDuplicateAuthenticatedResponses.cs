using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SurveyManagement.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PreventDuplicateAuthenticatedResponses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Önce foreign key tarafından kullanılabilecek
            // birleşik index oluşturulur.
            migrationBuilder.CreateIndex(name: "IX_FormResponses_FormId_RespondentUserId", table: "FormResponses", columns: new[]
                {
                    "FormId",
                    "RespondentUserId"
                },
                unique: true);

            // Eski tek kolonlu index daha sonra kaldırılır.
            migrationBuilder.DropIndex(
                name: "IX_FormResponses_FormId",
                table: "FormResponses");
        }

        /// <inheritdoc />
        protected override void Down(
    MigrationBuilder migrationBuilder)
        {
            // Geri dönüşte önce eski index oluşturulur.
            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_FormId",
                table: "FormResponses",
                column: "FormId");

            // Daha sonra birleşik unique index kaldırılır.
            migrationBuilder.DropIndex(
                name: "IX_FormResponses_FormId_RespondentUserId",
                table: "FormResponses");
        }
    }
}
