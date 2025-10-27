import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth} from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: Auth) {}

  async canActivate(): Promise<boolean> {
    const user = this.authService.getUser(); 
    if (user) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
