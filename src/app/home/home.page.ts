import { Component, OnInit } from '@angular/core';
import { Auth } from '../services/auth'; 
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
interface OrderItem {

  id: number;            
  name: string;         
  quantity: number;     
  comment: string;       
  unitPrice: number;     
  price: number;         
  tamaño?: string;       
  unidad_medida?: string;
  complementos?:any ;
  isExtra: boolean;
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
  totalAmount: number = 0;

  orderItems: OrderItem[] = [
    
  ];

  productos: any[] = []; 

  constructor(
    private authService: Auth,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    const user = this.authService.getEmpleado();
    if (user) {
      this.userName = user.nombre + " " + user.apellidos;
    }
    this.calculateTotal();
    this.cargarProductos();
     this.cargarPropinas();
      this.loadComplementos();
  }

  cargarProductos() {
    this.authService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }



async agregarComplementos(index: number) {
  const item = this.orderItems[index];

  const alert = await this.alertController.create({
    header: 'Agregar complementos',
    inputs: this.complementos.map(comp => ({
      type: 'checkbox',
      label: `${comp.nombre} (+$${comp.precio})`,
      value: comp.id,
      checked: (item.complementos ?? []).some((c: any) => c.id === comp.id)

    })),
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Agregar',
      handler: (selectedIds) => {

  // Asegurar que selectedIds sea SIEMPRE array
  const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];

  // Convertir IDs seleccionados → objetos completos
  const nuevosComp = ids.map(id => {
    const c = this.complementos.find(co => co.id === id);
    return {
      id: c.id,
      nombre: c.nombre,
      precio: Number(c.precio)
    };
  });

  item.complementos = nuevosComp;

  const totalComp = nuevosComp.reduce((s, c) => s + Number(c.precio), 0);

  item.price = (item.unitPrice + totalComp) * item.quantity;

  this.calculateTotal();
}

      }
    ]
  });

  await alert.present();
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
  always = true;
 takeOrder() {
  this.clientName = '';
  this.tableNumber = '';
  this.totalAmount = 0.00;
  this.tip = 0;
  this.orderItems = [];
  this.isNewOrder = true;
  this.showmenu = false;
  this.mostrarPropina = false;
  this.selectedComplementos = [];
}



  endDay() {
    console.log('Finalizando el día...');
  }



 
  async editItem(index: number) {
  const item = this.orderItems[index];

  const alert = await this.alertController.create({
    header: 'Editar comentario',
    inputs: [
      {
        name: 'comment',
        type: 'text',
        placeholder: 'Escribe un comentario',
        value: item.comment || ''
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Guardar',
     handler: (data) => {
  this.orderItems[index].comment = data.comment;
  this.calculateTotal();
  this.presentToast('Comentario actualizado', 'success');
}

      }
    ]
  });

  await alert.present();
}


  removeItem(index: number) {
    this.orderItems.splice(index, 1);
    this.calculateTotal();
  }

 calculateTotal() {
  let subtotal = this.orderItems.reduce((sum, item) => sum + item.price, 0);

  let tipAmount = subtotal * (this.tip / 100);

  this.totalAmount = subtotal + tipAmount;

  this.totalAmount = parseFloat(this.totalAmount.toFixed(2));
}



