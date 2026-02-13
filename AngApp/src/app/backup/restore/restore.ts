import { DatePipe } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardActions, MatCardModule } from '@angular/material/card';
import { BackupService } from '../backup-service';
import { WindowService } from '../../shared/services/window-service';
import { MatDialog } from '@angular/material/dialog';
import { EditFile } from '../../dialogs/edit-file/edit-file';
import { HttpEventType } from '@angular/common/http';
import { Result } from '../../dialogs/result/result';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { IdentityService } from '../../identity/identity-service';

@Component({
  selector: 'app-restore',
  imports: [
    MatCardModule, MatButton, RouterLink,MatIcon,
  ],
  templateUrl: './restore.html',
  styleUrl: './restore.css',
})
export class Restore {
  private refreshInterval = signal<number>(0);
  private timerInterval = signal<number>(0);
  restoreStatus = signal<RestoreStatus|null>(null);

  backupService = inject(BackupService);
  windowService = inject(WindowService);
  dialog = inject(MatDialog);
  identityService = inject(IdentityService);
  router = inject(Router);

  matCardActions = viewChild.required(MatCardActions, {read:ElementRef});
  timer = signal<number|null>(null);

  displayWaitSpinner = signal(true);
  waitSpinnerValue = signal(0);

  constructor(){
    this.backupService.requestRestoreStatus().subscribe({
      next: res => {
        if(res){
          this.restoreStatus.set(res);
          this.displayWaitSpinner.set(false);
        }
      },
      error: err => {
        console.log(JSON.stringify(err));
        this.restoreStatus.set(null);
      },
    });

    this.identityService.getCsrf().subscribe({
      next: res => {
        console.log("csrf received.");
      },
    });

    effect(()=>{
      if(!this.identityService.isAuthenticated()){
        this.router.navigate(["/"]);
      }
    });
  }
  ngOnDestroy(): void {
    clearInterval(this.refreshInterval());
    clearInterval(this.timerInterval());
  }

  uploadFile() {
    if(this.restoreStatus()?.process !== "Started"){
      this.dialog.open(EditFile,{data:{
        value:"",
        title:"",
      }}).afterClosed().subscribe(result=>{
        if(result && result.file){
          this.displayWaitSpinner.set(true);
          this.backupService.requestUploadBackupFile(result.file).subscribe({
            next: event => {
              if(event.type === HttpEventType.UploadProgress && event.total){
                this.waitSpinnerValue.set(Math.round((100 * event.loaded) / event.total));
              }
              if(event.type === HttpEventType.Response && event.body){
                this.restoreStatus.set(event.body);

                this.displayWaitSpinner.set(false);
                this.waitSpinnerValue.set(0);
              }
            },
            error: (err) => {
              this.displayWaitSpinner.set(false);
              this.waitSpinnerValue.set(0);
              this.dialog.open(Result,{
                data:{
                  status: "warning",
                  title: "Error Uploading File",
                  description: [
                    "Something went wrong during uploading the backup file!",
                    JSON.stringify(err),
                  ],
                }
              });
              throw(err);
            }
          });
        }
      });
    }
  }
  restore(){
    if(this.restoreStatus()?.process !== "Started"){
      this.backupService.requestRestore().subscribe({
        next: () => {
          //define timer interval
          this.timerInterval.set(setInterval(() => {
            this.timer.update(t=>{
              if(t === null || t <= 0){
                t = 10;
              }
              else{
                t -= 1;
              }
              return t;
            });
          }, 1000));
          //define refresh interval
          this.refreshInterval.set(setInterval(() => {
            this.backupService.requestRestoreStatus().subscribe({
              next: res => {
                if(res){
                  this.restoreStatus.set(res);
                  if(res.process === "Completed"){
                    clearInterval(this.refreshInterval());
                    clearInterval(this.timerInterval());
                    this.timer.set(null);
                  }
                }
              },
              error: err => {
                console.log(JSON.stringify(err));
                this.restoreStatus.set(null);
              },
            });
          }, 10000));//every 10 seconds
  
          //display result
          this.dialog.open(Result, {data:{
            status: "success",
            title: "Restoring Data",
            description: [
              "Your request for restoring from the backup file sent to the serer successfully.",
              "Please wait untill the restore process gets done successfully.",
              "You can check whether the restore process is completed or not from the status information that gets refreshed every 10 seconds."
            ],
          }});
        },
      });
    }
  }
}

export class RestoreStatus {
  backup_File_Name:string|null = null;
  process:string = null!;
  extracting_Zip_File:string = null!;
  clearing_All_Dbs:string = null!;
  seeding_Identity_User_Db:string = null!;
  seeding_Patient_Patient_Db:string = null!;
  seeding_Patient_Document_Db:string = null!;
  seeding_Patient_Element_Db:string = null!;
}
