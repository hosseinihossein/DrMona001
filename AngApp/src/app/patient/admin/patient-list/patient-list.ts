import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { MatMiniFabButton, MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDelete } from '../../../dialogs/confirm-delete/confirm-delete';
import { WaitSpinner } from '../../../shared/wait-spinner/wait-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { IdentityService } from '../../../identity/identity-service';
import { PatientService } from '../../patient-service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-patient-list',
  imports: [MatTableModule, MatMiniFabButton, MatIcon, RouterLink, NgOptimizedImage, MatAnchor,
    WaitSpinner,MatTooltip,MatPaginator
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientList {
  dataSource = signal<Patient_PatientListModel[]>([]);
  displayedColumns = signal<string[]>(["PatientImage","FullName","NationalId","Guid","CreatedAt",
    "Actions"
  ]);
  numberOfAllPatients = signal<number>(0);
  pageSize = signal<number>(10);
  pageIndex = signal<number>(0);
  
  displayWaitSpinner = signal(true);
  identityService = inject(IdentityService);
  patientService = inject(PatientService);
  dialog = inject(MatDialog);
  router = inject(Router);

  constructor(){
    effect(()=>{
      this.patientService.requestPatientList(this.pageIndex(),this.pageSize()).subscribe({
        next: res => {
          if(res){
            this.dataSource.set(res);
            this.displayWaitSpinner.set(false);
          }
        },
      });
    });

    this.patientService.requestNumberOfPatients().subscribe({
      next: res => {
        if(res){
          this.numberOfAllPatients.set(res.totalNumberOfPatients);
        }
      },
    });

    effect(()=>{
      if(!this.identityService.isAuthenticated()){
        this.router.navigate(["/"]);
      }
    });
  }

  deletePatient(guid:string,fullName:string){
    this.identityService.getCsrf().subscribe({
      next: () => {console.log("csrf received.")},
    });
    
    this.dialog.open(ConfirmDelete,{data:{
      title:fullName,
      type: "patient"
    }}).afterClosed().subscribe(result=>{
      if(result && result === true){
        this.displayWaitSpinner.set(true);
        this.patientService.requestDeletePatient(guid).subscribe({
          next: res => {
            if(res && res.success){
              this.dataSource.update(ds=>{
                let index = ds.findIndex(pm=>pm.guid === guid);
                ds.splice(index,1);
                return ds.map(um=>new Patient_PatientListModel(um));
              });
            }
            this.displayWaitSpinner.set(false);
          },
        });
      }
    });
  }

  handlePageEvent(e: PageEvent) {
    //let length = e.length;
    this.pageSize.set(e.pageSize);
    this.pageIndex.set(e.pageIndex);
  }

}

export class Patient_PatientListModel{
  constructor(model:Patient_PatientListModel){
    this.guid = model.guid;
    this.nationalId = model.nationalId;
    this.fullName = model.fullName;
    this.hasImage = model.hasImage;
    this.integrityVersion = model.integrityVersion;
    this.createdAt = model.createdAt;
  }

  guid:string = null!;
  nationalId:string = null!;
  fullName:string = null!;
  hasImage:boolean = false;
  integrityVersion: number = 0;
  createdAt:Date = null!;
}
