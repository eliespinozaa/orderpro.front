import { Component, OnInit } from '@angular/core';
import { Auth } from '../services/auth'; 
import { Router } from '@angular/router';
import { AlertController, ModalController, Platform, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface OrderItem {
  id: number;            
  name: string;         
  quantity: number;     
  comment: string;       
  unitPrice: number;     
  price: number;         
  tamaño?: string;       
  unidad_medida?: string;
  complementos?: any;
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
  orderItems: OrderItem[] = [];
  productos: any[] = []; 
  propinas: any[] = []; 
  ordenes: any[] = [];
  showResumen: boolean = false;
  showmenu = true;
  always = true;
  mostrarPropina = false;
  complementos: any[] = [];
  selectedComplementos: number[] = [];
  hasExtras: boolean = false;
  isNewOrder: boolean = true; 
  currentOrderId: number | null = null;
  currentPaymentOrder: any = null;
  mostrarDetallePago: boolean = false;
  paymentReceived: number = 0;
  change: number = 0;
  seccionActiva: 'productos' | 'salir' | 'resumen' | 'historial' = 'productos';
 mesas: any[] = [];


  constructor(
    private authService: Auth,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalCtrl: ModalController,
      private platform: Platform
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
     this.cargarMesas();
  }

  
mesasLibres: any[] = [];

cargarMesas() {
  this.authService.getMesas().subscribe({
    next: (data) => {
      this.mesas = data;
      this.mesasLibres = this.mesas.filter(m => m.estatus === 'Libre');
    },
    error: (err) => console.error('Error al cargar mesas', err)
  });
}


  cargarProductos() {
    this.authService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

cancelarOrden(orden: any) {
  console.log(orden,"isdodoffjdksdfjdnkdfgkm")
  this.authService.cancelarOrden(orden.id).subscribe({
    next: (res: any) => {
      this.cargarMesas();
      this.cargarOrdenes(); // recargas la tabla
    },
    error: err => {
      console.error('Error al cancelar', err);
    }
  });
}



  async agregarComplementos(index: number) {
    const item = this.orderItems[index];

    const alert = await this.alertController.create({
      header: 'Agregar complementos',
      inputs: this.complementos.map(comp => ({
        type: 'checkbox',
        label: `${comp.nombre} (+${comp.precio})`,
        value: comp.id,
        checked: (item.complementos ?? []).some((c: any) => c.id === comp.id)
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (selectedIds) => {
            if (!selectedIds || (Array.isArray(selectedIds) && selectedIds.length === 0)) {
              item.complementos = [];
              item.price = item.unitPrice * item.quantity;
              this.calculateTotal();
              return;
            }

            const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
            const uniqueIds = [...new Set(ids)];

            const nuevosComp = uniqueIds
              .map(id => this.complementos.find(co => co.id === id))
              .filter(c => c)
              .map(c => ({
                id: c.id,
                nombre: c.nombre,
                precio: Number(c.precio)
              }));

            item.complementos = nuevosComp;

            const totalComp = nuevosComp.reduce((s, c) => s + Number(c.precio), 0);
            item.price = (item.unitPrice * item.quantity) + totalComp;

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

 seleccionarSeccion(seccion: 'productos' | 'resumen' | 'salir' | 'historial') {
  this.seccionActiva = seccion;

  if (seccion === 'historial') {
    this.showmenu = false;
    this.always = true;
    this.cargarHistorial();
  }

  if (seccion === 'productos' || seccion === 'resumen') {
    this.showmenu = false;
    this.always = true;
  }

  if (seccion === 'salir') {
    this.showmenu = false;
  }
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

  takeOrder() {
    this.clientName = '';
    this.tableNumber = '';
    this.totalAmount = 0.00;
    this.tip = 0;
    this.orderItems = [];
    this.isNewOrder = true;
    this.currentOrderId = null;
    this.showmenu = false;
    this.mostrarPropina = false;
    this.selectedComplementos = [];
    this.hasExtras = false;
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
    this.updateHasExtras();
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
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        comment: i.comment,
        unitPrice: i.unitPrice,
        price: i.price,
        complementos: i.complementos ?? [],
        isExtra: i.isExtra
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
        this.isNewOrder = true;
        this.currentOrderId = null;
        this.hasExtras = false;
        this.cargarMesas();
      },
      error: (err) => {
        console.error("Error al guardar la orden", err);
        this.presentToast("Error al guardar la orden", "danger");
      }
    });
  }

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
cargarOrdenes2(): Observable<any[]> {
  return this.authService.getOrdenes();
}
cargarMesas2(): Observable<any[]> {
  return this.authService.getMesas();
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
    this.currentOrderId = null;
    this.showmenu = true;  
    this.seccionActiva = 'productos'; 
    this.mostrarPropina = false; 
    this.selectedComplementos = [];
    this.hasExtras = false;
  }

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
        (this.orderItems[index].unitPrice * this.orderItems[index].quantity) + compTotal;
    } else {
      const compTotal = Array.isArray(product.complementos)
        ? product.complementos.reduce((s: number, c: any) => s + Number(c.precio), 0)
        : 0;

      this.orderItems.push({
        id: product.id,
        name: product.nombre,
        quantity: 1,
        comment: '',
        unitPrice: Number(product.precio),
        price: Number(product.precio) + compTotal,
        tamaño: product.tamaño,
        unidad_medida: product.unidad_medida,
        complementos: Array.isArray(product.complementos) ? [...product.complementos] : [],
        isExtra: !this.isNewOrder
      });
    }

    this.calculateTotal();
    this.updateHasExtras();
  }

  updateHasExtras() {
    this.hasExtras = this.orderItems.some(item => item.isExtra);
  }

  precargarOrden(orden: any) {
    
    this.showmenu = false;
    this.seccionActiva = 'productos';
    this.clientName = orden.client;
    this.tableNumber = orden.mesaId;
    this.tip = Number(orden.tip) || 0;

    this.orderItems = orden.items.map((i: any) => {
      // Limpiar complementos duplicados
      let complementos = [];
      if (Array.isArray(i.complementos)) {
        const compMap = new Map();
        i.complementos.forEach((c: any) => {
          if (!compMap.has(c.id)) {
            compMap.set(c.id, {
              id: c.complemento_id ?? c.id,
              nombre: c.nombre,
              precio: Number(c.precio)
            });
          }
        });
        complementos = Array.from(compMap.values());
      }

      const unitPrice = Number(i.unitPrice);
      const quantity = Number(i.quantity);
      const complementosTotal = complementos.reduce((sum, c) => sum + Number(c.precio), 0);
      
      const calculatedPrice = (unitPrice * quantity) + complementosTotal;

      console.log(`📝 Item: ${i.nombre}`);
      console.log(`   Cantidad: ${quantity}`);
      console.log(`   Precio unitario: ${unitPrice}`);
      console.log(`   Complementos total: ${complementosTotal}`);
      console.log(`   Precio calculado: ${calculatedPrice}`);

      return {
        id: i.producto_id ?? i.id,
        name: i.nombre,
        quantity: quantity,
        comment: i.comment || '',
        unitPrice: unitPrice,
        price: calculatedPrice,
        complementos: complementos,
        isExtra: false
      };
    });

    this.isNewOrder = false;
    this.currentOrderId = orden.id;
    
    this.calculateTotal();
    this.updateHasExtras();
  }

  showPaymentDetails(orden: any) {
    this.always = false;
    this.authService.getOrdenById(orden.id).subscribe({
      next: (fullOrder: any) => {
        const items = Array.isArray(fullOrder?.items) ? fullOrder.items : [];
        this.paymentReceived = 0;
        this.change = 0;

        const processedItems = items.map((i: any) => {
          let complementos = [];
          if (Array.isArray(i?.complementos)) {
            const compMap = new Map();
            i.complementos.forEach((c: any) => {
              if (!compMap.has(c.id)) {
                compMap.set(c.id, {
                  nombre: c.nombre,
                  precio: Number(c.precio ?? 0)
                });
              }
            });
            complementos = Array.from(compMap.values());
          }

          const unitPrice = Number(i?.unitPrice ?? 0);
          const quantity = Number(i?.quantity ?? 0);
          const complementosTotal = complementos.reduce((sum, c) => sum + c.precio, 0);
          const calculatedPrice = (unitPrice * quantity) + complementosTotal;

          return {
            id: i?.producto_id ?? i?.item_id ?? 0,
            name: i?.nombre ?? 'Sin nombre',
            quantity: quantity,
            comment: i?.comment ?? '',
            unitPrice: unitPrice,
            price: calculatedPrice,
            complementos: complementos,
            isExtra: i?.isExtra ?? false
          };
        });

        const subtotal = processedItems.reduce((sum: number, item: any) => sum + item.price, 0);
        const tip = Number(fullOrder?.tip ?? 0);
        const tipAmount = subtotal * (tip / 100);
        const total = subtotal + tipAmount;

        this.currentPaymentOrder = {
          id: fullOrder.id,
          client: fullOrder?.client ?? 'Sin nombre',
          table: fullOrder?.mesaNombre ?? 'Sin mesa',
          items: processedItems,
          tip: tip,
          totalAmount: parseFloat(total.toFixed(2))
        };

        this.mostrarDetallePago = true;
      },
      error: (err) => console.error("Error al cargar detalle", err)
    });
  }

  calculatePaymentTotal() {
    if (!this.currentPaymentOrder) return;

    const subtotal = this.currentPaymentOrder.items.reduce((sum: number, i: any) => {
      return sum + i.price;
    }, 0);

    const tipAmount = subtotal * (this.currentPaymentOrder.tip / 100);
    this.currentPaymentOrder.totalAmount = parseFloat((subtotal + tipAmount).toFixed(2));
  }

  updateTip(value: number) {
    if (!this.currentPaymentOrder) return;
    this.currentPaymentOrder.tip = value;
    this.calculatePaymentTotal();
  }
  finalizarOrden2(orden: any) {
  return this.authService.finalizarOrden(orden.id);
}


finishPayment() {
  if (!this.currentPaymentOrder) return;

  const total = this.currentPaymentOrder.totalAmount;

  if (this.paymentReceived < total) {
    this.presentToast("El pago es insuficiente", "danger");
    return;
  }

  this.finalizarOrden2(this.currentPaymentOrder).subscribe(() => {

    this.cargarOrdenes2().subscribe((ordenes) => {
      this.ordenes = ordenes;  
    });

    this.cargarMesas2().subscribe((mesas) => {
       this.mesas = mesas;
      this.mesasLibres = this.mesas.filter(m => m.estatus === 'Libre');
    });

    this.currentPaymentOrder = null;
    this.paymentReceived = 0;
    this.change = 0;
    this.always = true;
    this.mostrarDetallePago = false;
  });
}

get mesasDisponibles() {
  if (!this.tableNumber) {
    return this.mesas.filter(m => m.estatus === 'Libre');
  }

  return this.mesas.filter(m =>
    m.estatus === 'Libre' || m.id == this.tableNumber
  );
}


getStatusClass(status: string) {
  switch (status) {
    case 'En proceso':
      return 'status-proceso';
    case 'Finalizada':
      return 'status-finalizada';
    case 'Cancelada':
      return 'status-cancelada';
    default:
      return 'status-default';
  }
}


  canceled() {
    this.mostrarDetallePago = false;
    this.always = true;
    this.seccionActiva = 'resumen';
    this.showmenu = false;
  }

  calculateChange() {
    if (!this.currentPaymentOrder || !this.paymentReceived) {
      this.change = 0;
      return;
    }

    const total = Number(this.currentPaymentOrder.totalAmount);
    this.change = this.paymentReceived - total;

    if (this.change < 0) {
      this.change = 0;
    }

    this.change = parseFloat(this.change.toFixed(2));
  }

  historial: any[] = [];

  cargarHistorial() {
  this.authService.getReporteDelDia().subscribe({
    next: (data) => {
      this.historial = data;
    },
    error: (err) => console.error(err)
  });
}


async descargarPDF() {
  this.authService.descargarReportePDF().subscribe({
    next: async (blob) => {
      try {
        // Convierte el blob a base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const base64 = base64Data.split(',')[1]; // Quita el prefijo data:application/pdf;base64,
          
          const fileName = `reporte_${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Guarda el archivo
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Documents,
          });
          
          console.log('Archivo guardado en:', savedFile.uri);
          this.presentToast(`PDF guardado en Documentos/${fileName}`, 'success');
        };
      } catch (error) {
        console.error('Error al guardar PDF:', error);
        this.presentToast('Error al guardar el PDF', 'danger');
      }
    },
    error: (err) => {
      console.error('Error al descargar PDF:', err);
      this.presentToast('Error al descargar el PDF', 'danger');
    }
  });
}

selectMesa(id: string) {
  this.tableNumber = id;
}


}