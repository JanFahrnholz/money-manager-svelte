import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.component').then(m => m.TabsComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'contacts', loadComponent: () => import('./features/contacts/pages/contact-list/contact-list.page').then(m => m.ContactListPage) },
      { path: 'contacts/:id', loadComponent: () => import('./features/contacts/pages/contact-detail/contact-detail.page').then(m => m.ContactDetailPage) },
      { path: 'transactions/create', loadComponent: () => import('./features/transactions/pages/transaction-create/transaction-create.page').then(m => m.TransactionCreatePage) },
      { path: 'transactions/planned', loadComponent: () => import('./features/transactions/pages/planned-list/planned-list.page').then(m => m.PlannedListPage) },
      { path: 'profile', loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage) },
      { path: 'profile/network', loadComponent: () => import('./features/couriers/pages/network-overview/network-overview.page').then(m => m.NetworkOverviewPage) },
      { path: 'profile/network/:id', loadComponent: () => import('./features/couriers/pages/courier-detail/courier-detail.page').then(m => m.CourierDetailPage) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
