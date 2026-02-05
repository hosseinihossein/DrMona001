import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DocumentElementModel } from '../document-element';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-code-element',
  imports: [MatIcon, MatIconButton, MatTooltip],
  templateUrl: './code-element.html',
  styleUrl: './code-element.css',
})
export class CodeElement {
  elementModel = input.required<DocumentElementModel>();

  clipboard = inject(Clipboard);
  
  codePreElement = viewChild<ElementRef<HTMLPreElement>>("codePre");
  
  copyCode(){
    if(this.codePreElement()){
      let code = this.codePreElement()!.nativeElement.innerHTML ??  '';
      code = code.replaceAll("&lt;","<");
      code = code.replaceAll("&gt;",">");
      this.clipboard.copy(code);
    }
  }
}
