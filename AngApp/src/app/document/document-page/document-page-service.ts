import { Injectable, signal } from '@angular/core';
import { DocumentPageModel } from './document-page';

@Injectable()
export class DocumentPageService {
  editMode = signal(false);
  documentPageModel = signal<DocumentPageModel|null>(null);

  constructor(){}

  toggleEditMode(){
    this.editMode.update(m=>!m);
  }
}
