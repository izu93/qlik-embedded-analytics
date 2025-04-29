import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InsightsComponent } from './pages/insights/insights.component';
import { PredictiveAnalyticsComponent } from './pages/predictive-analytics/predictive-analytics.component';
import { WritebackTableComponent } from './pages/writeback-table/writeback-table.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'insights', component: InsightsComponent },
    { path: 'predictive-analytics', component: PredictiveAnalyticsComponent },
    { path: 'writeback', component: WritebackTableComponent }, // Example of a route that could be used for writeback table
];
