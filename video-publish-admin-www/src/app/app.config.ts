import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import zhHans from '@angular/common/locales/zh-Hans';
import { NzIconModule, provideNzIcons } from 'ng-zorro-antd/icon';
import { NZ_DATE_LOCALE, provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import zhCN from 'date-fns/locale/zh-CN';
import { 
  PlusOutline, 
  UserOutline, 
  LockOutline, 
  MenuOutline, 
  KeyOutline, 
  BuildOutline,
  SearchOutline,
  EditOutline,
  DeleteOutline,
  EyeOutline,
  PlayCircleOutline,
  SettingOutline,
  FileOutline,
  VideoCameraOutline,
  SendOutline,
  BarChartOutline,
  LogoutOutline,
  HomeOutline,
  FolderOutline,
  TagOutline,
  DatabaseOutline,
  LinkOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  ReloadOutline,
  RollbackOutline,
  ImportOutline,
  CalendarOutline,
  CloseCircleFill,
  ClockCircleOutline,
  LeftOutline,
  RightOutline,
  DoubleLeftOutline,
  DoubleRightOutline
} from '@ant-design/icons-angular/icons';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(zhHans);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideNzI18n(zh_CN),
    { provide: LOCALE_ID, useValue: 'zh-Hans' },
    { provide: NZ_DATE_LOCALE, useValue: zhCN },
    provideNzIcons([
      PlusOutline,
      UserOutline,
      LockOutline,
      MenuOutline,
      KeyOutline,
      BuildOutline,
      SearchOutline,
      EditOutline,
      DeleteOutline,
      EyeOutline,
      PlayCircleOutline,
      SettingOutline,
      FileOutline,
      VideoCameraOutline,
      SendOutline,
      BarChartOutline,
      LogoutOutline,
      HomeOutline,
      FolderOutline,
      TagOutline,
      DatabaseOutline,
      LinkOutline,
      MenuFoldOutline,
      MenuUnfoldOutline,
      ReloadOutline,
      RollbackOutline,
      ImportOutline,
      CalendarOutline,
      CloseCircleFill,
      ClockCircleOutline,
      LeftOutline,
      RightOutline,
      DoubleLeftOutline,
      DoubleRightOutline
    ]),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
