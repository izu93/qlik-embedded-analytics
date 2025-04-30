import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-writeback-table-static-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './writeback-table-static-data.component.html',
  styleUrls: ['./writeback-table-static-data.component.css']
})
export class WritebackTableStaticDataComponent {
  //  Search term for filter bar
  searchTerm = '';

  //  Pagination state
  currentPage = 1;
  pageSize = 10;
  min = Math.min; // Needed for use in HTML interpolation
  // Array to track saved row IDs for visual feedback
  rowSaved: string[] = [];
  //  Save state loader
  isSaving = false;
  //Tracks touched input fields for validation display
  touchedFields = new Set<string>();
  //Sorting logic
  sortColumn: keyof (typeof this.writebackData)[0] | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';



  // Mock data: Replace with backend integration later
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
    },
    {
      customerId: 'CUST004',
      customerName: 'Sara Kim',
      churnPrediction: 'No Churn',
      probability: 0.10,
      lastInteraction: '2025-04-20',
      assignedAgent: 'Agent C',
      actionTaken: 'N/A',
      status: 'Resolved',
      feedback: 'Loyal customer',
      changed: false
    },
    {
      customerId: 'CUST005',
      customerName: 'Mike Ross',
      churnPrediction: 'Churn',
      probability: 0.65,
      lastInteraction: '2025-04-15',
      assignedAgent: 'Agent A',
      actionTaken: 'Follow-up scheduled',
      status: 'Pending',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST006',
      customerName: 'Emily Stone',
      churnPrediction: 'No Churn',
      probability: 0.20,
      lastInteraction: '2025-04-18',
      assignedAgent: 'Agent D',
      actionTaken: 'Chat support',
      status: 'Confirmed',
      feedback: 'Quick resolution',
      changed: false
    },
    {
      customerId: 'CUST007',
      customerName: 'Liam Brown',
      churnPrediction: 'Churn',
      probability: 0.91,
      lastInteraction: '2025-04-11',
      assignedAgent: 'Agent A',
      actionTaken: '',
      status: 'Pending',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST008',
      customerName: 'Olivia Green',
      churnPrediction: 'No Churn',
      probability: 0.08,
      lastInteraction: '2025-04-27',
      assignedAgent: 'Agent B',
      actionTaken: 'N/A',
      status: 'Confirmed',
      feedback: 'Happy customer',
      changed: false
    },
    {
      customerId: 'CUST009',
      customerName: 'Ethan White',
      churnPrediction: 'Churn',
      probability: 0.78,
      lastInteraction: '2025-04-22',
      assignedAgent: 'Agent C',
      actionTaken: 'Left voicemail',
      status: 'In Progress',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST010',
      customerName: 'Ava Black',
      churnPrediction: 'No Churn',
      probability: 0.30,
      lastInteraction: '2025-04-26',
      assignedAgent: 'Agent D',
      actionTaken: '',
      status: 'Resolved',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST011',
      customerName: 'Noah Lee',
      churnPrediction: 'Churn',
      probability: 0.82,
      lastInteraction: '2025-04-09',
      assignedAgent: 'Agent B',
      actionTaken: 'Escalated to manager',
      status: 'Confirmed',
      feedback: 'Needs urgent handling',
      changed: false
    },
    {
      customerId: 'CUST012',
      customerName: 'Mia Clark',
      churnPrediction: 'No Churn',
      probability: 0.12,
      lastInteraction: '2025-04-24',
      assignedAgent: 'Agent C',
      actionTaken: '',
      status: 'Pending',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST013',
      customerName: 'James Young',
      churnPrediction: 'Churn',
      probability: 0.89,
      lastInteraction: '2025-04-08',
      assignedAgent: 'Agent A',
      actionTaken: '',
      status: 'In Progress',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST014',
      customerName: 'Sophia King',
      churnPrediction: 'No Churn',
      probability: 0.18,
      lastInteraction: '2025-04-17',
      assignedAgent: 'Agent D',
      actionTaken: 'Chat transcript sent',
      status: 'Resolved',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST015',
      customerName: 'Lucas Scott',
      churnPrediction: 'Churn',
      probability: 0.55,
      lastInteraction: '2025-04-13',
      assignedAgent: 'Agent B',
      actionTaken: '',
      status: 'Pending',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST016',
      customerName: 'Grace Adams',
      churnPrediction: 'No Churn',
      probability: 0.05,
      lastInteraction: '2025-04-28',
      assignedAgent: 'Agent C',
      actionTaken: 'N/A',
      status: 'Confirmed',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST017',
      customerName: 'Benjamin Hill',
      churnPrediction: 'Churn',
      probability: 0.70,
      lastInteraction: '2025-04-10',
      assignedAgent: 'Agent A',
      actionTaken: 'Callback scheduled',
      status: 'In Progress',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST018',
      customerName: 'Zoe Perez',
      churnPrediction: 'No Churn',
      probability: 0.25,
      lastInteraction: '2025-04-26',
      assignedAgent: 'Agent D',
      actionTaken: '',
      status: 'Confirmed',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST019',
      customerName: 'Logan Carter',
      churnPrediction: 'Churn',
      probability: 0.83,
      lastInteraction: '2025-04-12',
      assignedAgent: 'Agent B',
      actionTaken: '',
      status: 'Pending',
      feedback: '',
      changed: false
    },
    {
      customerId: 'CUST020',
      customerName: 'Chloe Mitchell',
      churnPrediction: 'No Churn',
      probability: 0.22,
      lastInteraction: '2025-04-27',
      assignedAgent: 'Agent C',
      actionTaken: 'Survey sent',
      status: 'Resolved',
      feedback: '',
      changed: false
    }
  ];

  //  Clone of original data used to reset edited rows
  originalData = JSON.parse(JSON.stringify(this.writebackData));


  //Called whenever a row is edited
  markChanged(row: any, field?: string) {
    row.changed = true;
    if (field) {
      this.touchedFields.add(`${row.customerId}_${field}`);
    }
  }
  //Feedback validation — required once edited
  isFeedbackInvalid(row: any): boolean {
    return row.changed && !row.feedback.trim() && this.touchedFields.has(`${row.customerId}_feedback`);
  }
  //  Status validation — show suggestion if still "Pending"
  isStatusPending(row: any): boolean {
    return row.changed && row.status === 'Pending' && this.touchedFields.has(`${row.customerId}_status`);
  }


  // ⬆⬇ Toggle sort for selected column
  setSort(column: keyof (typeof this.writebackData)[0]) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
  //     Filter logic for search input across all key fields
  get filteredRows() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.writebackData;

    return this.writebackData.filter(row =>
      row.customerId.toLowerCase().includes(term) ||
      row.customerName.toLowerCase().includes(term) ||
      row.churnPrediction.toLowerCase().includes(term) ||
      row.lastInteraction.toLowerCase().includes(term) ||
      row.assignedAgent.toLowerCase().includes(term) ||
      row.actionTaken.toLowerCase().includes(term) ||
      row.status.toLowerCase().includes(term) ||
      row.feedback.toLowerCase().includes(term) ||
      (row.probability * 100).toFixed(0).includes(term)
    );
  }

  //Sorted rows using selected sortColumn + direction
  get sortedRows() {
    const rows = [...this.filteredRows];
    if (!this.sortColumn) return rows;

    const column = this.sortColumn;

    return rows.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return this.sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }
  //  Return paginated results from sorted dataset
  get pagedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedRows.slice(start, start + this.pageSize);
  }


  //  Pagination forward
  nextPage() {
    if (this.currentPage * this.pageSize < this.filteredRows.length) {
      this.currentPage++;
    }
  }

  //  Pagination backward
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Checks if any row is marked as changed
  hasChanges() {
    return this.writebackData.some(row => row.changed);
  }

  //Save button logic — simulates save + tracks saved row
  saveChanges() {
    this.isSaving = true;

    setTimeout(() => {
      this.originalData = JSON.parse(JSON.stringify(this.writebackData));
      this.rowSaved = [];

      this.writebackData.forEach(row => {
        if (row.changed) {
          row.changed = false;
          this.rowSaved.push(row.customerId); //  track saved row IDs
        }
      });

      this.isSaving = false;

      //  Clear the saved state after a few seconds
      setTimeout(() => {
        this.rowSaved = [];
      }, 2000);
    }, 1500);
  }
  //  Reset a row to original untouched state
  resetRow(row: any) {
    const original = this.originalData.find((r: { customerId: any; }) => r.customerId === row.customerId);
    if (original) {
      Object.assign(row, { ...original, changed: false });
    }
  }




}
