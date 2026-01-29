import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Identity_UserModel, IdentityService } from '../../identity-service';

@Component({
  selector: 'app-user-list',
  imports: [MatTableModule,MatMiniFabButton,MatIcon,RouterLink,NgOptimizedImage],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  dataSource = signal<Identity_UserModel[]>([
    //{description:"",guid:"123Guid",hasImage:false,integrityVersion:0,realName:"مونا بیشه",roles:[],userName:"DrMona"},
    //{description:"",guid:"456Guid",hasImage:false,integrityVersion:0,realName:"حسین حسینی",roles:[],userName:"hossein"},
  ]);
  displayedColumns = signal<string[]>(["UserImage","FullName","UserName","UserGuid","Actions"]);

  identityService = inject(IdentityService);

  constructor(){
    this.identityService.requestUserList().subscribe({
      next: res => {
        if(res){
          this.dataSource.set(res);
        }
      },
    });
  }

  deleteUser(userGuid:string,userName:string){}
}
