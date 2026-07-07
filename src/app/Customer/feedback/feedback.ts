import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../../../services/feedback.service';
import { Feedback } from '../../../models/feedback.model';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-feedback',
  imports: [ReactiveFormsModule, CommonModule],
  standalone: true,
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.css']
})
export class FeedbackComponent {

  feedbackForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService
  ) {

    this.feedbackForm = this.fb.group({
      bookingId: ['', Validators.required],
      foodRating: ['', Validators.required],
      roomRating: ['', Validators.required],
      hygieneRating: ['', Validators.required],
      staffRating: ['', Validators.required],
      overallRating: ['', Validators.required],
      comments: ['', [Validators.required, Validators.maxLength(500)]]

    });
  }

  submitFeedback() {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    const feedback: Feedback = this.feedbackForm.value;
    this.feedbackService.submitFeedback(feedback).subscribe({
      next: () => {
        alert("Feedback submitted successfully.");
        this.feedbackForm.reset();
      },
      error: () => {
        alert("Unable to submit feedback.");
      }
    });
  }

  ratings = [1, 2, 3, 4, 5];

  setRating(controlName: string, rating: number) {
    this.feedbackForm.get(controlName)?.setValue(rating);
  }

  getRating(controlName: string): number {
    return this.feedbackForm.get(controlName)?.value || 0;
  }
}

