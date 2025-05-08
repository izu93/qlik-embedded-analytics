import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
} from '@angular/core';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WritebackTableComponent {
  filterPanelId = 'JbeMYy';

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

  statusWidth = 150;
  ARRWidth = 130;

  private previousRowCount: number = -1;
  private selectionPollInterval: any;

  // Column definitions used in the UI
  columnsToShow = [
    { label: 'URL', field: 'URL' },
    { label: 'Account', field: 'Account' },
    { label: 'Renewal Qtr', field: 'Renewal Qtr' },
    { label: 'Prob of Churn', field: 'Overall Renewal Risk' },
    { label: 'Overall Renewal Risk', field: 'Account Health Risk' },
    { label: 'Account Health Risk', field: 'SaaS Adoption Risk' },
    { label: 'SaaS Adoption Risk', field: 'Prob of Churn' },

    { label: 'ARR', field: 'ARR' },
    { label: 'Model Feedback', field: 'Status' },
    { label: 'Updated At', field: 'Updated At', hidden: true },
    { label: 'Updated By', field: 'Updated By', hidden: true },
    { label: 'Comments', field: 'Comments', hidden: true },
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
  private previousRowHash: string = '';
  constructor(
    private qlikService: QlikAPIService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    this.qlikService.getCurrentUserName().then((name) => {
      this.userName = name;
      console.log('Logged in as:', name);

      // Initial table load
      this.loadPage(this.currentPage).then(() => {
        this.mergeCachedWritebackEdits();
        this.previousRowHash = this.hashRows(this.writebackData);
      });

      this.selectionPollInterval = setInterval(async () => {
        const result = await this.qlikService.fetchPage(
          this.appId,
          this.objectId,
          1,
          3 // top 3 rows only
        );
        const previewRows = result.rows;
        const newHash = this.hashRows(previewRows);

        if (newHash !== this.previousRowHash) {
          console.log('Qlik selection change detected — refreshing table...');
          this.previousRowHash = newHash;

          await this.loadPage(this.currentPage);
          this.mergeCachedWritebackEdits();
          //this.cdRef.detectChanges();
        }
      }, 2000);
    });
  }
  private hashRows(rows: any[]): string {
    const preview = rows.slice(0, 3).map((r) => ({
      Account: r['Account'],
      ARR: r['ARR'],
      Risk: r['Overall Renewal Risk'],
    }));
    const raw = JSON.stringify(preview);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString();
  }

  private mergeCachedWritebackEdits() {
    const cached = localStorage.getItem('writebackData');
    if (cached) {
      const savedRows = JSON.parse(cached);
      this.writebackData = this.writebackData.map((row) => {
        const match = savedRows.find(
          (saved: any) => saved['Account'] === row['Account']
        );
        return match ? { ...row, ...match, changed: false } : row;
      });
      this.originalData = JSON.parse(JSON.stringify(this.writebackData));
      console.log('Local storage edits merged into Qlik data');
    }
  }
  // Load initial data

  async loadPage(page: number): Promise<void> {
    this.loading = true;
    this.currentPage = page;

    try {
      const result = await this.qlikService.fetchPage(
        this.appId,
        this.objectId,
        page,
        this.pageSize
      );

      const freshRows = result.rows;
      this.totalRows = result.totalRows;

      // Only update writebackData if different
      const newHash = this.hashRows(freshRows);
      if (newHash !== this.hashRows(this.writebackData)) {
        this.writebackData = freshRows.map((r) => ({ ...r, changed: false }));
        this.originalData = JSON.parse(JSON.stringify(this.writebackData));
      }
    } catch (error) {
      console.error('Error loading Qlik data:', error);
    } finally {
      this.loading = false;
    }
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
        // Mark rows as saved
        this.originalData = JSON.parse(JSON.stringify(this.writebackData));
        this.rowSaved = [];

        this.writebackData.forEach((row) => {
          if (row.changed) {
            row.changed = false;
            this.rowSaved.push(row['Account']);
          }
        });

        // Merge with localStorage instead of replacing completely
        const existing = JSON.parse(
          localStorage.getItem('writebackData') || '[]'
        );

        const updatedStorage = existing.map((row: any) => {
          const match = changedRows.find(
            (newRow: any) => newRow['Account'] === row['Account']
          );
          return match ? { ...row, ...match } : row;
        });

        const newRows = changedRows.filter(
          (row: any) =>
            !existing.some((r: any) => r['Account'] === row['Account'])
        );

        const finalStorage = [...updatedStorage, ...newRows];
        localStorage.setItem('writebackData', JSON.stringify(finalStorage));

        this.isSaving = false;
        setTimeout(() => (this.rowSaved = []), 2000);
      })
      .catch((err) => {
        console.error('Save to backend failed:', err);
        this.isSaving = false;
      });
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

  // Converts percentage string to float (e.g., "72.3%" → 72.3)
  parseFloatPercent(value: any): number {
    return parseFloat(value?.toString().replace('%', '').trim() || '0');
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

  ngOnDestroy(): void {
    clearInterval(this.selectionPollInterval);
  }
}
