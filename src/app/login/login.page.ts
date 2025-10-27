import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isAdmin: boolean = false; 

  constructor(
    private authService: Auth,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit() {}

  createForm(): FormGroup {
    if (this.isAdmin) {
      return this.fb.group({
        correo: ['', [Validators.required, Validators.email]],
        contrasena: ['', Validators.required]
      });
    } else {
      return this.fb.group({
        telefono: ['', [Validators.required, Validators.minLength(7)]]
      });
    }
  }

  toggleMode() {
    this.isAdmin = !this.isAdmin;
    this.loginForm = this.createForm();
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'top',
      icon: 'alert-circle-outline'
    });
    toast.present();
  }

  onLogin() {
  if (this.loginForm.invalid) {
    this.presentToast('Por favor llena todos los campos correctamente');
    return;
  }

  if (this.isAdmin) {
    const { correo, contrasena } = this.loginForm.value;
    this.authService.loginAdmin(correo, contrasena).subscribe({
      next: (user) => {
        this.presentToast(`Bienvenido ${user.full_name}`, 'success');
        this.router.navigate(['/administrador']);
      },
      error: (err) => this.presentToast(err.message || 'Correo o contraseña incorrectos')
    });
  } else {
    const { telefono } = this.loginForm.value;
    this.authService.loginEmpleado(telefono).subscribe({
      next: (empleado) => {
        this.presentToast(`Bienvenido ${empleado.nombre + " " + empleado.apellidos}`, 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => this.presentToast(err.message || 'Teléfono no registrado')
    });
  }
}

}
