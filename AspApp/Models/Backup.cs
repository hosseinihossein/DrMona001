using System.IO.Compression;
using System.Text.Json;
using AspApp.Filters;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AspApp.Models;

public enum StatusEnum
{
    Not_Started,
    Started,
    Completed,
}

public class Backup_Status
{
    public string Generating_Zip_File { get; set; } = StatusEnum.Not_Started.ToString();

    public string Getting_Identity_User_Backup { get; set; } = StatusEnum.Not_Started.ToString();

    public string Getting_Patient_Patient_Backup { get; set; } = StatusEnum.Not_Started.ToString();
    public string Getting_Patient_Document_Backup { get; set; } = StatusEnum.Not_Started.ToString();
    public string Getting_Patient_Element_Backup { get; set; } = StatusEnum.Not_Started.ToString();

    public DateTime Created_At { get; set; } = DateTime.UtcNow;
    public double File_Size { get; set; }
    public string? File_Name { get; set; }
    public bool Ready_To_Download { get; set; } = false;
}
public class Seed_Status
{
    public string Seeding_Identity_User_Db { get; set; } = StatusEnum.Not_Started.ToString();

    public string Seeding_Patient_Patient_Db { get; set; } = StatusEnum.Not_Started.ToString();
    public string Seeding_Patient_Document_Db { get; set; } = StatusEnum.Not_Started.ToString();
    public string Seeding_Patient_Element_Db { get; set; } = StatusEnum.Not_Started.ToString();
}

public class Backup_Process
{
    readonly DirectoryInfo Storage_Directory;
    public readonly DirectoryInfo Backup_Directory;
    public readonly DirectoryInfo Storage_Db_Directory;

    readonly DirectoryInfo Storage_Db_Identity_User;

    readonly DirectoryInfo Storage_Db_Patient_Patient;
    readonly DirectoryInfo Storage_Db_Patient_Document;
    readonly DirectoryInfo Storage_Db_Patient_Element;

    public readonly string Backup_Status_FilePath;
    public readonly string Seed_Status_FilePath;
    public readonly string BackupFileNameWithoutDate = "backup.zip";

    readonly JsonSerializerOptions jsonSerializerOptions = new(JsonSerializerDefaults.General);

    readonly IServiceProvider serviceProvider;

    public Backup_Process(IWebHostEnvironment env, IServiceProvider serviceProvider)
    {
        Storage_Directory = Directory.CreateDirectory(Path.Combine(env.ContentRootPath, "Storage"));
        Backup_Directory = Directory.CreateDirectory(Path.Combine(env.ContentRootPath, "Backup"));
        Storage_Db_Directory = Directory.CreateDirectory(Path.Combine(Storage_Directory.FullName, "DataBase"));

        Storage_Db_Identity_User = Directory.CreateDirectory(Path.Combine(Storage_Db_Directory.FullName, "Identity", "User"));

        Storage_Db_Patient_Patient = Directory.CreateDirectory(Path.Combine(Storage_Db_Directory.FullName, "Patient", "Patient"));
        Storage_Db_Patient_Document = Directory.CreateDirectory(Path.Combine(Storage_Db_Directory.FullName, "Patient", "Document"));
        Storage_Db_Patient_Element = Directory.CreateDirectory(Path.Combine(Storage_Db_Directory.FullName, "Patient", "Element"));

        Backup_Status_FilePath = Path.Combine(Backup_Directory.FullName, "Backup_Status.json");
        Seed_Status_FilePath = Path.Combine(Backup_Directory.FullName, "Seed_Status.json");

        jsonSerializerOptions.Converters.Add(new GuidJsonConverter());

        this.serviceProvider = serviceProvider;
    }

    public void Create_Directories()
    {
        Directory.CreateDirectory(Path.Combine(Storage_Directory.FullName));
        Directory.CreateDirectory(Path.Combine(Backup_Directory.FullName));
        Directory.CreateDirectory(Path.Combine(Storage_Db_Directory.FullName));

        Directory.CreateDirectory(Path.Combine(Storage_Db_Identity_User.FullName));

        Directory.CreateDirectory(Path.Combine(Storage_Db_Patient_Patient.FullName));
        Directory.CreateDirectory(Path.Combine(Storage_Db_Patient_Document.FullName));
        Directory.CreateDirectory(Path.Combine(Storage_Db_Patient_Element.FullName));
    }

    public async Task Generate_Backup_ZipFile()
    {
        //delete old directories
        if (Storage_Db_Directory.Exists)
        {
            Storage_Db_Directory.Delete(true);
        }
        if (Backup_Directory.Exists)
        {
            Backup_Directory.Delete(true);
        }

        //create new directories
        Create_Directories();

        //create new status and save it
        Backup_Status status = new();
        string statusInJson = JsonSerializer.Serialize(status);
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

        //get all dbs backup
        await Get_All_Dbs_Backup();

        //define backup status
        statusInJson = await File.ReadAllTextAsync(Backup_Status_FilePath);
        status = JsonSerializer.Deserialize<Backup_Status>(statusInJson) ?? new();
        DateTime createdAt = status.Created_At;
        string backupFileName = createdAt.ToString("yyyy_MM_dd_HH_mm_ss") + "_" + BackupFileNameWithoutDate;
        status.File_Name = backupFileName;

        //write status
        status.Generating_Zip_File = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

        //zip the Storage directory
        string backupFilePath = Path.Combine(Backup_Directory.FullName, backupFileName);
        ZipFile.CreateFromDirectory(Storage_Directory.FullName, backupFilePath);

        status.Generating_Zip_File = StatusEnum.Completed.ToString();
        FileInfo backupFileInfo = new FileInfo(backupFilePath);//fileInfo needed for fie length
        if (backupFileInfo.Exists)
        {
            status.File_Size = (double)backupFileInfo.Length / 1024;//size in KB
            status.Ready_To_Download = true;
        }
        statusInJson = JsonSerializer.Serialize(status);
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
    }

