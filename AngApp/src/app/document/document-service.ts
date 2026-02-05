import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { DocumentElementModel, NewElementFormModel } from './document-element/document-element';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private httpClient = inject(HttpClient);
  
  constructor(){}

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
    return this.httpClient.post<DocumentElementModel>(
      "/api/Document/SubmitNewElement", formData
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
}
