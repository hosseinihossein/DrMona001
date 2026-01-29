import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { Identity_UserModel, IdentityService } from '../../identity-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit-user-form',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatIcon,MatButton,MatIconButton,
    MatSuffix,
  ],
  templateUrl: './edit-user-form.html',
  styleUrl: './edit-user-form.css',
})
export class EditUserForm {
  userGuid = signal<string|null>(null);
  userModel = signal<Identity_UserModel|null>(null);
  hidePassword = signal(true);

  identityService = inject(IdentityService);
  actiatedRoute = inject(ActivatedRoute);
  //router = inject(Router);

  username_FormControl = new FormControl(this.userModel()?.userName,{
    validators:[
      Validators.required, 
      Validators.minLength(3),
      Validators.maxLength(32),
    ]
  });
  password_FormControl = new FormControl("",{
    validators:[
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(32),
    ]
  });

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
            }
          },
        });
      }
    });
    
  }

  changeVisibility(){
    this.hidePassword.update(h=>!h);
  }
}
