import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InsightsComponent } from './pages/insights/insights.component';
import { PredictiveAnalyticsComponent } from './pages/predictive-analytics/predictive-analytics.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'insights', component: InsightsComponent },
    { path: 'predictive-analytics', component: PredictiveAnalyticsComponent },
];
