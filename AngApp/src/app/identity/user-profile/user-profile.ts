import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Identity_UserModel, IdentityService } from '../identity-service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

@Component({
  selector: 'app-user-profile',
  imports: [MatCardModule, MatIcon, MatButton, MatTooltip, NgOptimizedImage, 
    RouterLink],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile {
  identityService = inject(IdentityService);
  actiatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  
  userGuid = signal<string|null>(null);
  userModel = signal<Identity_UserModel|null>(null);
  isMyProfile = computed(()=>this.identityService.userModel()?.guid === this.userGuid());
  userImgSrc = computed(()=>this.identityService.getUserImageAddress(this.identityService.userModel()));

  constructor(){
    this.actiatedRoute.paramMap.subscribe(params=>{
      if(params.has("userGuid")){
        this.userGuid.set(params.get("userGuid"));
      }
    });
    if(!this.userGuid() && this.identityService.isAuthenticated() && this.identityService.userModel()){
      this.userGuid.set(this.identityService.userModel()!.guid);
    }
    if(!this.userGuid()){
      this.router.navigate(['/login'],{queryParams:{returnUrl:"user-profile"}});
    }

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
}
