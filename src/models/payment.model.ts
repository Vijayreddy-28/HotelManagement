export enum PaymentMethod {
    Cash = 1,
    CreditCard = 2,
    DebitCard = 3,
    Upi = 4,
    NetBanking = 5,
}

export enum PaymentStatus {
    Pending = 1,
    Paid = 2,
    Failed = 3,
    Refunded = 4,
}

export class CreatePaymentRequest {
    constructor(
        public billId: number,
        public amountPaid: number,
        public method: PaymentMethod,
    ) { }
}

export class PaymentResponse {
    constructor(
        public paymentId: number,
        public billId: number,
        public amountPaid: number,
        public method: PaymentMethod,
        public status: PaymentStatus,
        public transactionId: string,
        public paidAt: string,
    ) { }
}