import { Component } from '@angular/core';

@Component({
  selector: 'app-document-element',
  imports: [],
  templateUrl: './document-element.html',
  styleUrl: './document-element.css',
})
export class DocumentElement {

}

export class DocumentElementModel{
  constructor(model:DocumentElementModel){
    this.guid = model.guid;
    this.type = model.type;
    this.value = model.value;
    this.order = model.order;
    this.title = model.title;
    this.persian = model.persian;
  }

  guid:string = null!;
  type:string = null!;
  value:string = null!;
  order:number = null!;
  title?: string;
  persian:boolean = false;
}

export class NewElementFormModel{
  DocumentGuid:string = null!;
  Tab:string = null!;
  Type:string = null!;
  Value?:string;
  Title?:string;
  File?:File;
}
