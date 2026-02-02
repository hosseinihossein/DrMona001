import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Patient_ProfileModel } from './patient-profile/patient-profile';
import { Patient_PatientListModel } from './admin/patient-list/patient-list';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private httpClient = inject(HttpClient);

  requestPatientModel(guid:string){
    let httpParams = new HttpParams().set("guid",guid);
    return this.httpClient.get<Patient_ProfileModel>(
      "/api/Patient/GetPatientModel",{params:httpParams}
    );
  }

  getPatientImageAddress(patientModel:{guid:string, integrityVersion:number, hasImage:boolean}|null):string|null{
    if(patientModel?.hasImage && patientModel.guid){
      return `/api/Patient/PatientImage?guid=${patientModel.guid}&v=${patientModel.integrityVersion}`;
    }
    return null;
  }
  requestPatientList(pageIndex:number=0,pageSize:number=50){
    
  }

  searchPatients(name:string|null,nationalId:string|null){
    let httpParams = new HttpParams();
    if(name){
      httpParams = httpParams.set("name",name);
    }
    if(nationalId){
      httpParams = httpParams.set("nationalId",nationalId);
    }
    return this.httpClient.get<Patient_PatientListModel[]>(
      "/api/Patient/PatientList",{params:httpParams}
    );
  }

  requestCreateNewPatient(fullName:string,nationalId:string){
    let httpParams = new HttpParams();
    httpParams = httpParams.set("fullName",fullName);
    httpParams = httpParams.set("nationalId",nationalId);
    return this.httpClient.post<{success:boolean,guid:string}>(
      "/api/Patient/CreateNewPatient",null,{params:httpParams}
    );
  }

  requestChangeNationalId(guid:string, nationalId:string){
    let httpParams = new HttpParams().set("nationalId",nationalId);
    httpParams = httpParams.set("guid",guid);
    return this.httpClient.post<{success:boolean}>(
      `/api/Patient/SubmitNationalId`, null,{params:httpParams}
    );
  }
  requestChangeFullName(guid:string, fullName:string){
    let httpParams = new HttpParams().set("fullName",fullName);
    httpParams = httpParams.set("guid",guid);
    return this.httpClient.post<{success:boolean}>(
      `/api/Patient/SubmitFullName`, null,{params:httpParams}
    );
  }
  requestChangeDescription(guid:string, description:string){
    let httpParams = new HttpParams().set("description",description);
    httpParams = httpParams.set("guid",guid);
    return this.httpClient.post<{success:boolean}>(
      `/api/Patient/SubmitDescription`, null,{params:httpParams}
    );
  }
  requestSubmitPatientImage(guid:string, file: File){
    const formData = new FormData();
    formData.append('patientImageFile', file);
    formData.append("guid",guid);
    return this.httpClient.post<{success: boolean, hasImage: boolean, integrityVersion:number}>(
      "/api/Patient/SubmitPatientImage", formData
    );
  }
  requestDeletePatientImage(guid:string){
    let httpParams = new HttpParams().set("guid",guid);
    return this.httpClient.delete<{success:boolean}>(
      "/api/Patient/DeletePatientImage",{params:httpParams}
    );
  }

}

