import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DocumentTab, DocumentTabModel } from "../document-tab/document-tab";
import { ActivatedRoute } from '@angular/router';
import { DocumentService } from '../document-service';
import { DocumentPageService } from './document-page-service';

@Component({
  selector: 'app-document-page',
  imports: [MatTabsModule, DocumentTab],
  templateUrl: './document-page.html',
  styleUrl: './document-page.css',
  providers: [DocumentPageService]
})
export class DocumentPage {
  patientGuid = input.required<string>();
  activatedRoute = inject(ActivatedRoute);
  documentService = inject(DocumentService);
  documentPageService = inject(DocumentPageService);

  //patientGuid = signal<string|null>(null);

  tabCC = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "CC"));
  tabPMH = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "PMH"));
  tabDH = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "DH"));
  tabPI = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "PI"));
  tabPHE = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "PHE"));
  tabPlan = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "Plan"));
  tabResults = computed(()=>this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === "Results"));

  constructor(){
    /*this.activatedRoute.paramMap.subscribe(params=>{
      if(params.has("patientGuid")){
        this.patientGuid.set(params.get("patientGuid"));
      }
    });*/

    effect(() => {
      if(this.patientGuid()){
        this.documentService.requestDocumentPageModel(this.patientGuid()!).subscribe({
          next: res => {
            if(res){
              this.documentPageService.documentPageModel.set(res);
            }
          },
        });
      }
    });
  }
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
