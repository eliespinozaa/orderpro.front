import { Component, OnInit } from '@angular/core';
import { Auth } from '../services/auth';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.page.html',
  styleUrls: ['./administrador.page.scss'],
  standalone: false,
})
export class AdministradorPage implements OnInit {
  // ========================= PRODUCTOS =========================
  productos: any[] = [];
  nuevoProducto: any = { nombre: '', precio: 0, unidad_medida: '', tamano: '' };
  productoSeleccionado: any = null;
  editandoProducto: boolean = false;

  productosFiltrados: any[] = [];
filtroProducto: string = '';


  // ========================= EMPLEADOS =========================
  empleados: any[] = [];
  empleadoSeleccionado: any = null;
  editandoEmpleado: boolean = false;

  // ========================= NAV =========================
  seccionActiva: 'productos' | 'empleados' | 'salir' = 'productos';

  constructor(
    private authService: Auth,
    private toastController: ToastController,
   
  private alertController: AlertController
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'top',
      icon: 'alert-circle-outline',
    });
    toast.present();
  }

  seleccionarSeccion(seccion: 'productos' | 'empleados' | 'salir') {
    this.seccionActiva = seccion;
    this.cancelarEdicionProducto();
    this.cancelarEdicionEmpleado();

    if (seccion === 'productos') this.cargarProductos();
    if (seccion === 'empleados') this.cargarEmpleados();
  }

  // ========================= PRODUCTOS =========================
cargarProductos() {
  this.authService.getProductos().subscribe({
    next: (res) => {
      this.productos = res;
      this.productosFiltrados = res; 
    },
    error: (err) => this.presentToast(err.message || 'Error al cargar productos'),
  });
}

filtrarProductos() {
  const filtro = this.filtroProducto.toLowerCase();
  this.productosFiltrados = this.productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro)
  );
}

async cerrarSesion() {
  const alert = await this.alertController.create({
    cssClass: 'custom-alert',
    header: 'Cerrar sesión',
    message: '¿Seguro que deseas salir de tu cuenta?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        cssClass: 'cancel-button',
      },
      {
        text: 'Cerrar sesión',
        handler: async () => {
          await this.authService.logout();

          const toast = await this.toastController.create({
            message: 'Sesión cerrada correctamente',
            color: 'success',
            duration: 2000,
            position: 'top',
            icon: 'log-out-outline',
          });
          await toast.present();
        },
        cssClass: 'confirm-button',
      },
    ],
  });

  await alert.present();
}



  nuevoProductoUI() {
    this.productoSeleccionado = {
      nombre: '',
      precio: 0,
      unidad_medida: '',
      tamano: '',
    };
    this.editandoProducto = true;
  }
  editarProductoUI(p: any) {
    this.productoSeleccionado = { ...p };
    this.editandoProducto = true;
  }
  cancelarEdicionProducto() {
    this.productoSeleccionado = null;
    this.editandoProducto = false;
  }

  guardarProducto() {
    if (!this.productoSeleccionado.nombre) {
      this.presentToast('Nombre obligatorio', 'warning');
      return;
    }
    if (this.productoSeleccionado.id) {
      this.authService.editarProducto(this.productoSeleccionado).subscribe({
        next: (res) => {
          this.presentToast(res.message, 'success');
          this.cargarProductos();
          this.cancelarEdicionProducto();
        },
        error: (err) => this.presentToast(err.message, 'danger'),
      });
    } else {
      this.authService.agregarProducto(this.productoSeleccionado).subscribe({
        next: (res) => {
          this.presentToast(res.message, 'success');
          this.cargarProductos();
          this.cancelarEdicionProducto();
        },
        error: (err) => this.presentToast(err.message, 'danger'),
      });
    }
  }

  eliminarProducto(id: number) {
    if (!confirm('¿Deseas eliminar este producto?')) return;
    this.authService.eliminarProducto(id).subscribe({
      next: (res) => {
        this.presentToast(res.message, 'success');
        this.cargarProductos();
      },
      error: (err) => this.presentToast(err.message, 'danger'),
    });
  }

  empleadosFiltrados: any[] = [];
  filtro: string = '';
  // ========================= EMPLEADOS =========================
 cargarEmpleados() {
    this.authService.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
        this.empleadosFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener empleados:', err);
      }
    });
  }

  filtrarEmpleados() {
    const texto = this.filtro.toLowerCase();
    this.empleadosFiltrados = this.empleados.filter(emp =>
      emp.nombre.toLowerCase().includes(texto) ||
      emp.apellidos.toLowerCase().includes(texto) ||
      emp.telefono.includes(texto)
    );
  }
  nuevoEmpleadoUI() {
    this.empleadoSeleccionado = {
      nombre: '',
      apellidos: '',
      edad: 0,
      telefono: '',
    };
    this.editandoEmpleado = true;
  }
  editarEmpleadoUI(e: any) {
    this.empleadoSeleccionado = { ...e };
    this.editandoEmpleado = true;
  }
  cancelarEdicionEmpleado() {
    this.empleadoSeleccionado = null;
    this.editandoEmpleado = false;
  }

  guardarEmpleado() {
    if (!this.empleadoSeleccionado.nombre) {
      this.presentToast('Nombre obligatorio', 'warning');
      return;
    }
    if (this.empleadoSeleccionado.id) {
      this.authService.updateEmpleado(this.empleadoSeleccionado).subscribe({
        next: (res) => {
          this.presentToast(res.message, 'success');
          this.cargarEmpleados();
          this.cancelarEdicionEmpleado();
        },
        error: (err) => this.presentToast(err.message, 'danger'),
      });
    } else {
      this.authService.createEmpleado(this.empleadoSeleccionado).subscribe({
        next: (res) => {
          this.presentToast(res.message, 'success');
          this.cargarEmpleados();
          this.cancelarEdicionEmpleado();
        },
        error: (err) => this.presentToast(err.message, 'danger'),
      });
    }
  }

  eliminarEmpleado(id: number) {
    if (!confirm('¿Deseas eliminar este empleado?')) return;
    this.authService.deleteEmpleado(id).subscribe({
      next: (res) => {
        this.presentToast(res.message, 'success');
        this.cargarEmpleados();
      },
      error: (err) => this.presentToast(err.message, 'danger'),
    });
  }
}
