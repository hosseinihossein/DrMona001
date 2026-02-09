import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-edit-textarea',
  imports: [MatDialogContent, MatLabel, MatFormField, MatDialogActions, MatDialogClose, MatButton, 
    MatInput, ReactiveFormsModule,MatError,MatSlideToggle,],
  templateUrl: './edit-textarea.html',
  styleUrl: './edit-textarea.css'
})
export class EditTextarea {
  //readonly dialogRef = inject(MatDialogRef<EditTextarea>);
  readonly data = inject<{
    label:string, 
    value:string, 
    enableDelete?:boolean
    persian?:boolean}>(MAT_DIALOG_DATA);

  myText = new FormControl(this.data.value,{
    nonNullable:true,
    validators:[Validators.required, Validators.maxLength(4000)],
  });

  isPersian = signal(this.data.persian ?? false);

  togglePersian(){
    this.isPersian.update(p=>!p);
  }
}
