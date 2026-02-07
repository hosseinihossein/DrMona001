import { Component, inject, input, output } from '@angular/core';
import { ElementEditBox } from './element-edit-box/element-edit-box';
import { H1Element } from './h1-element/h1-element';
import { PElement } from './p-element/p-element';
import { ImgElement } from './img-element/img-element';
import { CodeElement } from './code-element/code-element';
import { FileElement } from './file-element/file-element';
import { DocumentPageService } from '../document-page/document-page-service';

@Component({
  selector: 'app-document-element',
  imports: [ElementEditBox, H1Element, PElement, ImgElement, CodeElement, FileElement,

  ],
  templateUrl: './document-element.html',
  styleUrl: './document-element.css',
})
export class DocumentElement {
  elementModel = input.required<DocumentElementModel>();
  headingInitialized = output<HTMLHeadingElement>();

  documentPageService = inject(DocumentPageService);

  
}

export class DocumentElementModel{
  constructor(model:DocumentElementModel){
    this.guid = model.guid;
    this.tab = model.tab;
    this.type = model.type;
    this.value = model.value;
    this.order = model.order;
    this.title = model.title;
    this.persian = model.persian;
  }

  guid:string = null!;
  tab:string = null!;
  type:string = null!;
  order:number = null!;
  value?:string;
  title?: string;
  fileName?: string;
  persian:boolean = false;
}

export class NewElementFormModel{
  DocumentGuid:string = null!;
  Tab:string = null!;
  Type:string = null!;
  Value?:string;
  Title?:string;
  File?:File;
  Persian?:boolean = false;
}
