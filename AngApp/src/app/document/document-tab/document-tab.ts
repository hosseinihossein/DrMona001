import { Component, computed, effect, inject, input, Renderer2, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DocumentElement, DocumentElementModel, NewElementFormModel } from '../document-element/document-element';
import { ViewportScroller } from '@angular/common';
import { DocumentService } from '../document-service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DocumentPageService } from '../document-page/document-page-service';
import { MatDialog } from '@angular/material/dialog';
import { EditInput } from '../../dialogs/edit-input/edit-input';
import { EditTextarea } from '../../dialogs/edit-textarea/edit-textarea';
import { EditImage } from '../../dialogs/edit-image/edit-image';
import { EditFile } from '../../dialogs/edit-file/edit-file';
import { Result } from '../../dialogs/result/result';
import { IdentityService } from '../../identity/identity-service';
import { WaitSpinner } from '../../shared/wait-spinner/wait-spinner';
import { DocumentPageModel } from '../document-page/document-page';
import { WindowService } from '../../shared/services/window-service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-document-tab',
  imports: [MatSidenavModule,MatMenu, MatMenuItem, MatMenuTrigger,MatIcon,MatTooltip,DocumentElement,
    WaitSpinner,
  ],
  templateUrl: './document-tab.html',
  styleUrl: './document-tab.css',
})
export class DocumentTab {
  documentTabModel = input.required<DocumentTabModel>();

  viewPortObserver: IntersectionObserver;

  windowService = inject(WindowService);
  renderer = inject(Renderer2);
  identityService = inject(IdentityService);
  documentService = inject(DocumentService);
  documentPageService = inject(DocumentPageService);
  dialog = inject(MatDialog);
  viewportScroller = inject(ViewportScroller);

  headingElements = signal<HTMLHeadingElement[]>([]);
  displayWaitSpinner = signal(false);
  waitSpinnerValue = signal(0);

  editAllowed = computed(()=>this.identityService.isAuthenticated() && 
    this.identityService.userModel()?.roles.includes("Document_Admins")
  );
  sortedElements = computed(()=>
    this.documentTabModel().elements.sort((a,b)=>{
      if(a.order > b.order)return 1;else return -1;
    })
  );


  constructor(){
    this.viewPortObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        let overviewHeader = this.windowService.nativeWindow.document.getElementById("overview-"+entry.target.id);
        if(overviewHeader){
          if (entry.isIntersecting) {
            this.renderer.addClass(overviewHeader!, "active");
          } else {
            this.renderer.removeClass(overviewHeader!, "active");
          }
        }
      });
    });
    effect(()=>{
      for(let heading of this.headingElements()){
        this.viewPortObserver.observe(heading);
      }
    });
    
  }

  ngAfterViewInit(): void {
    this.viewportScroller.setOffset([0,64]);//[xOffset, yOffset]
  }

  onHeadingInit(headingElement: HTMLHeadingElement){
    this.headingElements.update(elements=>[...elements, headingElement]);
  }

  goToElement(guid:string){
    this.viewportScroller.scrollToAnchor(guid, {behavior:'smooth'});
  }

  enterEditMode(){
    if(this.editAllowed()){
      this.identityService.getCsrf().subscribe({
        next: () => {
          console.log("csrf token recieved successfully.");
        },
        error: err => {
          console.log("couldn't get csrf token");
          throw(err);
        }
      });

      this.documentPageService.toggleEditMode();
    }
  }

  addNewElement(type:"h1" | "p" | "img" | "code"/* | "file"*/){
    if(this.editAllowed() && this.documentPageService.documentPageModel()){

      let newElementFormModel: NewElementFormModel|null = null;

      if(type === "h1"){
        const dialogRef = this.dialog.open(EditInput, {data:{
          label:"Heading",
          value:"New Heading",
        }});
        dialogRef.afterClosed().subscribe(result=>{
          if(result){
            newElementFormModel = {
              DocumentGuid: this.documentPageService.documentPageModel()!.guid,
              Tab:this.documentTabModel().name,
              Type: type,
              Value: result,
            };
            this.requestForNewElement(newElementFormModel);
          }
        });
      }
      else if(type === "code"){
        const dialogRef = this.dialog.open(EditTextarea,{data:{
          label:"Code",
          value:"New Code",
        }});
        dialogRef.afterClosed().subscribe(result=>{
          if(result){
            newElementFormModel = {
              DocumentGuid: this.documentPageService.documentPageModel()!.guid,
              Tab:this.documentTabModel().name,
              Type: type,
              Value: result,
            };
            this.requestForNewElement(newElementFormModel);
          }
        });
      }
      else if(type === "p"){
        const dialogRef = this.dialog.open(EditTextarea, {data:{
          label:"Paragraph",
          value:"New Paragraph",
        }});
        dialogRef.afterClosed().subscribe(result => {
          if(result){
            newElementFormModel = {
              DocumentGuid: this.documentPageService.documentPageModel()!.guid,
              Tab:this.documentTabModel().name,
              Type: type,
              Value: result,
            };
            this.requestForNewElement(newElementFormModel);
          }
        });
      }
      else if(type === "img"){
        const dialogRef = this.dialog.open(EditImage, {data:{
          title:"New Image Title", 
          value:"",
          imageSize:20 * 1024 * 1024,//20 MB
        }});
        dialogRef.afterClosed().subscribe(result=>{
          if(result){
            newElementFormModel = {
              DocumentGuid: this.documentPageService.documentPageModel()!.guid,
              Tab:this.documentTabModel().name,
              Type: type,
              Title: result.title,
              File: result.file,
            };
            this.requestForNewElement(newElementFormModel);
          }
        });
      }
      /*else if(type === "file"){
        const dialogRef = this.dialog.open(EditFile, {data:{
          title:"New File Title", 
          value:"",
        }});
        dialogRef.afterClosed().subscribe(result=>{
          if(result){
            newElementFormModel = {
              DocumentGuid: this.documentPageService.documentPageModel()!.guid,
              Tab:this.documentTabModel().name,
              Type: type,
              Title: result.title,
              File: result.file,
            };
            this.requestForNewElement(newElementFormModel);
          }
        });
      }*/
    }
  }
  private requestForNewElement(newElementFormModel: NewElementFormModel){
    if(this.editAllowed()){
      this.displayWaitSpinner.set(true);

      this.documentService.submitNewElement(newElementFormModel).subscribe({
        next: event => {
          if(event.type === HttpEventType.UploadProgress && event.total){
            this.waitSpinnerValue.set(Math.round((100 * event.loaded) / event.total));
          }
          if(event.type === HttpEventType.Response && event.body){
            //console.log("new element added: ",JSON.stringify(event));
            this.documentTabModel().elements.push(event.body);
            this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
            
            setTimeout(()=>{
              this.goToElement(event.body!.guid);
            }, 1000);

            this.displayWaitSpinner.set(false);
            this.waitSpinnerValue.set(0);
          }
        },
        error: err => {
          this.displayWaitSpinner.set(false);
          this.waitSpinnerValue.set(0);
          this.dialog.open(Result,{
            data:{
              status: "warning",
              title: "Error Adding Element",
              description: [
                "Something went wrong during adding the new elemenet!",
                JSON.stringify(err),
              ],
            }
          });
        },
      });

    }
  }

  

}

export class DocumentTabModel{
  constructor(model:DocumentTabModel){
    this.elements = model.elements.map(el=>new DocumentElementModel(el));
  }

  elements:DocumentElementModel[] = [];
  name:string = null!;
}
