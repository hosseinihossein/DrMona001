using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AspApp.Validators;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AspApp.Models;

public class Identity_DbContext : IdentityDbContext<Identity_UserDbModel, Identity_RoleDbModel, int>
{
    public Identity_DbContext(DbContextOptions<Identity_DbContext> options) : base(options) { }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //*************************** Index Columns *********************************
        modelBuilder.Entity<Identity_UserDbModel>()
        .HasIndex(u => u.UserGuid)
        .IsUnique(true);
    }
}

public class Identity_UserDbModel : IdentityUser<int>
{
    public Guid UserGuid { get; set; } = Guid.NewGuid();
    [MaxLength(64)]
    [Unicode]
    public string? FullName { get; set; }
    [MaxLength(4000)]
    [Unicode]
    public string? Description { get; set; }
    public byte _integrityVersion { get; set; } = 0;
    [NotMapped]
    public int IntegrityVersion
    {
        get => _integrityVersion;
        set => _integrityVersion = value > 255 || value < 0 ? (byte)0 : (byte)value;
    }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool HasImage { get; set; } = false;
}

public class Identity_RoleDbModel : IdentityRole<int>
{
    public Identity_RoleDbModel() : base() { }
    public Identity_RoleDbModel(string roleName) : base(roleName) { }
    [MaxLength(128)]
    public string Description { get; set; } = string.Empty;
}

//*********************************** Form models ************************************
public class Identity_Login_FormModel
{
    [StringLength(32)]
    public string Username { get; set; } = string.Empty;

    [StringLength(32)]
    public string Password { get; set; } = string.Empty;
}
public class Identity_NewUser_FormModel
{
    [StringLength(32, MinimumLength = 3)]
    public string UserName { get; set; } = string.Empty;

    [StringLength(32, MinimumLength = 3)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(32, MinimumLength = 5)]
    public string Password { get; set; } = string.Empty;
    [MaxStringArrayLength(16, 32)]
    public string[] Roles { get; set; } = [];
}
public class Identity_EditUser_FormModel
{
    public Guid UserGuid { get; set; }

    [StringLength(32, MinimumLength = 3)]
    public string UserName { get; set; } = string.Empty;

    [StringLength(32, MinimumLength = 5)]
    public string Password { get; set; } = string.Empty;
    [MaxStringArrayLength(16, 32)]
    public string[] Roles { get; set; } = [];
}

//*********************************** View models ************************************
public class Identity_User_ViewModel
{
    public Guid Guid { get; set; }
    public string UserName { get; set; } = null!;
    public string? FullName { get; set; }
    public string? Description { get; set; }
    public bool HasImage { get; set; }
    public int IntegrityVersion { get; set; }
    public string[] Roles { get; set; } = [];
}

/******************************** Custom Token Provider *******************************/
public class CustomTokenProvider : DataProtectorTokenProvider<Identity_UserDbModel>
{
    readonly IConfiguration _configuration;
    public CustomTokenProvider(
        IDataProtectionProvider dataProtectionProvider,
        IOptions<DataProtectionTokenProviderOptions> options,
        ILogger<DataProtectorTokenProvider<Identity_UserDbModel>> logger,
        IConfiguration configuration)
    : base(dataProtectionProvider, options, logger)
    {
        _configuration = configuration;
    }

    public override async Task<string> GenerateAsync(string purpose,
    UserManager<Identity_UserDbModel> userManager, Identity_UserDbModel user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");

        var claims = new[]
        {
            //ClaimTypes.NameIdentifier
            new Claim("UserGuid", user.UserGuid.ToString("N")),
            new Claim("SecurityStamp", await userManager.GetSecurityStampAsync(user))
        };

        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]!));
        var signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(jwtSettings["DurationInHours"] ?? "10")),
            signingCredentials: signingCredentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public override async Task<bool> ValidateAsync(string purpose, string token,
    UserManager<Identity_UserDbModel> userManager, Identity_UserDbModel user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]!)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        ClaimsPrincipal principal;
        SecurityToken validatedToken;

        var validationResult = await tokenHandler.ValidateTokenAsync(token, tokenValidationParameters);
        if (!validationResult.IsValid)
        {
            return false;
        }

        try
        {
            // Validate the token and return the claims principal
            principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out validatedToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Token validation failed: {ex.Message}");
            return false;
        }

        // Ensure the token is a valid JWT
        if (validatedToken is JwtSecurityToken jwtToken &&
            jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256Signature, StringComparison.InvariantCultureIgnoreCase) &&
            principal is not null)
        {
            string? userStringGuid = principal.FindFirst("UserGuid")?.Value;
            if (userStringGuid is null ||
            !Guid.TryParseExact(userStringGuid, "N", out Guid userGuid) ||
            user.UserGuid != userGuid)
            {
                return false;
            }

            string? securityStamp = principal.FindFirst("SecurityStamp")?.Value;
            if (securityStamp is null || user.SecurityStamp != securityStamp)
            {
                return false;
            }

            return true;
        }

        return false;
    }


}


/******************************** Identity Process *******************************/
public class Identity_Process
{
    public readonly DirectoryInfo Storage_Users;
    //readonly string SeedFileName;
    public Identity_Process(IWebHostEnvironment env)
    {
        Storage_Users = Directory.CreateDirectory(Path.Combine(env.ContentRootPath, "Storage", "Identity", "Users"));
    }
}
