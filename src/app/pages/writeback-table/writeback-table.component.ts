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
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  masterDimensions: any[] = [];
  masterMeasures: any[] = [];
  allFields: any[] = [];
  columnsToShow: any[] = [];
  selectedField: string = '';

  constructor(private qlikService: QlikAPIService) { }

  ngOnInit(): void {
    this.qlikService.getAppData().then(data => {
      console.log('Qlik App Data (Full):', data);
      this.masterDimensions = data.dimensions;
      this.masterMeasures = data.measures;
      this.allFields = data.allFields;
      this.columnsToShow = this.allFields.filter(field =>
        field.cardinal > 1 && !field.name.startsWith('auto') && field.name !== 'Churned_no'
      );
    }).catch(err => {
      console.error('Error fetching Qlik app data:', err);
    });
  }

  writebackData = Array(20).fill(null).map((_, i) => ({
    AccountID: `CUST${(i + 1).toString().padStart(3, '0')}`,
    SHAP_value: parseFloat((Math.random() * 0.9 + 0.1).toFixed(2)),
    Churned_predicted: i % 2 === 0 ? 'Churn' : 'No Churn',
    Churned_yes: i % 2 === 0 ? 1 : 0,
    AdditionalFeatureSpend: Math.floor(Math.random() * 100),
    BaseFee: Math.floor(Math.random() * 100 + 50),
    CurrentPeriodUsage: Math.floor(Math.random() * 200),
    HasRenewed: i % 3 === 0 ? 1 : 0,
    NumberOfPenalties: Math.floor(Math.random() * 5),
    PlanType: ['Basic', 'Plus', 'Premium'][i % 3],
    PriorPeriodUsage: Math.floor(Math.random() * 150),
    Promotion: i % 2 === 0 ? 'Yes' : 'No',
    ServiceRating: '',
    ServiceTickets: Math.floor(Math.random() * 10),
    StartWeek: Math.floor(Math.random() * 52),
    changed: false
  }));

  originalData = JSON.parse(JSON.stringify(this.writebackData));

  markChanged(row: any, field?: string) {
    row.changed = true;
    if (field) {
      this.touchedFields.add(`${row.AccountID}_${field}`);
    }
  }

  isFeedbackInvalid(row: any): boolean {
    return row.changed && !row.ServiceRating.trim() && this.touchedFields.has(`${row.AccountID}_ServiceRating`);
  }

  isStatusPending(row: any): boolean {
    return row.changed && row.status === 'Pending' && this.touchedFields.has(`${row.AccountID}_status`);
  }

  setSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredRows() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.writebackData;
    return this.writebackData.filter(row =>
      Object.values(row).some(val => val && val.toString().toLowerCase().includes(term))
    );
  }

  get sortedRows() {
    const rows = [...this.filteredRows];
    if (!this.sortColumn) return rows;
    const column = this.sortColumn;
    return rows.sort((a, b) => {
      const valA = a[column as keyof typeof a];
      const valB = b[column as keyof typeof b];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return this.sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  get pagedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedRows.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.filteredRows.length) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
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
      setTimeout(() => {
        this.rowSaved = [];
      }, 2000);
    }, 1500);
  }

  resetRow(row: any) {
    const original = this.originalData.find((r: any) => r.AccountID === row.AccountID);
    if (original) {
      Object.assign(row, { ...original, changed: false });
    }
  }

  // Dynamic access helpers to avoid TS errors
  getValue(row: any, key: string): any {
    return row[key];
  }

  setValue(row: any, key: string, value: any): void {
    row[key] = value;
    this.markChanged(row, key);
  }

  // Export to CSV and JSON
  exportToCSV() {
    const header = this.columnsToShow.map(col => col.name);
    const rows = this.writebackData.map(row =>
      header.map(colName => `"${(row as any)[colName] ?? ''}"`).join(',')
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
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
