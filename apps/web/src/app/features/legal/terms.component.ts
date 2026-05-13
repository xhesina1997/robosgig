import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="page">
      <div class="inner">

        <div class="back-row">
          <a routerLink="/" class="back-link">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to RobosGig
          </a>
        </div>

        <div class="doc-header">
          <div class="brand">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="6" fill="#18181b"/><path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="white"/></svg>
            <span>RobosGig</span>
          </div>
          <h1 class="doc-title">Terms of Service & Platform Agreement</h1>
          <p class="doc-meta">Last updated: April 6, 2026 · Effective immediately upon account creation</p>
        </div>

        <div class="doc-body">

          <div class="notice-box">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <strong>Important:</strong> By creating an account, you agree to these terms in full — including our platform fee schedule and the strict prohibition on off-platform transactions.
          </div>

          <section>
            <h2>1. About RobosGig</h2>
            <p>RobosGig is an AI-powered task marketplace that connects clients who need work done with verified, skilled workers. We provide the platform, matching technology, communication tools, and secure payment processing. We are not a party to any contract between clients and workers.</p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>You must be at least 18 years old to use RobosGig. By registering, you confirm that all information you provide is accurate and complete. You are responsible for maintaining the security of your account credentials.</p>
          </section>

          <section>
            <h2>3. Identity Verification</h2>
            <p>All workers are required to verify their identity by uploading a valid government-issued ID document before applying to jobs. Clients may also be required to verify their identity. Verification documents are reviewed manually by our team and stored securely. Providing false documents is grounds for immediate and permanent account termination.</p>
          </section>

          <section>
            <h2>4. Platform Fees</h2>
            <p>RobosGig charges a platform service fee on every completed job. The fee is automatically deducted from the total job payment before the worker receives their payout. The fee schedule is as follows:</p>

            <div class="fee-table">
              <div class="fee-row fee-row--header">
                <span>Plan</span>
                <span>Platform fee</span>
                <span>Who it applies to</span>
              </div>
              <div class="fee-row">
                <span>Standard (Free)</span>
                <span class="fee-val">15%</span>
                <span>All users by default</span>
              </div>
              <div class="fee-row">
                <span>Worker Pro</span>
                <span class="fee-val fee-pro">12%</span>
                <span>Workers on the Pro plan</span>
              </div>
              <div class="fee-row">
                <span>Client Business</span>
                <span class="fee-val fee-biz">10%</span>
                <span>Clients on the Business plan</span>
              </div>
            </div>

            <p>For example: if a job is agreed at €100 and neither party has a paid plan, the worker receives €85 and RobosGig retains €15. Fees are non-refundable except in cases of documented fraud.</p>
            <p>By using RobosGig, you expressly acknowledge and accept the fee schedule above. Fees may be updated with 30 days' notice to registered users.</p>
          </section>

          <section>
            <h2>5. Non-Circumvention Policy</h2>
            <div class="highlight-box">
              <p><strong>You may not, under any circumstances, arrange, negotiate, or complete transactions with other RobosGig users outside of the RobosGig platform.</strong></p>
            </div>
            <p>This includes but is not limited to:</p>
            <ul>
              <li>Exchanging personal phone numbers, email addresses, or social media contacts through the RobosGig chat for the purpose of conducting transactions off-platform</li>
              <li>Paying a worker directly (cash, bank transfer, PayPal, etc.) for work found through RobosGig</li>
              <li>A worker accepting payment directly from a client found through RobosGig</li>
              <li>Re-engaging a RobosGig worker for subsequent jobs outside the platform</li>
            </ul>
            <p>Violations of this policy result in <strong>immediate account suspension</strong> and may result in legal action to recover lost platform fees. We monitor for patterns of off-platform communication and reserve the right to investigate suspected violations.</p>
            <p>The non-circumvention obligation applies for <strong>24 months</strong> after your last transaction on RobosGig involving the other party.</p>
          </section>

          <section>
            <h2>6. Payments & Refunds</h2>
            <p>All payments are processed securely through Stripe. Clients pay for jobs through the RobosGig platform. Workers receive their payout (total minus platform fee) within 2–5 business days of job completion. RobosGig does not hold funds beyond what is necessary for payment processing.</p>
            <p>Refunds may be issued at RobosGig's discretion in cases of fraud, verified non-delivery, or technical errors. Platform fees are non-refundable.</p>
          </section>

          <section>
            <h2>7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Post false, misleading, or fraudulent job listings or applications</li>
              <li>Harass, threaten, or discriminate against any other user</li>
              <li>Attempt to manipulate reviews or ratings</li>
              <li>Use RobosGig for any illegal activity</li>
              <li>Circumvent platform fees or attempt to contact matched users outside the platform (see Section 5)</li>
              <li>Create multiple accounts to evade suspensions or bans</li>
            </ul>
          </section>

          <section>
            <h2>8. Reviews & Ratings</h2>
            <p>After job completion, clients may leave a review rating workers from 1 to 5 stars. Reviews must be honest and based on actual experience. RobosGig reserves the right to remove reviews that violate our guidelines. Attempting to manipulate ratings — by offering incentives for positive reviews or threatening negative reviews — is prohibited.</p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>RobosGig is a marketplace platform. We do not employ workers and are not responsible for the quality, safety, or legality of services provided. Workers are independent contractors. RobosGig's liability is limited to the fees paid to RobosGig for the transaction in question. We are not liable for any indirect, incidental, or consequential damages.</p>
          </section>

          <section>
            <h2>10. Termination</h2>
            <p>RobosGig may suspend or terminate your account at any time for violation of these terms. You may close your account at any time by contacting support. Upon termination, your access to the platform ceases immediately. Pending payouts will be processed in accordance with our payment schedule.</p>
          </section>

          <section>
            <h2>11. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. We will notify registered users of material changes via email or in-app notification at least 30 days in advance. Continued use of the platform after the effective date constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>For questions about these Terms, please contact us at <strong>legal&#64;robosgig.io</strong>.</p>
          </section>

        </div>

        <div class="doc-footer">
          <p>By creating an account on RobosGig, you confirm that you have read, understood, and agree to be bound by these Terms of Service & Platform Agreement.</p>
          <a routerLink="/register" class="btn-cta">Create an account</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: var(--rg-bg, var(--rg-bg, #F8F8F8)); padding: 3rem 1.5rem; }
    .inner { max-width: 760px; margin: 0 auto; }

    .back-row { margin-bottom: 2rem; }
    .back-link {
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.82rem; font-weight: 600; color: #71717a; text-decoration: none;
      transition: color 0.15s;
    }
    .back-link:hover { color: #18181b; }

    .doc-header { margin-bottom: 2.5rem; }
    .brand {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.95rem; font-weight: 700; color: #18181b;
      margin-bottom: 1.5rem;
    }
    .doc-title {
      font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800;
      color: #09090b; letter-spacing: -0.03em; margin: 0 0 0.5rem;
    }
    .doc-meta { font-size: 0.8rem; color: #71717a; }

    .notice-box {
      display: flex; align-items: flex-start; gap: 0.75rem;
      background: #fffbeb; border: 1px solid #fde68a;
      color: #92400e; border-radius: 10px; padding: 1rem 1.25rem;
      font-size: 0.875rem; line-height: 1.6; margin-bottom: 2rem;
    }
    .notice-box svg { flex-shrink: 0; margin-top: 2px; color: #d97706; }

    .doc-body { background: #fff; border-radius: 16px; border: 1px solid #e4e4e7; padding: 2.5rem; }

    section { margin-bottom: 2rem; }
    section:last-child { margin-bottom: 0; }

    h2 {
      font-size: 1rem; font-weight: 700; color: #18181b;
      margin: 0 0 0.75rem; padding-bottom: 0.5rem;
      border-bottom: 1px solid #f4f4f5;
    }
    p { font-size: 0.9rem; color: #3f3f46; line-height: 1.75; margin: 0 0 0.75rem; }
    p:last-child { margin-bottom: 0; }
    ul { padding-left: 1.25rem; margin: 0.5rem 0 0.75rem; }
    li { font-size: 0.9rem; color: #3f3f46; line-height: 1.75; margin-bottom: 0.35rem; }

    .highlight-box {
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 0.75rem;
    }
    .highlight-box p { color: #991b1b; margin: 0; }

    .fee-table {
      border: 1px solid #e4e4e7; border-radius: 10px; overflow: hidden;
      margin: 0.75rem 0 1rem; font-size: 0.875rem;
    }
    .fee-row {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      padding: 0.6rem 1rem; border-bottom: 1px solid #f4f4f5;
    }
    .fee-row:last-child { border-bottom: none; }
    .fee-row--header {
      background: var(--rg-bg, var(--rg-bg, #F8F8F8)); font-weight: 700; font-size: 0.75rem;
      color: #71717a; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .fee-val { font-weight: 700; color: #18181b; }
    .fee-pro { color: #0284c7; }
    .fee-biz { color: #16a34a; }

    .doc-footer {
      margin-top: 2rem; padding: 2rem;
      background: #fff; border-radius: 16px; border: 1px solid #e4e4e7;
      text-align: center;
    }
    .doc-footer p { font-size: 0.875rem; color: #71717a; margin-bottom: 1.25rem; }
    .btn-cta {
      display: inline-flex; align-items: center;
      background: #18181b; color: #fff; text-decoration: none;
      font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 2rem; border-radius: 99px;
      transition: background 0.2s;
    }
    .btn-cta:hover { background: #3f3f46; }
  `],
})
export class TermsComponent {}
