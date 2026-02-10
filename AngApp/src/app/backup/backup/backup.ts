import { DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardActions, MatCardModule, } from '@angular/material/card';
import { BackupService } from '../backup-service';
import { WindowService } from '../../shared/services/window-service';
import { MatDialog } from '@angular/material/dialog';
import { Result } from '../../dialogs/result/result';

@Component({
  selector: 'app-backup',
  imports: [MatCardModule, MatButton, DatePipe,
  ],
  templateUrl: './backup.html',
  styleUrl: './backup.css',
})
export class Backup {
  private refreshInterval = signal<number>(0);
  private timerInterval = signal<number>(0);
  backupStatus = signal<BackupStatus|null>(null);

  backupService = inject(BackupService);
  windowService = inject(WindowService);
  dialog = inject(MatDialog);

  matCardActions = viewChild.required(MatCardActions, {read:ElementRef});
  timer = signal<number|null>(null);

  constructor(){
    this.backupService.requestBackupStatus().subscribe({
      next: res => {
        if(res){
          this.backupStatus.set(res);
        }
      },
      error: err => {
        console.log(JSON.stringify(err));
        this.backupStatus.set(null);
      },
    });
  }
  ngOnDestroy(): void {
    clearInterval(this.refreshInterval());
    clearInterval(this.timerInterval());
  }

  downloadFile() {
    if(this.backupStatus()){
      this.backupService.requestDownloadingBackupFile().subscribe({
        next: (blob: Blob) => {
          // Create a temporary link to trigger browser download
          const url = window.URL.createObjectURL(blob);
          const a = this.windowService.nativeWindow.document.createElement('a');
          a.href = url;
          a.download = this.backupStatus()!.fileName; // Suggested filename
          this.matCardActions().nativeElement.appendChild(a);
          a.click();
          this.matCardActions().nativeElement.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Download failed:', err);
          throw(err);
        }
      });
    }
  }
  deleteFile(){
    if(this.backupStatus()){
      this.backupService.requestDeleteBackup().subscribe({
        next: ()=>{
          this.backupService.requestBackupStatus().subscribe({
            next: res => {
              if(res){
                this.backupStatus.set(res);
              }
            },
            error: err => {
              console.log(JSON.stringify(err));
              this.backupStatus.set(null);
            },
          });
        },
      });
    }
  }
  generateFile(){
    this.backupService.requestGeneratingBackupFile().subscribe({
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
          this.backupService.requestBackupStatus().subscribe({
            next: res => {
              if(res){
                this.backupStatus.set(res);
                if(res.readyToDownload){
                  clearInterval(this.refreshInterval());
                  clearInterval(this.timerInterval());
                  this.timer.set(null);
                }
              }
            },
            error: err => {
              console.log(JSON.stringify(err));
              this.backupStatus.set(null);
            },
          });
        }, 10000));//every 10 seconds

        //display result
        this.dialog.open(Result, {data:{
          status: "success",
          title: "Generating Backup File",
          description: [
            "Your request for generating the backup file sent successfully.",
            "Please wait untill the backup file gets ready.",
            "You can check whether it's ready to download or not from the status information that gets refreshed every 10 seconds."
          ],
        }});
      },
    });
  }
  
}

export class BackupStatus {
  process:string = null!;
  generating_Zip_File:string = null!;
  getting_Identity_User_Backup:string = null!;
  getting_Patient_Patient_Backup:string = null!;
  getting_Patient_Document_Backup:string = null!;
  getting_Patient_Element_Backup:string = null!;
  created_At:Date = null!;
  file_Size:number = 0;
  file_Name:string = null!;
  ready_To_Download:boolean = false;
}
