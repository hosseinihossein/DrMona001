using System.ComponentModel.DataAnnotations;
using System.Net;
using AspApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspApp.ControllersApi;

[ApiController]
[Route("api/[controller]/[action]")]
public class DocumentController : ControllerBase
{
    readonly Patient_DbContext patientDb;
    readonly DirectoryInfo Storage_Elements;
    readonly FileNameValidator fileNameValidator;





    public DocumentController(Patient_DbContext patientDb, Patient_Process patientProcess,
    FileNameValidator fileNameValidator)
    {
        this.patientDb = patientDb;
        Storage_Elements = patientProcess.Storage_Elements;
        this.fileNameValidator = fileNameValidator;
    }





    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetDocumentPageModel([FromQuery][StringLength(32)] string patientGuid)
    {
        if (!Guid.TryParseExact(patientGuid, "N", out Guid patient_Guid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        var documentPageInfo = await patientDb.Patients
        .Where(p => p.Guid == patient_Guid)
        .Select(p => new
        {
            p.Documents.First().Guid,
            elements = p.Documents.First().Elements,
        })
        .AsSplitQuery()
        .FirstOrDefaultAsync();

        if (documentPageInfo is null)
        {
            ModelState.AddModelError("Patient Guid", "Couldn't find any patient with the specified guid!");
            return BadRequest(ModelState);
        }

        IEnumerable<IGrouping<string, Patient_Element_DbModel>> elementsGroupedByTabs =
        documentPageInfo.elements.GroupBy(el => el.Tab);

        List<Patient_Tab_ViewModel> tabs = [];
        foreach (IGrouping<string, Patient_Element_DbModel> g in elementsGroupedByTabs)
        {
            Patient_Tab_ViewModel tab = new()
            {
                Name = g.Key,
                Elements = g.Select(el => new Patient_Element_ViewModel()
                {
                    Guid = el.Guid,
                    Order = el.Order,
                    Persian = el.Persian,
                    Tab = el.Tab,
                    Title = el.Title,
                    Type = el.Type,
                    Value = el.Value,
                    FileName = el.Value,
                }).ToArray(),
            };
            tabs.Add(tab);
        }

        Patient_DocumentPage_ViewModel documentPageModel = new()
        {
            Guid = documentPageInfo.Guid,
            PatientGuid = patient_Guid,
            Tabs = tabs.ToArray(),
        };

        return Ok(documentPageModel);
    }

    [HttpGet]
    [Authorize]
    public IActionResult ElementFile([FromQuery][StringLength(32)] string guid,
    [FromQuery][StringLength(64)] string fileName)
    {
        string filePath = Path.Combine(Storage_Elements.FullName, guid, fileName);
        if (System.IO.File.Exists(filePath))
        {
            return PhysicalFile(filePath, "application/octet-stream", fileName, true);
        }
        return NotFound("The element file Not found!");
    }





    [HttpPost]
    [Authorize(Roles = "Document_Admins")]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(22 * 1024 * 1024)]//22 MB
    public async Task<IActionResult> SubmitNewElement([FromForm] Patient_NewElement_FormModel formModel)
    {
        if (ModelState.IsValid)
        {
            var parentDocumentInfo = await patientDb.Documents
            .Where(d => d.Guid == formModel.DocumentGuid)
            .Select(d => new
            {
                parentDocument = d,
                numberOfElementsWithSpecifiedTabAndParent = d.Elements.Count(el => el.Tab == formModel.Tab),
            })
            .AsSplitQuery()
            .FirstOrDefaultAsync();

            if (parentDocumentInfo is null)
            {
                ModelState.AddModelError("Parent Document", "Couldn't find any document with the specified guid!");
                return BadRequest(ModelState);
            }

            Patient_Element_DbModel element = new()
            {
                Document = parentDocumentInfo.parentDocument,
                Order = parentDocumentInfo.numberOfElementsWithSpecifiedTabAndParent,
                Persian = formModel.Persian ?? false,
                Tab = formModel.Tab,
                Title = formModel.Title,
                Type = formModel.Type,
                Value = formModel.Value,
            };
            patientDb.Elements.Add(element);

            if (formModel.Type == "img" && formModel.File is not null)
            {
                //get a valid file name
                string validFileName =
                fileNameValidator.GetValidFileName(WebUtility.HtmlEncode(formModel.File.FileName));

                DirectoryInfo elementDirectoryInfo = Directory.CreateDirectory(
                    Path.Combine(Storage_Elements.FullName, element.Guid.ToString("N"))
                );
                string elementFilePath = Path.Combine(elementDirectoryInfo.FullName, validFileName);
                using (FileStream fs = System.IO.File.Create(elementFilePath))
                {
                    await formModel.File.CopyToAsync(fs);
                }

                element.FileName = validFileName;
            }

            await patientDb.SaveChangesAsync();

            Patient_Element_ViewModel elementViewModel = new()
            {
                Guid = element.Guid,
                Order = element.Order,
                Persian = element.Persian,
                Tab = element.Tab,
                Title = element.Title,
                Type = element.Type,
                Value = element.Value,
                FileName = element.FileName,
            };

            return Ok(elementViewModel);
        }

        return BadRequest(ModelState);
    }

    [HttpPost]
    [Authorize(Roles = "Document_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> EditElement([FromQuery][StringLength(32)] string guid,
    [FromQuery][StringLength(4000)] string? value, [FromQuery][StringLength(128)] string? title)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid element_Guid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        Patient_Element_DbModel? elementDbModel = await patientDb.Elements
        .FirstOrDefaultAsync(el => el.Guid == element_Guid);

        if (elementDbModel is null)
        {
            ModelState.AddModelError("Guid", "Couldn't find any element with the specified guid!");
            return BadRequest(ModelState);
        }

        if (value is not null)
        {
            elementDbModel.Value = value;
        }
        if (title is not null)
        {
            elementDbModel.Title = title;
        }

        await patientDb.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpDelete]
    [Authorize(Roles = "Document_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteElement([FromQuery][StringLength(32)] string guid)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid element_Guid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        Patient_Element_DbModel? elementDbModel = await patientDb.Elements
        .Include(el => el.Document)
        .FirstOrDefaultAsync(el => el.Guid == element_Guid);

        if (elementDbModel is null)
        {
            ModelState.AddModelError("Guid", "Couldn't find any element with the specified guid!");
            return BadRequest(ModelState);
        }

        patientDb.Elements.Remove(elementDbModel);
        await patientDb.SaveChangesAsync();

        //reorder
        Patient_Element_DbModel[] remainedElementsInTab = await patientDb.Elements
        .Where(el =>
            el.Document.Guid == elementDbModel.Document.Guid &&
            el.Tab == elementDbModel.Tab
        )
        .OrderBy(el => el.Order)
        .ToArrayAsync();

        for (int i = 0; i < remainedElementsInTab.Length; i++)
        {
            remainedElementsInTab[i].Order = i;
        }
        await patientDb.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPost]
    [Authorize(Roles = "Document_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DecreaseOrder([FromQuery][StringLength(32)] string guid)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid element_Guid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        Patient_Element_DbModel? elementDbModel = await patientDb.Elements
        .Include(el => el.Document)
        .FirstOrDefaultAsync(el => el.Guid == element_Guid);

        if (elementDbModel is null)
        {
            ModelState.AddModelError("Guid", "Couldn't find any element with the specified guid!");
            return BadRequest(ModelState);
        }

        if (elementDbModel.Order <= 0)
        {
            return Ok(new { success = false });
        }

        Patient_Element_DbModel? previousElement = await patientDb.Elements
        .FirstOrDefaultAsync(el =>
            el.Document.Guid == elementDbModel.Document.Guid &&
            el.Order == (elementDbModel.Order - 1)
        );

        if (previousElement is not null)
        {
            previousElement.Order += 1;
            elementDbModel.Order -= 1;
            await patientDb.SaveChangesAsync();
            return Ok(new { success = true });
        }

        return Ok(new { success = false });

    }

    [HttpPost]
    [Authorize(Roles = "Document_Admins")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> IncreaseOrder([FromQuery][StringLength(32)] string guid)
    {
        if (!Guid.TryParseExact(guid, "N", out Guid element_Guid))
        {
            ModelState.AddModelError("Parse Guid", "Couldn't parse the specified guid!");
            return BadRequest(ModelState);
        }

        Patient_Element_DbModel? elementDbModel = await patientDb.Elements
        .Include(el => el.Document)
        .FirstOrDefaultAsync(el => el.Guid == element_Guid);

        if (elementDbModel is null)
        {
            ModelState.AddModelError("Guid", "Couldn't find any element with the specified guid!");
            return BadRequest(ModelState);
        }

        if (elementDbModel.Order >= 255)
        {
            return Ok(new { success = false });
        }

        Patient_Element_DbModel? nextElement = await patientDb.Elements
        .FirstOrDefaultAsync(el =>
            el.Document.Guid == elementDbModel.Document.Guid &&
            el.Order == (elementDbModel.Order + 1)
        );

        if (nextElement is not null)
        {
            nextElement.Order -= 1;
            elementDbModel.Order += 1;
            await patientDb.SaveChangesAsync();
            return Ok(new { success = true });
        }

        return Ok(new { success = false });

    }



}