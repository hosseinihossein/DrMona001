using System.Text.Json;
using AspApp.Filters;
using AspApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspApp.ControllersApi;

[ApiController]
[Route("api/[controller]/[action]")]
public class BackupController : ControllerBase
{
    readonly Backup_Process backupProcess;
    readonly UploadLargeFile uploadLargeFile;

    public BackupController(Backup_Process backupProcess, UploadLargeFile uploadLargeFile)
    {
        this.backupProcess = backupProcess;
        this.uploadLargeFile = uploadLargeFile;
    }





    [HttpGet]
    [Authorize(Roles = "Backup_Admins")]
    public async Task<IActionResult> GetBackupStatus()
    {
        Backup_Status? status = null;
        if (System.IO.File.Exists(backupProcess.Backup_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Backup_Status_FilePath);
            try
            {
                status = JsonSerializer.Deserialize<Backup_Status>(json);
            }
            catch (Exception e)
            {
                //log
                Console.WriteLine(e.Message);
            }
        }
        status ??= new();
        return Ok(status);
    }

    [HttpGet]
    [Authorize(Roles = "Backup_Admins")]
    public async Task<IActionResult> DownloadBackupFile()
    {
        Backup_Status? status = null;
        if (System.IO.File.Exists(backupProcess.Backup_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Backup_Status_FilePath);
            status = JsonSerializer.Deserialize<Backup_Status>(json);
        }
        if (status is null)
        {
            return BadRequest("status file not found!");
        }
        if (status.File_Name is null)
        {
            return BadRequest("file name can not be null!");
        }
        if (status.Process != "Completed")
        {
            return BadRequest("backup process is not completed yet!");
        }
        if (!status.Ready_To_Download)
        {
            return BadRequest("Not ready to download!");
        }

        string backupFilePath = Path.Combine(backupProcess.Backup_Directory.FullName, status.File_Name);
        if (System.IO.File.Exists(backupFilePath))
        {
            /*In ASP.NET Core, when you return a file using PhysicalFile, File, or FileContentResult, 
            the framework automatically sets the Content-Disposition header to attachment if 
            you pass a fileDownloadName.*/
            /*
            Content-Disposition: inline; Display the content in the browser.
            Content-Disposition: attachment; Prompt the user to download the file.
            */
            return PhysicalFile(backupFilePath, "application/octet-stream", status.File_Name, true);
        }
        return NotFound();
    }

    [HttpGet]
    [Authorize(Roles = "Backup_Admins")]
    public async Task<IActionResult> GenerateBackupFile()
    {
        Backup_Status? backupStatus = null;
        if (System.IO.File.Exists(backupProcess.Backup_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Backup_Status_FilePath);
            backupStatus = JsonSerializer.Deserialize<Backup_Status>(json);
        }
        if (backupStatus is not null && backupStatus.Process == "Started")
        {
            return BadRequest("last backup process is not completed yet!");
        }

        Restore_Status? restoreStatus = null;
        if (System.IO.File.Exists(backupProcess.Restore_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Restore_Status_FilePath);
            restoreStatus = JsonSerializer.Deserialize<Restore_Status>(json);
        }
        if (restoreStatus is not null && restoreStatus.Process == "Started")
        {
            return BadRequest("last restore process is not completed yet!");
        }

        _ = backupProcess.Generate_Backup_ZipFile();

        return Ok();
    }

    [HttpDelete]
    [Authorize(Roles = "Backup_Admins")]
    public async Task<IActionResult> DeleteBackupFile()
    {
        Backup_Status? status = null;
        if (System.IO.File.Exists(backupProcess.Backup_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Backup_Status_FilePath);
            status = JsonSerializer.Deserialize<Backup_Status>(json);
        }
        if (status is not null && status.Process == "Started")
        {
            return BadRequest("last backup process is not completed yet!");
        }

        if (backupProcess.Storage_Db_Directory.Exists)
        {
            try
            {
                backupProcess.Storage_Db_Directory.Delete(true);
            }
            catch (Exception e)
            {
                //log
                Console.WriteLine($"\n     ***** couldn't delete directory {backupProcess.Storage_Db_Directory.FullName} *****");
                Console.WriteLine(e.Message);
            }
        }

        if (backupProcess.Backup_Directory.Exists)
        {
            try
            {
                backupProcess.Backup_Directory.Delete(true);
            }
            catch (Exception e)
            {
                //log
                Console.WriteLine($"\n     ***** couldn't delete directory {backupProcess.Backup_Directory.FullName} *****");
                Console.WriteLine(e.Message);
            }
        }

        return Ok();
    }




