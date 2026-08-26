using MySql.Data.MySqlClient;
using Npgsql;

// Aktarılacak tablolar foreign key ilişkilerine göre sıralanmıştır.
var tableNames = new[]
{
    "Roles",
    "Users",
    "UserRoles",
    "Forms",
    "FormRoles",
    "Questions",
    "QuestionOptions",
    "QuestionValidations",
    "MatrixRows",
    "MatrixColumns",
    "FormResponses",
    "ResponseAnswers",
    "ResponseAnswerOptions",
    "ResponseMatrixAnswers"
};

try
{
    // Bağlantı bilgileri dosyada tutulmaz, uygulama çalışırken alınır.
    var postgresConnectionString = ReadRequired(
        "PostgreSQL bağlantı dizesi: ");

    var mysqlConnectionString = ReadRequired(
        "MySQL bağlantı dizesi: ");

    using var postgresConnection =
        new NpgsqlConnection(postgresConnectionString);

    using var mysqlConnection =
        new MySqlConnection(mysqlConnectionString);

    Console.WriteLine("Veritabanlarına bağlanılıyor...");

    await postgresConnection.OpenAsync();
    await mysqlConnection.OpenAsync();

    Console.WriteLine("Bağlantılar başarılı.");

    // Hedef veritabanındaki foreign key kontrolleri
    // aktarım süresince geçici olarak kapatılır.
    await ExecuteMySqlCommandAsync(
        mysqlConnection,
        "SET FOREIGN_KEY_CHECKS = 0;");

    using var transaction = mysqlConnection.BeginTransaction();

    try
    {
        foreach (var tableName in tableNames)
        {
            await TransferTableAsync(
                postgresConnection,
                mysqlConnection,
                transaction,
                tableName);
        }

        transaction.Commit();
        Console.WriteLine("Tüm tablolar başarıyla aktarıldı.");
    }
    catch
    {
        transaction.Rollback();
        throw;
    }
    finally
    {
        // Foreign key kontrolleri mutlaka tekrar açılır.
        await ExecuteMySqlCommandAsync(
            mysqlConnection,
            "SET FOREIGN_KEY_CHECKS = 1;");
    }
}
catch (Exception exception)
{
    Console.Error.WriteLine();
    Console.Error.WriteLine("Veri aktarımı başarısız oldu.");
    Console.Error.WriteLine(exception.Message);

    Environment.ExitCode = 1;
}

static async Task TransferTableAsync(
    NpgsqlConnection postgresConnection,
    MySqlConnection mysqlConnection,
    MySqlTransaction transaction,
    string tableName)
{
    var postgresTableName = QuotePostgresIdentifier(tableName);

    using var selectCommand = new NpgsqlCommand(
        $"SELECT * FROM {postgresTableName};",
        postgresConnection);

    using var reader = await selectCommand.ExecuteReaderAsync();

    var columns = Enumerable
        .Range(0, reader.FieldCount)
        .Select(reader.GetName)
        .ToArray();

    if (columns.Length == 0)
    {
        Console.WriteLine($"{tableName}: Kolon bulunamadı.");
        return;
    }

    var mysqlColumns = string.Join(
        ", ",
        columns.Select(QuoteMySqlIdentifier));

    var parameters = string.Join(
        ", ",
        columns.Select((_, index) => $"@p{index}"));

    // Aynı primary key veya unique key varsa mevcut kayıt güncellenir.
    // Bu sayede migration ile seed edilen Admin/User rolleri sorun çıkarmaz.
    var updateColumns = string.Join(
        ", ",
        columns.Select(column =>
            $"{QuoteMySqlIdentifier(column)} = VALUES({QuoteMySqlIdentifier(column)})"));

    var insertSql = $"""
        INSERT INTO {QuoteMySqlIdentifier(tableName)}
            ({mysqlColumns})
        VALUES
            ({parameters})
        ON DUPLICATE KEY UPDATE
            {updateColumns};
        """;

    var transferredRowCount = 0;

    while (await reader.ReadAsync())
    {
        using var insertCommand = mysqlConnection.CreateCommand();

        insertCommand.Transaction = transaction;
        insertCommand.CommandText = insertSql;

        for (var index = 0; index < reader.FieldCount; index++)
        {
            var value = reader.IsDBNull(index)
                ? DBNull.Value
                : NormalizeValue(reader.GetValue(index));

            insertCommand.Parameters.AddWithValue($"@p{index}", value);
        }

        await insertCommand.ExecuteNonQueryAsync();
        transferredRowCount++;
    }

    Console.WriteLine(
        $"{tableName}: {transferredRowCount} kayıt aktarıldı.");
}

static async Task ExecuteMySqlCommandAsync(
    MySqlConnection connection,
    string sql)
{
    using var command = connection.CreateCommand();
    command.CommandText = sql;
    await command.ExecuteNonQueryAsync();
}

static object NormalizeValue(object value)
{
    // DateOnly, MySQL tarafından DateTime olarak daha uyumlu işlenir.
    if (value is DateOnly dateOnly)
    {
        return dateOnly.ToDateTime(TimeOnly.MinValue);
    }

    // DateTimeOffset değerleri UTC DateTime olarak aktarılır.
    if (value is DateTimeOffset dateTimeOffset)
    {
        return dateTimeOffset.UtcDateTime;
    }

    // Guid değerleri MySQL tarafındaki char(36) alanlarına aktarılır.
    if (value is Guid guid)
    {
        return guid.ToString();
    }

    return value;
}

static string ReadRequired(string message)
{
    Console.Write(message);

    var value = Console.ReadLine();

    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException(
            "Bağlantı dizesi boş bırakılamaz.");
    }

    return value.Trim();
}

static string QuotePostgresIdentifier(string identifier)
{
    return $"\"{identifier.Replace("\"", "\"\"")}\"";
}

static string QuoteMySqlIdentifier(string identifier)
{
    return $"`{identifier.Replace("`", "``")}`";
}