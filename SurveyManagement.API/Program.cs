using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SurveyManagement.API.Middlewares;
using SurveyManagement.Application.Interfaces.Auth;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Responses;
using SurveyManagement.Application.Services.Responses;
using SurveyManagement.Application.Interfaces.Security;
using SurveyManagement.Application.Interfaces.Forms;
using SurveyManagement.Application.Interfaces.Roles;
using SurveyManagement.Application.Interfaces.Admin;
using SurveyManagement.Application.Services.Admin;
using SurveyManagement.Application.Services.Roles;
using SurveyManagement.Application.Services.Forms;
using SurveyManagement.Application.Services;
using SurveyManagement.Persistence.Context;
using SurveyManagement.Application.Interfaces.AI;
using SurveyManagement.Application.Options;
using SurveyManagement.Application.Services.AI;
using SurveyManagement.Application.Interfaces.Options;
using SurveyManagement.Application.Services.Options;


var builder = WebApplication.CreateBuilder(args);

// 1. Veritabanı Bağlantısı ve IAppDbContext Kaydı
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection bulunamadı.");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// 2. Güvenlik ve İş Mantığı Servislerinin Kaydı
builder.Services.AddScoped<IPasswordHashService, PasswordHashService>();
builder.Services.AddScoped<ITokenService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Form oluşturma ve soru türü doğrulama servisleri her HTTP isteği için oluşturulur.
builder.Services.AddScoped<IFormRequestValidator, FormRequestValidator>();
builder.Services.AddScoped<IFormService, FormService>();

// Form yanıtlarının doğrulama ve kayıt servisleri.
builder.Services.AddScoped<IFormResponseValidator, FormResponseValidator>();
builder.Services.AddScoped<IFormResponseService, FormResponseService>();

// Birim rolü listeleme ve admin rol oluşturma servisleri.
builder.Services.AddScoped<IRoleService, RoleService>();

// Admin paneli kullanıcı yönetimi servisi.
builder.Services.AddScoped<
    IAdminUserService,
    AdminUserService>();

// Gemini AI ayarları User Secrets veya ortam değişkenlerinden okunur.
var geminiOptions = new GeminiOptions
{
    ApiKey = builder.Configuration["Gemini:ApiKey"]
        ?? string.Empty,

    Model = builder.Configuration["Gemini:Model"]
        ?? "gemini-3.5-flash-lite",

    BaseUrl = builder.Configuration["Gemini:BaseUrl"]
        ?? "https://generativelanguage.googleapis.com"
};

builder.Services.AddSingleton(geminiOptions);

// HttpClient, GeminiSurveyService'e dependency injection ile verilir.
builder.Services.AddHttpClient<
    IGeminiSurveyService,
    GeminiSurveyService>();

builder.Services.AddHttpClient<
    IOptionImportService,
    OptionImportService>(client =>
    {
        // Dış API yanıtı için maksimum bekleme süresi.
        client.Timeout = TimeSpan.FromSeconds(10);
    });

// 3. JWT Authentication (Kimlik Doğrulama) Ayarları
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey bulunamadı.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Frontend ile API arasındaki browser isteklerine izin verir.
var frontendOrigin =
    builder.Configuration["Frontend:Origin"]
    ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // API enum değerlerini 1, 2 gibi sayılar yerine "Rating", "Published" gibi metin olarak işler.
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 4. Swagger / OpenAPI Servis Kaydı ve JWT Desteği (V2.x Mimarisi)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Survey Management API",
        Version = "v1",
        Description = "Survey Management System - JWT & Role-Based API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Lütfen kilit kutucuğuna SADECE token'ınızı yapıştırın."
    });


    options.AddSecurityRequirement(document =>
    {
        var scheme = new OpenApiSecuritySchemeReference("Bearer", document);

        return new OpenApiSecurityRequirement
        {
            [scheme] = new List<string>()
        };
    });
});

var app = builder.Build();

// 🛡️ Global Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// 6. Geliştirme Ortamında Swagger Arayüzünü Aç
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Survey Management API v1");
    });
}

app.UseHttpsRedirection();

// CORS middleware'i endpoint'lerden önce çalışmalıdır.
app.UseCors("FrontendPolicy");

// 🔑 Kimlik Doğrulama ve Yetkilendirme
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();