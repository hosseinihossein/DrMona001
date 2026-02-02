import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';
import { IdentityService } from '../../../identity/identity-service';
import { PatientService } from '../../patient-service';
import { Patient_ProfileModel } from '../../patient-profile/patient-profile';
import { EditImage } from '../../../dialogs/edit-image/edit-image';
import { Result } from '../../../dialogs/result/result';
import { EditInput } from '../../../dialogs/edit-input/edit-input';
import { EditTextarea } from '../../../dialogs/edit-textarea/edit-textarea';

@Component({
  selector: 'app-patient-profile-settings',
  imports: [MatCardModule,MatIcon,MatIconButton,MatTooltip,NgOptimizedImage,WaitSpinner],
  templateUrl: './patient-profile-settings.html',
  styleUrl: './patient-profile-settings.css',
})
export class PatientProfileSettings {
  identityService = inject(IdentityService);
  patientService = inject(PatientService)
  dialog = inject(MatDialog);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  patientGuid = signal<string|null>(null);
  patientModel = signal<Patient_ProfileModel|null>(null);
  patientImgSrc = computed(()=>this.patientService.getPatientImageAddress(this.patientModel()));
  displayWaitSpinner = signal(false);

  constructor(){
    this.activatedRoute.paramMap.subscribe(params=>{
      if(params.has("patientGuid")){
        this.patientGuid.set(params.get("patientGuid"));
      }
    });

    effect(()=>{
      if(this.patientGuid()){
        this.patientService.requestPatientModel(this.patientGuid()!).subscribe({
          next: res => {
            if(res){
              this.patientModel.set(res);
            }
          },
        });
      }
    });

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
    if(this.patientGuid() && this.patientModel()){

      this.dialog.open(EditImage,{data:{
        value: this.patientImgSrc(),
        title: "Patient Image",
        imageSize: 128 * 1024,// 128 KB
        enableEdit:this.patientImgSrc() ? true : false,
      }}).afterClosed().subscribe(result=>{
  
        if(result && result.file){
          this.displayWaitSpinner.set(true);
          this.patientService.requestSubmitPatientImage(this.patientGuid()!,result.file).subscribe({
            next: res => {
              if(res && res.success){
                this.patientModel.update(pm=>{
                  pm!.hasImage = res.hasImage;
                  pm!.integrityVersion = res.integrityVersion;
                  return new Patient_ProfileModel(pm!);
                });
              }
              this.displayWaitSpinner.set(false);
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status:"warning",
                title:"Submit Patient Image",
                description:[
                  "Something went wrong during submitting patient image!",
                  JSON.stringify(err),
                ],
              }});
              throw(err);
            }
          });
        }
  
        else if(result && result === "Delete"){
          this.displayWaitSpinner.set(true);
          this.patientService.requestDeletePatientImage(this.patientGuid()!).subscribe({
            next: res => {
              if(res && res.success){
                this.patientModel.update(pm=>{
                  pm!.hasImage = false;
                  pm!.integrityVersion = 0;
                  return new Patient_ProfileModel(pm!);
                });
              }
              this.displayWaitSpinner.set(false);
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status:"warning",
                title:"Delete Patient Image",
                description:[
                  "Something went wrong during deleting patient image!",
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
  openEditNationalIdDialog(){
    if(this.patientGuid() && this.patientModel()){
      this.dialog.open(EditInput,{data:{
        label:"Edit National Id",
        value:this.patientModel()!.nationalId,
      }}).afterClosed().subscribe((result:string)=>{
        if(result){
          this.displayWaitSpinner.set(true);
          this.patientService.requestChangeNationalId(this.patientGuid()!,result).subscribe({
            next: res => {
              if(res && res.success){
                this.patientModel.update(pm=>{
                  pm!.nationalId = result;
                  return new Patient_ProfileModel(pm!);
                });
              }
              this.displayWaitSpinner.set(false);
            },
            error: err => {
              this.displayWaitSpinner.set(false);
              this.dialog.open(Result,{data:{
                status:"warning",
                title:"Submit National Id",
                description:[
                  "Something went wrong during submitting national Id!",
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
    if(this.patientGuid() && this.patientModel()){
      this.dialog.open(EditInput,{data:{
        label:"Edit Full Name",
        value:this.patientModel()?.fullName,
        persian:true,
      }}).afterClosed().subscribe((result:string)=>{
        if(result){
          this.displayWaitSpinner.set(true);
          this.patientService.requestChangeFullName(this.patientGuid()!,result).subscribe({
            next: res => {
              if(res && res.success){
                this.patientModel.update(pm=>{
                  pm!.fullName = result;
                  return new Patient_ProfileModel(pm!);
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
    if(this.patientGuid() && this.patientModel()){
      this.dialog.open(EditTextarea,{data:{
        label:"Edit Description",
        value:this.patientModel()!.description,
        persian:true,
      }}).afterClosed().subscribe((result:string)=>{
        if(result){
          this.displayWaitSpinner.set(true);
          this.patientService.requestChangeDescription(this.patientGuid()!,result).subscribe({
            next: res => {
              if(res && res.success){
                this.patientModel.update(pm=>{
                  pm!.description = result;
                  return new Patient_ProfileModel(pm!);
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

}
