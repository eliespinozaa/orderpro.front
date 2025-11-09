import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Auth} from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: Auth) {}


  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const admin = this.authService.getUser();
    const empleado = this.authService.getEmpleado();
    const path = route.routeConfig?.path;

    if (path === 'administrador') {
      if (admin) return true; 
      this.router.navigate(['/home']); 
      return false;
    }

    if (path === 'login') {
      if (empleado) return true;
      this.router.navigate(['/home']); 
      return false;
    }

    if (!admin && !empleado) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
