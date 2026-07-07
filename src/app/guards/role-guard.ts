import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

    const router = inject(Router);

    const role = sessionStorage.getItem('role');
    const allowedRoles = route.data['roles'] as string[] | undefined;

    console.log('Current Route:', route.routeConfig?.path);
    console.log('User Role:', role);
    console.log('Allowed Roles:', allowedRoles);

    if (!allowedRoles) {
        return true;
    }

    if (role && allowedRoles.includes(role)) {
        return true;
    }

    router.navigate(['/unauthorized']);
    return false;
};