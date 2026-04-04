import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PocketbaseService } from '../services/pocketbase.service';

export const authGuard: CanActivateFn = () => {
  const pb = inject(PocketbaseService);
  const router = inject(Router);

  if (pb.isAuthenticated) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
