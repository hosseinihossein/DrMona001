import { Component } from '@angular/core';

@Component({
  selector: 'app-restore',
  imports: [],
  templateUrl: './restore.html',
  styleUrl: './restore.css',
})
export class Restore {

}

export class RestoreStatus {
  Process:string = null!;
  Extracting_Zip_File:string = null!;
  Clearing_All_Dbs:string = null!;
  Seeding_Identity_User_Db:string = null!;
  Seeding_Patient_Patient_Db:string = null!;
  Seeding_Patient_Document_Db:string = null!;
  Seeding_Patient_Element_Db:string = null!;
}
