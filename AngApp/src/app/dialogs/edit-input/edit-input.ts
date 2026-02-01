import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
//import { SingletonService } from '../../shared/services/singleton-service';

@Component({
  selector: 'app-edit-input',
  imports: [MatDialogContent, MatDialogActions, MatFormField, MatInput, MatLabel,
    MatButton, MatDialogClose, ReactiveFormsModule, MatError],
  templateUrl: './edit-input.html',
  styleUrl: './edit-input.css'
})
export class EditInput {
  //readonly dialogRef = inject(MatDialogRef<EditInput>);
  readonly data = inject<{
    label:string, 
    value:string, 
    maxLength?:number, 
    minLength?:number, 
    enableDelete?:boolean,
    persian?:boolean}>(MAT_DIALOG_DATA);

  myInput = new FormControl(this.data.value,{
    nonNullable:true,
    validators:[Validators.required, 
      Validators.maxLength(this.data.maxLength || 128),
      Validators.minLength(this.data.minLength || 3),
    ],
  });
}
