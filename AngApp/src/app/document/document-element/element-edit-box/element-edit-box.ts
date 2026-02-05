import { Component, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { DocumentElementModel } from '../document-element';
import { DocumentService } from '../../document-service';
import { DocumentPageService } from '../../document-page/document-page-service';
import { MatDialog } from '@angular/material/dialog';
import { EditInput } from '../../../dialogs/edit-input/edit-input';
import { DocumentPageModel } from '../../document-page/document-page';

@Component({
  selector: 'app-element-edit-box',
  imports: [MatIcon,MatButton],
  templateUrl: './element-edit-box.html',
  styleUrl: './element-edit-box.css',
})
export class ElementEditBox {
  elementModel = input.required<DocumentElementModel>();
  
  documentService = inject(DocumentService);
  documentPageService = inject(DocumentPageService);
  dialog = inject(MatDialog);

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
          this.documentService.requestEditElement(this.elementModel().guid, result).subscribe({
            next: res => {
              if(res && res.success){
                console.log("heading value edited: ",result);
                this.elementModel().value = result;
                //this.documentPageService.documentPageModel.update(dpm => new DocumentPageModel(dpm!));
              }
            }
          });
        }
      }
    });
  }
  private openEditParagraphDialog(){
    const dialogRef = this.dialog.open(EditParagraph, {
      data:{value:this.elementModel().value, enableEdit:true}
    });
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.editValueTitle(result);
        }
      }
    });
  }
  private openEditCodeDialog(){
    const dialogRef = this.dialog.open(EditCode,{
      data:{value:this.elementModel().value, enableEdit:true}
    });
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.editValueTitle(result);
        }
      }
    });
  }
  private openEditFileDialog(){
    const dialogRef = this.dialog.open(EditFile,{
      data:{value:this.elementModel().value, title:this.elementModel().title, enableEdit:true }
    });
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.editValueTitle(undefined,result);
        }
      }
    });
  }
  private openEditImageDialog(){
    const dialogRef = this.dialog.open(EditImageTitle,{
      data:{value:this.elementModel().value,title:this.elementModel().title??'', enableEdit:true}
    });
    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        if(result === "Delete"){
          this.deleteElement();
        }
        else{
          this.editValueTitle(undefined, result);
        }
      }
    });
  }

  private deleteElement(){}

  decreaseOrderSubstitute(){}
  increaseOrderSubstitute(){}

}
