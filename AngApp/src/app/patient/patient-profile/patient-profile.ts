import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatAnchor } from '@angular/material/button';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IdentityService } from '../../identity/identity-service';
import { PatientService } from '../patient-service';
import { WaitSpinner } from '../../shared/wait-spinner/wait-spinner';

@Component({
  selector: 'app-patient-profile',
  imports: [MatCardModule, MatIcon, MatButton, NgOptimizedImage, WaitSpinner, 
    MatAnchor, RouterLink
  ],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile {
  identityService = inject(IdentityService);
  patientService = inject(PatientService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  patientGuid = signal<string|null>(null);
  patientModel = signal<Patient_ProfileModel|null>(null);
  patientImgSrc = computed(()=>this.patientService.getPatientImageAddress(this.patientModel()));
  displayWaitSpinner = signal(true);

  constructor(){
    this.activatedRoute.paramMap.subscribe(params=>{
      if(params.has("patientGuid")){
        this.patientGuid.set(params.get("patientGuid"));
      }
    });

    effect(()=>{
      if(this.patientGuid()){
        this.patientService.requestPatientModel(this.patientGuid()!).subscribe({
          next: res => {
            if(res){
              this.patientModel.set(res);
              this.displayWaitSpinner.set(false);
            }
          },
        });
      }
    });

    effect(()=>{
      if(!this.identityService.isAuthenticated()){
        this.router.navigate(["/"]);
      }
    });
  }

}

export class Patient_ProfileModel
{
  constructor(patientModel?:Patient_ProfileModel){
    this.guid = patientModel?.guid ?? "";
    this.nationalId = patientModel?.nationalId ?? "";
    this.fullName = patientModel?.fullName;
    this.description = patientModel?.description;
    this.hasImage = patientModel?.hasImage ?? false;
    this.integrityVersion = patientModel?.integrityVersion ?? 0;
    this.createdAt = patientModel?.createdAt ?? new Date(Date.now());
  }
  guid: string;
  nationalId: string;
  fullName?: string|null;
  description?: string|null;
  hasImage:boolean;
  integrityVersion:number;
  createdAt:Date = null!;
}
