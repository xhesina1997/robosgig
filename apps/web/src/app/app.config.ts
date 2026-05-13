import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const savedLang = (typeof localStorage !== 'undefined' && localStorage.getItem('rg_lang')) || 'en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      defaultLanguage: 'en',
      lang: savedLang,
      fallbackLang: 'en',
    }),
    provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json',
    }),
  ],
};

// Apply saved language on boot
if (typeof window !== 'undefined') {
  // Defer until after TranslateService is bootstrapped — settings component reads localStorage on init.
  document.documentElement.setAttribute('lang', savedLang);
}
