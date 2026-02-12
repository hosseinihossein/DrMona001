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
    public string Process { get; set; } = StatusEnum.Not_Started.ToString();

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
public class Restore_Status
{
    public string? Backup_File_Name { get; set; }

    public string Process { get; set; } = StatusEnum.Not_Started.ToString();

    public string Extracting_Zip_File { get; set; } = StatusEnum.Not_Started.ToString();

    public string Clearing_All_Dbs { get; set; } = StatusEnum.Not_Started.ToString();

    public string Seeding_Identity_User_Db { get; set; } = StatusEnum.Not_Started.ToString();

    public string Seeding_Patient_Patient_Db { get; set; } = StatusEnum.Not_Started.ToString();
    public string Seeding_Patient_Document_Db { get; set; } = StatusEnum.Not_Started.ToString();
    public string Seeding_Patient_Element_Db { get; set; } = StatusEnum.Not_Started.ToString();

    //public bool Restore_Completed { get; set; } = false;
}

public class Backup_Process
{
    public readonly DirectoryInfo Storage_Directory;
    public readonly DirectoryInfo Backup_Directory;
    public readonly DirectoryInfo Storage_Db_Directory;

    readonly DirectoryInfo Storage_Db_Identity_User;

    readonly DirectoryInfo Storage_Db_Patient_Patient;
    readonly DirectoryInfo Storage_Db_Patient_Document;
    readonly DirectoryInfo Storage_Db_Patient_Element;

    public readonly string Backup_Status_FilePath;
    public readonly string Restore_Status_FilePath;
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
        Restore_Status_FilePath = Path.Combine(Backup_Directory.FullName, "Seed_Status.json");

        jsonSerializerOptions.Converters.Add(new GuidJsonConverter());

