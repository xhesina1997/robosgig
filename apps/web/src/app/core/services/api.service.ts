import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyzeJobRequest {
  rawInput: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export interface JobPreview {
  title: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  urgency: string;
  priceMin: number;
  priceMax: number;
  estimatedHours: number;
  toolsNeeded: string[];
  summary: string;
}

export interface SuggestedWorker {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  rating: number;
  totalJobs: number;
  hourlyRate: number | null;
  city: string;
  distanceKm: number;
  skills: string[];
  matchScore: number;
  matchReasons: string[];
  isAvailable: boolean;
  idVerified: boolean;
}

export interface AnalyzeJobResponse {
  jobPreview: JobPreview;
  suggestedWorkers: SuggestedWorker[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ── Auth ──────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<{ accessToken: string; role: string }> {
    return this.http.post<{ accessToken: string; role: string }>(`${this.baseUrl}/auth/login`, { email, password });
  }

  register(data: unknown): Observable<{ accessToken: string; role: string }> {
    return this.http.post<{ accessToken: string; role: string }>(`${this.baseUrl}/auth/register`, data);
  }

  // ── Jobs ──────────────────────────────────────────────────────────
  analyzeJob(request: AnalyzeJobRequest): Observable<AnalyzeJobResponse> {
    return this.http.post<AnalyzeJobResponse>(`${this.baseUrl}/jobs/analyze`, request);
  }

  createJob(data: unknown): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/jobs`, data);
  }

  getJob(id: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/jobs/${id}`);
  }

  // ── Workers ───────────────────────────────────────────────────────
  getMyWorkerProfile(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/workers/me`);
  }

  updateWorkerProfile(data: unknown): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/workers/me`, data);
  }

  getNearbyJobs(skip = 0): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/workers/me/jobs?skip=${skip}&take=10`);
  }

  getAllSkills(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/workers/skills`);
  }

  addSkill(skillId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/workers/me/skills/${skillId}`, {});
  }

  removeSkill(skillId: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/workers/me/skills/${skillId}`);
  }

  getWorkerPublicProfile(workerId: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/workers/${workerId}`);
  }

  // ── Applications ──────────────────────────────────────────────────
  applyToJob(jobId: string, data: { proposedPrice?: number; message?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/jobs/${jobId}/apply`, data);
  }

  getJobApplications(jobId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/jobs/${jobId}/applications`);
  }

  acceptApplication(applicationId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/applications/${applicationId}/accept`, {});
  }

  rejectApplication(applicationId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/applications/${applicationId}/reject`, {});
  }

  workerWithdrawApplication(applicationId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/applications/${applicationId}/withdraw`, {});
  }

  workerAcceptAssignment(applicationId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/applications/${applicationId}/worker-accept`, {});
  }

  workerDeclineAssignment(applicationId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/applications/${applicationId}/worker-decline`, {});
  }

  completeJob(jobId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/jobs/${jobId}/complete`, {});
  }

  leaveReview(jobId: string, data: { rating: number; comment?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/jobs/${jobId}/review`, data);
  }

  // ── Verify ────────────────────────────────────────────────────────────
  getVerifyStatus(): Observable<{ idVerified: boolean; verification: { status: string } | null }> {
    return this.http.get<{ idVerified: boolean; verification: { status: string } | null }>(`${this.baseUrl}/verify/status`);
  }

  createVerifySession(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.baseUrl}/verify/session`, {});
  }

  getAdminVerifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/verify/admin/all`);
  }

  // ── Payments ──────────────────────────────────────────────────────
  createJobPaymentSession(jobId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/payments/jobs/${jobId}/checkout`, {});
  }

  confirmJobPayment(jobId: string, sessionId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/payments/jobs/${jobId}/confirm`, { sessionId });
  }

  getJobPayment(jobId: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/payments/jobs/${jobId}`);
  }

  // ── Chat ──────────────────────────────────────────────────────────
  getChatConversations(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/chat/conversations`);
  }

  // ── Dashboard ─────────────────────────────────────────────────────
  getClientDashboard(skip = 0): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/dashboard/client?skip=${skip}&take=10`);
  }

  getWorkerDashboard(skip = 0): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/dashboard/worker?skip=${skip}&take=10`);
  }

  // ── Subscriptions ─────────────────────────────────────────────────
  getMySubscription(): Observable<{ planType: string; isActive: boolean; currentPeriodEnd?: string }> {
    return this.http.get<{ planType: string; isActive: boolean; currentPeriodEnd?: string }>(`${this.baseUrl}/subscriptions/me`);
  }

  createCheckoutSession(planType: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/subscriptions/checkout`, { planType });
  }

  activateSubscription(planType: string, sessionId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/subscriptions/activate`, { planType, sessionId });
  }

  cancelSubscription(): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/subscriptions/me`);
  }
}
