import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Feedback } from "../models/feedback.model";
import { apiUrl } from "../environment";


@Injectable()
export class FeedbackService {
    constructor(private http: HttpClient) { }

    public submitFeedback(feedback: Feedback) {
        const token = sessionStorage.getItem("token");
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const url = `${apiUrl}Feedback`;
        return this.http.post(url, feedback, { headers });
    }
}