import { Component, input } from '@angular/core';
import { DocumentElementModel } from '../document-element';

@Component({
  selector: 'app-p-element',
  imports: [],
  templateUrl: './p-element.html',
  styleUrl: './p-element.css',
})
export class PElement {
  elementModel = input.required<DocumentElementModel>();
}
