import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() >= payload.exp * 1000) {
      sessionStorage.clear();
      router.navigate(['/login']);
      return false;
    }
    return true;
  }
  catch (error) {
    sessionStorage.clear();
    router.navigate(['/login']);
    return false;
  }

};