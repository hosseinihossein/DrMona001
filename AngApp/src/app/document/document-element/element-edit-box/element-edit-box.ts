import { Component, inject, input, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { DocumentElementModel } from '../document-element';
import { DocumentService } from '../../document-service';
import { DocumentPageService } from '../../document-page/document-page-service';
import { MatDialog } from '@angular/material/dialog';
import { EditInput } from '../../../dialogs/edit-input/edit-input';
import { DocumentPageModel } from '../../document-page/document-page';
import { EditTextarea } from '../../../dialogs/edit-textarea/edit-textarea';
import { EditFile } from '../../../dialogs/edit-file/edit-file';
import { EditImage } from '../../../dialogs/edit-image/edit-image';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';

@Component({
  selector: 'app-element-edit-box',
  imports: [MatIcon,MatButton,WaitSpinner],
  templateUrl: './element-edit-box.html',
  styleUrl: './element-edit-box.css',
})
export class ElementEditBox {
  elementModel = input.required<DocumentElementModel>();
  
  documentService = inject(DocumentService);
  documentPageService = inject(DocumentPageService);
  dialog = inject(MatDialog);

  displayWaitSpinner = signal(false);

  openDialog(){
    switch(this.elementModel().type){
      case "h1":
        this.openEditHeaderDialog();
        break;
      case "p":
        this.openEditParagraphDialog();
        break;
        case "code":
        this.openEditCodeDialog();
        break;
        case "file":
        this.openEditFileDialog();
        break;
        case "img":
        this.openEditImageDialog();
        break;
    }
  }

  private openEditHeaderDialog(){
    const dialogRef = this.dialog.open(EditInput, {data:{
      label:"Edit Heading",
      value:this.elementModel().value, 
      enableDelete:true,
    }});
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.displayWaitSpinner.set(true);
          this.documentService.requestEditElement(this.elementModel().guid, result).subscribe({
            next: res => {
              if(res && res.success){
                console.log("heading value edited: ",result);
                this.elementModel().value = result;
                this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
              }
              this.displayWaitSpinner.set(false);
            }
          });
        }
      }
    });
  }
  private openEditParagraphDialog(){
    const dialogRef = this.dialog.open(EditTextarea, {data:{
      label:"Edit Paragraph",
      value:this.elementModel().value, 
      enableDelete:true,
    }});
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.displayWaitSpinner.set(true);
          this.documentService.requestEditElement(this.elementModel().guid, result).subscribe({
            next: res => {
              if(res && res.success){
                console.log("paragraph value edited: ",result);
                this.elementModel().value = result;
                this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
              }
              this.displayWaitSpinner.set(false);
            }
          });
        }
      }
    });
  }
  private openEditCodeDialog(){
    const dialogRef = this.dialog.open(EditTextarea,{data:{
      title:"Edit Code",
      value:this.elementModel().value, 
      enableDelete:true
    }});
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.displayWaitSpinner.set(true);
          this.documentService.requestEditElement(this.elementModel().guid, result).subscribe({
            next: res => {
              if(res && res.success){
                console.log("code value edited: ",result);
                this.elementModel().value = result;
                this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
              }
              this.displayWaitSpinner.set(false);
            }
          });
        }
      }
    });
  }
  private openEditFileDialog(){
    const dialogRef = this.dialog.open(EditFile,{data:{
      value:this.elementModel().value, 
      title:this.elementModel().title, 
      enableEdit:true, 
    }});
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.displayWaitSpinner.set(true);
          this.documentService.requestEditElement(this.elementModel().guid, undefined, result).subscribe({
            next: res => {
              if(res && res.success){
                console.log("file title edited: ",result);
                this.elementModel().value = result;
                this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
              }
              this.displayWaitSpinner.set(false);
            }
          });
        }
      }
    });
  }
  private openEditImageDialog(){
    const dialogRef = this.dialog.open(EditImage,{data:{
      value:this.elementModel().value,
      title:this.elementModel().title??'', 
      displayTitle: true,
      enableEdit:true,
    }});
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.displayWaitSpinner.set(true);
          this.documentService.requestEditElement(this.elementModel().guid, undefined, result).subscribe({
            next: res => {
              if(res && res.success){
                console.log("file title edited: ",result);
                this.elementModel().value = result;
                this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
              }
              this.displayWaitSpinner.set(false);
            }
          });
        }
      }
    });
  }

  private deleteElement(){
    this.displayWaitSpinner.set(true);
    this.documentService.requestDeleteElement(this.elementModel().guid).subscribe({
      next: res => {
        if(res && res.success){
          console.log("element deleted!");
          this.documentPageService.documentPageModel.update(dpm=>{
            let tab = dpm!.tabs.find(t=>t.name === this.elementModel().tab);
            if(tab){
              let elementIndex = tab.elements.findIndex(el=>el.guid === this.elementModel().guid);
              let deletedElements = tab.elements.splice(elementIndex,1);
              if(deletedElements.length > 0){
                let deletedOrder = deletedElements[0].order;
                tab.elements.forEach(t=>{
                  if(t.order > deletedOrder){
                    t.order -= 1;
                  }
                });
              }
            }
            return new DocumentPageModel(dpm!);
          });
        }
        this.displayWaitSpinner.set(false);
      },
    });
  }

  decreaseOrder(){
    if(this.elementModel().order > 0){
      this.displayWaitSpinner.set(true);
      this.documentService.requestDecreaseOrder(this.elementModel().guid).subscribe({
        next: res => {
          if(res && res.success){
            this.documentPageService.documentPageModel.update(dpm=>{
              let tab = dpm!.tabs.find(t=>t.name === this.elementModel().tab);
              if(tab){
                let subtituteOrder = this.elementModel().order - 1;
                let subtituteElement = tab.elements.find(t=>t.order === subtituteOrder);
                if(subtituteElement){
                  this.elementModel().order -= 1;
                  subtituteElement.order += 1;
                }
              }
              return new DocumentPageModel(dpm!);
            });
          }
          this.displayWaitSpinner.set(false);
        },
      });
    }
  }
  increaseOrder(){
    let tab = this.documentPageService.documentPageModel()?.tabs.find(t=>t.name === this.elementModel().tab);
    if(tab && this.elementModel().order < (tab.elements.length - 1)){
      this.displayWaitSpinner.set(true);
      this.documentService.requestDecreaseOrder(this.elementModel().guid).subscribe({
        next: res => {
          if(res && res.success){
            this.documentPageService.documentPageModel.update(dpm=>{
              if(tab){
                let subtituteOrder = this.elementModel().order + 1;
                let subtituteElement = tab.elements.find(t=>t.order === subtituteOrder);
                if(subtituteElement){
                  this.elementModel().order += 1;
                  subtituteElement.order -= 1;
                }
              }
              return new DocumentPageModel(dpm!);
            });
          }
          this.displayWaitSpinner.set(false);
        },
      });
    }
  }

}