        this.serviceProvider = serviceProvider;
    }

    public void Create_Directories()
    {
        Directory.CreateDirectory(Storage_Directory.FullName);
        Directory.CreateDirectory(Backup_Directory.FullName);
        Directory.CreateDirectory(Storage_Db_Directory.FullName);

        Directory.CreateDirectory(Storage_Db_Identity_User.FullName);

        Directory.CreateDirectory(Storage_Db_Patient_Patient.FullName);
        Directory.CreateDirectory(Storage_Db_Patient_Document.FullName);
        Directory.CreateDirectory(Storage_Db_Patient_Element.FullName);
    }

    public async Task Generate_Backup_ZipFile()
    {
        try
        {
            //create new status and save it
            Backup_Status status = new();
            status.Process = StatusEnum.Started.ToString();
            string statusInJson = JsonSerializer.Serialize(status);
            await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

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
        catch (Exception e)
        {
            //log
            Console.WriteLine(e.Message);

            string json = await System.IO.File.ReadAllTextAsync(Backup_Status_FilePath);
            Backup_Status? status = JsonSerializer.Deserialize<Backup_Status>(json);
            status ??= new();
            status.Process = StatusEnum.Completed.ToString();

            string statusInJson = JsonSerializer.Serialize(status);
            await System.IO.File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
        }
    }
    public async Task Restore_From_Backup_ZipFile()
    {
        try
        {
            //create new status and save it
            Restore_Status status = new();
            status.Process = StatusEnum.Started.ToString();
            string statusInJson = JsonSerializer.Serialize(status);
            await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

            FileInfo[] backupZipFiles = Backup_Directory.GetFiles($"*_{BackupFileNameWithoutDate}");
            if (backupZipFiles.Length == 0) throw new Exception("Can not find any backup file trailing with '_backup.zip'!");
            FileInfo? backupZipFile = null;
            if (backupZipFiles.Length == 1)
            {
                backupZipFile = backupZipFiles[0];
            }
            else
            {
                backupZipFile = backupZipFiles.MaxBy(f => f.CreationTimeUtc);
            }
            if (backupZipFile is null) throw new Exception("'backupZipFile' can Not be null!");

            //delete old storage directory
            if (Storage_Directory.Exists)
            {
                Storage_Directory.Delete(true);
            }

            //create new Storage directory
            Directory.CreateDirectory(Storage_Directory.FullName);

            //extracting started
            status.Extracting_Zip_File = StatusEnum.Started.ToString();
            statusInJson = JsonSerializer.Serialize(status);
            await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

            //extract backk zip file to storage directory
            ZipFile.ExtractToDirectory(backupZipFile.FullName, Storage_Directory.FullName);

            //set extracting zip file to completed
            status.Extracting_Zip_File = StatusEnum.Completed.ToString();
            status.Clearing_All_Dbs = StatusEnum.Started.ToString();
            statusInJson = JsonSerializer.Serialize(status);
            await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

            //clear all Dbs
            using (IServiceScope scope = serviceProvider.CreateScope())
            {
                //delete all isentity users
                UserManager<Identity_UserDbModel> userManager = scope.ServiceProvider.GetRequiredService<UserManager<Identity_UserDbModel>>();
                await userManager.Users.Where(u => u.UserName != "admin").ExecuteDeleteAsync();

                //delete all patient patients
                Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();
                await patientDb.Patients.ExecuteDeleteAsync();
                //delete all patient documents
                await patientDb.Documents.ExecuteDeleteAsync();
                //delete all patient elements
                await patientDb.Elements.ExecuteDeleteAsync();
            }

            //status
            status.Clearing_All_Dbs = StatusEnum.Completed.ToString();
            statusInJson = JsonSerializer.Serialize(status);
            await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

            //seed all databases
            await Seed_All_Dbs();

            //status
            //status.Restore_Completed = true;
            status.Process = StatusEnum.Completed.ToString();
            statusInJson = JsonSerializer.Serialize(status);
            await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);
        }
        catch (Exception e)
        {
            //log
            Console.WriteLine(e.Message);

            string json = await System.IO.File.ReadAllTextAsync(Restore_Status_FilePath);
            Restore_Status? status = JsonSerializer.Deserialize<Restore_Status>(json);
            status ??= new();
            status.Process = StatusEnum.Completed.ToString();

            string statusInJson = JsonSerializer.Serialize(status);
            await System.IO.File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);
        }
    }

    private async Task Get_All_Dbs_Backup()
    {
        await Get_Identity_User_Backup();

        await Get_Patient_Patient_Backup();
        await Get_Patient_Document_Backup();
        await Get_Patient_Element_Backup();
    }
    private async Task Seed_All_Dbs()
    {
        await Seed_Identity_User_Db();

        await Seed_Patient_Patient_Db();
        await Seed_Patient_Document_Db();
        await Seed_Patient_Element_Db();
    }

    private async Task Get_Identity_User_Backup()
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

            int bunchIndex = 0;
            int bunchSize = 1000;
            while (true)
            {
                List<Identity_UserDbModel> users = await userManager.Users
                .OrderBy(u => u.Id)
                .Skip(bunchIndex * bunchSize)
                .Take(bunchSize)
                .ToListAsync();

                if (users.Count == 0) break;

                List<Identity_User_SeedModel> list = [];
                foreach (Identity_UserDbModel user in users)
                {
                    string[] roles = [.. await userManager.GetRolesAsync(user)];
                    list.Add(Identity_User_SeedModel.Factory(user, roles));
                }

                string json = JsonSerializer.Serialize(list, jsonSerializerOptions);
                string filePath = Path.Combine(Storage_Db_Identity_User.FullName, $"list_{bunchIndex}.json");
                await File.WriteAllTextAsync(filePath, json);

                if (users.Count < bunchSize) break;

                bunchIndex++;
            }
        }

        //set new status
        status.Getting_Identity_User_Backup = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
    }
    private async Task Seed_Identity_User_Db()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Restore_Status_FilePath);
        Restore_Status status = JsonSerializer.Deserialize<Restore_Status>(statusInJson) ?? new();
        //set new status
        status.Seeding_Identity_User_Db = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            UserManager<Identity_UserDbModel> userManager = scope.ServiceProvider.GetRequiredService<UserManager<Identity_UserDbModel>>();

            foreach (FileInfo fileInfo in Storage_Db_Identity_User.EnumerateFiles())
            {
                string json = await File.ReadAllTextAsync(fileInfo.FullName);
                List<Identity_User_SeedModel>? seedModel_List;
                try
                {
                    seedModel_List = JsonSerializer.Deserialize<List<Identity_User_SeedModel>>(json, jsonSerializerOptions);
                }
                catch (Exception e)
                {
                    //log
                    Console.WriteLine(e.Message);
                    continue;
                }
                if (seedModel_List is null) continue;

                foreach (Identity_User_SeedModel seedModel in seedModel_List)
                {
                    Identity_UserDbModel user = seedModel.GetDbModel();

                    if (user.UserName == "admin") continue;

                    IdentityResult result = await userManager.CreateAsync(user);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRolesAsync(user, seedModel.Roles);
                    }
                }
            }
        }

        //set new status
        status.Seeding_Identity_User_Db = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);
    }

    private async Task Get_Patient_Patient_Backup()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Backup_Status_FilePath);
        Backup_Status status = JsonSerializer.Deserialize<Backup_Status>(statusInJson) ?? new();
        //set new status
        status.Getting_Patient_Patient_Backup = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();

            int bunchIndex = 0;
            int bunchSize = 1000;
            while (true)
            {
                List<Patient_Patient_SeedModel> list = await patientDb.Patients
                .OrderBy(p => p.Id)
                .Skip(bunchIndex * bunchSize)
                .Take(bunchSize)
                .Select(p => new Patient_Patient_SeedModel()
                {
                    CreatedAt = p.CreatedAt,
                    Description = p.Description,
                    FullName = p.FullName,
                    Guid = p.Guid,
                    HasImage = p.HasImage,
                    NationalId = p.NationalId,
                })
                .ToListAsync();

                if (list.Count == 0) break;

                string json = JsonSerializer.Serialize(list, jsonSerializerOptions);
                string filePath = Path.Combine(Storage_Db_Patient_Patient.FullName, $"list_{bunchIndex}.json");
                await File.WriteAllTextAsync(filePath, json);

                if (list.Count < bunchSize) break;

                bunchIndex++;
            }
        }

        //set new status
        status.Getting_Patient_Patient_Backup = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
    }
    private async Task Seed_Patient_Patient_Db()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Restore_Status_FilePath);
        Restore_Status status = JsonSerializer.Deserialize<Restore_Status>(statusInJson) ?? new();
        //set new status
        status.Seeding_Patient_Patient_Db = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();

            foreach (FileInfo fileInfo in Storage_Db_Patient_Patient.EnumerateFiles())
            {
                string json = await File.ReadAllTextAsync(fileInfo.FullName);
                List<Patient_Patient_SeedModel>? seedModel_List;
                try
                {
                    seedModel_List = JsonSerializer.Deserialize<List<Patient_Patient_SeedModel>>(json, jsonSerializerOptions);
                }
                catch (Exception e)
                {
                    //log
                    Console.WriteLine(e.Message);
                    continue;
                }
                if (seedModel_List is null) continue;

                List<Patient_Patient_DbModel> patients = [];
                foreach (Patient_Patient_SeedModel seedModel in seedModel_List)
                {
                    patients.Add(seedModel.GetDbModel());
                }

                patientDb.Patients.AddRange(patients);
                await patientDb.SaveChangesAsync();
            }
        }

        //set new status
        status.Seeding_Patient_Patient_Db = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);
    }

    private async Task Get_Patient_Document_Backup()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Backup_Status_FilePath);
        Backup_Status status = JsonSerializer.Deserialize<Backup_Status>(statusInJson) ?? new();
        //set new status
        status.Getting_Patient_Document_Backup = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();

            int bunchIndex = 0;
            int bunchSize = 1000;
            while (true)
            {
                List<Patient_Document_SeedModel> list = await patientDb.Documents
                .OrderBy(d => d.Id)
                .Skip(bunchIndex * bunchSize)
                .Take(bunchSize)
                .Select(d => new Patient_Document_SeedModel()
                {
                    CreatedAt = d.CreatedAt,
                    Guid = d.Guid,
                    Patient_Guid = d.Patient.Guid,
                })
                .AsSplitQuery()
                .ToListAsync();

                if (list.Count == 0) break;

                string json = JsonSerializer.Serialize(list, jsonSerializerOptions);
                string filePath = Path.Combine(Storage_Db_Patient_Document.FullName, $"list_{bunchIndex}.json");
                await File.WriteAllTextAsync(filePath, json);

                if (list.Count < bunchSize) break;

                bunchIndex++;
            }
        }

        //set new status
        status.Getting_Patient_Document_Backup = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
    }
    private async Task Seed_Patient_Document_Db()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Restore_Status_FilePath);
        Restore_Status status = JsonSerializer.Deserialize<Restore_Status>(statusInJson) ?? new();
        //set new status
        status.Seeding_Patient_Document_Db = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();

            foreach (FileInfo fileInfo in Storage_Db_Patient_Document.EnumerateFiles())
            {
                string json = await File.ReadAllTextAsync(fileInfo.FullName);
                List<Patient_Document_SeedModel>? seedModel_List;
                try
                {
                    seedModel_List = JsonSerializer.Deserialize<List<Patient_Document_SeedModel>>(json, jsonSerializerOptions);
                }
                catch (Exception e)
                {
                    //log
                    Console.WriteLine(e.Message);
                    continue;
                }
                if (seedModel_List is null) continue;

                List<Patient_Document_DbModel> documents = [];
                foreach (Patient_Document_SeedModel seedModel in seedModel_List)
                {
                    Patient_Document_DbModel document = seedModel.GetDbModel();

                    Patient_Patient_DbModel? parentPatient = await patientDb.Patients
                    .FirstOrDefaultAsync(p => p.Guid == seedModel.Patient_Guid);
                    if (parentPatient is null)
                    {
                        //log
                        Console.WriteLine($"couldn't the specified find parent patient! parent patient guid = {seedModel.Patient_Guid}");
                        continue;
                    }

                    document.Patient = parentPatient;
                    documents.Add(document);
                }

                patientDb.Documents.AddRange(documents);
                await patientDb.SaveChangesAsync();
            }
        }

        //set new status
        status.Seeding_Patient_Document_Db = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);
    }

    private async Task Get_Patient_Element_Backup()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Backup_Status_FilePath);
        Backup_Status status = JsonSerializer.Deserialize<Backup_Status>(statusInJson) ?? new();
        //set new status
        status.Getting_Patient_Element_Backup = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();

            int bunchIndex = 0;
            int bunchSize = 1000;
            while (true)
            {
                List<Patient_Element_SeedModel> list = await patientDb.Elements
                .OrderBy(el => el.Id)
                .Skip(bunchIndex * bunchSize)
                .Take(bunchSize)
                .Select(el => new Patient_Element_SeedModel()
                {
                    CreatedAt = el.CreatedAt,
                    Guid = el.Guid,
                    Document_Guid = el.Document.Guid,
                    FileName = el.FileName,
                    Order = el.Order,
                    Persian = el.Persian,
                    Tab = el.Tab,
                    Title = el.Title,
                    Type = el.Type,
                    Value = el.Value,
                })
                .AsSplitQuery()
                .ToListAsync();

                if (list.Count == 0) break;

                string json = JsonSerializer.Serialize(list, jsonSerializerOptions);
                string filePath = Path.Combine(Storage_Db_Patient_Element.FullName, $"list_{bunchIndex}.json");
                await File.WriteAllTextAsync(filePath, json);

                if (list.Count < bunchSize) break;

                bunchIndex++;
            }
        }

        //set new status
        status.Getting_Patient_Element_Backup = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Backup_Status_FilePath, statusInJson);
    }
    private async Task Seed_Patient_Element_Db()
    {
        //define backup status
        string statusInJson = await File.ReadAllTextAsync(Restore_Status_FilePath);
        Restore_Status status = JsonSerializer.Deserialize<Restore_Status>(statusInJson) ?? new();
        //set new status
        status.Seeding_Patient_Element_Db = StatusEnum.Started.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);

        using (IServiceScope scope = serviceProvider.CreateScope())
        {
            Patient_DbContext patientDb = scope.ServiceProvider.GetRequiredService<Patient_DbContext>();

            foreach (FileInfo fileInfo in Storage_Db_Patient_Element.EnumerateFiles())
            {
                string json = await File.ReadAllTextAsync(fileInfo.FullName);
                List<Patient_Element_SeedModel>? seedModel_List;
                try
                {
                    seedModel_List = JsonSerializer.Deserialize<List<Patient_Element_SeedModel>>(json, jsonSerializerOptions);
                }
                catch (Exception e)
                {
                    //log
                    Console.WriteLine(e.Message);
                    continue;
                }
                if (seedModel_List is null) continue;

                List<Patient_Element_DbModel> elements = [];
                foreach (Patient_Element_SeedModel seedModel in seedModel_List)
                {
                    Patient_Element_DbModel element = seedModel.GetDbModel();

                    Patient_Document_DbModel? parentDocument = await patientDb.Documents
                    .FirstOrDefaultAsync(d => d.Guid == seedModel.Document_Guid);
                    if (parentDocument is null)
                    {
                        //log
                        Console.WriteLine($"couldn't the specified find parent document! parent document guid = {seedModel.Document_Guid}");
                        continue;
                    }

                    element.Document = parentDocument;
                    elements.Add(element);
                }

                patientDb.Elements.AddRange(elements);
                await patientDb.SaveChangesAsync();
            }
        }

        //set new status
        status.Seeding_Patient_Element_Db = StatusEnum.Completed.ToString();
        statusInJson = JsonSerializer.Serialize(status);
        //write status
        await File.WriteAllTextAsync(Restore_Status_FilePath, statusInJson);
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



