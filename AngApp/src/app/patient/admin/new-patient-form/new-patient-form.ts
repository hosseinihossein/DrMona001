import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Result } from '../../../dialogs/result/result';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';
import { Router } from '@angular/router';
import { IdentityService } from '../../../identity/identity-service';
import { PatientService } from '../../patient-service';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

@Component({
  selector: 'app-new-patient-form',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatButton,
    MatSelectModule,WaitSpinner
  ],
  templateUrl: './new-patient-form.html',
  styleUrl: './new-patient-form.css',
})
export class NewPatientForm {
  identityService = inject(IdentityService);
  patientService = inject(PatientService);
  dialog = inject(MatDialog);
  router = inject(Router);

  displayWaitSpinner = signal(false);

  fullname_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.required, 
      Validators.maxLength(32),
    ]
  });
  nationalId_FormControl = new FormControl("",{
    nonNullable:true,
    validators:[
      Validators.required, 
      Validators.minLength(3),
      Validators.maxLength(10),
    ]
  });

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

  submitNewPatient(){
    if(this.fullname_FormControl.valid && 
      this.nationalId_FormControl.valid){
        
        this.displayWaitSpinner.set(true);

        this.patientService.requestCreateNewPatient(this.fullname_FormControl.value,
          this.nationalId_FormControl.value).subscribe({
          next: res => {
            this.displayWaitSpinner.set(false);
            if(res && res.success){
              this.router.navigate(['/patient-profile',res.guid]);
            }
          },
          error: err => {
            this.displayWaitSpinner.set(false);
            if(err instanceof HttpErrorResponse && err.status == HttpStatusCode.BadRequest){
              //console.error("BadRequest err: "+err.error);
              if(err.error.fullName || err.error.errors?.fullName){
                this.fullname_FormControl.setErrors({submitError: err.error.fullName || err.error.errors?.fullName});
              }
              else if(err.error.nationalId || err.error.errors?.nationalId){
                this.nationalId_FormControl.setErrors({submitError: err.error.nationalId || err.error.errors?.nationalId});
              }
            }
            throw(err);
          }
        });
    }
  }
  
}

