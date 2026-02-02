import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { WaitSpinner } from '../../shared/wait-spinner/wait-spinner';
import { PatientService } from '../patient-service';
import { MatDialog } from '@angular/material/dialog';
import { PatientList } from '../../dialogs/patient-list/patient-list';

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule,MatFormField,MatLabel,MatInput,MatError,MatIcon,MatButton,
    WaitSpinner
  ],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  patientService = inject(PatientService);
  dialog = inject(MatDialog);

  displayWaitSpinner = signal(false);

  name_FormControl = new FormControl("",{
    validators:[
      Validators.maxLength(32),
    ]
  });
  nid_FormControl = new FormControl("",{
    validators:[
      Validators.maxLength(10),
    ]
  });

  constructor(){}

  search(){
    if(this.name_FormControl.valid && this.nid_FormControl.valid){
      this.displayWaitSpinner.set(true);
      this.patientService.searchPatients(this.name_FormControl.value,this.nid_FormControl.value).subscribe({
        next: res => {
          if(res){
            this.dialog.open(PatientList,{data:{
              label:"Found Patients",
              patients: res,
            }});
          }
        },
      });
    }
  }

}
