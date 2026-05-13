import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--rg-bg, #f8f8f8);font-family:system-ui">
      <div style="text-align:center;color:#71717a">
        <div style="width:32px;height:32px;border:3px solid #e4e4e7;border-top-color:#18181b;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 1rem"></div>
        Signing you in…
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    const role = this.route.snapshot.queryParamMap.get('role') as 'CLIENT' | 'WORKER' | 'ADMIN' | null;

    if (token && role) {
      this.auth.loginWithToken(token, role);
      if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
      else if (role === 'WORKER') this.router.navigate(['/dashboard/worker']);
      else this.router.navigate(['/dashboard/client']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
