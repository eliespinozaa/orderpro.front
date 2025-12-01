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
  productos: any[] = [];
  nuevoProducto: any = { nombre: '', precio: 0, unidad_medida: '', tamano: '' };
  productoSeleccionado: any = null;
  editandoProducto: boolean = false;

  productosFiltrados: any[] = [];
filtroProducto: string = '';


  empleados: any[] = [];
  empleadoSeleccionado: any = null;
  editandoEmpleado: boolean = false;

  seccionActiva: 'productos' | 'empleados' | 'salir' | 'propinas' | 'complementos'  = 'productos';

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

 seleccionarSeccion(seccion: 'productos' | 'empleados' | 'complementos' | 'propinas' | 'salir') {
  this.seccionActiva = seccion;

  this.cancelarEdicionProducto();
  this.cancelarEdicionEmpleado();
  this.cancelarEdicionComplemento();
  this.cancelarEdicionPropina();

  if (seccion === 'productos') this.cargarProductos();
  if (seccion === 'empleados') this.cargarEmpleados();
  if (seccion === 'complementos') this.cargarComplementos();
  if (seccion === 'propinas') this.cargarPropinas();
}


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
      descripcion: ''
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

  async eliminarProducto(id: number) {
  const alert = await this.alertController.create({
    header: 'Eliminar producto',
    message: '¿Seguro que deseas eliminar este producto?',
    cssClass: 'custom-alert',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        cssClass: 'cancel-button'
      },
      {
        text: 'Eliminar',
        cssClass: 'confirm-button',
        handler: () => {
          this.authService.eliminarProducto(id).subscribe({
            next: (res) => {
              this.presentToast(res.message, 'success');
              this.cargarProductos();
            },
            error: (err) => this.presentToast(err.message, 'danger'),
          });
        }
      }
    ]
  });

  await alert.present();
}


  empleadosFiltrados: any[] = [];
  filtro: string = '';
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

 

async eliminarEmpleado(id: number) {
  const alert = await this.alertController.create({
    header: 'Eliminar empleado',
    message: '¿Seguro que deseas eliminar este empleado?',
    cssClass: 'custom-alert',
    buttons: [
      { text: 'Cancelar', role: 'cancel', cssClass: 'cancel-button' },
      {
        text: 'Eliminar',
        cssClass: 'confirm-button',
        handler: () => {
          this.authService.deleteEmpleado(id).subscribe({
            next: (res) => {
              this.presentToast(res.message, 'success');
              this.cargarEmpleados();
            },
            error: (err) => this.presentToast(err.message, 'danger'),
          });
        }
      }
    ]
  });

  await alert.present();
}



  // -------- Complementos --------
complementos: any[] = [];
complementosFiltrados: any[] = [];
filtroComplemento: string = '';

complementoSeleccionado: any = null;
editandoComplemento: boolean = false;

// -------- Propinas --------
propinas: any[] = [];
propinaSeleccionada: any = null;
editandoPropina: boolean = false;




cargarComplementos() {
  this.authService.getComplementos().subscribe({
    next: (res) => {
      const data = Array.isArray(res) ? res : [];

      this.complementos = data;
      this.complementosFiltrados = data;
    },
    error: (err) => this.presentToast(err.message)
  });
}


filtrarComplementos() {
  const f = this.filtroComplemento.toLowerCase();
  this.complementosFiltrados = this.complementos.filter(c =>
    c.nombre.toLowerCase().includes(f)
  );
}

nuevoComplementoUI() {
  this.complementoSeleccionado = { nombre: '', precio: 0 };
  this.editandoComplemento = true;
}

editarComplementoUI(c: any) {
  this.complementoSeleccionado = { ...c };
  this.editandoComplemento = true;
}

cancelarEdicionComplemento() {
  this.complementoSeleccionado = null;
  this.editandoComplemento = false;
}

guardarComplemento() {
  if (this.complementoSeleccionado.id) {
    this.authService.updateComplemento(this.complementoSeleccionado).subscribe({
      next: (res) => {
        this.presentToast(res.message, 'success');
        this.cargarComplementos();
        this.cancelarEdicionComplemento();
      },
      error: (err) => this.presentToast(err.message)
    });
  } else {
    this.authService.createComplemento(this.complementoSeleccionado).subscribe({
      next: (res) => {
        this.presentToast(res.message, 'success');
        this.cargarComplementos();
        this.cancelarEdicionComplemento();
      },
      error: (err) => this.presentToast(err.message)
    });
  }
}



async eliminarComplemento(id: number) {
  const alert = await this.alertController.create({
    cssClass: 'custom-alert',
    header: 'Eliminar complemento',
    message: '¿Deseas eliminar este complemento?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        cssClass: 'cancel-button',
      },
      {
        text: 'Eliminar',
        cssClass: 'confirm-button',
        handler: () => {
          this.authService.deleteComplemento(id).subscribe({
            next: (res) => {
              this.presentToast(res.message, 'success');
              this.cargarComplementos();
            },
            error: (err) => this.presentToast(err.message, 'danger'),
          });
        },
      },
    ],
  });

  await alert.present();
}




cargarPropinas() {
  this.authService.getPropinas().subscribe({
    next: res => this.propinas = res,
    error: err => this.presentToast(err.message)
  });
}

editarPropinaUI(p: any) {
  this.propinaSeleccionada = { ...p };
  this.editandoPropina = true;
}

cancelarEdicionPropina() {
  this.propinaSeleccionada = null;
  this.editandoPropina = false;
}

guardarPropina() {
  this.authService.updatePropina(this.propinaSeleccionada).subscribe({
    next: res => {
      this.presentToast(res.message, 'success');
      this.cargarPropinas();
      this.cancelarEdicionPropina();
    },
    error: err => this.presentToast(err.message)
  });
}


}
