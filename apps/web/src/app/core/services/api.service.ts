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

  register(data: unknown): Observable<{ accessToken: string; role: string } | { requiresVerification: boolean; email: string }> {
    return this.http.post<{ accessToken: string; role: string } | { requiresVerification: boolean; email: string }>(`${this.baseUrl}/auth/register`, data);
  }

  verifyEmail(email: string, code: string): Observable<{ accessToken: string; role: string }> {
    return this.http.post<{ accessToken: string; role: string }>(`${this.baseUrl}/auth/verify-email`, { email, code });
  }

  resendVerification(email: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${this.baseUrl}/auth/resend-verification`, { email });
  }

  // ── Jobs ──────────────────────────────────────────────────────────
  analyzeJob(request: AnalyzeJobRequest): Observable<AnalyzeJobResponse> {
    return this.http.post<AnalyzeJobResponse>(`${this.baseUrl}/jobs/analyze`, request);
  }

  createJob(data: unknown): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/jobs`, data);
  }

  saveJobDraft(data: {
    id?: string;
    rawInput?: string;
    title?: string;
    description?: string;
    urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
    categorySlug?: string;
    priceMin?: number;
    priceMax?: number;
    estimatedHours?: number;
    toolsNeeded?: string[];
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    scheduledDate?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/jobs/drafts`, data);
  }

  listJobDrafts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/jobs/drafts`);
  }

  deleteJobDraft(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/jobs/drafts/${id}`);
  }

  publishJobDraft(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/jobs/drafts/${id}/publish`, {});
  }

  getJob(id: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/jobs/${id}`);
  }

  deleteJob(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/jobs/${id}`);
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

  getJobsForMap(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/workers/me/jobs/map`);
  }

  getWorkerJobDetail(id: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/workers/me/jobs/${id}`);
  }

  parseAiMapFilter(query: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/workers/me/jobs/ai-filter`, { query });
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

  createVerifySession(country: string): Observable<{ method: 'STRIPE'; clientSecret: string } | { method: 'MANUAL' }> {
    return this.http.post<{ method: 'STRIPE'; clientSecret: string } | { method: 'MANUAL' }>(`${this.baseUrl}/verify/session`, { country });
  }

  submitManualVerification(body: { country: string; idFrontUrl: string; idBackUrl?: string | null; selfieUrl: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/verify/manual`, body);
  }

  getCloudinarySignature(folder: string): Observable<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }> {
    return this.http.post<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>(`${this.baseUrl}/cloudinary/signature`, { folder });
  }

  getAdminVerifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/verify/admin/all`);
  }

  approveVerification(id: string, documentType?: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/verify/admin/${id}/approve`, { documentType });
  }

  rejectVerification(id: string, reason?: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/verify/admin/${id}/reject`, { reason });
  }

  // ── Payments ──────────────────────────────────────────────────────
  createJobPaymentSession(jobId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/payments/jobs/${jobId}/checkout`, {});
  }

  confirmJobPayment(jobId: string, sessionId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/payments/jobs/${jobId}/confirm`, { sessionId });
  }

  reconfirmJobPayment(jobId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/payments/jobs/${jobId}/confirm`, {});
  }

  getJobPayment(jobId: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/payments/jobs/${jobId}`);
  }

  getSavedPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/payments/me/payment-methods`);
  }

  removePaymentMethod(id: string): Observable<{ removed: boolean }> {
    return this.http.delete<{ removed: boolean }>(`${this.baseUrl}/payments/me/payment-methods/${id}`);
  }

  createCardSetupIntent(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.baseUrl}/payments/me/payment-methods/setup`, {});
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

  // ── Clients ───────────────────────────────────────────────────────
  getClientProfile(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/clients/me`);
  }

  getClientStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/clients/me/stats`);
  }

  getClientTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/clients/me/transactions`);
  }

  getWorkerStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/workers/me/stats`);
  }

  getSavedJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/workers/me/saved-jobs`);
  }

  saveJob(jobId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/workers/me/saved-jobs/${jobId}`, {});
  }

  unsaveJob(jobId: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/workers/me/saved-jobs/${jobId}`);
  }

  updateClientProfile(data: unknown): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/clients/me`, data);
  }

  // ── Stripe Connect (worker payouts) ───────────────────────────────
  getConnectStatus(): Observable<{ connected: boolean; onboarded: boolean; payoutsEnabled: boolean }> {
    return this.http.get<{ connected: boolean; onboarded: boolean; payoutsEnabled: boolean }>(`${this.baseUrl}/workers/me/connect/status`);
  }

  startConnectOnboarding(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/workers/me/connect/onboard`, {});
  }

  getConnectDashboardLink(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.baseUrl}/workers/me/connect/dashboard`);
  }

  // ── Account ───────────────────────────────────────────────────────
  changePassword(currentPassword: string, newPassword: string): Observable<{ updated: boolean }> {
    return this.http.patch<{ updated: boolean }>(`${this.baseUrl}/auth/password`, { currentPassword, newPassword });
  }

  deleteAccount(): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/auth/me`);
  }

  // ── Admin Payouts & Settings ──────────────────────────────────────
  getAdminPayouts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/admin/payouts`);
  }

  markPayoutSent(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/dashboard/admin/payouts/${paymentId}/mark-sent`, {});
  }

  getAdminSettings(): Observable<{ feeDefault: number; feeWorkerPro: number; feeClientBusiness: number }> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/admin/settings`);
  }

  updateAdminSettings(data: { feeDefault?: number; feeWorkerPro?: number; feeClientBusiness?: number }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/dashboard/admin/settings`, data);
  }

  // ── Admin ─────────────────────────────────────────────────────────
  getAdminDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/admin`);
  }

  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/admin/users`);
  }

  getAdminSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/admin/subscriptions`);
  }

  getAdminConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/admin/conversations`);
  }

  getAdminConversationMessages(jobId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/admin/conversations/${jobId}/messages`);
  }

  // ── Reports ───────────────────────────────────────────────────────
  submitReport(data: { category: string; subject: string; description: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/reports`, data);
  }

  getAdminReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reports/admin`);
  }

  updateReportStatus(id: string, status: string, adminNotes?: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/reports/admin/${id}`, { status, adminNotes });
  }
}
