import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  //private apiUrl = 'http://localhost:8080/backendorderpro/';
  private apiUrl = 'http://orderpro.duckdns.org/';
  constructor(private http: HttpClient, private router: Router) {}

 loginAdmin(correo: string, contrasena: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}login.php`, { correo, contrasena }).pipe(
    map(response => {
      if (response.success) {
        const userWithRole = { ...response.user, role: 'admin' };
        localStorage.setItem('user', JSON.stringify(userWithRole));
        localStorage.setItem('role', 'admin');
        return userWithRole;
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
        const empWithRole = { ...response.user, role: 'empleado' };
        localStorage.setItem('empleado', JSON.stringify(empWithRole));
        localStorage.setItem('role', 'empleado'); 
        return empWithRole;
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
getRole(): string | null {
  return localStorage.getItem('role');
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
        tamano: p.tamaño,
        descripcion: p.descripcion
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


getPropinas() {
  return this.http.get<any[]>(`${this.apiUrl}propinas.php`);
}

guardarOrden(data: any) {
  return this.http.post(`${this.apiUrl}guardarOrden.php`, data);
}


  getOrdenes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getOrdenes.php`);
  }

  finalizarOrden(ordenId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/finalizarOrden.php`, { id: ordenId });
  }


eliminarOrden(ordenId: number) {
  const url = `${this.apiUrl}/eliminarOrden.php?id=${ordenId}`;
  return this.http.delete(url);
}


  getComplementos() {
    return this.http.get(`${this.apiUrl}getcomplementos.php`);
  }
 getOrdenById(id: number) {
  return this.http.get(`${this.apiUrl}getOrdenesextras.php?id=${id}`);
}






createComplemento(data: any) {
  return this.http.post<any>(`${this.apiUrl}create-complemento.php`, data);
}

updateComplemento(data: any) {
  return this.http.put<any>(`${this.apiUrl}update-complemento.php`, data);
}

deleteComplemento(id: number) {
  return this.http.request<any>('DELETE', `${this.apiUrl}delete-complemento.php`, { body: { id } });
}

updatePropina(data: any) {
  return this.http.put<any>(`${this.apiUrl}update-propina.php`, data);
}


getMesas(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}mesas.php`).pipe(
    map((response: any[]) => response),
    catchError(err =>
      throwError(() => new Error(err.error?.error || err.message || 'Error al obtener mesas'))
    )
  );
}

cancelarOrden(ordenId: number): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}cancelar_orden.php`, { orden_id: ordenId }).pipe(
    map(res => res),
    catchError(err =>
      throwError(() => new Error(err.error?.error || err.message || 'Error al cancelar la orden'))
    )
  );
}


getReporteDelDia(): Observable<any> {
  // Ajuste seguro de fecha local (evita desfases por timezone)
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());

  const fecha = hoy.toISOString().split('T')[0];

  return this.http.get<any>(`${this.apiUrl}historial-dia.php?fecha=${fecha}`).pipe(
    catchError(err =>
      throwError(() => new Error(err.error?.error || err.message || 'Error al obtener el reporte del día'))
    )
  );
}


descargarReportePDF(): Observable<Blob> {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  const fecha = hoy.toISOString().split('T')[0];

  return this.http.get(`${this.apiUrl}reporte-dia-pdf.php?fecha=${fecha}`, {
    responseType: 'blob'
  });
}


}
