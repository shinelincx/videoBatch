import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';

interface TableData {
  id: string;
  name: string;
  status: string;
  created: Date;
}

@Component({
  selector: 'app-selection-source',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzSpaceModule,
    NzIconModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">选品来源</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <button nz-button nzType="primary">
            <nz-icon nzType="plus"></nz-icon>
            <span>新增</span>
          </button>
        </div>

        <nz-table
          [nzData]="data"
          [nzLoading]="loading"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
        >
          <thead>
            <tr>
              <th>来源名称</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track item.id) {
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.status }}</td>
                <td>{{ item.created | date: 'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>
                  <nz-space>
                    <button nz-button nzType="link" nzSize="small">编辑</button>
                    <button nz-button nzType="link" nzSize="small" nzDanger>删除</button>
                  </nz-space>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 0;
    }

    .page-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .page-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: #262626;
      letter-spacing: 0.3px;
    }

    .card-container {
      background: #fff;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .toolbar button {
      flex-shrink: 0;
    }
  `]
})
export class SelectionSourceComponent implements OnInit {
  data: TableData[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    setTimeout(() => {
      this.data = [
        { id: '1', name: '来源A', status: '启用', created: new Date() },
        { id: '2', name: '来源B', status: '禁用', created: new Date() }
      ];
      this.total = 2;
      this.loading = false;
    }, 500);
  }
}
