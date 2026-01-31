import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Identity_NewUser_FormModel } from './admin/new-user-form/new-user-form';
import { Identity_EditUser_FormModel } from './admin/edit-user-form/edit-user-form';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private token_StorageKey = "DrMona_jwt_token";
  private user_StorageKey = "DrMona_user_model";
  private tokenExpiration_StorageKey = "DrMona_token_expire";
  private httpClient = inject(HttpClient);

  isAuthenticated = signal(false);
  userModel = signal<Identity_UserModel | null>(null);
  token = signal<string | null>(null);

  constructor(){
    this.isAuthenticated.set(this.hasRecord());
    this.userModel.set(this.getUserModelFromLocalStorage());
    this.token.set(this.getTokenFromLocalStorage());
  }

  private hasRecord():boolean{
    if(localStorage.getItem(this.token_StorageKey) && 
    localStorage.getItem(this.tokenExpiration_StorageKey) &&
    localStorage.getItem(this.user_StorageKey)){
      let expireDate = Date.parse(localStorage.getItem(this.tokenExpiration_StorageKey)!);
      if(Date.now() < expireDate){
        return true;
      }
      else{
        this.logout();
      }
    }
    return false;
  }
  private getTokenFromLocalStorage(): string | null{
    if(this.isAuthenticated()){
      return localStorage.getItem(this.token_StorageKey);
    }
    return null;
  }
  private getUserModelFromLocalStorage(): Identity_UserModel | null{
    if(this.isAuthenticated()){
      return JSON.parse(localStorage.getItem(this.user_StorageKey)!);
    }
    return null;
  }

  getCsrf(){
    return this.httpClient.get("/api/Identity/GetCsrf");
  }

  login(username: string, password: string){
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return this.httpClient.post<{token:string, expiresInHours:string, user: Identity_UserModel}>(
      "/api/Identity/login", formData
    ).pipe(
      tap({
        next: res => {
          this.token.set(res.token);
          localStorage.setItem(this.token_StorageKey, res.token);

          let expireDate = new Date(Date.now());
          expireDate.setHours(expireDate.getHours() + Number(res.expiresInHours));
          localStorage.setItem(this.tokenExpiration_StorageKey, expireDate.toString());

          this.userModel.set(res.user);
          localStorage.setItem(this.user_StorageKey, JSON.stringify(this.userModel()));

          this.isAuthenticated.set(true);
        },
      }),
    );
  }
  logout(){
    localStorage.removeItem(this.token_StorageKey);
    localStorage.removeItem(this.user_StorageKey);
    localStorage.removeItem(this.tokenExpiration_StorageKey);
    this.isAuthenticated.set(false);
    this.userModel.set(null);
    this.token.set(null);
    console.log("user logout!");
  }

  requestCreateNewUser(formModel:Identity_NewUser_FormModel){
    return this.httpClient.post<{success:boolean}>(
      "/api/Identity/SubmitNewUser", formModel
    );
  }
  requestAllRoles(){
    return this.httpClient.get<string[]>("/api/Identity/GetAllRoles");
  }
  requestUserRoles(userGuid:string){
    let httpParams = new HttpParams().set("userGuid",userGuid);
    return this.httpClient.get<string[]>("/api/Identity/GetUserRoles",{params:httpParams});
  }
  requestEditUser(formModel:Identity_EditUser_FormModel){
    return this.httpClient.post<{success:boolean}>(
      "/api/Identity/SubmitEditUser", formModel
    );
  }

  getUserImageAddress(userModel:{guid:string, integrityVersion:number, hasImage:boolean}|null):string|null{
    if(userModel?.hasImage && userModel.guid){
      return `/api/Identity/UserImage?userGuid=${userModel.guid}&v=${userModel.integrityVersion}`;
    }
    return null;
  }

  requestUserModel(userGuid:string){
    return this.httpClient.get<Identity_UserModel>(`/api/Identity/GetUserModel?userGuid=${userGuid}`);
  }
  requestUserList(){
    return this.httpClient.get<Identity_UserModel[]>("/api/Identity/GetUserList");
  }

  requestChangeUserName(username:string){
    const formData = new FormData();
    formData.append("username",username);
    return this.httpClient.post<{success:boolean, token:string}>(
      `/api/Identity/SubmitUserName`, formData
      ).pipe(tap({
        next: res => {
          this.token.set(res.token);
          localStorage.setItem(this.token_StorageKey, res.token);
        },
      })
    );
  }
  requestChangeFullName(fullName:string){
    const formData = new FormData();
    formData.append("fullName",fullName);
    return this.httpClient.post<{success:boolean}>(
      `/api/Identity/SubmitFullName`, formData
    );
  }
  requestChangeDescription(description:string){
    const formData = new FormData();
    formData.append("description",description);
    return this.httpClient.post<{success:boolean}>(
      `/api/Identity/SubmitDescription`, formData
    );
  }
  requestChangePassword(currentPassword:string, newPassword:string){
    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    return this.httpClient.post<{success:boolean, token:string}>(
      `/api/Identity/ChangePassword`, formData
      ).pipe(tap({
        next: res => {
          this.token.set(res.token);
          localStorage.setItem(this.token_StorageKey, res.token);
        },
      })
    );
  }
  requestSubmitUserImage(file: File){
    const formData = new FormData();
    formData.append('userImageFile', file);
    return this.httpClient.post<{success: boolean, hasImage: boolean, integrityVersion:number}>(
      "/api/Identity/SubmitUserImage", formData
    );
  }
  requestDeleteUserImage(){
    return this.httpClient.delete<{success:boolean}>(
      "/api/Identity/DeleteUserImage"
    );
  }
  
}

export class Identity_UserModel
{
  constructor(userModel?:Identity_UserModel){
    this.guid = userModel?.guid ?? "";
    this.userName = userModel?.userName ?? "";
    this.fullName = userModel?.fullName;
    this.description = userModel?.description;
    this.hasImage = userModel?.hasImage ?? false;
    this.integrityVersion = userModel?.integrityVersion ?? 0;
    this.roles = userModel?.roles.map(r=>r) ?? [];
  }
  guid: string;
  userName: string;
  fullName?: string|null;
  description?: string|null;
  hasImage:boolean;
  integrityVersion:number;
  roles: string[];
}