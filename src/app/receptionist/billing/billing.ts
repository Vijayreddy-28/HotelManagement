import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
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

  // Step 2: Payment section (revealed automatically once a bill exists)
  billIdForPayment: number | null = null;
  selectedMethod: PaymentMethod | null = null;
  verifiedWithCustomer = false;
  collectingPayment = false;
  paymentCollected = false;

  // Step 3: Checkout
  checkingOut = false;

  constructor(
    private billingService: BillingService,
    private paymentService: PaymentService,
    private roomBookingService: RoomBookingService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

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

  collectPayment(): void {
    if (!this.bill || !this.billIdForPayment || this.selectedMethod === null) {
      this.toastr.warning('Please select a payment method before collecting payment.', 'Validation');
      return;
    }
    if (!this.verifiedWithCustomer) {
      this.toastr.warning('Please verify the payment details with the guest first.', 'Validation');
      return;
    }

    Swal.fire({
      title: 'Confirm Payment Collection',
      html: `Collect <strong>\u20b9${this.bill.totalAmount.toLocaleString()}</strong> for Bill #${this.billIdForPayment}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Collect Payment',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const request = new CreatePaymentRequest(this.billIdForPayment!, this.bill!.totalAmount, this.selectedMethod!);

      this.collectingPayment = true;
      this.cdr.detectChanges();

      this.paymentService.createPayment(request).subscribe({
        next: (response: any) => {
          this.collectingPayment = false;

          if (response?.statusCode && response.statusCode >= 400) {
            this.cdr.detectChanges();
            this.toastr.error(response.message || 'Payment could not be collected.', 'Payment Failed');
            return;
          }

          // Only mark the payment as collected once the API confirms success.
          this.paymentCollected = true;
          this.cdr.detectChanges();
          this.toastr.success('Payment collected successfully. You may now check out the guest.', 'Payment Successful');
        },
        error: (err) => {
          this.collectingPayment = false;
          this.cdr.detectChanges();
          // paymentCollected stays false here so the form remains editable and the guest can retry.
          this.toastr.error(err.error?.message || 'Payment could not be collected.', 'Payment Failed');
        }
      });
    });
  }

  // ===================== Checkout =====================
  checkout(): void {
    if (!this.bill || !this.paymentCollected) return;

    Swal.fire({
      title: 'Confirm Check-Out',
      text: `Complete check-out for Booking #${this.bill.bookingId}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Check Out Guest',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.checkingOut = true;
      this.cdr.detectChanges();

      this.roomBookingService.checkOut(this.bill!.bookingId).subscribe({
        next: (response: any) => {
          this.checkingOut = false;
          this.cdr.detectChanges();
          if (response?.statusCode && response.statusCode >= 400) {
            this.toastr.error(response.message || 'Unable to check out guest.', 'Checkout Failed');
            return;
          }
          Swal.fire('Checked Out', 'Guest has been checked out successfully.', 'success');
          this.resetSearch();
        },
        error: (err) => {
          this.checkingOut = false;
          this.cdr.detectChanges();
          this.toastr.error(err.error?.message || 'Unable to check out guest.', 'Checkout Failed');
        }
      });
    });
  }
}