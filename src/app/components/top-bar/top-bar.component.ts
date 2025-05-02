import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QlikAPIService } from '../../services/qlik-api.service'; // Adjust path as needed

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent implements OnInit {
  isChatOpen = false;
  isAlertOpen = false;
  isDarkMode = false;
  currentUser: string = '';

  constructor(
    private renderer: Renderer2,
    private qlikService: QlikAPIService
  ) {}

  ngOnInit(): void {
    this.qlikService.getCurrentUserName()
      .then(name => this.currentUser = name)
      .catch(() => this.currentUser = 'User');
  }

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
