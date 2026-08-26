using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SurveyManagement.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialMySqlCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false),
                    IsSystemRole = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false),
                    Username = table.Column<string>(type: "longtext", nullable: false),
                    Email = table.Column<string>(type: "longtext", nullable: false),
                    PasswordHash = table.Column<byte[]>(type: "longblob", nullable: false),
                    PasswordSalt = table.Column<byte[]>(type: "longblob", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Forms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    PublicId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    ShowRespondentIdentity = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    AccessType = table.Column<string>(type: "longtext", nullable: false),
                    CreationSource = table.Column<string>(type: "longtext", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Forms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Forms_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FormResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    FormId = table.Column<int>(type: "int", nullable: false),
                    RespondentUserId = table.Column<int>(type: "int", nullable: true),
                    RespondentNameSnapshot = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    RespondentIpAddress = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormResponses_Forms_FormId",
                        column: x => x.FormId,
                        principalTable: "Forms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FormResponses_Users_RespondentUserId",
                        column: x => x.RespondentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FormRoles",
                columns: table => new
                {
                    FormId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormRoles", x => new { x.FormId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_FormRoles_Forms_FormId",
                        column: x => x.FormId,
                        principalTable: "Forms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Questions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    FormId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Type = table.Column<string>(type: "longtext", nullable: false),
                    IsRequired = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    RatingMinLabel = table.Column<string>(type: "longtext", nullable: true),
                    RatingMaxLabel = table.Column<string>(type: "longtext", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Questions_Forms_FormId",
                        column: x => x.FormId,
                        principalTable: "Forms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MatrixColumns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatrixColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatrixColumns_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MatrixRows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatrixRows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatrixRows_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuestionOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionOptions_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuestionValidations",
                columns: table => new
                {
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    MinLength = table.Column<int>(type: "int", nullable: true),
                    MaxLength = table.Column<int>(type: "int", nullable: true),
                    RegexPattern = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    MinValue = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    MaxValue = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    MinDate = table.Column<DateOnly>(type: "date", nullable: true),
                    MaxDate = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionValidations", x => x.QuestionId);
                    table.ForeignKey(
                        name: "FK_QuestionValidations_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ResponseAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    FormResponseId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    TextValue = table.Column<string>(type: "longtext", nullable: true),
                    NumericValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DateValue = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResponseAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResponseAnswers_FormResponses_FormResponseId",
                        column: x => x.FormResponseId,
                        principalTable: "FormResponses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResponseAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ResponseAnswerOptions",
                columns: table => new
                {
                    ResponseAnswerId = table.Column<int>(type: "int", nullable: false),
                    QuestionOptionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResponseAnswerOptions", x => new { x.ResponseAnswerId, x.QuestionOptionId });
                    table.ForeignKey(
                        name: "FK_ResponseAnswerOptions_QuestionOptions_QuestionOptionId",
                        column: x => x.QuestionOptionId,
                        principalTable: "QuestionOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResponseAnswerOptions_ResponseAnswers_ResponseAnswerId",
                        column: x => x.ResponseAnswerId,
                        principalTable: "ResponseAnswers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ResponseMatrixAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    ResponseAnswerId = table.Column<int>(type: "int", nullable: false),
                    MatrixRowId = table.Column<int>(type: "int", nullable: false),
                    MatrixColumnId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResponseMatrixAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResponseMatrixAnswers_MatrixColumns_MatrixColumnId",
                        column: x => x.MatrixColumnId,
                        principalTable: "MatrixColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResponseMatrixAnswers_MatrixRows_MatrixRowId",
                        column: x => x.MatrixRowId,
                        principalTable: "MatrixRows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResponseMatrixAnswers_ResponseAnswers_ResponseAnswerId",
                        column: x => x.ResponseAnswerId,
                        principalTable: "ResponseAnswers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "IsActive", "IsSystemRole", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Admin" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "User" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_FormId",
                table: "FormResponses",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_RespondentUserId",
                table: "FormResponses",
                column: "RespondentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormRoles_RoleId",
                table: "FormRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Forms_CreatedByUserId",
                table: "Forms",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Forms_PublicId",
                table: "Forms",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatrixColumns_QuestionId_DisplayOrder",
                table: "MatrixColumns",
                columns: new[] { "QuestionId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatrixRows_QuestionId_DisplayOrder",
                table: "MatrixRows",
                columns: new[] { "QuestionId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionOptions_QuestionId_DisplayOrder",
                table: "QuestionOptions",
                columns: new[] { "QuestionId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_FormId_DisplayOrder",
                table: "Questions",
                columns: new[] { "FormId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResponseAnswerOptions_QuestionOptionId",
                table: "ResponseAnswerOptions",
                column: "QuestionOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_ResponseAnswers_FormResponseId_QuestionId",
                table: "ResponseAnswers",
                columns: new[] { "FormResponseId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResponseAnswers_QuestionId",
                table: "ResponseAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_ResponseMatrixAnswers_MatrixColumnId",
                table: "ResponseMatrixAnswers",
                column: "MatrixColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_ResponseMatrixAnswers_MatrixRowId",
                table: "ResponseMatrixAnswers",
                column: "MatrixRowId");

            migrationBuilder.CreateIndex(
                name: "IX_ResponseMatrixAnswers_ResponseAnswerId_MatrixRowId_MatrixCol~",
                table: "ResponseMatrixAnswers",
                columns: new[] { "ResponseAnswerId", "MatrixRowId", "MatrixColumnId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormRoles");

            migrationBuilder.DropTable(
                name: "QuestionValidations");

            migrationBuilder.DropTable(
                name: "ResponseAnswerOptions");

            migrationBuilder.DropTable(
                name: "ResponseMatrixAnswers");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "QuestionOptions");

            migrationBuilder.DropTable(
                name: "MatrixColumns");

            migrationBuilder.DropTable(
                name: "MatrixRows");

            migrationBuilder.DropTable(
                name: "ResponseAnswers");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "FormResponses");

            migrationBuilder.DropTable(
                name: "Questions");

            migrationBuilder.DropTable(
                name: "Forms");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
