import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem } from '@angular/material/menu';
import { AccountDropdown } from "./account-dropdown/account-dropdown";
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { WindowService } from '../shared/services/window-service';
import { IdentityService } from '../identity/identity-service';
import { SingletonService } from '../shared/services/singleton-service';
import { UserList } from '../identity/admin/user-list/user-list';

@Component({
  selector: 'app-nav-bar',
  imports: [MatIcon, MatToolbar, MatIconButton, MatMenu, MatMenuItem, AccountDropdown, MatTooltip, 
    RouterLink,
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar implements OnDestroy {
  windowService = inject(WindowService);
  //document = inject(DOCUMENT);
  singleton = inject(SingletonService);
  identityService = inject(IdentityService);

  numberOfNotifications = signal<number>(0);
  notificationInterval = signal<number>(0);
  
  displayShadow = signal(false);

  constructor(){
    this.windowService.nativeWindow.addEventListener("scroll", ()=>{
      if(this.windowService.nativeWindow.scrollY >= 5){
        this.displayShadow.set(true);
      }
      else{
        this.displayShadow.set(false);
      }
    });
  }
  
  ngOnDestroy(): void {
    clearInterval(this.notificationInterval());
  }

}
