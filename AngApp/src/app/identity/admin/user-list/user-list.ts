import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { MatMiniFabButton, MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { Identity_UserModel, IdentityService } from '../../identity-service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDelete } from '../../../dialogs/confirm-delete/confirm-delete';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-list',
  imports: [MatTableModule, MatMiniFabButton, MatIcon, RouterLink, NgOptimizedImage, MatAnchor,
    WaitSpinner,MatTooltip,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  dataSource = signal<Identity_UserListModel[]>([]);
  displayedColumns = signal<string[]>(["UserImage","FullName","UserName","UserGuid","Actions"]);
  
  displayWaitSpinner = signal(true);

  identityService = inject(IdentityService);
  dialog = inject(MatDialog);
  router = inject(Router);

  constructor(){
    this.identityService.requestUserList().subscribe({
      next: res => {
        if(res){
          this.dataSource.set(res);
          this.displayWaitSpinner.set(false);
        }
      },
    });

    effect(()=>{
      if(!this.identityService.isAuthenticated()){
        this.router.navigate(["/"]);
      }
    });
  }

  deleteUser(userGuid:string,userName:string){
    this.identityService.getCsrf().subscribe({
      next: () => {console.log("csrf received.")},
    });
    
    this.dialog.open(ConfirmDelete,{data:{
      title:userName,
      type: "user"
    }}).afterClosed().subscribe(result=>{
      if(result && result === true){
        this.displayWaitSpinner.set(true);
        this.identityService.requestDeleteUser(userGuid).subscribe({
          next: res => {
            if(res && res.success){
              this.dataSource.update(ds=>{
                let index = ds.findIndex(userModel=>userModel.guid === userGuid);
                ds.splice(index,1);
                return ds.map(um=>new Identity_UserListModel(um));
              });
            }
            this.displayWaitSpinner.set(false);
          },
        });
      }
    });
  }
}

export class Identity_UserListModel{
  constructor(model:Identity_UserListModel){
    this.guid = model.guid;
    this.userName = model.userName;
    this.fullName = model.fullName;
    this.hasImage = model.hasImage;
    this.integrityVersion = model.integrityVersion;
  }

  guid:string = null!;
  userName:string = null!;
  fullName:string = null!;
  hasImage:boolean = false;
  integrityVersion: number = 0;
}
