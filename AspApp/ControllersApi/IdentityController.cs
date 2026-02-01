using System.ComponentModel.DataAnnotations;
using AspApp.Filters;
using AspApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    public async Task<IActionResult> Login([FromForm] Identity_Login_FormModel loginModel,
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
                        user = new Identity_User_ViewModel()
                        {
                            Guid = user.UserGuid,
                            UserName = user.UserName!,
                            Description = user.Description,
                            Roles = (await userManager.GetRolesAsync(user)).ToArray(),
                            HasImage = user.HasImage,
                            IntegrityVersion = user.IntegrityVersion,
                            FullName = user.FullName,
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

    [HttpGet]
    public async Task<IActionResult> GetUserModel([FromQuery][StringLength(32)] string userGuid)
    {
        if (!Guid.TryParseExact(userGuid, "N", out Guid userGuid_Guid))
        {
            ModelState.AddModelError("Try Parse Guid", "Couldn't parse the specified string guid!");
            return BadRequest(ModelState);
        }

        Identity_UserDbModel? user =
        await userManager.Users
        .FirstOrDefaultAsync(u => u.UserGuid == userGuid_Guid);

        if (user is null)
        {
            ModelState.AddModelError("user", "the specified user Not found!");
            return BadRequest(ModelState);
        }

        Identity_User_ViewModel user_ViewModel = new Identity_User_ViewModel()
        {
            Guid = user.UserGuid,
            UserName = user.UserName!,
            Description = user.Description,
            HasImage = user.HasImage,
            IntegrityVersion = user.IntegrityVersion,
            FullName = user.FullName,
            Roles = (await userManager.GetRolesAsync(user)).ToArray(),
        };

        return Ok(user_ViewModel);
    }

    [HttpPost]
    [Authorize(Roles = "Identity_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitNewUser([FromBody] Identity_NewUser_FormModel formModel)
    {
        if (ModelState.IsValid)
        {
            Identity_UserDbModel user = new Identity_UserDbModel()
            {
                UserName = formModel.UserName,
                FullName = formModel.FullName,
            };
            IdentityResult result = await userManager.CreateAsync(user, formModel.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(user, formModel.Roles);
                return Ok(new { success = true });
            }
            foreach (IdentityError error in result.Errors)
            {
                ModelState.AddModelError("Submitting New User", error.Description);
            }
        }
        return BadRequest(ModelState);
    }

    [HttpGet]
    [Authorize(Roles = "Identity_Admins")]
    public async Task<IActionResult> GetAllRoles([FromServices] RoleManager<Identity_RoleDbModel> roleManager)
    {
        string[] roles = await roleManager.Roles.Select(role => role.Name!).ToArrayAsync();
        return Ok(roles);
    }
    [HttpGet]
    [Authorize(Roles = "Identity_Admins")]
    public async Task<IActionResult> GetUserRoles([FromQuery][StringLength(32)] string userGuid)
    {
        if (!Guid.TryParseExact(userGuid, "N", out Guid userGuid_Guid))
        {
            ModelState.AddModelError("Try Parse Guid", "Couldn't parse the specified string guid!");
            return BadRequest(ModelState);
        }

        Identity_UserDbModel? user =
        await userManager.Users
        .FirstOrDefaultAsync(u => u.UserGuid == userGuid_Guid);

        if (user is null)
        {
            ModelState.AddModelError("user", "the specified user Not found!");
            return BadRequest(ModelState);
        }

        string[] roles = (await userManager.GetRolesAsync(user)).ToArray();

        return Ok(roles);
    }

    [HttpPost]
    [Authorize(Roles = "Identity_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitEditUser([FromBody] Identity_EditUser_FormModel formModel)
    {
        if (ModelState.IsValid)
        {
            Identity_UserDbModel? user = await userManager.Users
            .FirstOrDefaultAsync(u => u.UserGuid == formModel.UserGuid);

            if (user is null)
            {
                ModelState.AddModelError("UserGuid", "Coudn't find the specified user!");
                return BadRequest(ModelState);
            }

            user.UserName = formModel.UserName;

            IdentityResult result = await userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(user, formModel.Roles);
                await userManager.RemovePasswordAsync(user);
                await userManager.AddPasswordAsync(user, formModel.Password);
                return Ok(new { success = true });
            }
            foreach (IdentityError error in result.Errors)
            {
                ModelState.AddModelError("Editing User", error.Description);
            }
        }
        return BadRequest(ModelState);
    }





    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitUsername([FromQuery][StringLength(32)] string username)
    {
        //fetch and create
        Identity_UserDbModel user = (await userManager.FindByNameAsync(User.Identity!.Name!))!;

        var result = await userManager.SetUserNameAsync(user, username);
        if (result.Succeeded)
        {
            //update user and its normalized username
            //await userManager.UpdateAsync(user);
            string token = await userManager.GenerateUserTokenAsync(user, "customTokenProvider", "login");
            return Ok(new { success = true, token });
        }
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError("Username", error.Description);
        }
        return BadRequest(ModelState);
    }
    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitFullName([FromQuery][StringLength(32)] string fullName)
    {
        //fetch and create
        Identity_UserDbModel user = (await userManager.FindByNameAsync(User.Identity!.Name!))!;

        user.FullName = fullName;
        var result = await userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            return Ok(new { success = true });
        }
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError("FullName", error.Description);
        }
        return BadRequest(ModelState);
    }
    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitDescription([FromQuery][StringLength(32)] string description)
    {
        //fetch and create
        Identity_UserDbModel user = (await userManager.FindByNameAsync(User.Identity!.Name!))!;

        user.Description = description;
        var result = await userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            return Ok(new { success = true });
        }
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError("Description", error.Description);
        }
        return BadRequest(ModelState);
    }
    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ChangePassword([FromQuery][StringLength(32)] string currentPassword,
    [FromQuery][StringLength(32)] string newPassword)
    {
        Identity_UserDbModel user = (await userManager.FindByNameAsync(User.Identity!.Name!))!;

        var result = await userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (result.Succeeded)
        {
            string token = await userManager.GenerateUserTokenAsync(user, "customTokenProvider", "login");
            return Ok(new { success = true, token });
        }
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError("ChangePassword", error.Description);
        }
        return BadRequest(ModelState);
    }
    [HttpPost]
    [Authorize]
    [RequestSizeLimit(128 * 1024)]//128 KB
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitUserImage([FromForm] UserImageFile_FormModel formModel)
    {
        if (ModelState.IsValid)
        {
            Identity_UserDbModel user = (await userManager.FindByNameAsync(User.Identity!.Name!))!;

            DirectoryInfo userDirectoryInfo = Directory.CreateDirectory(
                 Path.Combine(Storage_Users.FullName, user.UserGuid.ToString("N"))
            );
            string userImagePath = Path.Combine(userDirectoryInfo.FullName, "image");
            using (FileStream fs = System.IO.File.Create(userImagePath))
            {
                await formModel.UserImageFile.CopyToAsync(fs);
            }

            user.HasImage = true;
            user.IntegrityVersion++;

            //save
            await userManager.UpdateAsync(user);

            return Ok(new { success = true, user.HasImage, user.IntegrityVersion });
        }
        return BadRequest(ModelState);
    }
    public class UserImageFile_FormModel
    {
        public IFormFile UserImageFile { get; set; } = null!;
    }
    [HttpDelete]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteUserImage()
    {
        Identity_UserDbModel user = (await userManager.FindByNameAsync(User.Identity!.Name!))!;

        string userImagePath =
        Path.Combine(Storage_Users.FullName, user.UserGuid.ToString("N"), "image");

        if (System.IO.File.Exists(userImagePath))
        {
            System.IO.File.Delete(userImagePath);

            //edit user
            user.HasImage = false;
            user.IntegrityVersion = 0;

            await userManager.UpdateAsync(user);
        }

        return Ok(new { success = true });
    }



}