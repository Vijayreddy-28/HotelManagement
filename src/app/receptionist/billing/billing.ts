import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { BillingService } from '../../../services/billing.service';
import { PaymentService } from '../../../services/payment.service';
import { RoomBookingService } from '../../../services/roombooking.service';
import { Bill } from '../../../models/bill.model';
import { CreatePaymentRequest, PaymentMethod } from '../../../models/payment.model';

@Component({
  selector: 'app-receptionist-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.html',
  styleUrl: './billing.css'
})
export class ReceptionistBillingComponent {
  PaymentMethod = PaymentMethod;

  // Step 1: Booking lookup
  bookingIdInput: number | null = null;
  loadingBill = false;
  bill: Bill | null = null;

  // Active checked-in bookings for the dropdown
  checkedInBookings: { bookingId: number; customerName: string }[] = [];
  loadingBookings = true;

  // Step 2: Payment section (revealed automatically once a bill exists)
  billIdForPayment: number | null = null;
  selectedMethod: PaymentMethod | null = null;
  verifiedWithCustomer = false;
  collectingPayment = false;
  paymentCollected = false;

  // Step 3: Checkout
  checkingOut = false;

  // Custom Confirmation Modal
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'payment' | 'checkout' | '' = '';
  processingAction = false;

  constructor(
    private billingService: BillingService,
    private paymentService: PaymentService,
    private roomBookingService: RoomBookingService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCheckedInBookings();
  }

  loadCheckedInBookings(): void {
    this.loadingBookings = true;
    this.roomBookingService.getBookingsByStatus('CheckedIn').subscribe({
      next: (res: any) => {
        this.checkedInBookings = Array.isArray(res)
          ? res.map((b: any) => ({ bookingId: b.bookingId, customerName: b.customerName }))
          : [];
        this.loadingBookings = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.checkedInBookings = [];
        this.loadingBookings = false;
        this.cdr.detectChanges();
      }
    });
  }

  onBookingSelected(bookingId: number): void {
    this.bookingIdInput = bookingId ? Number(bookingId) : null;
  }

  // ===================== Bill Generation =====================
  generateBill(): void {

    if (!this.bookingIdInput || this.bookingIdInput <= 0) {
      this.toastr.warning('Please enter a valid Booking ID.', 'Validation');
      return;
    }

    this.loadingBill = true;
    this.bill = null;
    this.resetPaymentState();
    // Sync the view now, before the request resolves, so this component's
    // template is fully up to date before Toastr (below) inserts its own
    // component and forces an out-of-band change-detection pass.
    this.cdr.detectChanges();

    this.billingService.generateBill(this.bookingIdInput).subscribe({

      next: (response: any) => {

        if (response?.statusCode && response.statusCode >= 400) {
          this.loadingBill = false;
          this.cdr.detectChanges();
          this.toastr.error(response.message || 'Unable to generate bill.', 'Billing Error');
          return;
        }

        this.bill = response;
        this.billIdForPayment = response.billId;
        this.loadingBill = false;
        this.cdr.detectChanges();

        this.toastr.success(
          `Bill #${response.billId} generated successfully.`,
          'Bill Generated'
        );

      },

      error: (err) => {

        this.loadingBill = false;
        this.cdr.detectChanges();

        this.toastr.error(
          err.error?.message || 'Unable to generate bill.',
          'Billing Error'
        );

      }

    });

  }

  resetSearch(): void {
    this.bookingIdInput = null;
    this.bill = null;
    this.resetPaymentState();
  }

  private resetPaymentState(): void {
    this.billIdForPayment = null;
    this.selectedMethod = null;
    this.verifiedWithCustomer = false;
    this.paymentCollected = false;
    this.collectingPayment = false;
  }

  // ===================== Payment Section =====================
  // These are the single source of truth for button enable/disable state.
  // (No separate updateButtonStates() call needed — Angular re-evaluates
  // getters on every change detection cycle.)
  get canCollectPayment(): boolean {
    return !!this.billIdForPayment &&
      this.selectedMethod !== null &&
      this.verifiedWithCustomer &&
      !this.paymentCollected;
  }

  get canCheckout(): boolean {
    return this.paymentCollected;
  }

  // Kept so the (ngModelChange) bindings in the template still compile;
  // the getters above already recompute automatically, so this is a no-op.
  updateButtonStates(): void { }

  confirmCollectPayment(): void {
    if (!this.bill || !this.billIdForPayment || this.selectedMethod === null) {
      this.toastr.warning('Please select a payment method before collecting payment.', 'Validation');
      return;
    }
    if (!this.verifiedWithCustomer) {
      this.toastr.warning('Please verify the payment details with the guest first.', 'Validation');
      return;
    }

    this.confirmTitle = 'Confirm Payment Collection';
    this.confirmMessage = `Reconcile and collect \u20b9${this.bill.totalAmount.toLocaleString()} for Invoice Bill #${this.billIdForPayment}?`;
    this.confirmAction = 'payment';
    this.showConfirmModal = true;
  }

  confirmCheckout(): void {
    if (!this.bill || !this.paymentCollected) return;

    this.confirmTitle = 'Confirm Room Check-Out';
    this.confirmMessage = `Release and check out guest for Booking ID #${this.bill.bookingId}?`;
    this.confirmAction = 'checkout';
    this.showConfirmModal = true;
  }

  executeConfirmedAction(): void {
    const action = this.confirmAction;
    if (!action) return;

    this.processingAction = true;
    this.cdr.detectChanges();

    if (action === 'payment') {
      const request = new CreatePaymentRequest(this.billIdForPayment!, this.bill!.totalAmount, this.selectedMethod!);
      this.collectingPayment = true;
      this.cdr.detectChanges();

      this.paymentService.createPayment(request).subscribe({
        next: (response: any) => {
          this.collectingPayment = false;
          this.processingAction = false;
          this.closeConfirmModal();

          if (response?.statusCode && response.statusCode >= 400) {
            this.cdr.detectChanges();
            this.toastr.error(response.message || 'Payment could not be collected.', 'Payment Failed');
            return;
          }

          this.paymentCollected = true;
          this.cdr.detectChanges();
          this.toastr.success('Payment collected successfully. You may now check out the guest.', 'Payment Successful');
        },
        error: (err) => {
          this.collectingPayment = false;
          this.processingAction = false;
          this.closeConfirmModal();
          this.cdr.detectChanges();
          this.toastr.error(err.error?.message || 'Payment could not be collected.', 'Payment Failed');
        }
      });
    } else if (action === 'checkout') {
      this.checkingOut = true;
      this.cdr.detectChanges();

      this.roomBookingService.checkOut(this.bill!.bookingId).subscribe({
        next: (response: any) => {
          this.checkingOut = false;
          this.processingAction = false;
          this.closeConfirmModal();
          this.cdr.detectChanges();
          if (response?.statusCode && response.statusCode >= 400) {
            this.toastr.error(response.message || 'Unable to check out guest.', 'Checkout Failed');
            return;
          }
          this.toastr.success('Guest has been checked out successfully.', 'Checked Out');
          this.resetSearch();
        },
        error: (err) => {
          this.checkingOut = false;
          this.processingAction = false;
          this.closeConfirmModal();
          this.cdr.detectChanges();
          this.toastr.error(err.error?.message || 'Unable to check out guest.', 'Checkout Failed');
        }
      });
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmAction = '';
    this.processingAction = false;
  }
}