    //***** restore *****
    [HttpGet]
    [Authorize(Roles = "Backup_Admins")]
    public async Task<IActionResult> GetRestoreStatus()
    {
        Restore_Status? status = null;
        if (System.IO.File.Exists(backupProcess.Restore_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Restore_Status_FilePath);
            try
            {
                status = JsonSerializer.Deserialize<Restore_Status>(json);
            }
            catch (Exception e)
            {
                //log
                Console.WriteLine(e.Message);
            }
        }
        status ??= new();
        return Ok(status);
    }

    [HttpPost]
    [Authorize(Roles = "Backup_Admins")]
    [DisableRequestSizeLimit]
    [DisableModelBinding]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UploadBackupFile()
    {
        /*Backup_Restore_FormModel*/
        object? formModel = null;//new();
        List<string> uploadingFormFileNames = ["File"];
        var uploadLargeFile_Model = await uploadLargeFile.GetFormModelAndLargeFiles(HttpContext, formModel,
        uploadingFormFileNames, this);

        //string fileGuid = uploadLargeFile_Model.UploadedFileGuid;
        FileInfo fileTempPathFileInfo =
        new FileInfo(uploadLargeFile_Model.FormFileNameFullName["File"]);
        string fileName = fileTempPathFileInfo.Name;

        if (!uploadLargeFile_Model.IsSuccessful)
        {
            if (fileTempPathFileInfo.Exists)
            {
                fileTempPathFileInfo.Directory?.Delete(true);
            }

            foreach (var kv in uploadLargeFile_Model.ErrorDescription)
            {
                ModelState.AddModelError(kv.Key, kv.Value);
            }
            return BadRequest(ModelState);
        }

        if (!uploadLargeFile_Model.FormFileNameFullName.ContainsKey("File") ||
        string.IsNullOrWhiteSpace(uploadLargeFile_Model.FormFileNameFullName["File"]))
        {
            ModelState.AddModelError("File", "File is required!");
            return BadRequest(ModelState);
        }

        var fileDirInfo = Directory.CreateDirectory(
            Path.Combine(backupProcess.Backup_Directory.FullName)
        );

        string fileMainPath = Path.Combine(fileDirInfo.FullName, fileName);
        if (fileTempPathFileInfo.Exists)
        {
            System.IO.File.Move(fileTempPathFileInfo.FullName, fileMainPath);
        }
        else
        {
            ModelState.AddModelError("temp file", "Can not find temp file!");
            return BadRequest(ModelState);
        }

        fileTempPathFileInfo.Directory?.Delete(true);

        //create new status and save it
        Backup_Status status = new();
        status.Process = StatusEnum.Completed.ToString();
        status.Ready_To_Download = true;
        status.File_Name = fileName;
        status.File_Size = (double)new FileInfo(fileMainPath).Length / 1024;//KB
        string statusInJson = JsonSerializer.Serialize(status);
        await System.IO.File.WriteAllTextAsync(backupProcess.Backup_Status_FilePath, statusInJson);

        return Ok(new { success = true });
    }

    [HttpGet]
    [Authorize(Roles = "Backup_Admins")]
    public async Task<IActionResult> RestoreFromBackup()
    {
        Backup_Status? backupStatus = null;
        if (System.IO.File.Exists(backupProcess.Backup_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Backup_Status_FilePath);
            backupStatus = JsonSerializer.Deserialize<Backup_Status>(json);
        }
        if (backupStatus is not null && backupStatus.Process == "Started")
        {
            return BadRequest("last backup process is not completed yet!");
        }

        Restore_Status? restoreStatus = null;
        if (System.IO.File.Exists(backupProcess.Restore_Status_FilePath))
        {
            string json = await System.IO.File.ReadAllTextAsync(backupProcess.Restore_Status_FilePath);
            restoreStatus = JsonSerializer.Deserialize<Restore_Status>(json);
        }
        if (restoreStatus is not null && restoreStatus.Process == "Started")
        {
            return BadRequest("last restore process is not completed yet!");
        }

        _ = backupProcess.Restore_From_Backup_ZipFile();

        return Ok();
    }


}