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

  constructor(
    private authService: Auth,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required]
    });
  }

  ngOnInit() {}

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

    const { correo, contrasena } = this.loginForm.value;

    this.authService.login(correo, contrasena).subscribe({
      next: (user) => {
        console.log('Login exitoso:', user);
        this.presentToast(`Bienvenido ${user.full_name}`, 'success');
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        console.error(err);
        this.presentToast(err.message || 'Correo o contraseña incorrectos');
      }
    });
  }
}
