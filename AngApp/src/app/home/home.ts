import { AfterViewInit, Component, effect, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Result } from '../dialogs/result/result';
import { Search } from "../patient/search/search";
import { MatAnchor } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { IdentityService } from '../identity/identity-service';
import { NgOptimizedImage } from "@angular/common";

@Component({
  selector: 'app-home',
  imports: [Search, MatAnchor, MatIcon, RouterLink, NgOptimizedImage],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit {
  actiatedRoute = inject(ActivatedRoute);
  dialog = inject(MatDialog);
  identitySerice = inject(IdentityService);
  router = inject(Router);

  constructor(){
    effect(()=>{
      if(!this.identitySerice.isAuthenticated()){
        this.router.navigate(['/login']);
      }
    });
  }
  ngAfterViewInit(): void {
    this.actiatedRoute.data.subscribe(data=>{
      if(data){
        if(data["accessDenied"]){
          this.dialog.open(Result,{data:{
            status:"warning",
            title:"Access Denied!",
            description: [
              "You're Not Allowed to access the specified route!"
            ],
          }});
        }
      }
    });
  }
}
