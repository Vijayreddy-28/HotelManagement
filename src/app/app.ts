import { Component, signal } from '@angular/core';
import { WelcomeComponent } from './welcome/welcome';
import { GuestRegisterComponent } from './register/register';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('HotelManagement');
}
