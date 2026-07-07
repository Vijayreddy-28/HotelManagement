export class Feedback {
    bookingId: number;
    foodRating: number;
    roomRating: number;
    hygieneRating: number;
    staffRating: number;
    overallRating: number;
    comments: string;

    constructor() {
        this.bookingId = 0;
        this.foodRating = 0;
        this.roomRating = 0;
        this.hygieneRating = 0;
        this.staffRating = 0;
        this.overallRating = 0;
        this.comments = '';
    }
}