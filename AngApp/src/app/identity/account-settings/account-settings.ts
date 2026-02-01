import { Component, computed, effect, inject, signal } from '@angular/core';
import { Identity_UserModel, IdentityService } from '../identity-service';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgOptimizedImage } from '@angular/common';
import { ChangePassword } from '../../dialogs/change-password/change-password';
import { WaitSpinner } from '../../shared/wait-spinner/wait-spinner';
import { Result } from '../../dialogs/result/result';
import { EditInput } from '../../dialogs/edit-input/edit-input';
import { EditTextarea } from '../../dialogs/edit-textarea/edit-textarea';
import { EditImage } from '../../dialogs/edit-image/edit-image';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-settings',
  imports: [MatCardModule,MatIcon,MatIconButton,MatTooltip,MatFabButton,NgOptimizedImage,WaitSpinner],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettings {
  identityService = inject(IdentityService);
  dialog = inject(MatDialog);
  router = inject(Router);

  userImgSrc = computed(()=>this.identityService.getUserImageAddress(this.identityService.userModel()));
  displayWaitSpinner = signal(false);

  constructor(){
    this.identityService.getCsrf().subscribe({
      next: res => {
        console.log("csrf received.");
      },
    });

    effect(()=>{
      if(!this.identityService.isAuthenticated()){
        this.router.navigate(["/"]);
      }
    });
  }

  openEditImageDialog(){
    this.dialog.open(EditImage,{data:{
      value: this.userImgSrc(),
      title: "User Image",
      imageSize: 128 * 1024,// 128 KB
      enableEdit:this.userImgSrc() ? true : false,
    }}).afterClosed().subscribe(result=>{

      if(result && result.file){
        this.displayWaitSpinner.set(true);
        this.identityService.requestSubmitUserImage(result.file).subscribe({
          next: res => {
            if(res && res.success){
              this.identityService.userModel.update(um=>{
                um!.hasImage = res.hasImage;
                um!.integrityVersion = res.integrityVersion;
                return new Identity_UserModel(um!);
              });
            }
            this.displayWaitSpinner.set(false);
          },
          error: err => {
            this.displayWaitSpinner.set(false);
            this.dialog.open(Result,{data:{
              status:"warning",
              title:"Submit User Image",
              description:[
                "Something went wrong during submitting user image!",
                JSON.stringify(err),
              ],
            }});
            throw(err);
          }
        });
      }

      else if(result && result === "Delete"){
        this.displayWaitSpinner.set(true);
        this.identityService.requestDeleteUserImage().subscribe({
          next: res => {
            if(res && res.success){
              this.identityService.userModel.update(um=>{
                um!.hasImage = false;
                um!.integrityVersion = 0;
                return new Identity_UserModel(um!);
              });
            }
            this.displayWaitSpinner.set(false);
          },
          error: err => {
            this.displayWaitSpinner.set(false);
            this.dialog.open(Result,{data:{
              status:"warning",
              title:"Delete User Image",
              description:[
                "Something went wrong during deleting user image!",
                JSON.stringify(err),
              ],
            }});
            throw(err);
          }
        });
      }
      
    });
  }
  openEditUsernameDialog(){
    if(this.identityService.userModel()){
      this.dialog.open(EditInput,{data:{
        label:"Edit Username",
        value:this.identityService.userModel()?.userName,
      }}).afterClosed().subscribe((result:string)=>{
        if(result){
          this.displayWaitSpinner.set(true);
          this.identityService.requestChangeUserName(result).subscribe({
            next: res => {
              if(res && res.success){
                this.identityService.userModel.update(um=>{
                  um!.userName = result;
                  return new Identity_UserModel(um!);
                });
              }
              this.displayWaitSpinner.set(false);
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status:"warning",
                title:"Submit Username",
                description:[
                  "Something went wrong during submitting username!",
                  JSON.stringify(err),
                ],
              }});
              throw(err);
            }
          });
        }
      });
    }
  }
  openEditFullNameDialog(){
    if(this.identityService.userModel()){
      this.dialog.open(EditInput,{data:{
        label:"Edit Full Name",
        value:this.identityService.userModel()?.fullName,
        persian:true,
      }}).afterClosed().subscribe((result:string)=>{
        if(result){
          this.displayWaitSpinner.set(true);
          this.identityService.requestChangeFullName(result).subscribe({
            next: res => {
              if(res && res.success){
                this.identityService.userModel.update(um=>{
                  um!.fullName = result;
                  return new Identity_UserModel(um!);
                });
              }
              this.displayWaitSpinner.set(false);
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status:"warning",
                title:"Submit Full Name",
                description:[
                  "Something went wrong during submitting full name!",
                  JSON.stringify(err),
                ],
              }});
              throw(err);
            }
          });
        }
      });
    }
  }
  openEditDescriptionDialog(){
    if(this.identityService.userModel()){
      this.dialog.open(EditTextarea,{data:{
        label:"Edit Description",
        value:this.identityService.userModel()?.description,
        persian:true,
      }}).afterClosed().subscribe((result:string)=>{
        if(result){
          this.displayWaitSpinner.set(true);
          this.identityService.requestChangeDescription(result).subscribe({
            next: res => {
              if(res && res.success){
                this.identityService.userModel.update(um=>{
                  um!.description = result;
                  return new Identity_UserModel(um!);
                });
              }
              this.displayWaitSpinner.set(false);
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status:"warning",
                title:"Submit Description",
                description:[
                  "Something went wrong during submitting description!",
                  JSON.stringify(err),
                ],
              }});
              throw(err);
            }
          });
        }
      });
    }
  }
  openChangePasswordDialog(){
    this.dialog.open(ChangePassword).afterClosed().subscribe(
      (result:{currentPassword:string,newPassword:string}) => {
        if(result){
          this.displayWaitSpinner.set(true);
          this.identityService.requestChangePassword(result.currentPassword,result.newPassword).subscribe({
            next: res => {
              this.displayWaitSpinner.set(false);
              if(res && res.success){
                this.dialog.open(Result,{data:{
                  status: "success",
                  title: "Password Change",
                  description: ["Password changed successfully."],
                }});
              }
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status: "waning",
                title: "Password Change",
                description: [
                  "Something went wrong during changing password!",
                  JSON.stringify(err),
                ],
              }});
              throw(err);
            }
          });
        }
      }
    );
  }


}
