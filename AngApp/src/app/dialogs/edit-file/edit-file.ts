import { JsonPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-edit-file',
  imports: [MatDialogContent, MatFormField, MatButton,MatDialogActions,MatDialogClose,MatLabel,MatInput,
    MatError,ReactiveFormsModule
  ],
  templateUrl: './edit-file.html',
  styleUrl: './edit-file.css'
})
export class EditFile {
  readonly dialogRef = inject(MatDialogRef<EditFile>);
  readonly data = inject<{
    value:string, 
    title:string, 
    enableEdit?:boolean, 
    fileSize?:number,
    displayTitle?:boolean,
  }>(MAT_DIALOG_DATA);

  selectedFile = signal<File | null>(null);
  fileNameSrc = signal(this.data.value);
  fileSizeError = signal<string|null>(null);

  fileName = viewChild<ElementRef<HTMLImageElement>>("fileName");

  titleControl = new FormControl(this.data.title,{nonNullable:true, validators:[
    //Validators.required, 
    Validators.maxLength(128), 
    Validators.minLength(3)
  ]})

  onSelectFile(event:Event){
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      if(this.data.fileSize && (input.files[0].size > this.data.fileSize)){
        this.fileSizeError.set(
          `The size of choosen file cannot be more than ${this.data.fileSize / 1024} KB!`
        );
      }
      else{
        this.selectedFile.set(input.files[0]);
        this.fileNameSrc.set(this.selectedFile()?.name ?? "selected file name!");
      }
    }
    else{
      this.selectedFile.set(null);
      this.fileNameSrc.set(this.data.value);
    }
  }
}
