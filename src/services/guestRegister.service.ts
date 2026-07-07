import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Register } from '../models/register';
import { apiUrl } from '../environment';

@Injectable()
export class GuestRegisterService {
  constructor(private http: HttpClient) {}

  public RegisterApiCall(registerModel: Register) {
    let url = `${apiUrl}Auth/register/customer`;
    return this.http.post(url, registerModel);
  }
}
