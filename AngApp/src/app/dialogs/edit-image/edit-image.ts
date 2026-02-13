import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-edit-image',
  imports: [MatDialogContent, MatFormField, MatButton,MatDialogActions,MatDialogClose,MatLabel,MatInput,
    ReactiveFormsModule, MatError,JsonPipe,
  ],
  templateUrl: './edit-image.html',
  styleUrl: './edit-image.css',
})
export class EditImage {
  //readonly dialogRef = inject(MatDialogRef<EditImageTitle>);
  readonly data = inject<{
    value:string|null, 
    title:string, 
    enableEdit?:boolean, 
    imageSize?:number, 
    displayTitle?:boolean
  }>(MAT_DIALOG_DATA);
  
  selectedFile = signal<File | null>(null);
  previewImgSrc = signal(this.data.value);
  imageSizeError = signal<string|null>(null);

  //previewImg = viewChild<ElementRef<HTMLImageElement>>("previewImg");
  canvas = viewChild<ElementRef<HTMLCanvasElement>>("canvas");

  titleControl = new FormControl(this.data.title,{nonNullable:true,validators:[Validators.required,
    Validators.maxLength(128), 
    Validators.minLength(3)
  ]})

  onSelectImage(event:Event){
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      if(this.data.imageSize && (input.files[0].size > this.data.imageSize)){
        if(this.canvas()){
          const reader = new FileReader(); // Create a FileReader instance

          // Load the image as a Data URL
          reader.onload = (e)=> {
            const img = new Image();
            img.onload = ()=>{
              const ctx = this.canvas()!.nativeElement.getContext("2d");
              // Set new size
              const newWidth = 800;
              const newHeight = Math.round((img.height / img.width) * newWidth);

              this.canvas()!.nativeElement.width = newWidth;
              this.canvas()!.nativeElement.height = newHeight;

              // Draw resized image
              if(ctx){
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
              }

              // Convert to data URL (can be uploaded or displayed)
              const resizedDataUrl = this.canvas()!.nativeElement.toDataURL("image/webp", 0.8); // 0.8 = quality only for image/jpeg and image/webp
              this.previewImgSrc.set(resizedDataUrl);
              
              this.canvas()!.nativeElement.toBlob((blob)=>{
                if(blob){
                  let file = new File([blob], "editedUserImage", {
                    type: blob.type || "application/octet-stream",
                    lastModified: Date.now()
                  });
                  this.selectedFile.set(file);
                }
              },"image/webp", 0.8);
            };
            img.src = e.target!.result as string ?? this.data.value;
          };

          reader.readAsDataURL(input.files[0]); // Read the file as a Data URL
        }
        else{
          this.imageSizeError.set(
            `The size of the choosen image cannot be more than ${this.data.imageSize / 1024} KB!`
          );
        }
      }
      else{
        this.selectedFile.set(input.files[0]);

        const reader = new FileReader(); // Create a FileReader instance

        // Load the image as a Data URL
        reader.onload = (e)=> {
          this.previewImgSrc.set(e.target!.result as string ?? this.data.value);
        };

        reader.readAsDataURL(input.files[0]); // Read the file as a Data URL
      }
    }
    else{
      this.selectedFile.set(null);
      this.previewImgSrc.set(this.data.value);
    }
  }

}
