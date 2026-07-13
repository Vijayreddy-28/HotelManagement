import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../../../services/feedback.service';
import { Feedback } from '../../../models/feedback.model';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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
    private feedbackService: FeedbackService,
    private toastr: ToastrService
  ) {
    this.feedbackForm = this.fb.group({
      bookingId: ['', [Validators.required, Validators.min(1)]],
      foodRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      roomRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      hygieneRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      staffRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      overallRating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  submitFeedback() {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      this.toastr.warning('Please complete all rating segments before submitting.', 'Validation Error');
      return;
    }

    const feedback: Feedback = this.feedbackForm.value;
    this.feedbackService.submitFeedback(feedback).subscribe({
      next: () => {
        this.toastr.success('Thank you for sharing your experience! Feedback submitted successfully.', 'Success');
        this.feedbackForm.reset();
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to submit feedback at this time. Please try again.', 'Submission Error');
      }
    });
  }

  ratings = [1, 2, 3, 4, 5];

  setRating(controlName: string, rating: number) {
    this.feedbackForm.get(controlName)?.setValue(rating);
    this.feedbackForm.get(controlName)?.markAsTouched();
  }

  getRating(controlName: string): number {
    return this.feedbackForm.get(controlName)?.value || 0;
  }

  getRatingLabel(value: number): string {
    switch (value) {
      case 5: return 'Excellent';
      case 4: return 'Very Good';
      case 3: return 'Good / Average';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'Tap to Rate';
    }
  }
}
