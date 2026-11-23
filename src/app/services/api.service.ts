import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Lesson {
  id: number;
  courseId: number;
  lessonNumber: number;
  title: string;
  description?: string;
  durationMinutes: number;
  driveVideoLink?: string;
  isFreePreview: boolean;
  createdAt: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  subject: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  validityDays: number;
  totalVideos: number;
  driveFolderLink?: string;
  createdAt: string;
  lessons?: Lesson[];
}

export interface Order {
  id: number;
  orderNumber: string;
  courseId: number;
  courseTitle: string;
  driveFolderLink: string;
  amount: number;
  paymentStatus: string;
  driveAccessStatus: string;
  createdAt: string;
}

export interface Testimonial {
  id: number;
  studentName: string;
  designation: string;
  speech: string;
  avatarUrl?: string;
  rating: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  // Dynamically reads from assets/env.js window.__env.apiUrl, defaults to http://localhost:5000/api
  public get baseUrl(): string {
    const env = (typeof window !== 'undefined') ? (window as any)?.__env : null;
    if (env && env.apiUrl) {
      return env.apiUrl.replace(/\/+$/, '');
    }
    return 'http://localhost:5000/api';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('tm_student_token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Course Catalog
  getCourses(publicOnly: boolean = true): Observable<Course[]> {
    return this.http.get<any>(`${this.baseUrl}/courses?publicOnly=${publicOnly}`).pipe(
      map(res => (res?.data !== undefined ? res.data : res) as Course[])
    );
  }

  getCourseBySlug(slug: string): Observable<Course> {
    return this.http.get<any>(`${this.baseUrl}/courses/slug/${slug}`).pipe(
      map(res => (res?.data !== undefined ? res.data : res) as Course)
    );
  }

  // Testimonials (Success Stories)
  getTestimonials(): Observable<Testimonial[]> {
    return this.http.get<any>(`${this.baseUrl}/testimonials?activeOnly=true`).pipe(
      map(res => (res?.data !== undefined ? res.data : res) as Testimonial[])
    );
  }

  // Auth
  register(data: { fullName: string; email: string; password: string; phoneNumber?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, data).pipe(
      map(res => (res?.data !== undefined ? res.data : res))
    );
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, data).pipe(
      map(res => (res?.data !== undefined ? res.data : res))
    );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => (res?.data !== undefined ? res.data : res))
    );
  }

  // Checkout & Orders
  checkout(courseId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/checkout`, { courseId }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => (res?.data !== undefined ? res.data : res))
    );
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<any>(`${this.baseUrl}/orders/my-orders`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => (res?.data !== undefined ? res.data : res) as Order[])
    );
  }

  // Simulate Payment for local testing
  simulatePayment(tranId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payment/simulate-success`, { tranId }).pipe(
      map(res => (res?.data !== undefined ? res.data : res))
    );
  }
}
