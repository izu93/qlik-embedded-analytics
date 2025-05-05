import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QlikAPIService } from '../../services/qlik-api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-writeback-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './writeback-table.component.html',
  styleUrls: ['./writeback-table.component.css'],
})
export class WritebackTableComponent {
  loading = false;
  // Search term for filtering rows
  searchTerm = '';

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  totalRows = 0; // ← for total count
  //pagedRows: any[] = [];
  min = Math.min;

  // Rows that have been saved successfully
  rowSaved: string[] = [];

  // Saving flag for UI state
  isSaving = false;

  // Tracks which fields were modified
  touchedFields = new Set<string>();

  // Sorting state
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  //current user (will be set on init)
  //rrentUser: string = 'Unknown User';
  userName: string = '';

  statusWidth = 140;

  // Column definitions used in the UI
  columnsToShow = [
    { label: 'Account ID', field: 'Account ID' },
    { label: 'Predicted to Churn?', field: 'Predicted to Churn?' },
    { label: 'Probability of Churn', field: 'Probability of Churn' },
    { label: 'Base Fee', field: 'Base Fee' },
    { label: 'Has Renewed', field: 'HasRenewed' },
    { label: 'Plan Type', field: 'PlanType' },
    { label: 'Status', field: 'Status' },
    { label: 'Updated At', field: 'Updated At', hidden: true }, //  hidden
    { label: 'Updated By', field: 'Updated By', hidden: true }, //  hidden
    { label: 'Comments', field: 'Comments', hidden: true }, //  hidden
  ];

  // Live dataset for editing
  writebackData: any[] = [];

  // Original unedited dataset used for resets
  originalData: any[] = [];

  // Qlik object references
  readonly appId = environment.qlik.appId;
  readonly objectId = environment.qlik.objectId;
  data: any;
  col: any;

  constructor(private qlikService: QlikAPIService) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    this.qlikService.getCurrentUserName().then((name) => {
      this.userName = name;
      console.log('Logged in as:', name);
    });

    this.loadPage(this.currentPage);

