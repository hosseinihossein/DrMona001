import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { IdentityService } from '../identity-service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { WaitSpinner } from '../../shared/wait-spinner/wait-spinner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatIcon,MatButton,MatIconButton,
    MatSuffix,WaitSpinner
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  identityService = inject(IdentityService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  hidePassword = signal(true);
  displayWaitSpinner = signal(false);

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

  constructor(){}

  changeVisibility(){
    this.hidePassword.update(h=>!h);
  }

  login(){
    if(this.username_FormControl.valid && this.password_FormControl.valid){
      this.displayWaitSpinner.set(true);
      this.identityService.login(this.username_FormControl.value,this.password_FormControl.value).subscribe({
        next: res => {
          if(res){
            let returnUrl = this.activatedRoute.snapshot.queryParamMap.get("returnUrl") || "/";
            this.router.navigateByUrl(returnUrl);
          }
          this.displayWaitSpinner.set(false);
        },
        error: err => {
          if(err instanceof HttpErrorResponse && err.status == HttpStatusCode.BadRequest){
            //console.error("BadRequest err: "+err.error);
            if(err.error.Username || err.error.errors?.Username){
              this.username_FormControl.setErrors({loginError: err.error.Username || err.error.errors?.Username});
            }
            else if(err.error.Password || err.error.errors?.Password){
              this.password_FormControl.setErrors({loginError: err.error.Password || err.error.errors?.Password});
            }
            else{
              this.password_FormControl.setErrors({loginError: err.error});
            }
          }
          this.displayWaitSpinner.set(false);
          throw(err);
        },
      });
    }
  }

}
