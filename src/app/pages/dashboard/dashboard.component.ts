import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- IMPORTANT

@Component({
  selector: 'app-dashboard',
  standalone: true, // make sure you have standalone true
  imports: [CommonModule], // <-- ADD THIS
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  kpiList = [
    {
      label: 'Total Revenue',
      value: '$120K',
      color: 'text-black',
      borderColor: 'border-gray-300'
    },
    {
      label: 'Active Users',
      value: '4,350',
      color: 'text-black',
      borderColor: 'border-gray-300'
    },
    {
      label: 'Churn Rate',
      value: '2.5%',
      color: 'text-red-500',
      borderColor: 'border-red-400'
    },
    {
      label: 'New Signups',
      value: '850',
      color: 'text-green-500',
      borderColor: 'border-green-400'
    }
  ];

}
