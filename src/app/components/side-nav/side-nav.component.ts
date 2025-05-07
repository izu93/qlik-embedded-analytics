import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router'; // <-- Import these!

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule,
    RouterLink,        // <-- ADD THIS
    RouterLinkActive   // <-- ADD THIS
  ],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent {
  isCollapsed = true;

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
