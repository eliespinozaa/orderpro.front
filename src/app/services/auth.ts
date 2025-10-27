import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/backendorderpro/';

  constructor(private http: HttpClient) {}

  loginAdmin(correo: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login.php`, { correo, contrasena }).pipe(
      map(response => {
        if (response.success) {
          localStorage.setItem('user', JSON.stringify(response.user));
          return response.user;
        } else {
          throw new Error(response.error || 'Login fallido');
        }
      }),
      catchError(err => {
        const errorMsg = err.error?.error || err.message || 'Error desconocido';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  loginEmpleado(telefono: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login-empleado.php`, { telefono }).pipe(
      map(response => {
        if (response.success) {
          localStorage.setItem('empleado', JSON.stringify(response.user));
          return response.user;
        } else {
          throw new Error(response.error || 'Login fallido');
        }
      }),
      catchError(err => {
        const errorMsg = err.error?.error || err.message || 'Error desconocido';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getEmpleado(): any {
    const empStr = localStorage.getItem('empleado');
    return empStr ? JSON.parse(empStr) : null;
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('empleado');
  }
}
