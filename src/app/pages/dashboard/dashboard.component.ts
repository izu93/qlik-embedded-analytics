import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, takeWhile } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
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
    const duration = 2000; // Each KPI animation duration
    const fps = 75;
    const intervalTime = 1000 / fps;
    const steps = duration / intervalTime;
    const staggerDelay = 200; // <-- NEW: 200ms delay between KPIs

    this.kpiList.forEach((kpi, index) => {
      setTimeout(() => {
        const increment = this.kpiData[index].target / steps;

        const counter = interval(intervalTime).pipe(
          takeWhile(() => this.kpiList[index].value < this.kpiData[index].target)
        );

        counter.subscribe(() => {
          this.kpiList[index].value += increment;

          if (this.kpiList[index].value > this.kpiData[index].target) {
            this.kpiList[index].value = this.kpiData[index].target;
          }
        });
      }, index * staggerDelay); // <-- NEW: Delayed each KPI start
    });
  }

  // ➡️ New: Format function (for 120K / 1M etc.)
  formatValue(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toFixed(0);
    }
  }

}
