import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/dashboard', pathMatch: 'full' },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.component').then(m => m.TabsComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'network', loadComponent: () => import('./features/contacts/pages/contact-list/contact-list.page').then(m => m.ContactListPage) },
      { path: 'network/:id', loadComponent: () => import('./features/contacts/pages/contact-detail/contact-detail.page').then(m => m.ContactDetailPage) },
      { path: 'transactions/create', loadComponent: () => import('./features/transactions/pages/transaction-create/transaction-create.page').then(m => m.TransactionCreatePage) },
      { path: 'transactions/planned', loadComponent: () => import('./features/transactions/pages/planned-list/planned-list.page').then(m => m.PlannedListPage) },
      { path: 'profile', loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage) },
      { path: 'profile/linkages', loadComponent: () => import('./features/linkages/pages/linkage-list/linkage-list.page').then(m => m.LinkageListPage) },
      { path: 'profile/linkages/:pairId', loadComponent: () => import('./features/linkages/pages/linkage-detail/linkage-detail.page').then(m => m.LinkageDetailPage) },
      { path: 'profile/courier-dashboard', loadComponent: () => import('./features/couriers/pages/courier-dashboard/courier-dashboard.page').then(m => m.CourierDashboardPage) },
      { path: 'profile/network', loadComponent: () => import('./features/couriers/pages/network-overview/network-overview.page').then(m => m.NetworkOverviewPage) },
      { path: 'profile/network/:id', loadComponent: () => import('./features/couriers/pages/courier-detail/courier-detail.page').then(m => m.CourierDetailPage) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
