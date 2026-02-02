import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { NgOptimizedImage } from "@angular/common";
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../patient/patient-service';
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'app-patient-list',
  imports: [MatDialogModule, NgOptimizedImage, MatIcon, RouterLink, MatButton, ReactiveFormsModule, 
    MatCardModule,
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientList {
  readonly data = inject<{
    label:string,
    patients:Patient_ListModel[]
  }>(MAT_DIALOG_DATA);

  patientService = inject(PatientService);

  constructor(){
    if(!this.data.label){
      this.data.label = "List";
    }
  }

}

export class Patient_ListModel
{
  constructor(personModel?:Partial<Patient_ListModel>){
    this.guid = personModel?.guid ?? "";
    this.nationalId = personModel?.nationalId ?? "";
    this.fullName = personModel?.fullName;
    this.hasImage = personModel?.hasImage ?? false;
    this.integrityVersion = personModel?.integrityVersion ?? 0;
  }
  guid: string;
  nationalId: string;
  fullName?: string|null;
  hasImage:boolean;
  integrityVersion:number;
}
