import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome';
import { GuestRegisterComponent } from './register/register';
import { LoginComponent } from './login/login';
import { CustomerLayoutComponent } from './Customer/customer-layout/customer-layout';
import { AvailableRooms } from './Customer/available-rooms/available-rooms';
import { RoomCartComponent } from './Customer/room-cart/room-cart';
import { FoodMenuComponent } from './Customer/food-menu/food-menu';
import { FoodOrderComponent } from './Customer/food-order/food-order';
import { ReceptionistLayoutComponent } from './receptionist/receptionist-layout/receptionist-layout';
import { ReceptionistDashboardComponent } from './receptionist/dashboard/dashboard';
import { ReceptionistBookingsComponent } from './receptionist/bookings/bookings';
import { ReceptionistRoomsComponent } from './receptionist/rooms/rooms';
import { ReceptionistBillingComponent } from './receptionist/billing/billing';
import { ReceptionistHousekeepingComponent } from './receptionist/housekeeping/housekeeping';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { Unauthorized } from './shared/unauthorized/unauthorized';
import { FeedbackComponent } from './Customer/feedback/feedback';


export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'unauthorized', component: Unauthorized },
  { path: 'register', component: GuestRegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'employee-login', component: LoginComponent },
  {
    path: 'customer',
    component: CustomerLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Customer'] },
    children: [
      { path: 'rooms', component: AvailableRooms },
      { path: 'cart', component: RoomCartComponent },
      { path: 'food', component: FoodMenuComponent },
      { path: 'foodcart', component: FoodOrderComponent },
      { path: 'feedback', component: FeedbackComponent },
      { path: '', redirectTo: 'rooms', pathMatch: 'full' },
    ],
  },
  {
    path: 'receptionist',
    component: ReceptionistLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Receptionist', 'Admin'] },
    children: [
      { path: 'dashboard', component: ReceptionistDashboardComponent },
      { path: 'bookings', component: ReceptionistBookingsComponent },
      { path: 'rooms', component: ReceptionistRoomsComponent },
      { path: 'billing', component: ReceptionistBillingComponent },
      { path: 'housekeeping', component: ReceptionistHousekeepingComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];


