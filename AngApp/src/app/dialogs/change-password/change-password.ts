import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { compareTwoInputs } from '../../shared/validators/compare-two-inputs';

@Component({
  selector: 'app-change-password',
  imports: [MatDialogContent, MatDialogActions, MatFormField, MatInput, MatLabel,
    MatButton, MatDialogClose, ReactiveFormsModule, MatError],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css'
})
export class ChangePassword {
  //readonly changePasswordDialogRef = inject(MatDialogRef<ChangePassword>);
  //readonly data = inject<{label:string, value:string}>(MAT_DIALOG_DATA);

  changePasswordForm = signal(new FormGroup({
    CurrentPassword: new FormControl("",{
      nonNullable:true,
      validators:[Validators.required, Validators.maxLength(32)],
    }),
    NewPassword: new FormControl("",{
      nonNullable:true,
      validators:[Validators.required, Validators.minLength(5), Validators.maxLength(32)],
    }),
    RepeatNewPassword: new FormControl("",{
      nonNullable:true,
      validators:[Validators.required],
    }),
  },{validators: [compareTwoInputs("NewPassword","RepeatNewPassword"),]}));

  currentPassword = computed(() => this.changePasswordForm().controls["CurrentPassword"]);
  newPassword = computed(() => this.changePasswordForm().controls["NewPassword"]);
  repeatNewPassword = computed(() => this.changePasswordForm().controls["RepeatNewPassword"]);

}
