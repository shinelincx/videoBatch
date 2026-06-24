import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { SysApiService } from '../../core/services/sys-api.service';
import { isApiSessionExpiredResponse } from '../../core/utils/api-session.util';

interface PublishAccountColumn {
  name: string;
  label: string;
  dataType: string;
  columnType: string;
  nullable: boolean;
  defaultValue?: unknown;
  autoIncrement: boolean;
  editable: boolean;
}

type PublishAccountRow = Record<string, unknown>;
type AccountId = number | string;

interface PublishAccountStatistics {
  accountCount: number;
  publishedCount: number;
  pendingPublishCount: number;
  currentMonthPublishCount: number;
  lastMonthPublishCount: number;
}

interface PublishConditionDraft {
  key: number;
  publishTimeRangeBegin: string;
  publishTimeRangeEnd: string;
  publishNum: number | null;
}

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
    NzFormModule,
    NzTagModule,
    NzSpaceModule,
    NzIconModule,
    NzPopconfirmModule,
    NzInputNumberModule,
    NzAvatarModule,
    NzSelectModule,
    NzCheckboxModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">发布账号</h2>
      </div>

      <div class="card-container">
        <div class="toolbar">
          <div class="toolbar-left">
            <button nz-button nzType="primary" (click)="showImportModal()">
              <nz-icon nzType="import"></nz-icon>
              <span>导入账号</span>
            </button>
          </div>
          <div class="toolbar-right">
            <button nz-button (click)="refresh()" [nzLoading]="loading">
              <nz-icon nzType="reload"></nz-icon>
              <span>刷新</span>
            </button>
          </div>
        </div>

        <div class="statistics-panel" [class.statistics-panel-loading]="statisticsLoading">
          <div class="stat-item">
            <div class="stat-label">账号数</div>
            <div class="stat-value">{{ statisticNumber('accountCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">已发布数</div>
            <div class="stat-value success">{{ statisticNumber('publishedCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">发布数</div>
            <div class="stat-value warning">{{ statisticNumber('pendingPublishCount') }}</div>
          </div>
          <div class="stat-item stat-item-total">
            <div class="stat-label">合计</div>
            <div class="month-total">
              <span>本月发布数 <strong>{{ statisticNumber('currentMonthPublishCount') }}</strong></span>
              <span class="month-divider"></span>
              <span>上月发布数 <strong>{{ statisticNumber('lastMonthPublishCount') }}</strong></span>
            </div>
          </div>
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
          [nzScroll]="{ x: '2260px' }"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
        >
          <thead>
            <tr>
              <th
                nzWidth="46px"
                [nzChecked]="publishAccountAllChecked"
                [nzIndeterminate]="publishAccountIndeterminate"
                [nzDisabled]="selectablePublishAccounts.length === 0"
                (nzCheckedChange)="onPublishAccountAllChecked($event)"
              ></th>
              <th nzWidth="72px">头像</th>
              <th nzWidth="150px">昵称</th>
              <th nzWidth="180px">品类</th>
              <th nzWidth="160px">配置名称</th>
              <th nzWidth="100px">发布数量</th>
              <th nzWidth="110px">今日发布数</th>
              <th nzWidth="110px">登录状态</th>
              <th nzWidth="160px">关联客户端</th>
              <th nzWidth="220px">发布条件</th>
              <th nzWidth="150px">所属用户</th>
              <th nzWidth="220px">异常原因</th>
              <th nzWidth="180px">最近登录</th>
              <th nzWidth="180px">最近发布时间</th>
              <th nzWidth="160px" nzRight>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of data; track getRowId(item, $index)) {
              <tr>
                <td
                  [nzChecked]="isPublishAccountChecked(item)"
                  [nzDisabled]="publishAccountId(item) === null"
                  (nzCheckedChange)="onPublishAccountChecked(item, $event)"
                ></td>
                <td>
                  <nz-avatar [nzSrc]="asString(item['displayAvatar'])" nzIcon="user" nzSize="small"></nz-avatar>
                </td>
                <td>
                  <span class="cell-text" [title]="displayText(item['displayNickname'])">{{ displayText(item['displayNickname']) }}</span>
                </td>
                <td>
                  <span class="cell-text category-cell" [title]="displayText(item['displayCategoryNames'])">{{ displayText(item['displayCategoryNames']) }}</span>
                </td>
                <td>
                  <span class="cell-text" [title]="displayText(item['displayConfigName'])">{{ displayText(item['displayConfigName']) }}</span>
                </td>
                <td>{{ numberText(item['publishConditionTotalNum']) }}</td>
                <td>{{ numberText(item['todayPublishCount']) }}</td>
                <td>
                  <nz-tag [nzColor]="loginStatusColor(item['loginStatus'] ?? item['login_status'])">
                    {{ loginStatusText(item['loginStatus'] ?? item['login_status']) }}
                  </nz-tag>
                </td>
                <td>
                  <span class="cell-text" [title]="displayRobotText(item)">{{ displayRobotText(item) }}</span>
                </td>
                <td>
                  <span class="cell-text condition-cell" [title]="formatPublishConditions(item)">{{ formatPublishConditions(item) }}</span>
                </td>
                <td>
                  <span class="cell-text" [title]="displayText(item['ownerName'])">{{ displayText(item['ownerName']) }}</span>
                </td>
                <td>
                  <span class="cell-text reason-cell" [title]="displayText(item['loginErrorReason'] ?? item['login_error_reason'])">
                    {{ displayText(item['loginErrorReason'] ?? item['login_error_reason']) }}
                  </span>
                </td>
                <td>
                  <span class="cell-text" [title]="displayDateTime(item['displayLastLoginTime'])">{{ displayDateTime(item['displayLastLoginTime']) }}</span>
                </td>
                <td>
                  <span class="cell-text" [title]="displayDateTime(item['displayLastPublishTime'])">{{ displayDateTime(item['displayLastPublishTime']) }}</span>
                </td>
                <td nzRight>
                  <div class="action-buttons">
                    <button nz-button nzType="link" nzSize="small" (click)="loginPublishAccount(item)">登录</button>
                    <button nz-button nzType="link" nzSize="small" (click)="showEditModal(item)">编辑</button>
                    <button
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="确定删除此账号?"
                      (nzOnConfirm)="deleteItem(item)"
                    >删除</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>

      <nz-modal
        [(nzVisible)]="modalVisible"
        [nzTitle]="modalTitle"
        [nzOkLoading]="modalLoading"
        (nzOnOk)="handleOk()"
        (nzOnCancel)="modalVisible = false"
        nzWidth="780px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" nzLayout="vertical">
            @if (editingId !== null && editingId !== undefined) {
              <div class="form-grid">
                <nz-form-item class="full-row">
                  <nz-form-label nzRequired>发布配置</nz-form-label>
                  <nz-form-control [nzValidateStatus]="form.controls['configId']" nzErrorTip="请选择发布配置">
                    <nz-select formControlName="configId" nzPlaceHolder="请选择发布配置" (ngModelChange)="onEditConfigChange($event)">
                      @for (config of configOptions; track getRowId(config, $index)) {
                        <nz-option [nzValue]="config['id']" [nzLabel]="configOptionLabel(config)"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
                <nz-form-item class="full-row">
                  <nz-form-label>关联客户端</nz-form-label>
                  <nz-form-control>
                    <nz-select
                      formControlName="robotId"
                      nzAllowClear
                      [nzLoading]="robotOptionsLoading"
                      nzPlaceHolder="请选择关联客户端"
                    >
                      @for (robot of robotOptions; track getRowId(robot, $index)) {
                        <nz-option [nzValue]="robot['id']" [nzLabel]="robotLabel(robot)"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
                <div class="condition-section full-row">
                  <div class="condition-header">
                    <span>发布条件</span>
                    <button nz-button nzSize="small" type="button" (click)="addEditCondition()">
                      <nz-icon nzType="plus"></nz-icon>
                      <span>添加</span>
                    </button>
                  </div>
                  @for (condition of editConditions; track condition.key; let index = $index) {
                    <div class="condition-row">
                      <nz-form-item>
                        <nz-form-label nzRequired>发布时间开始</nz-form-label>
                        <nz-form-control>
                          <nz-select [(ngModel)]="condition.publishTimeRangeBegin" [ngModelOptions]="{ standalone: true }" nzPlaceHolder="请选择发布时间开始">
                            @for (time of halfHourTimeOptions; track time.value) {
                              <nz-option [nzValue]="time.value" [nzLabel]="time.label"></nz-option>
                            }
                          </nz-select>
                        </nz-form-control>
                      </nz-form-item>
                      <nz-form-item>
                        <nz-form-label nzRequired>发布时间结束</nz-form-label>
                        <nz-form-control>
                          <nz-select [(ngModel)]="condition.publishTimeRangeEnd" [ngModelOptions]="{ standalone: true }" nzPlaceHolder="请选择发布时间结束">
                            @for (time of halfHourTimeOptions; track time.value) {
                              <nz-option [nzValue]="time.value" [nzLabel]="time.label"></nz-option>
                            }
                          </nz-select>
                        </nz-form-control>
                      </nz-form-item>
                      <nz-form-item>
                        <nz-form-label nzRequired>发布数量</nz-form-label>
                        <nz-form-control>
                          <nz-input-number
                            class="number-input"
                            [(ngModel)]="condition.publishNum"
                            [ngModelOptions]="{ standalone: true }"
                            [nzMin]="1"
                            [nzMax]="10"
                            [nzStep]="1"
                          ></nz-input-number>
                        </nz-form-control>
                      </nz-form-item>
                      <button nz-button nzType="link" nzDanger type="button" (click)="removeEditCondition(index)">删除</button>
                    </div>
                  }
                </div>
                <nz-form-item>
                  <nz-form-label>选品是否审核</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="selectionAudit" nzPlaceHolder="请选择选品是否审核">
                      <nz-option [nzValue]="0" nzLabel="否"></nz-option>
                      <nz-option [nzValue]="1" nzLabel="是"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
            } @else {
              <div class="form-grid">
                @for (column of editableColumns; track column.name) {
                  <nz-form-item [class.full-row]="isLongColumn(column)">
                    <nz-form-label [nzRequired]="isRequired(column)">{{ formLabel(column) }}</nz-form-label>
                    <nz-form-control [nzErrorTip]="'请填写' + formLabel(column)">
                      @if (isStatusColumn(column)) {
                        <nz-select [formControlName]="column.name">
                          <nz-option [nzValue]="1" nzLabel="启用"></nz-option>
                          <nz-option [nzValue]="0" nzLabel="禁用"></nz-option>
                          <nz-option [nzValue]="2" nzLabel="授权过期"></nz-option>
                        </nz-select>
                      } @else if (isConfigColumn(column)) {
                        <nz-select [formControlName]="column.name" nzAllowClear nzPlaceHolder="请选择发布配置">
                          @for (config of configOptions; track getRowId(config, $index)) {
                            <nz-option [nzValue]="configOptionValue(config, column)" [nzLabel]="configOptionLabel(config)"></nz-option>
                          }
                        </nz-select>
                      } @else if (isRobotColumn(column)) {
                        <nz-select [formControlName]="column.name" nzAllowClear [nzLoading]="robotOptionsLoading" nzPlaceHolder="请选择关联客户端">
                          @for (robot of robotOptions; track getRowId(robot, $index)) {
                            <nz-option [nzValue]="robot['id']" [nzLabel]="robotLabel(robot)"></nz-option>
                          }
                        </nz-select>
                      } @else if (isPublishTimeRangeColumn(column)) {
                        <nz-select [formControlName]="column.name" nzAllowClear [nzPlaceHolder]="'请选择' + formLabel(column)">
                          @for (time of halfHourTimeOptions; track time.value) {
                            <nz-option [nzValue]="time.value" [nzLabel]="time.label"></nz-option>
                          }
                        </nz-select>
                      } @else if (isNumberColumn(column)) {
                        <nz-input-number
                          class="number-input"
                          [formControlName]="column.name"
                          [nzMin]="getNumberMin(column)"
                          [nzStep]="getNumberStep(column)"
                        ></nz-input-number>
                      } @else if (isLongColumn(column)) {
                        <textarea nz-input [formControlName]="column.name" rows="4" [placeholder]="'请输入' + formLabel(column)"></textarea>
                      } @else {
                        <input nz-input [formControlName]="column.name" [placeholder]="'请输入' + formLabel(column)" />
                      }
                    </nz-form-control>
                  </nz-form-item>
                }
              </div>
            }
          </form>
        </ng-container>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="startPublishModalVisible"
        nzTitle="启动发布"
        [nzOkLoading]="startPublishModalLoading"
        [nzOkDisabled]="!selectedStartPublishRobotId || selectedPublishAccounts.length === 0"
        (nzOnOk)="handleStartPublishOk()"
        (nzOnCancel)="closeStartPublishModal()"
        nzWidth="520px"
      >
        <ng-container *nzModalContent>
          <div class="batch-summary">已选择 {{ selectedPublishAccounts.length }} 个发布账号</div>
          <nz-form-item>
            <nz-form-label nzRequired>在线客户端</nz-form-label>
            <nz-form-control>
              <nz-select
                class="login-client-select"
                [(ngModel)]="selectedStartPublishRobotId"
                [nzLoading]="onlineRobotsLoading"
                nzPlaceHolder="请选择在线客户端"
              >
                @for (robot of onlineRobots; track getRowId(robot, $index)) {
                  <nz-option [nzValue]="robot['id']" [nzLabel]="robotLabel(robot)"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </ng-container>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="importVisible"
        nzTitle="导入发布账号"
        [nzOkLoading]="importLoading"
        (nzOnOk)="handleImportOk()"
        (nzOnCancel)="importVisible = false"
        nzWidth="780px"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="importForm" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>发布配置</nz-form-label>
              <nz-form-control nzErrorTip="请选择发布配置">
                <nz-select formControlName="configId" nzPlaceHolder="请选择发布配置" (ngModelChange)="onImportConfigChange($event)">
                  @for (config of configOptions; track getRowId(config, $index)) {
                    <nz-option [nzValue]="config['id']" [nzLabel]="configOptionLabel(config)"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>关联客户端</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="robotId"
                  nzAllowClear
                  [nzLoading]="robotOptionsLoading"
                  nzPlaceHolder="请选择关联客户端"
                >
                  @for (robot of robotOptions; track getRowId(robot, $index)) {
                    <nz-option [nzValue]="robot['id']" [nzLabel]="robotLabel(robot)"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <div class="condition-section">
              <div class="condition-header">
                <span>发布条件</span>
                <button nz-button nzSize="small" type="button" (click)="addImportCondition()">
                  <nz-icon nzType="plus"></nz-icon>
                  <span>添加</span>
                </button>
              </div>
              @for (condition of importConditions; track condition.key; let index = $index) {
                <div class="condition-row">
                  <nz-form-item>
                    <nz-form-label nzRequired>发布时间开始</nz-form-label>
                    <nz-form-control>
                      <nz-select [(ngModel)]="condition.publishTimeRangeBegin" [ngModelOptions]="{ standalone: true }" nzPlaceHolder="请选择发布时间开始">
                        @for (time of halfHourTimeOptions; track time.value) {
                          <nz-option [nzValue]="time.value" [nzLabel]="time.label"></nz-option>
                        }
                      </nz-select>
                    </nz-form-control>
                  </nz-form-item>
                  <nz-form-item>
                    <nz-form-label nzRequired>发布时间结束</nz-form-label>
                    <nz-form-control>
                      <nz-select [(ngModel)]="condition.publishTimeRangeEnd" [ngModelOptions]="{ standalone: true }" nzPlaceHolder="请选择发布时间结束">
                        @for (time of halfHourTimeOptions; track time.value) {
                          <nz-option [nzValue]="time.value" [nzLabel]="time.label"></nz-option>
                        }
                      </nz-select>
                    </nz-form-control>
                  </nz-form-item>
                  <nz-form-item>
                    <nz-form-label nzRequired>发布数量</nz-form-label>
                    <nz-form-control>
                      <nz-input-number
                        class="number-input"
                        [(ngModel)]="condition.publishNum"
                        [ngModelOptions]="{ standalone: true }"
                        [nzMin]="1"
                        [nzMax]="10"
                        [nzStep]="1"
                      ></nz-input-number>
                    </nz-form-control>
                  </nz-form-item>
                  <button nz-button nzType="link" nzDanger type="button" (click)="removeImportCondition(index)">删除</button>
                </div>
              }
            </div>
            <nz-form-item>
              <nz-form-label nzRequired>账号列表</nz-form-label>
              <nz-form-control [nzValidateStatus]="importForm.controls['accountIds']" nzErrorTip="请选择账号">
                <div class="account-picker-field" [class.account-picker-field-error]="isImportAccountInvalid()">
                  <button nz-button type="button" (click)="showAccountPicker()">
                    <nz-icon nzType="search"></nz-icon>
                    <span>选择账号</span>
                  </button>
                  <span class="selected-summary">已选择 {{ selectedImportAccounts.length }} 个账号</span>
                  @if (selectedImportAccounts.length > 0) {
                    <button nz-button nzType="link" type="button" nzSize="small" (click)="clearSelectedImportAccounts()">清空</button>
                  }
                </div>
                @if (selectedImportAccounts.length > 0) {
                  <div class="selected-account-preview">
                    @for (account of selectedImportAccountPreview; track baseAccountTrack(account, $index)) {
                      <nz-tag>{{ baseAccountNickname(account) }} / {{ baseAccountDouyin(account) }}</nz-tag>
                    }
                    @if (selectedImportAccounts.length > selectedImportAccountPreview.length) {
                      <nz-tag>+{{ selectedImportAccounts.length - selectedImportAccountPreview.length }}</nz-tag>
                    }
                  </div>
                }
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>选品是否审核</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="selectionAudit" nzPlaceHolder="请选择选品是否审核">
                  <nz-option [nzValue]="0" nzLabel="否"></nz-option>
                  <nz-option [nzValue]="1" nzLabel="是"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>

      <nz-modal
        [(nzVisible)]="accountPickerVisible"
        nzTitle="选择账号"
        [nzFooter]="accountPickerFooter"
        (nzOnCancel)="cancelAccountPicker()"
        nzWidth="960px"
      >
        <ng-container *nzModalContent>
          <div class="account-picker-toolbar">
            <input
              nz-input
              [(ngModel)]="accountPickerKeyword"
              (ngModelChange)="onAccountPickerKeywordChange($event)"
              placeholder="搜索昵称、抖音账号、商品类目"
            />
            <span class="picker-count">
              已选 {{ accountPickerSelectedKeys.size }} 个 / 共 {{ filteredBaseAccountOptions.length }} 个
            </span>
          </div>
          <nz-table
            #accountPickerTable
            class="account-picker-table"
            nzSize="small"
            [nzData]="filteredBaseAccountOptions"
            [nzLoading]="baseAccountLoading"
            [nzFrontPagination]="true"
            [nzPageSize]="50"
            [nzShowPagination]="true"
            [nzShowSizeChanger]="false"
            [nzScroll]="{ x: '760px', y: '430px' }"
            (nzCurrentPageDataChange)="onAccountPickerCurrentPageDataChange($event)"
          >
            <thead>
              <tr>
                <th nzWidth="42px">
                  <label
                    nz-checkbox
                    [ngModel]="accountPickerAllChecked"
                    [nzIndeterminate]="accountPickerIndeterminate"
                    (ngModelChange)="onAccountPickerAllChecked($event)"
                  ></label>
                </th>
                <th nzWidth="54px">头像</th>
                <th nzWidth="160px">昵称</th>
                <th nzWidth="160px">抖音账号</th>
                <th nzWidth="290px">商品类目</th>
                <th nzWidth="92px">状态</th>
              </tr>
            </thead>
            <tbody>
              @for (account of accountPickerTable.data; track baseAccountTrack(account, $index)) {
                <tr
                  class="account-picker-row"
                  [class.account-picker-row-checked]="isAccountPickerChecked(account)"
                  (click)="toggleAccountPickerRow(account)"
                >
                  <td>
                    <label
                      nz-checkbox
                      [ngModel]="isAccountPickerChecked(account)"
                      [nzDisabled]="baseAccountId(account) === null"
                      (click)="$event.stopPropagation()"
                      (ngModelChange)="onAccountPickerChecked(account, $event)"
                    ></label>
                  </td>
                  <td>
                    <nz-avatar [nzSrc]="baseAccountAvatar(account)" nzIcon="user" nzSize="small"></nz-avatar>
                  </td>
                  <td>
                    <span class="cell-text" [title]="baseAccountNickname(account)">{{ baseAccountNickname(account) }}</span>
                  </td>
                  <td>{{ baseAccountDouyin(account) }}</td>
                  <td>
                    <span class="category-cell" [title]="baseAccountCategoryNames(account)">
                      {{ baseAccountCategoryNames(account) }}
                    </span>
                  </td>
                  <td>
                    <nz-tag [nzColor]="statusColor(account['status'] ?? account['account_status'])">
                      {{ statusText(account['status'] ?? account['account_status']) }}
                    </nz-tag>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </ng-container>
      </nz-modal>
      <ng-template #accountPickerFooter>
        <button nz-button (click)="cancelAccountPicker()">取消</button>
        <button nz-button (click)="clearAccountPickerSelection()">清空</button>
        <button nz-button nzType="primary" (click)="confirmAccountPicker()">确定</button>
      </ng-template>
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
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .statistics-panel {
      display: grid;
      grid-template-columns: repeat(3, minmax(120px, 1fr)) minmax(260px, 1.5fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .statistics-panel-loading {
      opacity: .65;
    }
    .stat-item {
      min-height: 62px;
      padding: 10px 12px;
      border: 1px solid #edf0f5;
      border-radius: 4px;
      background: #fafafa;
    }
    .stat-label {
      color: #8c8c8c;
      font-size: 12px;
      line-height: 18px;
    }
    .stat-value {
      margin-top: 4px;
      color: #262626;
      font-size: 22px;
      font-weight: 600;
      line-height: 28px;
      font-variant-numeric: tabular-nums;
    }
    .stat-value.success {
      color: #389e0d;
    }
    .stat-value.warning {
      color: #d48806;
    }
    .month-total {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      color: #595959;
      font-size: 13px;
      line-height: 22px;
    }
    .month-total strong {
      color: #262626;
      font-size: 20px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .month-divider {
      width: 1px;
      height: 18px;
      background: #d9d9d9;
    }
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 2px;
      white-space: nowrap;
    }
    :host ::ng-deep .action-buttons .ant-btn-link {
      padding: 0 3px;
    }
    .cell-text {
      display: inline-block;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
    .condition-cell {
      max-width: 220px;
    }
    .reason-cell {
      max-width: 220px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }
    .form-grid .full-row {
      grid-column: 1 / -1;
    }
    .number-input {
      width: 100%;
    }
    .condition-section {
      margin-bottom: 12px;
    }
    .condition-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
      color: #262626;
      font-size: 13px;
      font-weight: 500;
    }
    .condition-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 96px auto;
      gap: 8px;
      align-items: start;
      margin-bottom: 8px;
    }
    .condition-row nz-form-item {
      margin-bottom: 0;
    }
    .account-picker-field {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
    }
    .account-picker-field-error {
      color: #ff4d4f;
    }
    .selected-summary,
    .picker-count {
      color: #8c8c8c;
      font-size: 12px;
    }
    .selected-account-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .batch-summary {
      margin-bottom: 12px;
      color: #595959;
      font-size: 13px;
    }
    .login-client-select {
      width: 100%;
    }
    .account-picker-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .account-picker-toolbar input {
      max-width: 360px;
    }
    :host ::ng-deep .account-picker-table .ant-table-thead > tr > th,
    :host ::ng-deep .account-picker-table .ant-table-tbody > tr > td {
      padding: 4px 8px;
      line-height: 20px;
      font-size: 12px;
    }
    :host ::ng-deep .account-picker-table .ant-table-pagination.ant-pagination {
      margin: 8px 0 0;
    }
    :host ::ng-deep .account-picker-table .ant-avatar-sm {
      width: 22px;
      height: 22px;
      line-height: 22px;
    }
    :host ::ng-deep .account-picker-table .ant-tag {
      margin-right: 0;
      line-height: 18px;
      padding: 0 6px;
    }
    :host ::ng-deep .account-picker-table .account-picker-row {
      cursor: pointer;
    }
    :host ::ng-deep .account-picker-table .account-picker-row-checked > td {
      background: #e6f4ff;
    }
    :host ::ng-deep .account-picker-table .account-picker-row:hover > td {
      background: #f5faff;
    }
    .category-cell {
      display: inline-block;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
    @media (max-width: 960px) {
      .statistics-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .stat-item-total {
        grid-column: 1 / -1;
      }
    }
    @media (max-width: 560px) {
      .statistics-panel {
        grid-template-columns: 1fr;
      }
      .condition-row {
        grid-template-columns: 1fr;
      }
      .stat-item-total {
        grid-column: auto;
      }
      .month-divider {
        display: none;
      }
    }
  `]
})
export class AccountManagementComponent implements OnInit {
  columns: PublishAccountColumn[] = [];
  data: PublishAccountRow[] = [];
  configOptions: PublishAccountRow[] = [];
  baseAccountOptions: PublishAccountRow[] = [];
  statistics: PublishAccountStatistics = this.emptyStatistics();
  form = new UntypedFormGroup({});
  importForm = new UntypedFormGroup({
    configId: new UntypedFormControl(null, [Validators.required]),
    robotId: new UntypedFormControl(null),
    selectionAudit: new UntypedFormControl(0),
    accountIds: new UntypedFormControl([], [Validators.required])
  });
  loading = false;
  statisticsLoading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  modalVisible = false;
  modalLoading = false;
  modalTitle = '新增账号';
  editingId: unknown = null;
  importVisible = false;
  importLoading = false;
  startPublishModalVisible = false;
  startPublishModalLoading = false;
  selectedStartPublishRobotId: AccountId | null = null;
  robotOptionsLoading = false;
  robotOptions: PublishAccountRow[] = [];
  onlineRobotsLoading = false;
  onlineRobots: PublishAccountRow[] = [];
  accountPickerVisible = false;
  accountPickerKeyword = '';
  accountPickerSelectedKeys = new Set<string>();
  selectedPublishAccountKeys = new Set<string>();
  selectedAccountKeys = new Set<string>();
  importedAccountKeys = new Set<string>();
  accountPickerCurrentPageData: PublishAccountRow[] = [];
  baseAccountLoading = false;
  halfHourTimeOptions = this.buildHalfHourTimeOptions();
  private conditionKeySeed = 0;
  importConditions: PublishConditionDraft[] = [this.createConditionDraft()];
  editConditions: PublishConditionDraft[] = [this.createConditionDraft()];

  constructor(
    private sysApi: SysApiService,
    private message: NzMessageService
  ) {}

  get editableColumns(): PublishAccountColumn[] {
    return this.columns.filter(column => column.editable);
  }

  ngOnInit(): void {
    this.loadConfigOptions();
    this.loadRobotOptions();
    this.loadBaseAccountOptions();
    this.loadImportedAccountKeys();
    this.loadStatistics();
    this.loadColumns();
  }

  refresh(): void {
    this.loadConfigOptions();
    this.loadRobotOptions();
    this.loadBaseAccountOptions();
    this.loadImportedAccountKeys();
    this.loadStatistics();
    this.loadColumns();
  }

  loadColumns(): void {
    this.loading = true;
    this.sysApi.getPublishAccountColumns().subscribe({
      next: (res: any) => {
        if (res.code === 0 && Array.isArray(res.data)) {
          this.columns = res.data;
          this.loadData();
        } else {
          this.columns = [];
          this.data = [];
          this.total = 0;
          this.loading = false;
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载发布账号字段失败');
          }
        }
      },
      error: () => {
        this.columns = [];
        this.data = [];
        this.total = 0;
        this.loading = false;
        this.message.error('加载发布账号字段失败');
      }
    });
  }

  loadConfigOptions(): void {
    this.sysApi.getAllPublishConfigs().subscribe({
      next: (res: any) => {
        this.configOptions = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        this.syncSelectionAuditControlFromCurrentConfig();
      },
      error: () => {
        this.configOptions = [];
      }
    });
  }

  loadBaseAccountOptions(): void {
    this.baseAccountLoading = true;
    this.sysApi.getAllBaseAccounts().subscribe({
      next: (res: any) => {
        this.baseAccountOptions = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        this.syncSelectedAccountFormControl(false);
        if (this.accountPickerVisible) {
          this.accountPickerCurrentPageData = this.filteredBaseAccountOptions.slice(0, 50);
        }
        this.baseAccountLoading = false;
      },
      error: () => {
        this.baseAccountOptions = [];
        this.baseAccountLoading = false;
      }
    });
  }

  loadRobotOptions(): void {
    this.robotOptionsLoading = true;
    this.sysApi.getRobotList({ current: 1, size: 1000 }).subscribe({
      next: (res: any) => {
        const page = res.code === 0 && res.data ? (res.data.page || res.data) : null;
        this.robotOptions = Array.isArray(page?.records) ? page.records : [];
        this.robotOptionsLoading = false;
      },
      error: () => {
        this.robotOptions = [];
        this.robotOptionsLoading = false;
      }
    });
  }

  loadImportedAccountKeys(): void {
    this.sysApi.getAllPublishAccounts().subscribe({
      next: (res: any) => {
        const rows: PublishAccountRow[] = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        this.statistics = {
          ...this.statistics,
          publishedCount: rows.reduce((total, row) => total + this.todayPublishQuantityOf(row), 0),
          pendingPublishCount: rows.reduce((total, row) => total + this.publishQuantityOf(row), 0)
        };
        this.importedAccountKeys = new Set(rows
          .map(row => this.publishAccountBaseId(row))
          .filter((id): id is AccountId => id !== null)
          .map(id => this.accountIdKey(id)));
        this.removeUnavailableSelectedAccounts();
        if (this.accountPickerVisible) {
          this.accountPickerCurrentPageData = this.filteredBaseAccountOptions.slice(0, 50);
        }
      },
      error: () => {
        this.statistics = {
          ...this.statistics,
          publishedCount: 0,
          pendingPublishCount: 0
        };
        this.importedAccountKeys.clear();
      }
    });
  }

  loadStatistics(): void {
    this.statisticsLoading = true;
    this.sysApi.getPublishAccountStatistics().subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          this.statistics = this.normalizeStatistics(res.data);
        } else {
          this.statistics = this.emptyStatistics();
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载发布账号统计失败');
          }
        }
        this.statisticsLoading = false;
      },
      error: () => {
        this.statistics = this.emptyStatistics();
        this.statisticsLoading = false;
        this.message.error('加载发布账号统计失败');
      }
    });
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
    this.sysApi.getPublishAccountList({ current: this.pageIndex, size: this.pageSize }).subscribe({
      next: (res: any) => {
        if (res.code === 0 && res.data) {
          const page = res.data.page || res.data;
          this.data = page.records || [];
          this.total = page.total || 0;
          this.removeUnavailableSelectedPublishAccounts();
        } else {
          this.data = [];
          this.total = 0;
          this.selectedPublishAccountKeys.clear();
          if (!isApiSessionExpiredResponse(res)) {
            this.message.error(res.msg || '加载发布账号失败');
          }
        }
        this.loading = false;
      },
      error: () => {
        this.message.error('加载发布账号失败');
        this.selectedPublishAccountKeys.clear();
        this.loading = false;
      }
    });
  }

  showAddModal(): void {
    this.modalTitle = '新增账号';
    this.editingId = null;
    this.buildForm();
    this.modalVisible = true;
  }

  showImportModal(): void {
    this.selectedAccountKeys.clear();
    this.accountPickerSelectedKeys.clear();
    this.accountPickerKeyword = '';
    this.importConditions = [this.createConditionDraft()];
    this.importForm.reset({ configId: null, robotId: null, selectionAudit: 0, accountIds: [] });
    if (this.robotOptions.length === 0 && !this.robotOptionsLoading) {
      this.loadRobotOptions();
    }
    this.loadImportedAccountKeys();
    this.importVisible = true;
  }

  showAccountPicker(): void {
    this.accountPickerSelectedKeys = new Set(this.selectedAccountKeys);
    this.accountPickerKeyword = '';
    this.accountPickerCurrentPageData = this.filteredBaseAccountOptions.slice(0, 50);
    this.accountPickerVisible = true;
    if (this.baseAccountOptions.length === 0 && !this.baseAccountLoading) {
      this.loadBaseAccountOptions();
    }
  }

  cancelAccountPicker(): void {
    this.accountPickerVisible = false;
  }

  confirmAccountPicker(): void {
    this.selectedAccountKeys = new Set(this.accountPickerSelectedKeys);
    this.syncSelectedAccountFormControl(true);
    this.accountPickerVisible = false;
  }

  clearAccountPickerSelection(): void {
    this.accountPickerSelectedKeys.clear();
  }

  clearSelectedImportAccounts(): void {
    this.selectedAccountKeys.clear();
    this.accountPickerSelectedKeys.clear();
    this.syncSelectedAccountFormControl(true);
  }

  showStartPublishModal(): void {
    if (this.selectedPublishAccounts.length === 0) {
      this.message.warning('请先勾选发布账号');
      return;
    }
    this.selectedStartPublishRobotId = null;
    this.onlineRobots = [];
    this.startPublishModalVisible = true;
    this.loadOnlineRobots();
  }

  handleStartPublishOk(): void {
    const publishAccountIds = this.selectedPublishAccounts
      .map(item => this.publishAccountId(item))
      .filter((id): id is AccountId => id !== null);
    if (publishAccountIds.length === 0) {
      this.message.warning('请先勾选发布账号');
      return;
    }
    if (this.selectedStartPublishRobotId === null) {
      this.message.warning('请选择在线客户端');
      return;
    }

    this.startPublishModalLoading = true;
    this.sysApi.startPublishAccounts({
      publishAccountIds,
      robotId: this.selectedStartPublishRobotId
    }).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          const count = res.data?.totalProductCount ?? 0;
          this.message.success(`启动发布需求已推送：${count} 个商品`);
          this.closeStartPublishModal();
          this.selectedPublishAccountKeys.clear();
          this.loadStatistics();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '启动发布失败');
        }
        this.startPublishModalLoading = false;
      },
      error: () => {
        this.message.error('启动发布失败');
        this.startPublishModalLoading = false;
      }
    });
  }

  closeStartPublishModal(): void {
    this.startPublishModalVisible = false;
    this.selectedStartPublishRobotId = null;
    this.onlineRobots = [];
  }

  loginPublishAccount(item: PublishAccountRow): void {
    const publishAccountId = this.publishAccountId(item);
    if (publishAccountId === null) {
      this.message.warning('发布账号ID为空');
      return;
    }
    const robotId = this.rowRobotId(item);
    if (typeof robotId !== 'number' && typeof robotId !== 'string') {
      this.message.warning('请先给发布账号关联客户端');
      return;
    }

    this.sysApi.loginPublishAccount({ publishAccountId, robotId }).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('登录指令已下发');
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '登录指令下发失败');
        }
      },
      error: () => this.message.error('登录指令下发失败')
    });
  }

  loadOnlineRobots(): void {
    this.onlineRobotsLoading = true;
    this.sysApi.getOnlineRobots().subscribe({
      next: (res: any) => {
        this.onlineRobots = res.code === 0 && Array.isArray(res.data) ? res.data : [];
        if (this.onlineRobots.length === 0 && !isApiSessionExpiredResponse(res)) {
          this.message.warning('当前没有在线客户端');
        }
        this.onlineRobotsLoading = false;
      },
      error: () => {
        this.message.error('加载在线客户端失败');
        this.onlineRobotsLoading = false;
      }
    });
  }

  showEditModal(item: PublishAccountRow): void {
    this.modalTitle = '编辑账号';
    this.editingId = item['id'];
    this.buildEditForm(item);
    if (this.robotOptions.length === 0 && !this.robotOptionsLoading) {
      this.loadRobotOptions();
    }
    this.modalVisible = true;
  }

  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      this.message.warning('请先完善必填信息');
      return;
    }

    const editing = this.editingId !== null && this.editingId !== undefined;
    const rawPayload = this.form.getRawValue();
    if (editing && !this.validatePublishConditions(this.editConditions)) {
      return;
    }
    this.modalLoading = true;
    const payload = editing ? this.editPayload(rawPayload) : this.normalizePayload(rawPayload);
    const api$ = editing
      ? this.sysApi.updatePublishAccount({ ...payload, id: this.editingId })
      : this.sysApi.createPublishAccount(payload);

    api$.subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success(editing ? '更新成功' : '创建成功');
          this.modalVisible = false;
          this.loadStatistics();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '操作失败');
        }
        this.modalLoading = false;
      },
      error: () => {
        this.message.error('操作失败');
        this.modalLoading = false;
      }
    });
  }

  handleImportOk(): void {
    this.syncSelectedAccountFormControl(true);
    if (this.importForm.invalid) {
      Object.values(this.importForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      this.message.warning('请选择发布配置和账号');
      return;
    }

    const value = this.importForm.value;
    if (!this.validatePublishConditions(this.importConditions)) {
      return;
    }
    this.importLoading = true;
    this.sysApi.importPublishAccounts({
      configId: value.configId,
      robotId: value.robotId,
      selectionAudit: this.normalizeSelectionAuditValue(value.selectionAudit),
      publishConditions: this.normalizePublishConditions(this.importConditions),
      accountIds: value.accountIds || []
    }).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          const count = res.data?.count ?? 0;
          this.message.success(`导入成功：${count} 个账号`);
          this.importVisible = false;
          this.loadImportedAccountKeys();
          this.loadStatistics();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '导入失败');
        }
        this.importLoading = false;
      },
      error: () => {
        this.message.error('导入失败');
        this.importLoading = false;
      }
    });
  }

  deleteItem(item: PublishAccountRow): void {
    const id = item['id'];
    if (id === null || id === undefined || id === '') return;
    this.sysApi.deletePublishAccount(id as number).subscribe({
      next: (res: any) => {
        if (res.code === 0) {
          this.message.success('删除成功');
          this.selectedPublishAccountKeys.delete(this.accountIdKey(id as AccountId));
          this.loadImportedAccountKeys();
          this.loadStatistics();
          this.loadData();
        } else if (!isApiSessionExpiredResponse(res)) {
          this.message.error(res.msg || '删除失败');
        }
      },
      error: () => this.message.error('删除失败')
    });
  }

  buildForm(row?: PublishAccountRow): void {
    const controls: Record<string, UntypedFormControl> = {};
    this.editableColumns.forEach(column => {
      controls[column.name] = new UntypedFormControl(
        row ? this.getFormValue(row, column) : this.getDefaultValue(column),
        this.isRequired(column) ? [Validators.required] : []
      );
    });
    this.form = new UntypedFormGroup(controls);
  }

  buildEditForm(row: PublishAccountRow): void {
    const configId = this.rowConfigId(row);
    this.editConditions = this.conditionsFromRow(row);
    this.form = new UntypedFormGroup({
      configId: new UntypedFormControl(configId, [Validators.required]),
      robotId: new UntypedFormControl(this.rowRobotId(row)),
      selectionAudit: new UntypedFormControl(this.selectionAuditValueByConfigId(configId))
    });
  }

  editPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const next: Record<string, unknown> = {};
    const configId = payload['configId'];
    const config = this.findOptionById(this.configOptions, configId);

    if (this.hasColumn('config_id')) {
      next['config_id'] = configId;
    } else if (this.hasColumn('publish_config_id')) {
      next['publish_config_id'] = configId;
    }
    if (this.hasColumn('config_name')) {
      next['config_name'] = config ? this.configOptionLabel(config) : null;
    } else if (this.hasColumn('publish_config_name')) {
      next['publish_config_name'] = config ? this.configOptionLabel(config) : null;
    }
    if (this.hasColumn('robot_id')) {
      next['robot_id'] = payload['robotId'] ?? null;
    }
    next['publishConditions'] = this.normalizePublishConditions(this.editConditions);
    next['selection_audit'] = this.normalizeSelectionAuditValue(payload['selectionAudit']);
    return next;
  }

  normalizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const next: Record<string, unknown> = {};
    this.editableColumns.forEach(column => {
      const value = payload[column.name];
      next[column.name] = this.isPublishTimeRangeColumn(column)
        ? this.normalizeTimeValue(value)
        : this.isNumberColumn(column) && value !== '' && value !== null && value !== undefined
        ? Number(value)
        : value;
    });
    return next;
  }

  getDefaultValue(column: PublishAccountColumn): unknown {
    if (this.isStatusColumn(column)) return 1;
    if (this.isPublishTimeRangeColumn(column)) return '';
    if (column.defaultValue !== null && column.defaultValue !== undefined) return column.defaultValue;
    return this.isNumberColumn(column) ? 0 : '';
  }

  getFormValue(row: PublishAccountRow, column: PublishAccountColumn): unknown {
    const value = row[column.name];
    return this.isPublishTimeRangeColumn(column) ? this.formatTimeForInput(value) : value ?? '';
  }

  getRowId(item: PublishAccountRow, index: number): unknown {
    return item['id'] ?? index;
  }

  publishAccountId(item: PublishAccountRow): AccountId | null {
    const id = item['id'];
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  }

  displayText(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  displayDateTime(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  robotLabel(robot: PublishAccountRow): string {
    const machineName = this.displayText(robot['machineName'] ?? robot['machine_name']);
    const macAddress = this.displayText(robot['macAddress'] ?? robot['mac_address']);
    return `${machineName} / ${macAddress}`;
  }

  displayRobotText(row: PublishAccountRow): string {
    const displayValue = row['displayRobotName'] ?? row['displayRobotLabel'];
    if (displayValue !== null && displayValue !== undefined && displayValue !== '') {
      return String(displayValue);
    }
    const robotId = this.rowRobotId(row);
    if (robotId === null) return '-';
    const robot = this.findOptionById(this.robotOptions, robotId);
    return robot ? this.robotLabel(robot) : String(robotId);
  }

  numberText(value: unknown): string {
    if (value === null || value === undefined || value === '') return '0';
    return String(value);
  }

  statisticNumber(key: keyof PublishAccountStatistics): string {
    return this.numberText(this.statistics[key]);
  }

  asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  formatPublishConditions(item: PublishAccountRow): string {
    const raw = item['publishConditions'] ?? item['publish_conditions'];
    const conditions = Array.isArray(raw) ? raw : [];
    if (conditions.length === 0) return '-';
    return conditions
      .filter((condition): condition is Record<string, unknown> => condition !== null && typeof condition === 'object' && !Array.isArray(condition))
      .map(condition => {
        const begin = this.formatTimeForDisplay(condition['publishTimeRangeBegin'] ?? condition['publish_time_range_begin']);
        const end = this.formatTimeForDisplay(condition['publishTimeRangeEnd'] ?? condition['publish_time_range_end']);
        const publishNum = this.numberText(condition['publishNum'] ?? condition['publish_num']);
        return `${begin || '-'}-${end || '-'}×${publishNum}`;
      })
      .join('、') || '-';
  }

  statusText(value: unknown): string {
    if (value === 1 || value === '1' || value === true) return '启用';
    if (value === 0 || value === '0' || value === false) return '禁用';
    if (value === 2 || value === '2') return '授权过期';
    return this.displayText(value);
  }

  statusColor(value: unknown): string {
    if (value === 1 || value === '1' || value === true) return 'green';
    if (value === 2 || value === '2') return 'orange';
    if (value === '已登录' || value === '正在待机' || value === '正在选品' || value === '正在剪辑' || value === '正在发布' || value === '正在采集品类') return 'green';
    if (value === '等待扫码') return 'orange';
    return 'red';
  }

  loginStatusText(value: unknown): string {
    const text = this.displayText(value);
    return text === '-' ? '未登录' : text;
  }

  loginStatusColor(value: unknown): string {
    const text = this.loginStatusText(value);
    if (text === '已登录') return 'green';
    if (text === '异常') return 'red';
    return 'default';
  }

  formLabel(column: PublishAccountColumn): string {
    if (this.isAvatarColumn(column)) return '头像URL';
    return column.label || column.name;
  }

  configOptionLabel(config: PublishAccountRow): string {
    return this.displayText(config['name'] ?? config['config_name'] ?? config['displayConfigName'] ?? config['id']);
  }

  get selectedImportAccounts(): PublishAccountRow[] {
    return this.availableBaseAccountOptions.filter(account => {
      const id = this.baseAccountId(account);
      return id !== null && this.selectedAccountKeys.has(this.accountIdKey(id));
    });
  }

  get selectedImportAccountPreview(): PublishAccountRow[] {
    return this.selectedImportAccounts.slice(0, 4);
  }

  get selectablePublishAccounts(): PublishAccountRow[] {
    return this.data.filter(item => this.publishAccountId(item) !== null);
  }

  get selectedPublishAccounts(): PublishAccountRow[] {
    return this.selectablePublishAccounts.filter(item => {
      const id = this.publishAccountId(item);
      return id !== null && this.selectedPublishAccountKeys.has(this.accountIdKey(id));
    });
  }

  get publishAccountAllChecked(): boolean {
    const accounts = this.selectablePublishAccounts;
    return accounts.length > 0 && accounts.every(item => {
      const id = this.publishAccountId(item);
      return id !== null && this.selectedPublishAccountKeys.has(this.accountIdKey(id));
    });
  }

  get publishAccountIndeterminate(): boolean {
    const accounts = this.selectablePublishAccounts;
    const checkedCount = accounts.filter(item => {
      const id = this.publishAccountId(item);
      return id !== null && this.selectedPublishAccountKeys.has(this.accountIdKey(id));
    }).length;
    return checkedCount > 0 && checkedCount < accounts.length;
  }

  onPublishAccountAllChecked(checked: boolean): void {
    this.selectablePublishAccounts.forEach(item => {
      const id = this.publishAccountId(item);
      if (id === null) return;
      const key = this.accountIdKey(id);
      if (checked) {
        this.selectedPublishAccountKeys.add(key);
      } else {
        this.selectedPublishAccountKeys.delete(key);
      }
    });
  }

  onPublishAccountChecked(item: PublishAccountRow, checked: boolean): void {
    const id = this.publishAccountId(item);
    if (id === null) return;
    const key = this.accountIdKey(id);
    if (checked) {
      this.selectedPublishAccountKeys.add(key);
    } else {
      this.selectedPublishAccountKeys.delete(key);
    }
  }

  isPublishAccountChecked(item: PublishAccountRow): boolean {
    const id = this.publishAccountId(item);
    return id !== null && this.selectedPublishAccountKeys.has(this.accountIdKey(id));
  }

  get filteredBaseAccountOptions(): PublishAccountRow[] {
    const keyword = this.accountPickerKeyword.trim().toLowerCase();
    if (!keyword) return this.availableBaseAccountOptions;
    return this.availableBaseAccountOptions.filter(account => this.baseAccountSearchText(account).includes(keyword));
  }

  get availableBaseAccountOptions(): PublishAccountRow[] {
    return this.baseAccountOptions.filter(account => !this.isImportedBaseAccount(account));
  }

  get accountPickerAllChecked(): boolean {
    const accounts = this.accountPickerCurrentPageData.filter(account => this.baseAccountId(account) !== null);
    return accounts.length > 0 && accounts.every(account => this.isAccountPickerChecked(account));
  }

  get accountPickerIndeterminate(): boolean {
    const accounts = this.accountPickerCurrentPageData.filter(account => this.baseAccountId(account) !== null);
    const checkedCount = accounts.filter(account => this.isAccountPickerChecked(account)).length;
    return checkedCount > 0 && checkedCount < accounts.length;
  }

  onAccountPickerCurrentPageDataChange(data: readonly PublishAccountRow[]): void {
    this.accountPickerCurrentPageData = [...data];
  }

  onAccountPickerKeywordChange(keyword: string): void {
    this.accountPickerKeyword = keyword;
    this.accountPickerCurrentPageData = this.filteredBaseAccountOptions.slice(0, 50);
  }

  onAccountPickerAllChecked(checked: boolean): void {
    this.accountPickerCurrentPageData.forEach(account => {
      const id = this.baseAccountId(account);
      if (id === null) return;
      const key = this.accountIdKey(id);
      if (checked) {
        this.accountPickerSelectedKeys.add(key);
      } else {
        this.accountPickerSelectedKeys.delete(key);
      }
    });
  }

  onAccountPickerChecked(account: PublishAccountRow, checked: boolean): void {
    const id = this.baseAccountId(account);
    if (id === null) return;
    const key = this.accountIdKey(id);
    if (checked) {
      this.accountPickerSelectedKeys.add(key);
    } else {
      this.accountPickerSelectedKeys.delete(key);
    }
  }

  toggleAccountPickerRow(account: PublishAccountRow): void {
    if (this.baseAccountId(account) === null) return;
    this.onAccountPickerChecked(account, !this.isAccountPickerChecked(account));
  }

  isAccountPickerChecked(account: PublishAccountRow): boolean {
    const id = this.baseAccountId(account);
    return id !== null && this.accountPickerSelectedKeys.has(this.accountIdKey(id));
  }

  isImportAccountInvalid(): boolean {
    const control = this.importForm.controls['accountIds'];
    return control.invalid && (control.dirty || control.touched);
  }

  baseAccountLabel(account: PublishAccountRow): string {
    const nickname = this.baseAccountNickname(account);
    const douyinAccount = this.baseAccountDouyin(account);
    const categoryNames = this.baseAccountCategoryNames(account);
    return `${nickname} / ${douyinAccount} / ${categoryNames}`;
  }

  baseAccountTrack(account: PublishAccountRow, index: number): unknown {
    return this.baseAccountId(account) ?? index;
  }

  baseAccountId(account: PublishAccountRow): AccountId | null {
    const id = account['id'];
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  }

  publishAccountBaseId(account: PublishAccountRow): AccountId | null {
    const id = account['account_id'] ?? account['accountId'] ?? account['source_account_id'] ?? account['base_account_id'];
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  }

  isImportedBaseAccount(account: PublishAccountRow): boolean {
    const id = this.baseAccountId(account);
    return id !== null && this.importedAccountKeys.has(this.accountIdKey(id));
  }

  baseAccountAvatar(account: PublishAccountRow): string {
    return this.asString(account['avatar'] ?? account['avatarUrl'] ?? account['avatar_url']);
  }

  baseAccountNickname(account: PublishAccountRow): string {
    return this.displayText(account['nickname'] ?? account['nickName'] ?? account['nick_name'] ?? account['nick'] ?? account['name']);
  }

  baseAccountDouyin(account: PublishAccountRow): string {
    return this.displayText(account['douyinAccount'] ?? account['douyin_account'] ?? account['account']);
  }

  baseAccountCategoryNames(account: PublishAccountRow): string {
    return this.displayText(
      account['productCategoryName'] ??
      account['product_category_name'] ??
      account['productCategoryId'] ??
      account['product_category_id']
    );
  }

  addImportCondition(): void {
    this.importConditions = [...this.importConditions, this.createConditionDraft()];
  }

  removeImportCondition(index: number): void {
    this.importConditions = this.removeConditionAt(this.importConditions, index);
  }

  addEditCondition(): void {
    this.editConditions = [...this.editConditions, this.createConditionDraft()];
  }

  removeEditCondition(index: number): void {
    this.editConditions = this.removeConditionAt(this.editConditions, index);
  }

  private removeConditionAt(conditions: PublishConditionDraft[], index: number): PublishConditionDraft[] {
    const next = conditions.filter((_, itemIndex) => itemIndex !== index);
    return next.length > 0 ? next : [this.createConditionDraft()];
  }

  private createConditionDraft(source?: Record<string, unknown>): PublishConditionDraft {
    return {
      key: ++this.conditionKeySeed,
      publishTimeRangeBegin: this.formatTimeForInput(
        source?.['publishTimeRangeBegin'] ?? source?.['publish_time_range_begin']
      ),
      publishTimeRangeEnd: this.formatTimeForInput(
        source?.['publishTimeRangeEnd'] ?? source?.['publish_time_range_end']
      ),
      publishNum: this.toNullablePositiveInt(source?.['publishNum'] ?? source?.['publish_num'])
    };
  }

  private conditionsFromRow(row: PublishAccountRow): PublishConditionDraft[] {
    const raw = row['publishConditions'] ?? row['publish_conditions'];
    const items = Array.isArray(raw) ? raw : [];
    const conditions = items
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object' && !Array.isArray(item))
      .map(item => this.createConditionDraft(item));
    return conditions.length > 0 ? conditions : [this.createConditionDraft()];
  }

  private normalizePublishConditions(conditions: PublishConditionDraft[]): Array<Record<string, unknown>> {
    return conditions.map(condition => ({
      publish_time_range_begin: this.normalizeTimeValue(condition.publishTimeRangeBegin),
      publish_time_range_end: this.normalizeTimeValue(condition.publishTimeRangeEnd),
      publish_num: this.toNullablePositiveInt(condition.publishNum)
    }));
  }

  private validatePublishConditions(conditions: PublishConditionDraft[]): boolean {
    if (conditions.length === 0) {
      this.message.warning('请至少添加一条发布条件');
      return false;
    }
    let total = 0;
    const ranges: Array<{ begin: number; end: number }> = [];
    for (const condition of conditions) {
      const begin = condition.publishTimeRangeBegin;
      const end = condition.publishTimeRangeEnd;
      const publishNum = this.toNullablePositiveInt(condition.publishNum);
      if (!begin || !end || publishNum === null) {
        this.message.warning('请完善发布条件');
        return false;
      }
      if (!this.isAllowedHalfHourTime(begin) || !this.isAllowedHalfHourTime(end)) {
        this.message.warning('发布时间分钟只能选择00或30');
        return false;
      }
      const beginMinutes = this.toMinutes(begin);
      const endMinutes = this.toMinutes(end);
      if (beginMinutes === null || endMinutes === null || beginMinutes >= endMinutes) {
        this.message.warning('发布时间开始必须小于发布时间结束');
        return false;
      }
      total += publishNum;
      if (total > 10) {
        this.message.warning('发布数量合计不能超过10');
        return false;
      }
      ranges.push({ begin: beginMinutes, end: endMinutes });
    }
    const sortedRanges = [...ranges].sort((left, right) => left.begin - right.begin);
    for (let index = 1; index < sortedRanges.length; index++) {
      if (sortedRanges[index].begin < sortedRanges[index - 1].end) {
        this.message.warning('发布时间范围不能重叠');
        return false;
      }
    }
    return true;
  }

  private toNullablePositiveInt(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) return null;
    return number;
  }

  private accountIdKey(id: AccountId): string {
    return String(id);
  }

  private baseAccountSearchText(account: PublishAccountRow): string {
    return [
      this.baseAccountNickname(account),
      this.baseAccountDouyin(account),
      this.baseAccountCategoryNames(account),
      this.displayText(account['userId'] ?? account['user_id'])
    ].join(' ').toLowerCase();
  }

  private syncSelectedAccountFormControl(markDirty: boolean): void {
    const selectedIds = this.availableBaseAccountOptions
      .map(account => this.baseAccountId(account))
      .filter((id): id is AccountId => id !== null && this.selectedAccountKeys.has(this.accountIdKey(id)));
    const control = this.importForm.controls['accountIds'];
    control.setValue(selectedIds);
    if (markDirty) {
      control.markAsDirty();
      control.markAsTouched();
    }
    control.updateValueAndValidity();
  }

  private removeUnavailableSelectedAccounts(): void {
    const availableKeys = new Set(this.availableBaseAccountOptions
      .map(account => this.baseAccountId(account))
      .filter((id): id is AccountId => id !== null)
      .map(id => this.accountIdKey(id)));
    this.selectedAccountKeys.forEach(key => {
      if (!availableKeys.has(key)) {
        this.selectedAccountKeys.delete(key);
      }
    });
    this.accountPickerSelectedKeys.forEach(key => {
      if (!availableKeys.has(key)) {
        this.accountPickerSelectedKeys.delete(key);
      }
    });
    this.syncSelectedAccountFormControl(false);
  }

  private removeUnavailableSelectedPublishAccounts(): void {
    const availableKeys = new Set(this.selectablePublishAccounts
      .map(account => this.publishAccountId(account))
      .filter((id): id is AccountId => id !== null)
      .map(id => this.accountIdKey(id)));
    this.selectedPublishAccountKeys.forEach(key => {
      if (!availableKeys.has(key)) {
        this.selectedPublishAccountKeys.delete(key);
      }
    });
  }

  configOptionValue(config: PublishAccountRow, column: PublishAccountColumn): unknown {
    return this.isConfigNameColumn(column)
      ? this.configOptionLabel(config)
      : config['id'];
  }

  private rowConfigId(row: PublishAccountRow): unknown {
    return row['config_id'] ?? row['publish_config_id'] ?? row['configId'] ?? row['publishConfigId'] ?? null;
  }

  private rowRobotId(row: PublishAccountRow): unknown {
    return row['robot_id'] ?? row['robotId'] ?? null;
  }

  private findOptionById(options: PublishAccountRow[], id: unknown): PublishAccountRow | null {
    return options.find(option => String(option['id']) === String(id)) || null;
  }

  onImportConfigChange(configId: unknown): void {
    this.importForm.controls['selectionAudit']?.setValue(this.selectionAuditValueByConfigId(configId));
  }

  onEditConfigChange(configId: unknown): void {
    this.form.controls['selectionAudit']?.setValue(this.selectionAuditValueByConfigId(configId));
  }

  private syncSelectionAuditControlFromCurrentConfig(): void {
    const importConfigId = this.importForm.controls['configId']?.value;
    if (importConfigId !== null && importConfigId !== undefined && importConfigId !== '') {
      this.onImportConfigChange(importConfigId);
    }
    const editConfigId = this.form.controls['configId']?.value;
    if (editConfigId !== null && editConfigId !== undefined && editConfigId !== '') {
      this.onEditConfigChange(editConfigId);
    }
  }

  private selectionAuditValueByConfigId(configId: unknown): number {
    const config = this.findOptionById(this.configOptions, configId);
    return this.normalizeSelectionAuditValue(config?.['selection_audit'] ?? config?.['selectionAudit']);
  }

  private normalizeSelectionAuditValue(value: unknown): number {
    if (value === 1 || value === '1' || value === true || value === 'true' || value === '是') return 1;
    return 0;
  }

  private hasColumn(name: string): boolean {
    return this.columns.some(column => column.name.toLowerCase() === name.toLowerCase());
  }

  isRequired(column: PublishAccountColumn): boolean {
    return !column.nullable && column.defaultValue === null && !column.autoIncrement;
  }

  isNumberColumn(column: PublishAccountColumn): boolean {
    return ['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint', 'float', 'double', 'decimal'].includes(
      column.dataType
    );
  }

  isLongColumn(column: PublishAccountColumn): boolean {
    return ['text', 'mediumtext', 'longtext', 'json'].includes(column.dataType) ||
      column.columnType.includes('varchar(500') ||
      column.columnType.includes('varchar(1000');
  }

  isAvatarColumn(column: PublishAccountColumn): boolean {
    return ['avatar', 'avatar_url', 'head_img', 'head_img_url'].includes(column.name);
  }

  isStatusColumn(column: PublishAccountColumn): boolean {
    return column.name === 'status' || column.name.endsWith('_status') || column.name === 'enabled';
  }

  isConfigColumn(column: PublishAccountColumn): boolean {
    return column.name === 'config_id' || column.name === 'publish_config_id' ||
      column.name === 'config_name' || column.name === 'publish_config_name';
  }

  isRobotColumn(column: PublishAccountColumn): boolean {
    return column.name === 'robot_id' || column.name === 'robotId';
  }

  isConfigNameColumn(column: PublishAccountColumn): boolean {
    return column.name === 'config_name' || column.name === 'publish_config_name';
  }

  isPublishTimeRangeColumn(column: PublishAccountColumn): boolean {
    return column.name === 'publish_time_range_begin' || column.name === 'publish_time_range_end';
  }

  private validatePublishTimeRange(payload: Record<string, unknown>): boolean {
    const begin = this.timeFieldValue(payload, 'publishTimeRangeBegin', 'publish_time_range_begin');
    const end = this.timeFieldValue(payload, 'publishTimeRangeEnd', 'publish_time_range_end');
    if (!this.isAllowedHalfHourTime(begin) || !this.isAllowedHalfHourTime(end)) {
      this.message.warning('发布时间分钟只能选择00或30');
      return false;
    }
    if (!this.isPublishTimeRangeValid(begin, end)) {
      this.message.warning('发布时间开始必须小于发布时间结束');
      return false;
    }
    return true;
  }

  private timeFieldValue(payload: Record<string, unknown>, camelKey: string, snakeKey: string): string | null {
    const value = payload[camelKey] ?? payload[snakeKey];
    return value === null || value === undefined || value === '' ? null : String(value);
  }

  private buildHalfHourTimeOptions(): Array<{ label: string; value: string }> {
    const options: Array<{ label: string; value: string }> = [];
    [0, 30].forEach(minute => {
      for (let hour = 0; hour < 24; hour++) {
        const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        options.push({ label: value, value });
      }
    });
    return options.sort((a, b) => a.value.localeCompare(b.value));
  }

  private isPublishTimeRangeValid(begin?: string | null, end?: string | null): boolean {
    if (!begin || !end) return true;
    const beginMinutes = this.toMinutes(begin);
    const endMinutes = this.toMinutes(end);
    return beginMinutes !== null && endMinutes !== null && beginMinutes < endMinutes;
  }

  private isAllowedHalfHourTime(value?: string | null): boolean {
    if (!value) return true;
    return /^([01]\d|2[0-3]):(00|30)$/.test(value);
  }

  private toMinutes(value: string): number | null {
    const [hourText, minuteText] = value.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return hour * 60 + minute;
  }

  private normalizeTimeValue(value: unknown): string | null {
    const text = value === null || value === undefined ? '' : String(value).trim();
    if (!text) return null;
    return text.length === 5 ? `${text}:00` : text;
  }

  private formatTimeForInput(value: unknown): string {
    const text = this.timeText(value);
    return text ? text.slice(0, 5) : '';
  }

  private formatTimeForDisplay(value: unknown): string {
    const text = this.timeText(value);
    return text ? text.slice(0, 5) : '';
  }

  private timeText(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (Array.isArray(value)) {
      const [hour = 0, minute = 0] = value;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    return String(value);
  }

  private firstRowValue(row: PublishAccountRow, ...keys: string[]): unknown {
    for (const key of keys) {
      const value = row[key];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
    return null;
  }

  private emptyStatistics(): PublishAccountStatistics {
    return {
      accountCount: 0,
      publishedCount: 0,
      pendingPublishCount: 0,
      currentMonthPublishCount: 0,
      lastMonthPublishCount: 0
    };
  }

  private normalizeStatistics(data: Record<string, unknown>): PublishAccountStatistics {
    return {
      accountCount: this.toCount(data['accountCount']),
      publishedCount: this.statistics.publishedCount,
      pendingPublishCount: this.statistics.pendingPublishCount,
      currentMonthPublishCount: this.toCount(data['currentMonthPublishCount']),
      lastMonthPublishCount: this.toCount(data['lastMonthPublishCount'])
    };
  }

  private publishQuantityOf(row: PublishAccountRow): number {
    const total = row['publishConditionTotalNum'];
    if (total !== null && total !== undefined && total !== '') {
      return this.toCount(total);
    }
    const rawConditions = row['publishConditions'] ?? row['publish_conditions'];
    const conditions = Array.isArray(rawConditions) ? rawConditions : [];
    return conditions.reduce((sum, condition) => {
      if (condition === null || typeof condition !== 'object' || Array.isArray(condition)) {
        return sum;
      }
      const record = condition as Record<string, unknown>;
      return sum + this.toCount(record['publishNum'] ?? record['publish_num']);
    }, 0);
  }

  private todayPublishQuantityOf(row: PublishAccountRow): number {
    return this.toCount(row['todayPublishCount'] ?? row['today_publish_count']);
  }

  private toCount(value: unknown): number {
    const count = Number(value ?? 0);
    return Number.isFinite(count) ? count : 0;
  }

  getNumberMin(column: PublishAccountColumn): number | null {
    return column.columnType.includes('unsigned') || column.name.includes('count') ? 0 : null;
  }

  getNumberStep(column: PublishAccountColumn): number {
    return ['float', 'double', 'decimal'].includes(column.dataType) ? 0.01 : 1;
  }
}