    // Load data from localStorage if available
    const cached = localStorage.getItem('writebackData');
    if (cached) {
      this.writebackData = JSON.parse(cached);
      this.originalData = JSON.parse(cached);
      console.log('Loaded from localStorage:');
      console.log('writebackData:', this.writebackData);
      console.log('originalData:', this.originalData);
    } else {
      this.loadPage(this.currentPage);
    }
  }

  async loadPage(page: number): Promise<void> {
    this.loading = true;
    this.currentPage = page;

    const result = await this.qlikService.fetchPage(
      this.appId,
      this.objectId,
      page,
      this.pageSize
    );

    const freshRows = result.rows;
    this.totalRows = result.totalRows;

    const saved = JSON.parse(localStorage.getItem('writebackData') || '[]');

    const merged = freshRows.map((row: any) => {
      const match = saved.find(
        (edited: any) => edited['Account ID'] === row['Account ID']
      );

      if (match) {
        const mergedRow = { ...row, ...match };
        mergedRow.changed = false;
        return mergedRow;
      }

      return { ...row, changed: false };
    });

    this.writebackData = merged;
    this.originalData = JSON.parse(JSON.stringify(merged));
    this.loading = false;
  }

  // Getter to slice current paginated view
  get pagedRows() {
    return this.writebackData;
  }
  // Marks a row and optionally a field as changed
  markChanged(row: any, field?: string) {
    row.changed = true;
    if (field) this.touchedFields.add(`${row.AccountID}_${field}`);

    // Add timestamp and user
    row.UpdatedAt = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    row.UpdatedBy = this.userName;
  }

  // Returns the value of a given column in a row
  getValue(row: any, key: string): any {
    return row[key];
  }

  // Updates a value in the row and marks it as changed
  setValue(row: any, key: string, value: any): void {
    row[key] = value;
    this.markChanged(row, key);
  }

  // Returns rows filtered by search term
  get filteredRows() {
    const term = this.searchTerm.toLowerCase().trim();
    return !term
      ? this.writebackData
      : this.writebackData.filter((row) =>
          Object.values(row).some(
            (val) => val && val.toString().toLowerCase().includes(term)
          )
        );
  }

  // Toggles sort state or switches direction
  setSort(field: string) {
    if (this.sortColumn === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = field;
      this.sortDirection = 'asc';
    }
  }

  // Returns sorted rows based on current sort settings
  get sortedRows() {
    const sorted = [...this.filteredRows];
    if (this.sortColumn) {
      sorted.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];
        return (valA > valB ? 1 : -1) * (this.sortDirection === 'asc' ? 1 : -1);
      });
    }
    return sorted;
  }

  // Navigate to next page
  nextPage() {
    if (this.currentPage * this.pageSize < this.totalRows) {
      this.loadPage(this.currentPage + 1);
    }
  }
  // Navigate to previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.loadPage(this.currentPage - 1);
    }
  }

  // Check if any row has been modified
  hasChanges() {
    return this.writebackData.some((row) => row.changed);
  }

  getChangedRows(): any[] {
    return this.writebackData.filter((row) => row.changed);
  }

  // Simulate saving changes and reset changed flags
  //Call saveToBackend() inside saveChanges()
  saveChanges() {
    this.isSaving = true;
    const changedRows = this.getChangedRows();
    console.log('Saving to backend:', changedRows);

    this.qlikService
      .saveToBackend(changedRows)
      .then(() => {
        this.originalData = JSON.parse(JSON.stringify(this.writebackData));
        this.rowSaved = [];

        this.writebackData.forEach((row) => {
          if (row.changed) {
            row.changed = false;
            this.rowSaved.push(row['Account ID']);
          }
        });

        this.isSaving = false;
        setTimeout(() => (this.rowSaved = []), 2000);
      })
      .catch((err) => {
        console.error('Save to backend failed:', err);
        this.isSaving = false;
      });
    const stored = JSON.parse(localStorage.getItem('writebackData') || '[]');
    const filtered = stored.filter(
      (oldRow: any) =>
        !changedRows.some(
          (newRow) => newRow['Account ID'] === oldRow['Account ID']
        )
    );
    localStorage.setItem(
      'writebackData',
      JSON.stringify([...filtered, ...changedRows])
    );
  }
  // Reset a single row to its original state
  resetRow(row: any) {
    const original = this.originalData.find(
      (r) => r['Account ID'] === row['Account ID']
    );
    if (original) Object.assign(row, { ...original, changed: false });
  }

  // Converts any input to integer (used for % bar display)
  parseInt(value: any): number {
    return Number.parseInt(
      value?.toString().replace('%', '').trim() || '0',
      10
    );
  }

  // Removed duplicate saveChanges() implementation

  // Export all current rows to CSV format
  exportToCSV(): void {
    const rowsToExport = this.getChangedRows().length
      ? this.getChangedRows()
      : this.writebackData;

    const exportFields = [
      'Account ID',
      'Predicted to Churn?',
      'Probability of Churn',
      'Base Fee',
      'HasRenewed',
      'PlanType',
      'Status',
      'UpdatedAt',
      'UpdatedBy',
      'Comments',
    ];

    const exportLabels = [
      'Account ID',
      'Predicted to Churn?',
      'Probability of Churn',
      'Base Fee',
      'Has Renewed',
      'Plan Type',
      'Status',
      'Updated At',
      'Updated By',
      'Comments',
    ];

    const csvContent = [exportLabels.join(',')];

    rowsToExport.forEach((row: any) => {
      const rowData = exportFields.map((field) => `"${row[field] ?? ''}"`);
      csvContent.push(rowData.join(','));
    });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.href = url;
    a.download = 'churn_data.csv';
    a.click();
  }
  // Export all current rows to JSON format
  exportToJSON() {
    const json = JSON.stringify(this.writebackData, null, 2);
    this.downloadFile(json, 'data.json', 'application/json');
  }

  // Trigger file download in browser
  private downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  //to reset the localStorage and reload the page
  // This is useful for testing purposes, but should be removed in production
  confirmAndClearLocalCache() {
    const confirmed = window.confirm(
      'This will remove all saved writeback data and reload the app.\nAre you sure you want to proceed?'
    );

    if (confirmed) {
      localStorage.removeItem('writebackData');
      location.reload();
    }
  }
}
