import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InsightsComponent } from './pages/insights/insights.component';
import { PredictiveAnalyticsComponent } from './pages/predictive-analytics/predictive-analytics.component';
import { WritebackTableComponent } from './pages/writeback-table/writeback-table.component';
import { WritebackTableStaticDataComponent } from './pages/writeback-table-static-data/writeback-table-static-data.component';
import { OAuthCallbackComponent } from './components/o-auth-callback/o-auth-callback.component';

export const routes: Routes = [
    { path: '', redirectTo: '/writeback', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'insights', component: InsightsComponent },
    { path: 'predictive-analytics', component: PredictiveAnalyticsComponent },
    { path: 'writeback', component: WritebackTableComponent }, // for writeback table
    { path: 'writeback-static-data', component: WritebackTableStaticDataComponent }, // for writeback static data table,
    { path: 'assets/oauth-callback.html', component: OAuthCallbackComponent },  // OAuth Callback route

];
