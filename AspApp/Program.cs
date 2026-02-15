using System.Net;
using System.Text;
using AspApp.Filters;
using AspApp.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AspApp;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);





        //******************* Kestrel *******************
        builder.WebHost.ConfigureKestrel(options =>
        {
            options.Listen(IPAddress.Loopback, 5443, listenOptions =>
            {
                listenOptions.UseHttps(/*"certFileName.pfx"*/);//user default certs
            });

            options.Limits.MaxRequestBodySize = 16 * 1024;// 16 KB
        });





        //******************* Identity_DbContext *******************
        builder.Services.AddDbContext<Identity_DbContext>(opts =>
        {
            opts.UseMySql(builder.Configuration["ConnectionStrings_MySql:IdentityConnection"],
            new MySqlServerVersion(new Version(8, 0, 42)), options =>
            {
                options.EnableRetryOnFailure();
            });
        });
        //******************* Patient_DbContext *******************
        builder.Services.AddDbContext<Patient_DbContext>(opts =>
        {
            opts.UseMySql(builder.Configuration["ConnectionStrings_MySql:PatientConnection"],
            new MySqlServerVersion(new Version(8, 0, 42)), options =>
            {
                options.EnableRetryOnFailure();
            });
        });





        //******************* Identity *******************
        builder.Services.AddIdentity<Identity_UserDbModel, Identity_RoleDbModel>(options =>
        {
            options.User.RequireUniqueEmail = false;
            options.User.AllowedUserNameCharacters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._";

            options.SignIn.RequireConfirmedEmail = false;

            options.Password.RequireDigit = false;
            options.Password.RequiredLength = 5;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredUniqueChars = 1;

            //options.Lockout.AllowedForNewUsers = true;
            //options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            //options.Lockout.MaxFailedAccessAttempts = 5;

            //options.ClaimsIdentity.SecurityStampClaimType = "AspNet.Identity.SecurityStamp";
            //options.ClaimsIdentity.UserIdClaimType = ClaimTypes.NameIdentifier;

            options.Tokens.EmailConfirmationTokenProvider = "customTokenProvider";
            options.Tokens.ChangeEmailTokenProvider = "customTokenProvider";
            options.Tokens.PasswordResetTokenProvider = "customTokenProvider";
            //options.Tokens.AuthenticatorTokenProvider = "customTokenProvider";
            //options.Tokens.ChangePhoneNumberTokenProvider = "customTokenProvider";

        })
        .AddTokenProvider<CustomTokenProvider>("customTokenProvider")
        .AddEntityFrameworkStores<Identity_DbContext>();

        //******************* Authentication *******************
        builder.Services.AddAuthentication(options =>
        {
            //options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            //options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");

            options.RequireHttpsMetadata = true;
            options.SaveToken = true;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]!)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var userManager = context.HttpContext.RequestServices
                        .GetRequiredService<UserManager<Identity_UserDbModel>>();
                    var signinManager = context.HttpContext.RequestServices
                        .GetRequiredService<SignInManager<Identity_UserDbModel>>();

                    string? userStringGuid = context.Principal?.FindFirst("UserGuid")?.Value;
                    if (userStringGuid is null ||
                    !Guid.TryParseExact(userStringGuid, "N", out Guid userGuid))
                    {
                        context.Fail("couldn't find user id in the token!");
                        return;
                    }

                    string? securityStamp = context.Principal?.FindFirst("SecurityStamp")?.Value;
                    if (securityStamp is null)
                    {
                        context.Fail("couldn't find security stamp in the token!");
                        return;
                    }

                    Identity_UserDbModel? user = await userManager.Users
                    .FirstOrDefaultAsync(u => u.UserGuid == userGuid);
                    if (user is null || user.SecurityStamp != securityStamp)
                    {
                        //Console.WriteLine("\n***** token is invalid!");
                        context.Fail("token is invalid!");
                        return;
                    }

                    context.Principal = await signinManager.CreateUserPrincipalAsync(user);
                },

            };
        });

        //******************* SecurityStampValidatorOptions *******************
        builder.Services.Configure<SecurityStampValidatorOptions>(options =>
        {
            options.ValidationInterval = TimeSpan.Zero;
        });

        //******************* Controllers *******************
        builder.Services.AddControllersWithViews(options =>
        {
            options.Filters.Add(new RequireHttpsAttribute());
        })
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new GuidJsonConverter());
        });

        builder.Services.AddControllers(options =>
        {
            options.Filters.Add(new RequireHttpsAttribute());
        })
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new GuidJsonConverter());
        });

        //******************* AntiForgery *******************
        builder.Services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            //options.Cookie.Name = "XSRF-TOKEN";//swap error
        });





        //**************************** Custom Services **************************
        builder.Services.AddSingleton<Identity_Process>();
        builder.Services.AddSingleton<Patient_Process>();
        builder.Services.AddSingleton<Backup_Process>();
        builder.Services.AddSingleton<FileExtensionContentTypeProvider>();
        builder.Services.AddSingleton<FileNameValidator>();
        builder.Services.AddSingleton<UploadLargeFile>();





        //******************* app *******************
        var app = builder.Build();

        //**************************** app.Use ************************
        app.UseStaticFiles(new StaticFileOptions { ServeUnknownFileTypes = true });

        app.UseAuthentication();
        app.UseAuthorization();




        /********************** Migrate Pending DataBases **********************/
        if (args.Length > 0 && args.Contains("SeedDbs"))
        {
            using (var scope = app.Services.CreateScope())
            {
                Identity_DbContext identityDb = scope.ServiceProvider.GetRequiredService<Identity_DbContext>();
                identityDb.Database.Migrate();

                Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();
                patientDb.Database.Migrate();


                Console.WriteLine("** All DB Migration Completed! **");

                //************************** Seed DataBases **************************
                //***** Create "admin" Identity *****
                UserManager<Identity_UserDbModel> userManager = scope.ServiceProvider.GetRequiredService<UserManager<Identity_UserDbModel>>();
                RoleManager<Identity_RoleDbModel> roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Identity_RoleDbModel>>();

                Identity_UserDbModel? admin = await userManager.FindByNameAsync("admin");
                if (admin == null)
                {
                    string adminPassword = builder.Configuration["Identity:AdminPassword"]!;
                    admin = new Identity_UserDbModel
                    {
                        UserName = "admin",
                        Description = "This user account belongs to the admin of the app."
                    };
                    IdentityResult result = await userManager.CreateAsync(admin, adminPassword);

                    if (!result.Succeeded)
                    {
                        foreach (var error in result.Errors)
                        {
                            Console.WriteLine(error.Description);
                        }
                        return;
                    }
                }

                //***** Seed Roles *****
                if (await roleManager.FindByNameAsync("Identity_Admins") == null)
                {
                    await roleManager.CreateAsync(new Identity_RoleDbModel("Identity_Admins"));
                    await userManager.AddToRoleAsync(admin, "Identity_Admins");
                }
                if (await roleManager.FindByNameAsync("Backup_Admins") == null)
                {
                    await roleManager.CreateAsync(new Identity_RoleDbModel("Backup_Admins"));
                    await userManager.AddToRoleAsync(admin, "Backup_Admins");
                }
                if (await roleManager.FindByNameAsync("Patient_Admins") == null)
                {
                    await roleManager.CreateAsync(new Identity_RoleDbModel("Patient_Admins"));
                    await userManager.AddToRoleAsync(admin, "Patient_Admins");
                }
                if (await roleManager.FindByNameAsync("Document_Admins") == null)
                {
                    await roleManager.CreateAsync(new Identity_RoleDbModel("Document_Admins"));
                    await userManager.AddToRoleAsync(admin, "Document_Admins");
                }

            }
        }





        //**************************** app.Map ************************
        app.MapControllers();
        app.MapDefaultControllerRoute();

        app.Map("/{*catchAll}", async (HttpContext context) =>
        {
            string? catchAll = context.Request.RouteValues["catchAll"]?.ToString();
            if (!string.IsNullOrWhiteSpace(catchAll))
            {
                string staticFilePath =
                Path.Combine(app.Environment.WebRootPath, "AngularApp", "browser", catchAll);
                if (File.Exists(staticFilePath))
                {
                    var provider = new FileExtensionContentTypeProvider();
                    if (provider.TryGetContentType(staticFilePath, out string? contentType))
                    {
                        context.Response.ContentType = contentType;
                        await context.Response.SendFileAsync(staticFilePath);
                        return;
                    }
                    else
                    {
                        context.Response.ContentType = "application/octet-stream";
                        await context.Response.SendFileAsync(staticFilePath);
                        return;
                    }
                }
            }

            context.Response.ContentType = "text/html";
            await context.Response.SendFileAsync(
                Path.Combine(app.Environment.WebRootPath, "AngularApp", "browser", "index.html")
            );
        });





        //******************* app.Run ******************
        Console.WriteLine("app is running on 'https://localhost:5443'");
        app.Run();
    }
}
