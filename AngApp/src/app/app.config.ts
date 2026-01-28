import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { authInterceptor } from './identity/auth-interceptor';
import { AppErrorHandler } from './app-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    //provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withXsrfConfiguration({
        cookieName: "XSRF-TOKEN",
        headerName: "X-CSRF-TOKEN"
      }),
    ),
    {provide: ErrorHandler, useClass: AppErrorHandler},
  ]
};
