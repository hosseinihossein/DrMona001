import { Component, input } from '@angular/core';
import { DocumentElementModel } from '../document-element';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';

@Component({
  selector: 'app-file-element',
  imports: [MatIcon, MatFabButton],
  templateUrl: './file-element.html',
  styleUrl: './file-element.css',
})
export class FileElement {
  elementModel = input.required<DocumentElementModel>();
}
