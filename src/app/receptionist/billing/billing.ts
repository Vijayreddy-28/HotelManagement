import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receptionist-billing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing.html',
  styleUrl: './billing.css'
})
export class ReceptionistBillingComponent implements OnInit {
  bills = [
    { invoiceNo: 'INV-2026-001', guestName: 'Aarav Mehta', roomNo: '102', roomCharges: 15000, serviceCharges: 2500, status: 'Unpaid' },
    { invoiceNo: 'INV-2026-002', guestName: 'Priya Patel', roomNo: '201', roomCharges: 8000, serviceCharges: 1200, status: 'Paid' },
    { invoiceNo: 'INV-2026-003', guestName: 'Rohan Sharma', roomNo: '105', roomCharges: 6000, serviceCharges: 450, status: 'Unpaid' },
    { invoiceNo: 'INV-2026-004', guestName: 'Neha Sen', roomNo: '304', roomCharges: 22000, serviceCharges: 4800, status: 'Paid' },
    { invoiceNo: 'INV-2026-005', guestName: 'Dr. John Doe', roomNo: '202', roomCharges: 24000, serviceCharges: 3500, status: 'Paid' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
