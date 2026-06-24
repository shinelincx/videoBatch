import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzCardModule
  ],
  template: `
    <div class="login-container">
      <nz-card class="login-card" nzTitle="视频发布管理系统">
        <form nz-form [formGroup]="loginForm" nzLayout="vertical" (ngSubmit)="onSubmit()">
          <nz-form-item>
            <nz-form-label nzRequired>用户名</nz-form-label>
            <nz-form-control nzErrorTip="请输入用户名">
              <input
                nz-input
                formControlName="uname"
                placeholder="请输入用户名"
                nzSize="large"
              />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>密码</nz-form-label>
            <nz-form-control nzErrorTip="请输入密码">
              <input
                nz-input
                type="password"
                formControlName="pwd"
                placeholder="请输入密码"
                nzSize="large"
                (keydown.enter)="onSubmit()"
              />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <button
                nz-button
                nzType="primary"
                nzSize="large"
                [nzLoading]="loading"
                class="login-button"
                type="submit"
                [disabled]="loginForm.invalid"
              >
                登录
              </button>
            </nz-form-control>
          </nz-form-item>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 400px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .login-button {
      width: 100%;
      margin-top: 16px;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      uname: new FormControl('admin', [Validators.required]),
      pwd: new FormControl('123456', [Validators.required])
    });

    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { uname, pwd } = this.loginForm.value;

    this.authService.login(uname, pwd).subscribe({
      next: (response) => {
        if (response.code === 0) {
          this.authService.handleLoginSuccess(response);
          this.message.success('登录成功');
          this.router.navigate(['/']);
        } else {
          this.message.error(response.msg || '登录失败');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('登录失败:', err);
        this.message.error(err.error?.msg || '登录失败，请稍后重试');
        this.loading = false;
      }
    });
  }
}
