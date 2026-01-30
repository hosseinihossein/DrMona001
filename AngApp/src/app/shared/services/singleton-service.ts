import { inject, Injectable, signal } from '@angular/core';
import { WindowService } from './window-service';

@Injectable({
  providedIn: 'root',
})
export class SingletonService {
  private theme_StorageKey = "DrMona_theme";

  windowService = inject(WindowService);
  
  darkMode = signal(false);

  constructor(){
    let theme = localStorage.getItem(this.theme_StorageKey);
    if(theme && theme == "dark"){
      this.darkMode.set(true);
      this.windowService.nativeWindow.document.body.classList.add('dark-mode');
    }
    else{
      this.darkMode.set(false);
      this.windowService.nativeWindow.document.body.classList.remove('dark-mode');
    }
  }

  toggleDarkMode(){
    this.darkMode.update(mode=>!mode);
    if(this.darkMode()){
      this.windowService.nativeWindow.document.body.classList.add('dark-mode');
      localStorage.setItem(this.theme_StorageKey, "dark");
    }
    else{
      this.windowService.nativeWindow.document.body.classList.remove('dark-mode');
      localStorage.removeItem(this.theme_StorageKey);
    }
  }

}
