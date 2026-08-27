using System.Net;
using System.Net.Http.Json;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Roles;

namespace SurveyManagement.Tests.Integration;

public class RolesControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RolesControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetAvailableRoles_WhenAnonymous_ShouldReturnUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/roles/available");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateRole_WhenNormalUser_ShouldReturnForbidden()
    {
        // Arrange
        var client = _factory.CreateClientWithAuth("normaluser", role: "User", userId: 2);
        var request = new CreateRoleDto { Name = "Yeni Birim" };

        // Act
        var response = await client.PostAsJsonAsync("/api/roles", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateRole_WhenAdminUser_ShouldReturnCreated()
    {
        // Arrange
        var client = _factory.CreateClientWithAuth("adminuser", role: "Admin", userId: 1);
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..6];
        var request = new CreateRoleDto { Name = $"Fakülte {uniqueSuffix}" };

        // Act
        var response = await client.PostAsJsonAsync("/api/roles", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<RoleDto>>();
        result.Should().NotBeNull();
        result!.IsSuccess.Should().BeTrue();
        result.Data!.Name.Should().Be(request.Name);
    }
}
