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
  writebackData: any[] = [];
  originalData: any[] = [];

  readonly appId = '615ed533-b2d0-48cc-8d43-db57cd809305';
  readonly objectId = 'pjpWn'; // Your actual Qlik table object ID

  constructor(private qlikService: QlikAPIService) { }

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      console.warn('Skipping data load on server.');
      return;
    }

    this.qlikService.getAppData()
      .then(data => {
        this.masterDimensions = data.dimensions;
        this.masterMeasures = data.measures;
        this.allFields = data.allFields;

        this.columnsToShow = this.allFields.filter(field =>
          field.cardinal > 1 &&
          !field.name.startsWith('auto') &&
          field.name !== 'Churned_no'
        );

        this.columnsToShow = this.columnsToShow.filter(f => !!f?.name && typeof f.name === 'string');

        return this.qlikService.getObjectData(this.objectId, this.appId);
      })
      .then(rows => {
        if (!rows) return;

        this.writebackData = rows.map(row => ({
          ...row,
          ServiceRating: '',
          NumberOfPenalties: Number(row['NumberOfPenalties']) || 0,
          changed: false
        }));

        console.log('Populated rows from object:', this.writebackData);
        this.originalData = JSON.parse(JSON.stringify(this.writebackData));
      })
      .catch(err => {
        console.error('Error loading Qlik data:', err);
      });
  }

  markChanged(row: any, field?: string) {
    row.changed = true;
    if (field) {
      this.touchedFields.add(`${row.AccountID}_${field}`);
    }
  }

  isFeedbackInvalid(row: any): boolean {
    return row.changed && !row.ServiceRating?.trim() && this.touchedFields.has(`${row.AccountID}_ServiceRating`);
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

  getValue(row: any, key: string): any {
    return row[key];
  }

  setValue(row: any, key: string, value: any): void {
    row[key] = value;
    this.markChanged(row, key);
  }

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
