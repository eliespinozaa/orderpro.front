import { Component, OnInit } from '@angular/core';
import { Auth } from '../services/auth'; // importa tu servicio
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
interface OrderItem {
  name: string;
  quantity: number;
  comment: string;
  unitPrice: number;
  price: number;
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
  totalAmount: number = 249; // Se calcularía dinámicamente

  // Datos de ejemplo para la tabla (simulando la imagen)
  orderItems: OrderItem[] = [
    { name: 'Consome', quantity: 3, comment: '', unitPrice: 20, price: 60 },
    { name: 'Suadero', quantity: 5, comment: 'Sin cebolla', unitPrice: 23, price: 115 },
    // Agrega más ítems aquí para probar
  ];

  constructor(private authService: Auth,private router: Router ,
      private toastController: ToastController,
     
    private alertController: AlertController) {}

  ngOnInit() {
    const user = this.authService.getEmpleado();
    if (user) {
      this.userName = user.nombre + " " + user.apellidos;
    }
     this.calculateTotal();
  }

   goHome() {
    this.router.navigate(['/login']);
  }


 
    seccionActiva: 'productos' | 'salir' = 'productos';
 
  
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
    console.log('Navegando a Tomar Orden...');
this.showmenu=false
  }

  viewSummary() {
    console.log('Navegando a Resumen de órdenes...');
  }

  endDay() {
    console.log('Finalizando el día...');
  }


  // --- Funciones de Acción ---

  addProductToOrder(productName: string) {
    console.log("Añadiendo producto: ${productName}");
    // Lógica para buscar el precio y añadir al array orderItems
    // Por simplicidad, solo registraremos en consola por ahora
  }

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
    let subtotal = this.orderItems.reduce((sum, item) => sum + item.price, 0);
    // Nota: Deberías incluir la propina (this.tip) en el cálculo final
    this.totalAmount = subtotal + this.tip;
    // Opcionalmente, puedes formatearlo con toFixed(2)
  }

  saveOrder() {
    console.log('Guardando el pedido...');
    const orderData = {
      client: this.clientName,
      table: this.tableNumber,
      items: this.orderItems,
      tip: this.tip,
      total: this.totalAmount
    };
    console.log(orderData);
    // Lógica para guardar en un servicio o base de datos
  }
  }