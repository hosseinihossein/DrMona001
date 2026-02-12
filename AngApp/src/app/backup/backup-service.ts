import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BackupStatus } from './backup/backup';
import { RestoreStatus } from './restore/restore';

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  readonly httpClient = inject(HttpClient);

  requestBackupStatus(){
    return this.httpClient.get<BackupStatus>("/api/Backup/GetBackupStatus");
  }
  requestGeneratingBackupFile(){
    return this.httpClient.get("/api/Backup/GenerateBackupFile");
  }
  requestDownloadingBackupFile(){
    return this.httpClient.get("/api/Backup/DownloadBackupFile", {
      responseType: "blob",//browsers handle Blob streaming efficiently
      observe: "body",//by default return response body, so it's optional
    });
  }
  requestDeleteBackup(){
    return this.httpClient.delete("/api/Backup/DeleteBackupFile");
  }

  //***** restore *****
  requestRestoreStatus(){
    return this.httpClient.get<RestoreStatus>("/api/Backup/GetRestoreStatus");
  }
  requestUploadBackupFile(file:File){
    let formData = new FormData();
    formData.append("File",file);
    return this.httpClient.post<{success:boolean}>(
      "/api/Backup/UploadBackupFile", formData, {reportProgress:true, observe:"events"}
    );
  }
  requestRestore(){
    return this.httpClient.get("/api/Backup/RestoreFromBackup");
  }

}
