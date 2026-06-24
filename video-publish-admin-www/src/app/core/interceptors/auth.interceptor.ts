import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { isApiSessionExpiredResponse } from '../utils/api-session.util';
import * as CryptoJS from 'crypto-js';

const SIGN_KEY = 's.0wl?.i_s43$i1_';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timestamp = Date.now().toString();
    const nonceStr = this.generateNonceStr();
    const uri = this.getUri(req.url);

    const signature = this.generateSignature(timestamp, nonceStr, uri);

    const authReq = req.clone({
      withCredentials: true,
      setHeaders: {
        'signature': signature,
        'timestamp': timestamp,
        'nonceStr': nonceStr,
        'uri': uri
      }
    });

    return next.handle(authReq).pipe(
      tap({
        next: (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            const body = event.body;
            if (body && isApiSessionExpiredResponse(body)) {
              this.authService.handleSessionExpiredOnce(body.msg);
            }
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 302 || error.status === 401 ||
            (error.error && isApiSessionExpiredResponse(error.error)) ||
            (error.url && (error.url.includes('/page/401') || error.url.includes('/auth/page/401')))) {
          const msg = error.error && typeof error.error.msg === 'string' ? error.error.msg : undefined;
          this.authService.handleSessionExpiredOnce(msg);
          return EMPTY;
        }
        return throwError(() => error);
      })
    );
  }

  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getUri(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      let pathname = urlObj.pathname;
      if (pathname.startsWith('/api')) {
        pathname = pathname.substring(4);
      }
      return pathname;
    } catch {
      if (url.startsWith('/api')) {
        return url.substring(4);
      }
      return url;
    }
  }

  private generateSignature(timestamp: string, nonceStr: string, uri: string): string {
    const params: { [key: string]: string } = {
      timestamp,
      nonceStr,
      uri
    };

    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + `&key=${SIGN_KEY}`;

    return CryptoJS.MD5(signStr).toString().toLowerCase();
  }
}
