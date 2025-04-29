import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-writeback-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './writeback-table.component.html',
  styleUrls: ['./writeback-table.component.css']
})
export class WritebackTableComponent {

  writebackData = [
    {
      customerId: 'CUST001',
      customerName: 'John Doe',
      churnPrediction: 'Churn',
      probability: 0.87,
      lastInteraction: '2025-04-10',
      assignedAgent: 'Agent A',
      actionTaken: 'Called - No Response',
      status: 'Pending',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST002',
      customerName: 'Jane Smith',
      churnPrediction: 'No Churn',
      probability: 0.15,
      lastInteraction: '2025-04-27',
      assignedAgent: 'Agent B',
      actionTaken: 'Email Sent',
      status: 'Confirmed',
      feedback: 'Satisfied with service',
      changed: false
    },
    {
      customerId: 'CUST003',
      customerName: 'David Chen',
      churnPrediction: 'Churn',
      probability: 0.72,
      lastInteraction: '2025-04-25',
      assignedAgent: 'Agent A',
      actionTaken: '',
      status: 'In Progress',
      feedback: '',
      changed: false
    }
  ];

  isSaving = false;
  showToast = false;

  markChanged(row: any) {
    row.changed = true;
  }

  hasChanges(): boolean {
    return this.writebackData.some(row => row.changed);
  }

  saveChanges() {
    this.isSaving = true;
    setTimeout(() => {
      this.writebackData.forEach(row => row.changed = false);
      this.isSaving = false;
      this.showToast = true;
      setTimeout(() => this.showToast = false, 3000);
    }, 1500);
  }
}
