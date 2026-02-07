
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

//************************* Db Models **************************
public class Patient_Patient_DbModel
{
    [Key]
    public int Id { get; set; }
    public Guid Guid { get; set; } = Guid.NewGuid();
    [MaxLength(10)]
    public string NationalId { get; set; } = string.Empty;
    [MaxLength(128)]
    public string FullName { get; set; } = string.Empty;
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;
    public bool HasImage { get; set; } = false;
    public byte _integrityVersion { get; set; } = 0;
    [NotMapped]
    public int IntegrityVersion
    {
        get => _integrityVersion;
        set => _integrityVersion = value > 255 || value < 0 ? (byte)0 : (byte)value;
    }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Patient_Document_DbModel> Documents { get; set; } = [];
}
public class Patient_Document_DbModel
{
    [Key]
    public int Id { get; set; }
    public Guid Guid { get; set; } = Guid.NewGuid();
    public Patient_Patient_DbModel Patient { get; set; } = null!;
    public ICollection<Patient_Element_DbModel> Elements { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public class Patient_Element_DbModel
{
    [Key]
    public int Id { get; set; }
    public Guid Guid { get; set; } = Guid.NewGuid();
    public Patient_Document_DbModel Document { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(32)]
    public string Tab { get; set; } = string.Empty;
    [MaxLength(32)]
    public string Type { get; set; } = string.Empty;
    [MaxLength(4000)]
    public string? Value { get; set; }
    [MaxLength(128)]
    public string? Title { get; set; }
    [MaxLength(64)]
    public string? FileName { get; set; }
    public byte _order { get; set; } = 0;
    [NotMapped]
    public int Order
    {
        get => _order;
        set => _order = value > 255 || value < 0 ? (byte)0 : (byte)value;
    }
    public bool Persian { get; set; } = false;
}
//**************************************************************

public class Patient_DbContext : DbContext
{
    public Patient_DbContext(DbContextOptions<Patient_DbContext> options) : base(options) { }

    public DbSet<Patient_Patient_DbModel> Patients { get; set; }
    public DbSet<Patient_Document_DbModel> Documents { get; set; }
    public DbSet<Patient_Element_DbModel> Elements { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //********** Relationships **********
        //***** patient *****
        modelBuilder.Entity<Patient_Patient_DbModel>()
        .HasMany(p => p.Documents)
        .WithOne(d => d.Patient)
        .IsRequired(true);

        //***** document *****
        modelBuilder.Entity<Patient_Document_DbModel>()
        .HasMany(d => d.Elements)
        .WithOne(el => el.Document)
        .IsRequired(true);

        //********** Index columns **********
        //***** patient *****
        modelBuilder.Entity<Patient_Patient_DbModel>()
        .HasIndex(p => p.Guid)
        .IsUnique(true);
        modelBuilder.Entity<Patient_Patient_DbModel>()
        .HasIndex(p => p.NationalId);
        modelBuilder.Entity<Patient_Patient_DbModel>()
        .HasIndex(p => p.FullName);
        modelBuilder.Entity<Patient_Patient_DbModel>()
        .HasIndex(p => p.CreatedAt);

        //***** document *****
        modelBuilder.Entity<Patient_Document_DbModel>()
        .HasIndex(d => d.Guid)
        .IsUnique(true);
        modelBuilder.Entity<Patient_Document_DbModel>()
        .HasIndex(d => d.CreatedAt);

        //***** element *****
        modelBuilder.Entity<Patient_Element_DbModel>()
        .HasIndex(el => el.Guid)
        .IsUnique(true);
        modelBuilder.Entity<Patient_Element_DbModel>()
        .HasIndex(el => el.CreatedAt);
        modelBuilder.Entity<Patient_Element_DbModel>()
        .HasIndex(el => el.Order);
        modelBuilder.Entity<Patient_Element_DbModel>()
        .HasIndex(el => el.Tab);
    }
}

//************************** Process ***************************
public class Patient_Process
{
    public readonly DirectoryInfo Storage_Patients;
    public readonly DirectoryInfo Storage_Elements;

    public Patient_Process(IWebHostEnvironment env)
    {
        Storage_Patients = Directory.CreateDirectory(Path.Combine(env.ContentRootPath, "Storage", "Patient", "Patients"));
        Storage_Elements = Directory.CreateDirectory(Path.Combine(env.ContentRootPath, "Storage", "Patient", "Elements"));
    }
}

//**************************************************************
//************************ View Models *************************
public class Patient_Patient_ViewModel
{
    public Guid Guid { get; set; }
    public required string NationalId { get; set; }
    public required string FullName { get; set; }
    public string? Description { get; set; }
    public bool HasImage { get; set; }
    public int IntegrityVersion { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class Patient_PatientList_ViewModel
{
    public Guid Guid { get; set; }
    public required string NationalId { get; set; }
    public required string FullName { get; set; }
    public bool HasImage { get; set; }
    public int IntegrityVersion { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Patient_Element_ViewModel
{
    public Guid Guid { get; set; }
    public string Tab { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Title { get; set; }
    public int Order { get; set; }
    public bool Persian { get; set; }
    public string? FileName { get; set; }
}
public class Patient_Tab_ViewModel
{
    public string Name { get; set; } = string.Empty;
    public Patient_Element_ViewModel[] Elements { get; set; } = [];
}
public class Patient_DocumentPage_ViewModel
{
    public Guid Guid { get; set; }
    public Guid PatientGuid { get; set; }
    public Patient_Tab_ViewModel[] Tabs { get; set; } = [];
}

//**************************************************************
//************************ Form Models *************************
public class Patient_PatientImage_FormModel
{
    public Guid Guid { get; set; }
    public required IFormFile Image { get; set; }
}

public class Patient_NewElement_FormModel
{
    public Guid DocumentGuid { get; set; }
    [StringLength(32)]
    public required string Tab { get; set; }
    [StringLength(32)]
    public required string Type { get; set; }
    [StringLength(4000)]
    public string? Value { get; set; }
    [StringLength(128)]
    public string? Title { get; set; }
    public IFormFile? File { get; set; }
    public bool? Persian { get; set; }
}

//**************************************************************

