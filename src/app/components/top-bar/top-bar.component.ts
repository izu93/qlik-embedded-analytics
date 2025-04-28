import { Component, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-bar',
  standalone: true,  // <-- VERY IMPORTANT
  imports: [CommonModule],  // <-- Needed to use basic *ngIf etc.
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent {
  isChatOpen = false;
  isAlertOpen = false;
  isDarkMode = false;

  constructor(private renderer: Renderer2) { }


  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  toggleAlert() {
    this.isAlertOpen = !this.isAlertOpen;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.renderer.addClass(document.documentElement, 'dark');
    } else {
      this.renderer.removeClass(document.documentElement, 'dark');
    }
  }
}
