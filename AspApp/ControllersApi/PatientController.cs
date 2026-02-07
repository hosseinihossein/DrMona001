using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspApp.ControllersApi;

[ApiController]
[Route("api/[controller]/[action]")]
public class PatientController : ControllerBase
{
    readonly Patient_DbContext patientDb;
    readonly DirectoryInfo Storage_Patients;





    public PatientController(Patient_DbContext patientDb, Patient_Process patientProcess)
    {
        this.patientDb = patientDb;
        Storage_Patients = patientProcess.Storage_Patients;
    }





    [HttpPost]
    [Authorize(Roles = "Patient_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateNewPatient([FromQuery][StringLength(128)] string fullName,
    [FromQuery][StringLength(10)] string nationlId)
    {
        Patient_Patient_DbModel patientDbModel = new()
        {
            FullName = fullName,
            NationalId = nationlId,
        };

        patientDb.Patients.Add(patientDbModel);
        await patientDb.SaveChangesAsync();

        return Ok(new { success = true, guid = patientDbModel.Guid });
    }

    [HttpDelete]
    [Authorize(Roles = "Patient_Admins,Document_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeletePatient([FromQuery][StringLength(32)] string guid)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid patientGuid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        int deletedPatients = await patientDb.Patients.Where(p => p.Guid == patientGuid).ExecuteDeleteAsync();
        if (deletedPatients > 0)
        {
            string patientDirectoryPath = Path.Combine(Storage_Patients.FullName, guid);
            if (Directory.Exists(patientDirectoryPath))
            {
                Directory.Delete(patientDirectoryPath, true);
            }
        }

        return Ok(new { success = true });
    }





    [HttpPost]
    [Authorize(Roles = "Patient_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitNationalId([FromQuery][StringLength(32)] string guid,
    [FromQuery][StringLength(10)] string nationalId)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid patientGuid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        await patientDb.Patients.Where(p => p.Guid == patientGuid).ExecuteUpdateAsync(setter => setter
            .SetProperty(p => p.NationalId, nationalId)
        );

        return Ok(new { success = true });
    }

    [HttpPost]
    [Authorize(Roles = "Patient_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitFullName([FromQuery][StringLength(32)] string guid,
    [FromQuery][StringLength(128)] string fullName)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid patientGuid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        await patientDb.Patients.Where(p => p.Guid == patientGuid).ExecuteUpdateAsync(setter => setter
            .SetProperty(p => p.FullName, fullName)
        );

        return Ok(new { success = true });
    }

    [HttpPost]
    [Authorize(Roles = "Patient_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitDescription([FromQuery][StringLength(32)] string guid,
    [FromQuery][StringLength(128)] string description)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid patientGuid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        await patientDb.Patients.Where(p => p.Guid == patientGuid).ExecuteUpdateAsync(setter => setter
            .SetProperty(p => p.Description, description)
        );

        return Ok(new { success = true });
    }

    [HttpPost]
    [Authorize(Roles = "Patient_Admins")]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(128 * 1024)]//128 KB
    public async Task<IActionResult> SubmitPatientImage([FromForm] Patient_PatientImage_FormModel formModel)
    {
        if (ModelState.IsValid)
        {
            Patient_Patient_DbModel? patientDbModel = await patientDb.Patients
            .FirstOrDefaultAsync(p => p.Guid == formModel.Guid);
            if (patientDbModel is null)
            {
                ModelState.AddModelError("Patient Guid", "Couldn't find any patient with the specified guid");
                return BadRequest(ModelState);
            }

            DirectoryInfo patientDirectoryInfo = Directory.CreateDirectory(
                Path.Combine(Storage_Patients.FullName, formModel.Guid.ToString("N"))
            );
            string patientImagePath = Path.Combine(patientDirectoryInfo.FullName, "image");
            using (FileStream fs = System.IO.File.Create(patientImagePath))
            {
                await formModel.Image.CopyToAsync(fs);
            }

            patientDbModel.HasImage = true;
            patientDbModel.IntegrityVersion += 1;

            await patientDb.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                hasImage = true,
                integrityVersion = patientDbModel.IntegrityVersion,
            });
        }

        return BadRequest(ModelState);

    }

    [HttpDelete]
    [Authorize(Roles = "Patient_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeletePatientImage([FromQuery][StringLength(32)] string guid)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid patientGuid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        Patient_Patient_DbModel? patientDbModel = await patientDb.Patients
        .FirstOrDefaultAsync(p => p.Guid == patientGuid);
        if (patientDbModel is null)
        {
            ModelState.AddModelError("Patient Guid", "Couldn't find any patient with the specified guid");
            return BadRequest(ModelState);
        }

        string patientImagePath = Path.Combine(Storage_Patients.FullName, guid, "image");
        if (System.IO.File.Exists(patientImagePath))
        {
            System.IO.File.Delete(patientImagePath);
        }

        patientDbModel.HasImage = false;
        patientDbModel.IntegrityVersion = 0;

        await patientDb.SaveChangesAsync();

        return Ok(new { success = true });
    }





    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetPatientModel([FromQuery][StringLength(32)] string guid)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid patientGuid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        Patient_Patient_ViewModel? patientViewModel = await patientDb.Patients
        .Where(p => p.Guid == patientGuid)
        .Select(p => new Patient_Patient_ViewModel()
        {
            FullName = p.FullName,
            NationalId = p.NationalId,
            CreatedAt = p.CreatedAt,
            Description = p.Description,
            Guid = p.Guid,
            HasImage = p.HasImage,
            IntegrityVersion = p.IntegrityVersion,
        })
        .FirstOrDefaultAsync();

        if (patientViewModel is null)
        {
            ModelState.AddModelError("Patient Guid", "Couldn't find any patient with the specified guid");
            return BadRequest(ModelState);
        }

        return Ok(patientViewModel);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetPatientList([FromQuery] int? pageIndex, [FromQuery] int? pageSize,
    [FromQuery][StringLength(128)] string? name, [FromQuery][StringLength(10)] string? nationalId)
    {
        pageIndex ??= 0;
        pageSize ??= 50;

        Patient_PatientList_ViewModel[] patients = await patientDb.Patients
        .Where(p =>
            (nationalId == null || p.NationalId.Contains(nationalId)) &&
            (name == null || p.FullName.Contains(name))
        )
        .OrderByDescending(p => p.CreatedAt)
        .Skip(pageIndex.Value * pageSize.Value)
        .Take(pageSize.Value)
        .Select(p => new Patient_PatientList_ViewModel()
        {
            FullName = p.FullName,
            NationalId = p.NationalId,
            CreatedAt = p.CreatedAt,
            Guid = p.Guid,
            HasImage = p.HasImage,
            IntegrityVersion = p.IntegrityVersion,
        })
        .ToArrayAsync();

        return Ok(patients);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetTotalNumberOfPatients()
    {
        int totalNumberOfPatients = await patientDb.Patients.CountAsync();
        return Ok(new { totalNumberOfPatients });
    }





}