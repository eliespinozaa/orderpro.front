import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/backendorderpro/';

  constructor(private http: HttpClient, private router: Router) {}

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
  this.router.navigate(['/home']);
}


  createEmpleado(data: { nombre: string; apellidos: string; edad: number; telefono: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}create-empleado.php`, data).pipe(
      map(res => res),
      catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error al crear empleado')))
    );
  }

  getEmpleados(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}read-empleados.php`).pipe(
      map(res => res.empleados || []),
      catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error al obtener empleados')))
    );
  }

  updateEmpleado(data: { id: number; nombre: string; apellidos: string; edad: number; telefono: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}update-empleado.php`, data).pipe(
      map(res => res),
      catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error al actualizar empleado')))
    );
  }

  deleteEmpleado(id: number): Observable<any> {
    return this.http.request<any>('DELETE', `${this.apiUrl}delete-empleado.php`, { body: { id } }).pipe(
      map(res => res),
      catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error al eliminar empleado')))
    );
  }

 getProductos(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}productos.php`).pipe(
    map((response: any[]) => 
      response.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        unidad_medida: p.unidad_medida,
        tamano: p.tamaño
      }))
    ),
    catchError(err => throwError(() => new Error(err.message || 'Error al obtener productos')))
  );
}


editarProducto(producto: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}editar-producto.php`, producto).pipe(
    map(response => {
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Error al editar producto');
      }
    }),
    catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error desconocido')))
  );
}
// dentro de Auth
eliminarProducto(id: number): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}eliminar-producto.php`, { id }).pipe(
    map(response => {
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'No se pudo eliminar el producto');
      }
    }),
    catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error desconocido')))
  );
}
agregarProducto(producto: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}agregar-producto.php`, producto).pipe(
    map(response => {
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'No se pudo agregar el producto');
      }
    }),
    catchError(err => throwError(() => new Error(err.error?.error || err.message || 'Error desconocido')))
  );
}




}
