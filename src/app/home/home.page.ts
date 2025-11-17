import { Component, OnInit } from '@angular/core';
import { Auth } from '../services/auth'; // importa tu servicio
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
interface OrderItem {
  id: number;            // id del producto
  name: string;          // nombre del producto
  quantity: number;      // cantidad
  comment: string;       // comentarios
  unitPrice: number;     // precio unitario
  price: number;         // precio total (quantity * unitPrice)
  tamaño?: string;       // tamaño del producto (opcional)
  unidad_medida?: string; // unidad de medida (opcional)
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  userName: string = '';


  clientName: string = '';
  tableNumber: string = '';
  tip: number = 0;
  totalAmount: number = 0; // Se calcularía dinámicamente

  // Datos de ejemplo para la tabla (simulando la imagen)
  orderItems: OrderItem[] = [
    
  ];

  productos: any[] = []; // Aquí van los productos traídos del backend

  constructor(
    private authService: Auth,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController// Nuevo servicio
  ) {}

  ngOnInit() {
    const user = this.authService.getEmpleado();
    if (user) {
      this.userName = user.nombre + " " + user.apellidos;
    }
    this.calculateTotal();
    this.cargarProductos();
     this.cargarPropinas();
  }

  cargarProductos() {
    this.authService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

addProductToOrder(product: any) {
  const index = this.orderItems.findIndex(item => item.name === product.nombre);
  if (index >= 0) {
    // Si ya existe, solo sumamos cantidad y recalculamos precio
    this.orderItems[index].quantity++;
    this.orderItems[index].price = this.orderItems[index].quantity * this.orderItems[index].unitPrice;
  } else {
    // Si no existe, lo agregamos como nuevo
   this.orderItems.push({
  id: product.id, // <--- importante para guardar en orden_productos
  name: product.nombre,
  quantity: 1,
  comment: '',
  unitPrice: Number(product.precio),
  price: Number(product.precio),
  tamaño: product.tamaño,
  unidad_medida: product.unidad_medida
});

  }
  this.calculateTotal();
}



   goHome() {
    this.router.navigate(['/login']);
  }


 
   seccionActiva: 'productos' | 'salir' | 'resumen' = 'productos';

 
  
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
  
    seleccionarSeccion(seccion: 'productos' | 'salir') {
      this.seccionActiva = seccion;

  
   

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
  

  showmenu=true;
  takeOrder() {
    this.clientName='';
    this.tableNumber='';
this.totalAmount=0.00;
this.tip=0;
    this.showmenu=false
  }


  endDay() {
    console.log('Finalizando el día...');
  }


  // --- Funciones de Acción ---

 
  editItem(index: number) {
    console.log("Editando ítem en el índice: ${index}");
    // Aquí abrirías un modal o formulario para editar el OrderItem
  }

  removeItem(index: number) {
    console.log("Eliminando ítem en el índice: ${index}");
    this.orderItems.splice(index, 1);
    this.calculateTotal();
  }

 calculateTotal() {
  // Calculamos subtotal
  let subtotal = this.orderItems.reduce((sum, item) => sum + item.price, 0);

  // Convertimos la propina en porcentaje
  // this.tip = 10 significa 10%
  let tipAmount = subtotal * (this.tip / 100);

  // Total = subtotal + propina
  this.totalAmount = subtotal + tipAmount;

  // Opcional: redondear a 2 decimales
  this.totalAmount = parseFloat(this.totalAmount.toFixed(2));
}


saveOrder() {
  const subtotal = this.orderItems.reduce((sum, item) => sum + item.price, 0);

  const orderData = {
    client: this.clientName,
    table: this.tableNumber,
    items: this.orderItems,
    tip: this.tip,
    subtotal: subtotal,       // <-- aquí
    total: this.totalAmount,
    propina_id: this.propinas.find(p => p.cantidad_porcentaje === this.tip)?.id,
    empleado_id: this.authService.getEmpleado()?.id
  };

  this.authService.guardarOrden(orderData).subscribe({
    next: (res) => {
      console.log("Orden guardada:", res);
      this.presentToast("Orden guardada correctamente", "success");
      this.orderItems = []; // limpiar tabla
      this.showmenu = true;
    },
    error: (err) => {
      console.error("Error al guardar la orden", err);
      this.presentToast("Error al guardar la orden", "danger");
    }
  });
}




  propinas: any[] = []; // aquí se guardarán las propinas del backend


  cargarPropinas() {
  this.authService.getPropinas().subscribe({
    next: (data) => {
      this.propinas = data;
      // Opcional: seleccionar por defecto la primera propina
      if (this.propinas.length > 0) {
        this.tip = this.propinas[0].cantidad_porcentaje;
        this.calculateTotal();
      }
    },
    error: (err) => console.error('Error al cargar propinas', err)
  });
}


ordenes: any[] = [];
showResumen: boolean = false;

viewSummary() {
  this.seccionActiva = 'resumen';
  this.showmenu = false;
  this.cargarOrdenes();
}


cargarOrdenes() {
  this.authService.getOrdenes().subscribe({
    next: (data) => {
      this.ordenes = data;
    },
    error: (err) => console.error('Error al cargar órdenes', err)
  });
}

verDetalle(orden: any) {
  console.log('Ver detalle de la orden:', orden);
  // Aquí podrías abrir un modal con productos y complementos
}

finalizarOrden(orden: any) {
  // Llamar API para cambiar estatus a "Finalizada"
  this.authService.finalizarOrden(orden.id).subscribe({
    next: () => {
      orden.estatus = 'Finalizada';
      this.presentToast('Orden finalizada', 'success');
    },
    error: (err) => this.presentToast('Error al finalizar orden', 'danger')
  });
}

eliminarOrden(orden: any) {
  this.authService.eliminarOrden(orden.id).subscribe({
    next: () => {
      this.ordenes = this.ordenes.filter(o => o.id !== orden.id);
      this.presentToast('Orden eliminada', 'success');
    },
    error: (err) => this.presentToast('Error al eliminar orden', 'danger')
  });
}

backToMenu() {
  this.showmenu = true;
  this.seccionActiva = 'productos'

}


  }