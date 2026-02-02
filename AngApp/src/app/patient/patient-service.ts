import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Patient_ListModel } from '../dialogs/patient-list/patient-list';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private httpClient = inject(HttpClient);

  getPatientImageAddress(patientModel:{guid:string, integrityVersion:number, hasImage:boolean}|null):string|null{
    if(patientModel?.hasImage && patientModel.guid){
      return `/api/Patient/PatientImage?guid=${patientModel.guid}&v=${patientModel.integrityVersion}`;
    }
    return null;
  }

  searchPatients(name:string|null,nationalId:string|null){
    let httpParams = new HttpParams();
    if(name){
      httpParams = httpParams.set("name",name);
    }
    if(nationalId){
      httpParams = httpParams.set("nationalId",nationalId);
    }
    return this.httpClient.get<Patient_ListModel[]>(
      "/api/Patient/PatientList",{params:httpParams}
    );
  }


}

