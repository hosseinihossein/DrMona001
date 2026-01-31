using AspApp.Filters;
using AspApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AspApp.ControllersApi;

[ApiController]
[Route("api/[controller]/[action]")]
public class IdentityController : ControllerBase
{
    readonly SignInManager<Identity_UserDbModel> signInManager;
    readonly UserManager<Identity_UserDbModel> userManager;
    readonly DirectoryInfo Storage_Users;





    public IdentityController(SignInManager<Identity_UserDbModel> signInManager,
    UserManager<Identity_UserDbModel> userManager, Identity_Process identityProcess)
    {
        this.signInManager = signInManager;
        this.userManager = userManager;
        Storage_Users = identityProcess.Storage_Users;
    }





    [HttpGet]
    [GenerateAntiforgeryTokenCookie]
    [Authorize]
    public IActionResult GetCsrf()
    {
        return Ok();
    }





    [HttpPost]
    public async Task<IActionResult> Login([FromForm] Identity_LoginFormModel loginModel,
    [FromServices] IConfiguration configuration)
    {
        if (ModelState.IsValid)
        {
            if (User.Identity?.IsAuthenticated ?? false)
            {
                await signInManager.SignOutAsync();
            }

            Identity_UserDbModel? user = await userManager.FindByNameAsync(loginModel.Username);

            if (user is not null)
            {
                Microsoft.AspNetCore.Identity.SignInResult result =
                await signInManager.CheckPasswordSignInAsync(user, loginModel.Password, true);

                if (result.Succeeded)
                {
                    string token = await userManager.GenerateUserTokenAsync(user, "customTokenProvider", "login");
                    var jwtSettings = configuration.GetSection("JwtSettings");

                    return Ok(new
                    {
                        token,
                        expiresInHours = jwtSettings["DurationInHours"] ?? "10",
                        user = new Identity_UserProfile_ViewModel()
                        {
                            Guid = user.UserGuid,
                            Username = user.UserName!,
                            Description = user.Description,
                            Email = user.Email!,
                            DisplayEmailPublicly = user.DisplayEmailPublicly,
                            Roles = (await userManager.GetRolesAsync(user)).ToArray(),
                            HasImage = user.HasImage,
                            IntegrityVersion = user.IntegrityVersion,
                        },
                    });
                }
                else
                {
                    ModelState.AddModelError("Password", "Invalid Credentials");
                }
            }
            else
            {
                ModelState.AddModelError("Username", "Invalid Username or Email");
            }
        }

        return BadRequest(ModelState);
    }

}