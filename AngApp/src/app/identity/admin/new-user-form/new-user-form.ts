import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-new-user-form',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatIcon,MatButton,MatIconButton,
    MatSuffix,
  ],
  templateUrl: './new-user-form.html',
  styleUrl: './new-user-form.css',
})
export class NewUserForm {
  hidePassword = signal(true);

  fullname_FormControl = new FormControl("",{
    validators:[
      Validators.required, 
      Validators.maxLength(32),
    ]
  });
  username_FormControl = new FormControl("",{
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

  constructor(){}

  changeVisibility(){
    this.hidePassword.update(h=>!h);
  }
}