saveOrder() {
  const subtotal = this.orderItems.reduce((sum, item) => sum + item.price, 0);

  const orderData: any = {
    client: this.clientName,
    table: this.tableNumber,
    items: this.orderItems.map(i => ({
      id:  i.id,
      name: i.name,
      quantity: i.quantity,
      comment: i.comment,
      unitPrice: i.unitPrice,
      price: i.price,
      complementos: i.complementos ?? []
    })),
    tip: this.tip,
    subtotal: subtotal,
    total: this.totalAmount,
    propina_id: this.propinas.find(p => p.cantidad_porcentaje === this.tip)?.id,
    empleado_id: this.authService.getEmpleado()?.id
  };

  if (!this.isNewOrder && this.currentOrderId) {
    orderData.id = this.currentOrderId;
  }

  this.authService.guardarOrden(orderData).subscribe({
    next: (res) => {
      console.log("Orden guardada:", res);
      this.presentToast("Orden guardada correctamente", "success");
      this.orderItems = [];
      this.showmenu = true;
    },
    error: (err) => {
      console.error("Error al guardar la orden", err);
      this.presentToast("Error al guardar la orden", "danger");
    }
  });
}





  propinas: any[] = []; 


  cargarPropinas() {
  this.authService.getPropinas().subscribe({
    next: (data) => {
      this.propinas = data;
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



finalizarOrden(orden: any) {
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
  this.clientName = '';
  this.tableNumber = '';
  this.tip = 0;
  this.totalAmount = 0;
  this.orderItems = [];
  this.isNewOrder = true; 
  this.showmenu = true;  
  this.seccionActiva = 'productos'; 
  this.mostrarPropina = false; 
  this.selectedComplementos = []; 
}


mostrarPropina=false;

 complementos: any[] = [];
  selectedComplementos: number[] = [];

  loadComplementos() {
    this.authService.getComplementos().subscribe((resp: any) => {
      this.complementos = resp;
    });
  }

  toggleComplement(id: number) {
    if (this.selectedComplementos.includes(id)) {
      this.selectedComplementos = this.selectedComplementos.filter(c => c !== id);
    } else {
      this.selectedComplementos.push(id);
    }
  }


  verDetalle(orden: any) {
  this.authService.getOrdenById(orden.id).subscribe({
    next: (data) => {
      this.precargarOrden(data);
    },
    error: (err) => console.error("Error al cargar detalle", err)
  });
}



addProductToOrder(product: any) {
  const index = this.orderItems.findIndex(item =>
    item.id === product.id &&
    JSON.stringify(item.complementos || []) === JSON.stringify(product.complementos || [])
  );

  if (index >= 0) {
    this.orderItems[index].quantity++;
    const compTotal = (this.orderItems[index].complementos || []).reduce(
      (s: number, c: any) => s + Number(c.precio),
      0
    );
    this.orderItems[index].price =
      (this.orderItems[index].unitPrice + compTotal) * this.orderItems[index].quantity;
  } else {
    // Nuevo producto
    this.orderItems.push({
      id: product.id,
      name: product.nombre,
      quantity: 1,
      comment: '',
      unitPrice: Number(product.precio),
      price: Number(product.precio),
      tamaño: product.tamaño,
      unidad_medida: product.unidad_medida,
      complementos: product.complementos ? [...product.complementos] : [],
      isExtra: this.isNewOrder ? false : true 
    });
  }

  this.calculateTotal();
  this.updateHasExtras(); 
}

hasExtras: boolean = false;

updateHasExtras() {
  this.hasExtras = this.orderItems.some(item => item.isExtra);
}


isNewOrder: boolean = true; 
currentOrderId: number | null = null;

precargarOrden(orden: any) {
  this.showmenu = false;
  this.seccionActiva = 'productos';
  this.clientName = orden.client;
  this.tableNumber = orden.mesa;
  this.tip = orden.tip;

  this.orderItems = orden.items.map((i: any) => ({
    id: i.producto_id ?? i.id,
    name: i.nombre,
    quantity: i.quantity,
    comment: i.comment,
    unitPrice: Number(i.unitPrice),
    price: Number(i.price),
    complementos: i.complementos 
      ? i.complementos.map((c: any) => ({
          id: c.complemento_id ?? c.id,
          nombre: c.nombre,
          precio: Number(c.precio)
        }))
      : [],
    isExtra: i.isExtra ?? false   
  }));

  this.isNewOrder = false;
  this.currentOrderId = orden.id;
  this.calculateTotal();
  this.updateHasExtras(); 
}





currentPaymentOrder: any = null;
mostrarDetallePago: boolean = false;

showPaymentDetails(orden: any) {
  this.always = false;
  this.authService.getOrdenById(orden.id).subscribe({
    next: (fullOrder: any) => {

      const items = Array.isArray(fullOrder?.items) ? fullOrder.items : [];
this.paymentReceived = 0;
this.change = 0;

      this.currentPaymentOrder = {
        id: fullOrder.id,
        client: fullOrder?.client ?? 'Sin nombre',
        table: fullOrder?.mesa ?? 'Sin mesa',
        items: items.map((i: any) => ({
          id: i?.producto_id ?? i?.item_id ?? 0,
          name: i?.nombre ?? 'Sin nombre',
          quantity: Number(i?.quantity ?? 0),
          comment: i?.comment ?? '',
          unitPrice: Number(i?.unitPrice ?? 0),
          price: Number(i?.price ?? 0),
          complementos: Array.isArray(i?.complementos) ? i.complementos.map((c: any) => ({
            nombre: c.nombre,
            precio: Number(c.precio ?? 0)
          })) : [],
          isExtra: i?.isExtra ?? false
        })),
        tip: Number(fullOrder?.tip ?? 0),
        totalAmount: Number(fullOrder?.total ?? 0) 
      };

      this.mostrarDetallePago = true;
    },
    error: (err) => console.error("Error al cargar detalle", err)
  });
}




calculatePaymentTotal() {
  if (!this.currentPaymentOrder) return;

  const subtotal = this.currentPaymentOrder.items.reduce((sum: number, i: any) => {
    const complementosTotal = i.complementos.reduce((cSum: number, c: any) => cSum + c.precio, 0);
    return sum + (i.unitPrice + complementosTotal) * i.quantity;
  }, 0);

  const tipAmount = subtotal * (this.currentPaymentOrder.tip / 100);
  this.currentPaymentOrder.totalAmount = parseFloat((subtotal + tipAmount).toFixed(2));
}


updateTip(value: number) {
  if (!this.currentPaymentOrder) return;
  this.currentPaymentOrder.tip = value;
  this.calculatePaymentTotal();
}


finishPayment() {
  if (!this.currentPaymentOrder) return;

  const total = this.currentPaymentOrder.totalAmount;

  if (this.paymentReceived < total) {
    this.presentToast("El pago es insuficiente", "danger");
    return;
  }

  this.finalizarOrden(this.currentPaymentOrder);

  this.currentPaymentOrder = null;
  this.paymentReceived = 0;
  this.change = 0;
  this.always = true;
  this.cargarOrdenes();
  this.mostrarDetallePago = false;
}

canceled(){
  this.mostrarDetallePago=false
   this.always = true
   this.seccionActiva ='resumen';
   this.showmenu= false;
}




paymentReceived: number = 0;
change: number = 0;


calculateChange() {
  if (!this.currentPaymentOrder || !this.paymentReceived) {
    this.change = 0;
    return;
  }

  const total = Number(this.currentPaymentOrder.totalAmount);

  this.change = this.paymentReceived - total;

  // Evita que salga cambio negativo
  if (this.change < 0) {
    this.change = 0;
  }

  this.change = parseFloat(this.change.toFixed(2));
}

  }
