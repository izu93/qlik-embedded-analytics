import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QlikAPIService } from '../../services/qlik-api.service';

@Component({
  selector: 'app-writeback-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './writeback-table.component.html',
  styleUrls: ['./writeback-table.component.css']
})
export class WritebackTableComponent {
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  min = Math.min;
  rowSaved: string[] = [];
  isSaving = false;
  touchedFields = new Set<string>();
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  columnsToShow = [
    { label: 'Account ID', field: 'AccountID' },
    { label: 'Predicted to Churn?', field: 'Churned_predicted' },
    { label: 'Probability of Churn', field: 'ProbabilityOfChurn' },
    { label: 'Base Fee', field: 'BaseFee' },
    { label: 'Has Renewed', field: 'HasRenewed' },
    { label: 'Plan Type', field: 'PlanType' },
    { label: 'Status', field: 'Status' }

  ];

  writebackData: any[] = [];
  originalData: any[] = [];

  readonly appId = '615ed533-b2d0-48cc-8d43-db57cd809305';
  readonly objectId = 'GXQNmr';

  constructor(private qlikService: QlikAPIService) { }

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    this.qlikService.getObjectData(this.objectId, this.appId)
      .then(rows => {
        if (!rows) return;

        this.writebackData = rows.map(row => ({
          AccountID: row['Account ID'] ?? '',
          Churned_predicted: row['Predicted to Churn?'] ?? '',
          ProbabilityOfChurn: row['Probability of Churn'] ?? '',
          BaseFee: row['Base Fee'] ?? '',
          HasRenewed: row['HasRenewed'] ?? '',
          PlanType: row['PlanType'] ?? '',
          changed: false
        }));

        this.originalData = JSON.parse(JSON.stringify(this.writebackData));
        console.log('✅ Final mapped rows (normalized):', this.writebackData);
      })
      .catch(err => console.error('❌ Error loading Qlik data:', err));
  }

  markChanged(row: any, field?: string) {
    row.changed = true;
    if (field) this.touchedFields.add(`${row.AccountID}_${field}`);
  }

  getValue(row: any, key: string): any {
    return row[key];
  }

  setValue(row: any, key: string, value: any): void {
    row[key] = value;
    this.markChanged(row, key);
  }

  get filteredRows() {
    const term = this.searchTerm.toLowerCase().trim();
    return !term ? this.writebackData : this.writebackData.filter(row =>
      Object.values(row).some(val => val && val.toString().toLowerCase().includes(term))
    );
  }

  setSort(field: string) {
    if (this.sortColumn === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = field;
      this.sortDirection = 'asc';
    }
  }

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

  get pagedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedRows.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.filteredRows.length) this.currentPage++;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  hasChanges() {
    return this.writebackData.some(row => row.changed);
  }

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

  resetRow(row: any) {
    const original = this.originalData.find(r => r.AccountID === row.AccountID);
    if (original) Object.assign(row, { ...original, changed: false });
  }

  exportToCSV() {
    const header = this.columnsToShow.map(col => col.label);
    const rows = this.writebackData.map(row =>
      this.columnsToShow.map(col => `"${row[col.field] ?? ''}"`).join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    this.downloadFile(csvContent, 'data.csv', 'text/csv');
  }

  exportToJSON() {
    const json = JSON.stringify(this.writebackData, null, 2);
    this.downloadFile(json, 'data.json', 'application/json');
  }

  private downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  parseInt(value: any): number {
    return Number.parseInt(value?.toString().replace('%', '').trim() || '0', 10);
  }
}
