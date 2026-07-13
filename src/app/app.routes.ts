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
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout';
import { AdminDashboardComponent } from './admin/dashboard/dashboard';
import { AdminEmployeesComponent } from './admin/employees/employees';
import { AdminCustomersComponent } from './admin/customers/customers';
import { AdminBookingsComponent } from './admin/bookings/bookings';
import { AdminFoodComponent } from './admin/food/food';
import { AdminRoomsComponent } from './admin/rooms/rooms';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { Unauthorized } from './shared/unauthorized/unauthorized';
import { FeedbackComponent } from './Customer/feedback/feedback';
import { MyTasksComponent } from './housekeeping/my-tasks/my-tasks';
import { HousekeepingLayoutComponent } from './housekeeping/housekeeping-layout-component/housekeeping-layout-component';
import { MyBookingsComponent } from './Customer/my-bookings/my-bookings';
import { ChefLayoutComponent } from './chef/chef-layout/chef-layout';
import { ChefDashboardComponent } from './chef/dashboard/dashboard';
import { DeliveryLayoutComponent } from './delivery/delivery-layout/delivery-layout';
import { DeliveryDashboardComponent } from './delivery/dashboard/dashboard';


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
      { path: 'bookings', component: MyBookingsComponent },
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
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'employees', component: AdminEmployeesComponent },
      { path: 'customers', component: AdminCustomersComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'food', component: AdminFoodComponent },
      { path: 'rooms', component: AdminRoomsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'housekeeping',
    component: HousekeepingLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Housekeeping'] },
    children: [
      { path: 'tasks', component: MyTasksComponent },
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
    ],
  },
  {
    path: 'chef',
    component: ChefLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Chef'] },
    children: [
      { path: 'dashboard', component: ChefDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'delivery',
    component: DeliveryLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DeliveryPerson'] },
    children: [
      { path: 'dashboard', component: DeliveryDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];


