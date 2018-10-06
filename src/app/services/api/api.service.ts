import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getTasks() {
    return this.http.get(`${this.apiUrl}/tasks`);
  }

  submitTasks(data: any[]) {
    return this.http.post(`${this.apiUrl}/submit`, data);
  }
}
