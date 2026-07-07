import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { GuestRegisterService } from '../services/guestRegister.service';
import { AuthService } from '../services/login.service';
import { RoomService } from '../services/room.service';
import { RoomBookingService } from '../services/roombooking.service';
import { CartService } from '../services/cart.service';
import { provideToastr } from 'ngx-toastr';
import { FoodMenuService } from '../services/foodmenu.service';
import { UserService } from '../services/user.service';
import { HousekeepingService } from '../services/Housekeeping.service';
import { FeedbackService } from '../services/feedback.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    GuestRegisterService,
    AuthService,
    RoomService,
    RoomBookingService,
    CartService,
    FoodMenuService,
    HousekeepingService,
    UserService,
    FeedbackService,
    provideToastr({
      positionClass: 'toast-bottom-right',
      timeOut: 2000,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true
    })
  ],
};
