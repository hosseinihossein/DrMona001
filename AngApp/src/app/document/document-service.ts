import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { DocumentElementModel, NewElementFormModel } from './document-element/document-element';
import { DocumentPageModel } from './document-page/document-page';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private httpClient = inject(HttpClient);
  
  constructor(){}

  requestDocumentPageModel(patientGuid:string){
    let httpParams = new HttpParams().set("patientGuid",patientGuid);
    return this.httpClient.get<DocumentPageModel>(
      "/api/Document/GetDocumentPageModel",{params:httpParams}
    );
  }

  requestElementFile(guid:string,fileName:string){
    let httpParams = new HttpParams();
    httpParams = httpParams.set("guid",guid);
    //if(fileName){}
    httpParams = httpParams.set("fileName",fileName);
    return this.httpClient.get("/api/Patient/ElementFile",{
      params:httpParams,
      responseType: "blob",
      observe:"body",
    });
  }

  submitNewElement(formModel:NewElementFormModel){
    const formData = new FormData();
    if(formModel.DocumentGuid){
      formData.append("DocumentGuid", formModel.DocumentGuid);
    }
    if(formModel.Tab){
      formData.append("Tab", formModel.Tab);
    }
    if(formModel.Title){
      formData.append("Title", formModel.Title);
    }
    if(formModel.Type){
      formData.append("Type", formModel.Type);
    }
    if(formModel.Value){
      formData.append("Value", formModel.Value);
    }
    if(formModel.File){
      formData.append("File", formModel.File);
    }
    if(formModel.Persian){
      formData.append("Persian", "true");
    }
    return this.httpClient.post<DocumentElementModel>(
      "/api/Document/SubmitNewElement", formData, {reportProgress:true, observe:"events"}
    );
  }
  requestEditElement(guid:string,value?:string,title?:string){
    let httpParams= new HttpParams().set("guid",guid);
    if(value){
      httpParams = httpParams.set("value",value);
    }
    if(title){
      httpParams = httpParams.set("title",title);
    }
    return this.httpClient.post<{success:boolean}>(
      "/api/Document/EditElement",null,{params:httpParams}
    );
  }
  requestDeleteElement(guid:string){
    let httpParams = new HttpParams().set("guid",guid);
    return this.httpClient.delete<{success:boolean}>(
      "/api/Document/DeleteElement",{params:httpParams}
    );
  }
  requestDecreaseOrder(guid:string){
    let httpParams = new HttpParams().set("guid",guid);
    return this.httpClient.post<{success:boolean}>(
      "/api/Document/DecreaseOrder",null,{params:httpParams}
    );
  }
  requestIncreaseOrder(guid:string){
    let httpParams = new HttpParams().set("guid",guid);
    return this.httpClient.post<{success:boolean}>(
      "/api/Document/IncreaseOrder",null,{params:httpParams}
    );
  }


}
