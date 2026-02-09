import { NgOptimizedImage } from '@angular/common';
import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { DocumentElementModel } from '../document-element';
import { MatDialog } from '@angular/material/dialog';
import { LargeImg } from '../../../dialogs/large-img/large-img';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DocumentService } from '../../document-service';
import { WindowService } from '../../../shared/services/window-service';

@Component({
  selector: 'app-img-element',
  imports: [/*NgOptimizedImage*/],
  templateUrl: './img-element.html',
  styleUrl: './img-element.css',
})
export class ImgElement implements OnDestroy {
  elementModel = input.required<DocumentElementModel>();

  readonly dialog = inject(MatDialog);
  sanitizer = inject(DomSanitizer);
  documentService = inject(DocumentService);
  //windowService = inject(WindowService);

  objectUrl = signal<string|null>(null);
  imageUrl = signal<SafeUrl|null>(null);

  constructor(){
    effect(()=>{
      if(this.elementModel() && this.elementModel().fileName){
        //console.log("img element guid: ",this.elementModel().guid);
        //console.log("img fileName: ",this.elementModel().fileName);
        this.documentService.requestElementFile(this.elementModel().guid,this.elementModel().fileName!).subscribe({
          next: blob => {
            this.objectUrl.set(URL.createObjectURL(blob));
            if(this.objectUrl()){
              this.imageUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.objectUrl()!));
              this.elementModel().value = this.objectUrl()!;
            }
          },
        });
      }
    });
  }
  ngOnDestroy(): void {
    if(this.objectUrl()){
      URL.revokeObjectURL(this.objectUrl()!);
    }
  }

  openLargeImage(){
    this.dialog.open(LargeImg, {data:{
      imgSrc:this.imageUrl(), 
      imgTitle: this.elementModel().title,
    }});
  }
}
