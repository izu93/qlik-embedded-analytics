import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- IMPORTANT
import { interval, takeWhile } from 'rxjs'; // <-- RxJS for smooth counting

@Component({
  selector: 'app-dashboard',
  standalone: true, // make sure you have standalone true
  imports: [CommonModule], // <-- ADD THIS
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  // Original final values for KPIs
  kpiData = [
    { label: 'Total Revenue', target: 120000, color: 'text-black', borderColor: 'border-gray-300', prefix: '$' },
    { label: 'Active Users', target: 4350, color: 'text-black', borderColor: 'border-gray-300' },
    { label: 'Churn Rate', target: 2.5, color: 'text-red-500', borderColor: 'border-red-400', suffix: '%' },
    { label: 'New Signups', target: 850, color: 'text-green-500', borderColor: 'border-green-400' }
  ];
  // The list shown in UI (starts from 0)
  kpiList = this.kpiData.map(kpi => ({
    ...kpi,
    value: 0
  }));

  constructor() {
    this.animateKPIs();
  }

  animateKPIs() {
    const duration = 1500; // Animation duration in milliseconds
    const fps = 60; // Frames per second
    const intervalTime = 1000 / fps;
    const steps = duration / intervalTime;

    this.kpiList.forEach((kpi, index) => {
      const increment = this.kpiData[index].target / steps;

      const counter = interval(intervalTime).pipe(
        takeWhile(() => this.kpiList[index].value < this.kpiData[index].target)
      );

      counter.subscribe(() => {
        this.kpiList[index].value += increment;

        // Clamp to final value
        if (this.kpiList[index].value > this.kpiData[index].target) {
          this.kpiList[index].value = this.kpiData[index].target;
        }
      });
    });
  }
}
