import { Component, OnInit } from '@angular/core';
import { Auth } from '../services/auth'; // importa tu servicio
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  userName: string = '';

  constructor(private authService: Auth,private router: Router) {}

  ngOnInit() {
    const user = this.authService.getEmpleado();
    if (user) {
      this.userName = user.nombre + " " + user.apellidos;
    }
  }

   goHome() {
    this.router.navigate(['/login']);
  }
}