    public async Task Get_All_Dbs_Backup()
    {
        await Get_Identity_User_Backup();

        await Get_Patient_Patient_Backup();
        await Get_Patient_Document_Backup();
        await Get_Patient_Element_Backup();
    }

    public async Task Get_Identity_User_Backup()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Backup_Status_FilePath);
        Backup_Status status = JsonSerializer.Deserialize<Backup_Status>(statusInJson) ?? new();
        //set new status
        status.Getting_Identity_User_Backup = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            UserManager<Identity_UserDbModel> userManager = scope.ServiceProvider.GetRequiredService<UserManager<Identity_UserDbModel>>();

            await foreach (Identity_UserDbModel user in userManager.Users.AsAsyncEnumerable())
            {
                string[] roles = [.. await userManager.GetRolesAsync(user)];
                Identity_User_SeedModel seedModel = Identity_User_SeedModel.Factory(user, roles);
                string json = JsonSerializer.Serialize(seedModel, jsonSerializerOptions);
                string filePath = Path.Combine(Backup_Identity_User_Directory.FullName, user.UserGuid.ToString("N"));
                await File.WriteAllTextAsync(filePath, json);
            }
        }

        //set new status
        status.Getting_Identity_User_Backup = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
    }
    public async Task Seed_Identity_User_Db()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Seed_Status_FilePath);
        Seed_Status status = JsonSerializer.Deserialize<Seed_Status>(statusInJson) ?? new();
        //set new status
        status.Seeding_Identity_User_Db = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Seed_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            UserManager<Identity_UserDbModel> userManager = scope.ServiceProvider.GetRequiredService<UserManager<Identity_UserDbModel>>();

            foreach (FileInfo fileInfo in Backup_Identity_User_Directory.EnumerateFiles())
            {
                string json = await File.ReadAllTextAsync(fileInfo.FullName);
                Identity_User_SeedModel? seedModel;
                try
                {
                    seedModel = JsonSerializer.Deserialize<Identity_User_SeedModel>(json, jsonSerializerOptions);
                }
                catch (Exception e)
                {
                    //log
                    Console.WriteLine(e.Message);
                    continue;
                }
                if (seedModel is null) continue;

                Identity_UserDbModel user = seedModel.GetDbModel();

                IdentityResult result = await userManager.CreateAsync(user);
                if (result.Succeeded)
                {
                    await userManager.AddToRolesAsync(user, seedModel.Roles);
                }
            }
        }

        //set new status
        status.Seeding_Identity_User_Db = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Seed_Status_FilePath, statusInJson);
    }


    //***************** seed models *****************
    class Identity_User_SeedModel
    {
        public Guid UserGuid { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Description { get; set; }
        public string? ParsswordHash { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool HasImage { get; set; }
        public string[] Roles { get; set; } = [];

        public static Identity_User_SeedModel Factory(Identity_UserDbModel dbModel, string[] roles)
        {
            return new Identity_User_SeedModel()
            {
                CreatedAt = dbModel.CreatedAt,
                Description = dbModel.Description,
                HasImage = dbModel.HasImage,
                ParsswordHash = dbModel.PasswordHash,
                UserGuid = dbModel.UserGuid,
                UserName = dbModel.UserName,
                Roles = roles,
                FullName = dbModel.FullName,
            };
        }

        public Identity_UserDbModel GetDbModel()
        {
            return new Identity_UserDbModel()
            {
                CreatedAt = this.CreatedAt,
                Description = this.Description,
                HasImage = this.HasImage,
                PasswordHash = this.ParsswordHash,
                UserGuid = this.UserGuid,
                UserName = this.UserName,
                FullName = this.FullName,
            };
        }
    }

    class Patient_Patient_SeedModel
    {
        public Guid Guid { get; set; }
        public string NationalId { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public bool HasImage { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Patient_Patient_DbModel GetDbModel()
        {
            return new Patient_Patient_DbModel()
            {
                Guid = this.Guid,
                CreatedAt = this.CreatedAt,
                Description = this.Description,
                FullName = this.FullName,
                HasImage = this.HasImage,
                NationalId = this.NationalId,
            };
        }
    }
    class Patient_Document_SeedModel
    {
        public Guid Guid { get; set; }
        public Guid Patient_Guid { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Patient_Document_DbModel GetDbModel()
        {
            return new Patient_Document_DbModel()
            {
                CreatedAt = this.CreatedAt,
                Guid = this.Guid,
            };
        }
    }
    class Patient_Element_SeedModel
    {
        public Guid Guid { get; set; }
        public Guid Document_Guid { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Tab { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string? Title { get; set; } = null;
        public string? Value { get; set; } = null;
        public string? FileName { get; set; } = null;
        public int Order { get; set; }
        public bool Persian { get; set; } = false;

        public Patient_Element_DbModel GetDbModel()
        {
            return new Patient_Element_DbModel()
            {
                CreatedAt = this.CreatedAt,
                Guid = this.Guid,
                Title = this.Title,
                FileName = this.FileName,
                Order = this.Order,
                Persian = this.Persian,
                Tab = this.Tab,
                Type = this.Type,
                Value = this.Value,
            };
        }
    }



}

