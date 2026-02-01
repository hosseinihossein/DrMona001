import { AfterViewInit, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Result } from '../dialogs/result/result';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit {
  actiatedRoute = inject(ActivatedRoute);
  dialog = inject(MatDialog);

  constructor(){}
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
