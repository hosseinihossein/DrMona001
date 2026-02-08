import { inject, Injectable, signal } from '@angular/core';
import { DocumentPageModel } from './document-page';
import { IdentityService } from '../../identity/identity-service';

@Injectable()
export class DocumentPageService {
  identityService = inject(IdentityService);
  
  editMode = signal(false);
  documentPageModel = signal<DocumentPageModel|null>(null);

  constructor(){}

  toggleEditMode(){
    this.editMode.update(m=>!m);
    if(this.editMode()){
      this.identityService.getCsrf().subscribe({
        next: () => {
          console.log("csrf token recieved successfully.");
        },
        error: err => {
          console.log("couldn't get csrf token");
          throw(err);
        }
      });
    }
  }
}
