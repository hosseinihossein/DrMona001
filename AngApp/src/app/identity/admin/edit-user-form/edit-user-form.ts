import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { Identity_UserModel, IdentityService } from '../../identity-service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Result } from '../../../dialogs/result/result';
import { MatSelectModule } from '@angular/material/select';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';

@Component({
  selector: 'app-edit-user-form',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatIcon,MatButton,MatIconButton,
    MatSuffix,MatSelectModule,WaitSpinner,
  ],
  templateUrl: './edit-user-form.html',
  styleUrl: './edit-user-form.css',
})
export class EditUserForm {
  identityService = inject(IdentityService);
  actiatedRoute = inject(ActivatedRoute);
  dialog = inject(MatDialog);
  router = inject(Router);

  userGuid = signal<string|null>(null);
  userModel = signal<Identity_UserModel|null>(null);
  hidePassword = signal(true);
  allRoles = signal<string[]>([]);
  displayWaitSpinner = signal(false);

  username_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.minLength(3),
      Validators.maxLength(32),
    ]
  });
  password_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.minLength(5),
      Validators.maxLength(32),
    ]
  });
  selectedRoles_FormControl = new FormControl<string[]>([],{nonNullable:true});

  constructor(){
    this.actiatedRoute.paramMap.subscribe(params=>{
      if(params.has("userGuid")){
        this.userGuid.set(params.get("userGuid"));
      }
    });

    effect(()=>{
      if(this.userGuid()){
        this.identityService.requestUserModel(this.userGuid()!).subscribe({
          next: res => {
            if(res){
              this.userModel.set(res);
              this.username_FormControl.setValue(res.userName);
              this.selectedRoles_FormControl.setValue(res.roles);
            }
          },
        });
      }
    });

    effect(()=>{
      if(!this.identityService.isAuthenticated()){
        this.router.navigate(["/"]);
      }
    });

    this.identityService.requestAllRoles().subscribe({
      next: res => {
        if(res){
          this.allRoles.set(res);
        }
      },
    });

    this.identityService.getCsrf().subscribe({
      next: res => {
        console.log("csrf received.");
      },
    });
    
  }

  changeVisibility(){
    this.hidePassword.update(h=>!h);
  }

  submitEditUser(){
    if(this.userGuid()){
        
        this.displayWaitSpinner.set(true);

        let formModel:Identity_EditUser_FormModel = {
          userGuid: this.userGuid()!,
        };
        if(this.username_FormControl.valid && 
          this.username_FormControl.value !== this.userModel()?.userName){
            formModel.userName = this.username_FormControl.value;
        }
        if(this.password_FormControl.valid && 
          this.password_FormControl.value){
            formModel.password = this.password_FormControl.value;
        }
        if(this.selectedRoles_FormControl.valid && this.rolesChanged()){
            formModel.roles = this.selectedRoles_FormControl.value;
        }
        this.identityService.requestEditUser(formModel).subscribe({
          next: res => {
            this.displayWaitSpinner.set(false);
            if(res && res.success){
              this.dialog.open(Result,{data:{
                status: "success",
                title: "Edit User",
                description: [
                  `User '${formModel.userName}' edited successfully.`
                ],
              }}).afterClosed().subscribe(()=>{
                this.router.navigate(["/user-profile",this.userGuid()])
              });
            }
          },
          error: err => {
            this.displayWaitSpinner.set(false);
            this.dialog.open(Result,{data:{
              status: "warning",
              title: "Editing User",
              description: [
                `Something went wrong when editing user '${formModel.userName}'!`,
                JSON.stringify(err),
              ],
            }});
            throw(err);
          }
        });
    }
  }

  rolesChanged(){
    if(this.userModel()){
      if(this.selectedRoles_FormControl.value.length !== this.userModel()!.roles.length){
        return true;
      }
  
      for(let role of this.selectedRoles_FormControl.value){
        if(!this.userModel()!.roles.includes(role)){
          return true;
        }
      }
    }

    return false;
  }

}

export class Identity_EditUser_FormModel{
  userGuid:string = null!;
  userName?:string = null!;
  password?:string = null!;
  roles?:string[] = [];
}
