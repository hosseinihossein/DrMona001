import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { NgOptimizedImage } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { IdentityService } from '../../identity/identity-service';

@Component({
  selector: 'app-account-dropdown',
  imports: [MatIconButton, MatMenuTrigger, MatIcon, NgOptimizedImage,MatTooltip],
  templateUrl: './account-dropdown.html',
  styleUrl: './account-dropdown.css'
})
export class AccountDropdown {
  menu = input.required<MatMenu>();
  identityService = inject(IdentityService);

  imgSrc = computed(() => this.identityService.getUserImageAddress(this.identityService.userModel()));
    
  readonly imgBtnStyle = "padding: 0px; width: 40px; height: 40px; transform: translateY(3px);"

}
