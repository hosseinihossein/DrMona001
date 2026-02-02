import { Component } from '@angular/core';

@Component({
  selector: 'app-patient-profile',
  imports: [],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile {

}

export class Patient_ProfileModel
{
  constructor(patientModel?:Patient_ProfileModel){
    this.guid = patientModel?.guid ?? "";
    this.nationalId = patientModel?.nationalId ?? "";
    this.fullName = patientModel?.fullName;
    this.description = patientModel?.description;
    this.hasImage = patientModel?.hasImage ?? false;
    this.integrityVersion = patientModel?.integrityVersion ?? 0;
  }
  guid: string;
  nationalId: string;
  fullName?: string|null;
  description?: string|null;
  hasImage:boolean;
  integrityVersion:number;
}
