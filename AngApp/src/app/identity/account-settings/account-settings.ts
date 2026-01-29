import { Component, computed, inject, signal } from '@angular/core';
import { IdentityService } from '../identity-service';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-account-settings',
  imports: [MatCardModule,MatIcon,MatIconButton,MatTooltip,MatFabButton,NgOptimizedImage,],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettings {
  identityService = inject(IdentityService);
  dialog = inject(MatDialog);

  userImgSrc = computed(()=>this.identityService.getUserImageAddress(this.identityService.userModel()));
  errorResponse = signal<string|null>(null);

  constructor(){}

  openEditImageDialog(){}
  openEditUsernameDialog(){}
  openEditEmailDialog(){}
  openEditRealNameDialog(){}
  openEditDescriptionDialog(){}
  openChangePasswordDialog(){}


}
