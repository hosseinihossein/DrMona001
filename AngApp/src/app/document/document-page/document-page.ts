import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CdkNoDataRow } from "@angular/cdk/table";
import { DocumentTab, DocumentTabModel } from "../document-tab/document-tab";
import { DocumentElementModel } from '../document-element/document-element';

@Component({
  selector: 'app-document-page',
  imports: [MatTabsModule, DocumentTab],
  templateUrl: './document-page.html',
  styleUrl: './document-page.css',
})
export class DocumentPage {

}

export class DocumentPageModel {
  constructor(model:DocumentPageModel){
    this.guid = model.guid;
    this.tabs = model.tabs.map(a=>new DocumentTabModel(a));
  }

  guid:string = null!;
  patientGuid:string = null!;
  tabs:DocumentTabModel[] = [];
} 
