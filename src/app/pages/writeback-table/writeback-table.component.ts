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
  styleUrls: ['./writeback-table.component.css']
})
export class WritebackTableComponent {
  // Search term for filtering rows
  searchTerm = '';

  // Pagination state
  currentPage = 1;
  pageSize = 10;
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

  // Column definitions used in the UI
  columnsToShow = [
    { label: 'Account ID', field: 'AccountID' },
    { label: 'Predicted to Churn?', field: 'Churned_predicted' },
    { label: 'Probability of Churn', field: 'ProbabilityOfChurn' },
    { label: 'Base Fee', field: 'BaseFee' },
    { label: 'Has Renewed', field: 'HasRenewed' },
    { label: 'Plan Type', field: 'PlanType' },
    { label: 'Status', field: 'Status' }
  ];

  // Live dataset for editing
  writebackData: any[] = [];

  // Original unedited dataset used for resets
  originalData: any[] = [];

  // Qlik object references
  readonly appId = environment.qlik.appId;
  readonly objectId = environment.qlik.objectId;

  constructor(private qlikService: QlikAPIService) { }

  ngOnInit(): void {
    // Skip if not in browser
    if (typeof window === 'undefined') return;

    // Load data from Qlik API object
    this.qlikService.getObjectData(this.objectId, this.appId)
      .then(rows => {
        if (!rows) return;

        // Normalize field names and mark each row as unchanged
        this.writebackData = rows.map(row => ({
          AccountID: row['Account ID'] ?? '',
          Churned_predicted: row['Predicted to Churn?'] ?? '',
          ProbabilityOfChurn: row['Probability of Churn'] ?? '',
          BaseFee: row['Base Fee'] ?? '',
          HasRenewed: row['HasRenewed'] ?? '',
          PlanType: row['PlanType'] ?? '',
          Status: row['Status'] ?? null,
          changed: false
        }));

        // Deep copy original data for reset reference
        this.originalData = JSON.parse(JSON.stringify(this.writebackData));
        console.log('Final mapped rows (normalized):', this.writebackData);
      })
      .catch(err => console.error('Error loading Qlik data:', err));
  }

  // Marks a row and optionally a field as changed
  markChanged(row: any, field?: string) {
    row.changed = true;
    if (field) this.touchedFields.add(`${row.AccountID}_${field}`);
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
      : this.writebackData.filter(row =>
        Object.values(row).some(val =>
          val && val.toString().toLowerCase().includes(term)
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

  // Returns current page of sorted rows
  get pagedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedRows.slice(start, start + this.pageSize);
  }

  // Navigate to next page
  nextPage() {
    if (this.currentPage * this.pageSize < this.filteredRows.length) this.currentPage++;
  }

  // Navigate to previous page
  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  // Check if any row has been modified
  hasChanges() {
    return this.writebackData.some(row => row.changed);
  }

  // Simulate saving changes and reset changed flags
  saveChanges() {
    this.isSaving = true;
    setTimeout(() => {
      this.originalData = JSON.parse(JSON.stringify(this.writebackData));
      this.rowSaved = [];
      this.writebackData.forEach(row => {
        if (row.changed) {
          row.changed = false;
          this.rowSaved.push(row.AccountID);
        }
      });
      this.isSaving = false;
      setTimeout(() => (this.rowSaved = []), 2000);
    }, 1500);
  }

  // Reset a single row to its original state
  resetRow(row: any) {
    const original = this.originalData.find(r => r.AccountID === row.AccountID);
    if (original) Object.assign(row, { ...original, changed: false });
  }

  // Export all current rows to CSV format
  exportToCSV() {
    const header = this.columnsToShow.map(col => col.label);
    const rows = this.writebackData.map(row =>
      this.columnsToShow.map(col => `"${row[col.field] ?? ''}"`).join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    this.downloadFile(csvContent, 'data.csv', 'text/csv');
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

  // Converts any input to integer (used for % bar display)
  parseInt(value: any): number {
    return Number.parseInt(value?.toString().replace('%', '').trim() || '0', 10);
  }
}
