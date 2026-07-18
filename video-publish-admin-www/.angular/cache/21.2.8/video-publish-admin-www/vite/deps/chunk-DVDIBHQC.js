import {
  FocusMonitor
} from "./chunk-4OBKC2YF.js";
import {
  NZ_FORM_SIZE,
  NzFormStatusService
} from "./chunk-ZXU766DR.js";
import {
  NG_VALUE_ACCESSOR
} from "./chunk-YZ7GQAMP.js";
import {
  takeUntilDestroyed
} from "./chunk-LSZOUFU2.js";
import {
  fromEventOutsideAngular
} from "./chunk-OPN2JU7N.js";
import {
  Directionality
} from "./chunk-4L5DI3TQ.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  Input,
  NgModule,
  NgZone,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  setClassMetadata,
  signal,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomProperty,
  ɵɵloadQuery,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵqueryRefresh,
  ɵɵviewQuery
} from "./chunk-VS5U7YU4.js";
import {
  ReplaySubject,
  Subject
} from "./chunk-VUVMRRXW.js";

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-radio.mjs
var _c0 = ["*"];
var _c1 = ["inputElement"];
var _c2 = ["nz-radio", ""];
var NzRadioService = class _NzRadioService {
  selected$ = new ReplaySubject(1);
  touched$ = new Subject();
  disabled$ = new ReplaySubject(1);
  name$ = new ReplaySubject(1);
  touch() {
    this.touched$.next();
  }
  select(value) {
    this.selected$.next(value);
  }
  setDisabled(value) {
    this.disabled$.next(value);
  }
  setName(value) {
    this.name$.next(value);
  }
  static ɵfac = function NzRadioService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzRadioService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NzRadioService,
    factory: _NzRadioService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzRadioService, [{
    type: Injectable
  }], null, null);
})();
var NzRadioGroupComponent = class _NzRadioGroupComponent {
  cdr = inject(ChangeDetectorRef);
  nzRadioService = inject(NzRadioService);
  destroyRef = inject(DestroyRef);
  nzFormSize = inject(NZ_FORM_SIZE, {
    optional: true
  });
  value = null;
  isNzDisableFirstChange = true;
  onChange = () => {
  };
  onTouched = () => {
  };
  nzDisabled = false;
  nzButtonStyle = "outline";
  nzSize = "default";
  nzName = null;
  dir = inject(Directionality).valueSignal;
  size = signal(this.nzSize, ...ngDevMode ? [{
    debugName: "size"
  }] : []);
  finalSize = computed(() => this.nzFormSize?.() || this.size(), ...ngDevMode ? [{
    debugName: "finalSize"
  }] : []);
  ngOnInit() {
    this.nzRadioService.selected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (this.value !== value) {
        this.value = value;
        this.onChange(this.value);
      }
    });
    this.nzRadioService.touched$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      Promise.resolve().then(() => this.onTouched());
    });
  }
  ngOnChanges(changes) {
    const {
      nzDisabled,
      nzName,
      nzSize
    } = changes;
    if (nzDisabled) {
      this.nzRadioService.setDisabled(this.nzDisabled);
    }
    if (nzName) {
      this.nzRadioService.setName(this.nzName);
    }
    if (nzSize) {
      this.size.set(this.nzSize);
    }
  }
  writeValue(value) {
    this.value = value;
    this.nzRadioService.select(value);
    this.cdr.markForCheck();
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.nzDisabled = this.isNzDisableFirstChange && this.nzDisabled || isDisabled;
    this.isNzDisableFirstChange = false;
    this.nzRadioService.setDisabled(this.nzDisabled);
    this.cdr.markForCheck();
  }
  static ɵfac = function NzRadioGroupComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzRadioGroupComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzRadioGroupComponent,
    selectors: [["nz-radio-group"]],
    hostAttrs: [1, "ant-radio-group"],
    hostVars: 8,
    hostBindings: function NzRadioGroupComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-radio-group-large", ctx.finalSize() === "large")("ant-radio-group-small", ctx.finalSize() === "small")("ant-radio-group-solid", ctx.nzButtonStyle === "solid")("ant-radio-group-rtl", ctx.dir() === "rtl");
      }
    },
    inputs: {
      nzDisabled: [2, "nzDisabled", "nzDisabled", booleanAttribute],
      nzButtonStyle: "nzButtonStyle",
      nzSize: "nzSize",
      nzName: "nzName"
    },
    exportAs: ["nzRadioGroup"],
    features: [ɵɵProvidersFeature([NzRadioService, {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _NzRadioGroupComponent),
      multi: true
    }]), ɵɵNgOnChangesFeature],
    ngContentSelectors: _c0,
    decls: 1,
    vars: 0,
    template: function NzRadioGroupComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵprojection(0);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzRadioGroupComponent, [{
    type: Component,
    args: [{
      selector: "nz-radio-group",
      exportAs: "nzRadioGroup",
      template: `<ng-content />`,
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      providers: [NzRadioService, {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NzRadioGroupComponent),
        multi: true
      }],
      host: {
        class: "ant-radio-group",
        "[class.ant-radio-group-large]": `finalSize() === 'large'`,
        "[class.ant-radio-group-small]": `finalSize() === 'small'`,
        "[class.ant-radio-group-solid]": `nzButtonStyle === 'solid'`,
        "[class.ant-radio-group-rtl]": `dir() === 'rtl'`
      }
    }]
  }], null, {
    nzDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzButtonStyle: [{
      type: Input
    }],
    nzSize: [{
      type: Input
    }],
    nzName: [{
      type: Input
    }]
  });
})();
var NzRadioComponent = class _NzRadioComponent {
  directionality = inject(Directionality);
  nzRadioService = inject(NzRadioService, {
    optional: true
  });
  ngZone = inject(NgZone);
  elementRef = inject(ElementRef);
  cdr = inject(ChangeDetectorRef);
  focusMonitor = inject(FocusMonitor);
  destroyRef = inject(DestroyRef);
  nzFormStatusService = inject(NzFormStatusService, {
    optional: true
  });
  isNgModel = false;
  isNzDisableFirstChange = true;
  isChecked = false;
  name = null;
  onChange = () => {
  };
  onTouched = () => {
  };
  inputElement;
  nzValue = null;
  nzDisabled = false;
  nzAutoFocus = false;
  isRadioButton = false;
  dir = "ltr";
  focus() {
    this.focusMonitor.focusVia(this.inputElement, "keyboard");
  }
  blur() {
    this.inputElement.nativeElement.blur();
  }
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }
  setDisabledState(disabled) {
    this.nzDisabled = this.isNzDisableFirstChange && this.nzDisabled || disabled;
    this.isNzDisableFirstChange = false;
    this.cdr.markForCheck();
  }
  writeValue(value) {
    this.isChecked = value;
    this.cdr.markForCheck();
  }
  registerOnChange(fn) {
    this.isNgModel = true;
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  ngOnInit() {
    if (this.nzRadioService) {
      this.nzRadioService.name$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((name) => {
        this.name = name;
        this.cdr.markForCheck();
      });
      this.nzRadioService.disabled$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((disabled) => {
        this.nzDisabled = this.isNzDisableFirstChange && this.nzDisabled || disabled;
        this.isNzDisableFirstChange = false;
        this.cdr.markForCheck();
      });
      this.nzRadioService.selected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
        const isChecked = this.isChecked;
        this.isChecked = this.nzValue === value;
        if (this.isNgModel && isChecked !== this.isChecked && // We're only intereted if `isChecked` has been changed to `false` value to emit `false` to the ascendant form,
        // since we already emit `true` within the `setupClickListener`.
        this.isChecked === false) {
          this.onChange(false);
        }
        this.cdr.markForCheck();
      });
    }
    this.focusMonitor.monitor(this.elementRef, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((focusOrigin) => {
      if (!focusOrigin) {
        Promise.resolve().then(() => this.onTouched());
        if (this.nzRadioService) {
          this.nzRadioService.touch();
        }
      }
    });
    this.directionality.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((direction) => {
      this.dir = direction;
      this.cdr.detectChanges();
    });
    this.dir = this.directionality.value;
    this.setupClickListener();
  }
  ngAfterViewInit() {
    if (this.nzAutoFocus) {
      this.focus();
    }
  }
  setupClickListener() {
    fromEventOutsideAngular(this.elementRef.nativeElement, "click").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      event.stopPropagation();
      event.preventDefault();
      if (this.nzDisabled || this.isChecked) {
        return;
      }
      this.ngZone.run(() => {
        this.focus();
        this.nzRadioService?.select(this.nzValue);
        if (this.isNgModel) {
          this.isChecked = true;
          this.onChange(true);
        }
        this.cdr.markForCheck();
      });
    });
  }
  static ɵfac = function NzRadioComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzRadioComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzRadioComponent,
    selectors: [["", "nz-radio", ""], ["", "nz-radio-button", ""]],
    viewQuery: function NzRadioComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c1, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.inputElement = _t.first);
      }
    },
    hostVars: 18,
    hostBindings: function NzRadioComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-radio-wrapper-in-form-item", !!ctx.nzFormStatusService)("ant-radio-wrapper", !ctx.isRadioButton)("ant-radio-button-wrapper", ctx.isRadioButton)("ant-radio-wrapper-checked", ctx.isChecked && !ctx.isRadioButton)("ant-radio-button-wrapper-checked", ctx.isChecked && ctx.isRadioButton)("ant-radio-wrapper-disabled", ctx.nzDisabled && !ctx.isRadioButton)("ant-radio-button-wrapper-disabled", ctx.nzDisabled && ctx.isRadioButton)("ant-radio-wrapper-rtl", !ctx.isRadioButton && ctx.dir === "rtl")("ant-radio-button-wrapper-rtl", ctx.isRadioButton && ctx.dir === "rtl");
      }
    },
    inputs: {
      nzValue: "nzValue",
      nzDisabled: [2, "nzDisabled", "nzDisabled", booleanAttribute],
      nzAutoFocus: [2, "nzAutoFocus", "nzAutoFocus", booleanAttribute],
      isRadioButton: [2, "nz-radio-button", "isRadioButton", booleanAttribute]
    },
    exportAs: ["nzRadio"],
    features: [ɵɵProvidersFeature([{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _NzRadioComponent),
      multi: true
    }])],
    attrs: _c2,
    ngContentSelectors: _c0,
    decls: 6,
    vars: 24,
    consts: [["inputElement", ""], ["type", "radio", 3, "disabled", "checked"]],
    template: function NzRadioComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵdomElementStart(0, "span");
        ɵɵdomElement(1, "input", 1, 0)(3, "span");
        ɵɵdomElementEnd();
        ɵɵdomElementStart(4, "span");
        ɵɵprojection(5);
        ɵɵdomElementEnd();
      }
      if (rf & 2) {
        ɵɵclassProp("ant-radio", !ctx.isRadioButton)("ant-radio-checked", ctx.isChecked && !ctx.isRadioButton)("ant-radio-disabled", ctx.nzDisabled && !ctx.isRadioButton)("ant-radio-button", ctx.isRadioButton)("ant-radio-button-checked", ctx.isChecked && ctx.isRadioButton)("ant-radio-button-disabled", ctx.nzDisabled && ctx.isRadioButton);
        ɵɵadvance();
        ɵɵclassProp("ant-radio-input", !ctx.isRadioButton)("ant-radio-button-input", ctx.isRadioButton);
        ɵɵdomProperty("disabled", ctx.nzDisabled)("checked", ctx.isChecked);
        ɵɵattribute("autofocus", ctx.nzAutoFocus ? "autofocus" : null)("name", ctx.name);
        ɵɵadvance(2);
        ɵɵclassProp("ant-radio-inner", !ctx.isRadioButton)("ant-radio-button-inner", ctx.isRadioButton);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzRadioComponent, [{
    type: Component,
    args: [{
      selector: "[nz-radio],[nz-radio-button]",
      exportAs: "nzRadio",
      template: `
    <span
      [class.ant-radio]="!isRadioButton"
      [class.ant-radio-checked]="isChecked && !isRadioButton"
      [class.ant-radio-disabled]="nzDisabled && !isRadioButton"
      [class.ant-radio-button]="isRadioButton"
      [class.ant-radio-button-checked]="isChecked && isRadioButton"
      [class.ant-radio-button-disabled]="nzDisabled && isRadioButton"
    >
      <input
        #inputElement
        type="radio"
        [attr.autofocus]="nzAutoFocus ? 'autofocus' : null"
        [class.ant-radio-input]="!isRadioButton"
        [class.ant-radio-button-input]="isRadioButton"
        [disabled]="nzDisabled"
        [checked]="isChecked"
        [attr.name]="name"
      />
      <span [class.ant-radio-inner]="!isRadioButton" [class.ant-radio-button-inner]="isRadioButton"></span>
    </span>
    <span><ng-content /></span>
  `,
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NzRadioComponent),
        multi: true
      }],
      host: {
        "[class.ant-radio-wrapper-in-form-item]": "!!nzFormStatusService",
        "[class.ant-radio-wrapper]": "!isRadioButton",
        "[class.ant-radio-button-wrapper]": "isRadioButton",
        "[class.ant-radio-wrapper-checked]": "isChecked && !isRadioButton",
        "[class.ant-radio-button-wrapper-checked]": "isChecked && isRadioButton",
        "[class.ant-radio-wrapper-disabled]": "nzDisabled && !isRadioButton",
        "[class.ant-radio-button-wrapper-disabled]": "nzDisabled && isRadioButton",
        "[class.ant-radio-wrapper-rtl]": `!isRadioButton && dir === 'rtl'`,
        "[class.ant-radio-button-wrapper-rtl]": `isRadioButton && dir === 'rtl'`
      }
    }]
  }], () => [], {
    inputElement: [{
      type: ViewChild,
      args: ["inputElement", {
        static: true
      }]
    }],
    nzValue: [{
      type: Input
    }],
    nzDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzAutoFocus: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    isRadioButton: [{
      type: Input,
      args: [{
        alias: "nz-radio-button",
        transform: booleanAttribute
      }]
    }]
  });
})();
var NzRadioModule = class _NzRadioModule {
  static ɵfac = function NzRadioModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzRadioModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NzRadioModule,
    imports: [NzRadioComponent, NzRadioGroupComponent],
    exports: [NzRadioComponent, NzRadioGroupComponent]
  });
  static ɵinj = ɵɵdefineInjector({});
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzRadioModule, [{
    type: NgModule,
    args: [{
      imports: [NzRadioComponent, NzRadioGroupComponent],
      exports: [NzRadioComponent, NzRadioGroupComponent]
    }]
  }], null, null);
})();

export {
  NzRadioService,
  NzRadioGroupComponent,
  NzRadioComponent,
  NzRadioModule
};
//# sourceMappingURL=chunk-DVDIBHQC.js.map
