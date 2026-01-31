import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IdentityService } from '../../identity-service';
import { MatDialog } from '@angular/material/dialog';
import { Result } from '../../../dialogs/result/result';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';

@Component({
  selector: 'app-new-user-form',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatIcon,MatButton,MatIconButton,
    MatSuffix,MatSelectModule,WaitSpinner
  ],
  templateUrl: './new-user-form.html',
  styleUrl: './new-user-form.css',
})
export class NewUserForm {
  identityService = inject(IdentityService);
  dialog = inject(MatDialog);

  hidePassword = signal(true);
  allRoles = signal<string[]>([]);
  displayWaitSpinner = signal(false);

  fullname_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.required, 
      Validators.maxLength(32),
    ]
  });
  username_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.required, 
      Validators.minLength(3),
      Validators.maxLength(32),
    ]
  });
  password_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(32),
    ]
  });
  selectedRoles = new FormControl<string[]>([],{nonNullable:true});

  constructor(){
    this.identityService.requestAllRoles().subscribe({
      next: res => {
        if(res){
          this.allRoles.set(res);
        }
      },
    });
  }

  changeVisibility(){
    this.hidePassword.update(h=>!h);
  }

  submitNewUser(){
    if(this.fullname_FormControl.valid && 
      this.username_FormControl.valid && 
      this.password_FormControl.valid){
        
        this.displayWaitSpinner.set(true);

        let formModel: Identity_NewUser_FormModel = {
          fullName: this.fullname_FormControl.value,
          userName: this.username_FormControl.value,
          password: this.password_FormControl.value,
          roles: this.selectedRoles.value,
        }
        this.identityService.requestCreateNewUser(formModel).subscribe({
          next: res => {
            this.displayWaitSpinner.set(false);
            if(res && res.success){
              this.dialog.open(Result,{data:{
                status: "success",
                title: "Submit New User",
                description: [
                  `User '${formModel.userName}' submitted successfully.`
                ],
              }});
            }
          },
          error: err => {
            this.displayWaitSpinner.set(false);
            this.dialog.open(Result,{data:{
              status: "warning",
              title: "Submit New User",
              description: [
                `Something went wrong when submitting new user '${formModel.userName}'!`,
                JSON.stringify(err),
              ],
            }});
            throw(err);
          }
        });
    }
  }
  
}

export class Identity_NewUser_FormModel{
  fullName:string = null!;
  userName:string = null!;
  password:string = null!;
  roles:string[] = [];
}
