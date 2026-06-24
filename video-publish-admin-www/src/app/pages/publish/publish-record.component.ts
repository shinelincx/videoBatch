import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

type PublishRecordRow = Record<string, unknown>;

interface DisplayColumn {
  key: string;
  title: string;
  width: string;
  link?: boolean;
  number?: boolean;
}

const displayColumns: DisplayColumn[] = [
  { key: 'id', title: 'ID', width: '90px' },
  { key: 'displayProductId', title: '商品ID', width: '130px' },
  { key: 'displayProductTitle', title: '商品标题', width: '240px' },
  { key: 'displayProductLink', title: '商品链接', width: '180px', link: true },
  { key: 'displayAccountNickname', title: '账号昵称', width: '150px' },
  { key: 'displayStatus', title: '发布状态', width: '120px' },
  { key: 'displayReason', title: '原因', width: '220px' },
  { key: 'displayOwner', title: '所属用户', width: '130px' },
  { key: 'displayCreateTime', title: '创建时间', width: '170px' }
];

@Component({
  selector: 'app-publish-record',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">发布记录</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <button nz-button (click)="refresh()" [nzLoading]="loading">
            <nz-icon nzType="reload"></nz-icon>
            <span>刷新</span>
          </button>
        </div>

        <nz-table
          nzSize="small"
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [nzPageIndex]="pageIndex"
          [nzPageSize]="pageSize"
          [nzFrontPagination]="false"
          [nzShowSizeChanger]="true"
          [nzScroll]="{ x: '1430px' }"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
        >
          <thead>
            <tr>
              @for (column of columns; track column.key) {
                <th [nzWidth]="column.width">{{ column.title }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of data; track getRowId(item, $index)) {
              <tr>
                @for (column of columns; track column.key) {
                  <td>
                    @if (column.link && hasValue(item[column.key])) {
                      <a class="cell-text" [href]="asString(item[column.key])" target="_blank" rel="noopener">
                        {{ displayText(item[column.key]) }}
                      </a>
                    } @else {
                      <span class="cell-text" [title]="displayText(item[column.key])">
                        {{ column.number ? numberText(item[column.key]) : displayText(item[column.key]) }}
                      </span>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header {
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .page-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0;
      color: #262626;
    }
    .card-container {
      background: #fff;
      border-radius: 4px;
      padding: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.02);
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .cell-text {
      display: inline-block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
  `]
})
export class PublishRecordComponent implements OnInit {
  columns = displayColumns;
  data: PublishRecordRow[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  refresh(): void {
    this.loadData();
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadData();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.sysApi.getPublishRecordList({ current: this.pageIndex, size: this.pageSize }).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          const page = res.data.page || res.data;
          this.data = page.records || [];
          this.total = page.total || 0;
        } else {
          this.data = [];
          this.total = 0;
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载发布记录失败');
          }
        }
        this.loading = false;
      },
      error: () => {
        this.message.error('加载发布记录失败');
        this.loading = false;
      }
    });
  }

  getRowId(item: PublishRecordRow, index: number): unknown {
    return item['id'] ?? index;
  }

  hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  displayText(value: unknown): string {
    if (!this.hasValue(value)) return '-';
    return String(value);
  }

  numberText(value: unknown): string {
    if (!this.hasValue(value)) return '0';
    return String(value);
  }

  asString(value: unknown): string {
    return typeof value === 'string' ? value : String(value || '');
  }
}
