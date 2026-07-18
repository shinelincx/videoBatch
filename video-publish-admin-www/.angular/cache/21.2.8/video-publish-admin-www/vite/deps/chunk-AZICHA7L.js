import {
  NzAnimationCollapseDirective,
  NzNoAnimationDirective,
  SLIDE_ANIMATION_CLASS,
  withAnimationCheck
} from "./chunk-5TMQGPK6.js";
import {
  POSITION_MAP,
  getPlacementName
} from "./chunk-D3DECQHP.js";
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  OverlayModule
} from "./chunk-UXZ7ZQP6.js";
import {
  NzOutletModule,
  NzStringTemplateOutletDirective
} from "./chunk-QP2ATT6X.js";
import {
  NzIconDirective,
  NzIconModule
} from "./chunk-2YSKEAYZ.js";
import {
  Platform
} from "./chunk-MR7TIX67.js";
import {
  takeUntilDestroyed
} from "./chunk-LSZOUFU2.js";
import {
  generateClassName,
  getClassListFromValue,
  numberAttributeWithZeroFallback
} from "./chunk-OPN2JU7N.js";
import {
  Directionality
} from "./chunk-4L5DI3TQ.js";
import {
  NavigationEnd,
  Router,
  RouterLink
} from "./chunk-DIWUYGV5.js";
import {
  NgTemplateOutlet
} from "./chunk-SSARYQTY.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  output,
  setClassMetadata,
  ɵɵHostDirectivesFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵanimateEnter,
  ɵɵanimateLeave,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵviewQuery
} from "./chunk-VS5U7YU4.js";
import {
  merge
} from "./chunk-V37RSN4D.js";
import {
  BehaviorSubject,
  Subject,
  auditTime,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  startWith,
  switchMap
} from "./chunk-VUVMRRXW.js";

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-menu.mjs
var _c0 = ["nz-menu-item", ""];
var _c1 = ["*"];
var _c2 = ["nz-submenu-inline-child", ""];
var _c3 = ["nz-submenu-none-inline-child", ""];
var _c4 = ["nz-submenu-title", ""];
function NzSubMenuTitleComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 0);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵproperty("nzType", ctx_r0.nzIcon);
  }
}
function NzSubMenuTitleComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelementStart(1, "span", 4);
    ɵɵtext(2);
    ɵɵelementEnd();
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵtextInterpolate(ctx_r0.nzTitle);
  }
}
function NzSubMenuTitleComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 2);
    ɵɵelement(1, "nz-icon", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("nzType", ctx_r0.dir() === "rtl" ? "left" : "right");
  }
}
function NzSubMenuTitleComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 3);
  }
}
var _c5 = ["nz-submenu", ""];
var _c6 = [[["", "title", ""]], "*"];
var _c7 = ["[title]", "*"];
function NzSubMenuComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0);
  }
}
function NzSubMenuComponent_Conditional_3_ng_template_1_Template(rf, ctx) {
}
function NzSubMenuComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 3);
    ɵɵtemplate(1, NzSubMenuComponent_Conditional_3_ng_template_1_Template, 0, 0, "ng-template", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    const subMenuTemplate_r2 = ɵɵreference(6);
    ɵɵproperty("open", ctx_r0.nzOpen)("menuClass", ctx_r0.nzMenuClassName);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", subMenuTemplate_r2);
  }
}
function NzSubMenuComponent_Conditional_4_ng_template_0_ng_template_1_Template(rf, ctx) {
}
function NzSubMenuComponent_Conditional_4_ng_template_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 7);
    ɵɵlistener("subMenuMouseState", function NzSubMenuComponent_Conditional_4_ng_template_0_Template_div_subMenuMouseState_0_listener($event) {
      ɵɵrestoreView(_r4);
      const ctx_r0 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r0.setMouseEnterState($event));
    });
    ɵɵtemplate(1, NzSubMenuComponent_Conditional_4_ng_template_0_ng_template_1_Template, 0, 0, "ng-template", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    const subMenuTemplate_r2 = ɵɵreference(6);
    ɵɵproperty("theme", ctx_r0.theme)("mode", ctx_r0.mode)("open", ctx_r0.nzOpen)("position", ctx_r0.position)("menuClass", ctx_r0.nzMenuClassName)("nzDisabled", ctx_r0.nzDisabled)("nzTriggerSubMenuAction", ctx_r0.nzTriggerSubMenuAction)("nzNoAnimation", ctx_r0.noAnimation == null ? null : ctx_r0.noAnimation.nzNoAnimation == null ? null : ctx_r0.noAnimation.nzNoAnimation());
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", subMenuTemplate_r2);
  }
}
function NzSubMenuComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵtemplate(0, NzSubMenuComponent_Conditional_4_ng_template_0_Template, 2, 9, "ng-template", 6);
    ɵɵlistener("positionChange", function NzSubMenuComponent_Conditional_4_Template_ng_template_positionChange_0_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r0 = ɵɵnextContext();
      return ɵɵresetView(ctx_r0.onPositionChange($event));
    })("overlayOutsideClick", function NzSubMenuComponent_Conditional_4_Template_ng_template_overlayOutsideClick_0_listener() {
      ɵɵrestoreView(_r3);
      const ctx_r0 = ɵɵnextContext();
      return ɵɵresetView(ctx_r0.setMouseEnterState(false));
    });
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    const origin_r5 = ɵɵreference(1);
    ɵɵproperty("cdkConnectedOverlayPositions", ctx_r0.overlayPositions)("cdkConnectedOverlayOrigin", origin_r5)("cdkConnectedOverlayWidth", ctx_r0.triggerWidth)("cdkConnectedOverlayOpen", ctx_r0.nzOpen);
  }
}
function NzSubMenuComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 1);
  }
}
var _c8 = ["titleElement"];
var _c9 = ["nz-menu-group", ""];
var _c10 = ["*", [["", "title", ""]]];
var _c11 = ["*", "[title]"];
function NzMenuGroupComponent_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r0.nzTitle);
  }
}
function NzMenuGroupComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 1);
  }
}
var MenuService = class _MenuService {
  /** all descendant menu click **/
  descendantMenuItemClick$ = new Subject();
  /** child menu item click **/
  childMenuItemClick$ = new Subject();
  theme$ = new BehaviorSubject("light");
  mode$ = new BehaviorSubject("vertical");
  inlineIndent$ = new BehaviorSubject(24);
  isChildSubMenuOpen$ = new BehaviorSubject(false);
  onDescendantMenuItemClick(menu) {
    this.descendantMenuItemClick$.next(menu);
  }
  onChildMenuItemClick(menu) {
    this.childMenuItemClick$.next(menu);
  }
  setMode(mode) {
    this.mode$.next(mode);
  }
  setTheme(theme) {
    this.theme$.next(theme);
  }
  setInlineIndent(indent) {
    this.inlineIndent$.next(indent);
  }
  static ɵfac = function MenuService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MenuService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _MenuService,
    factory: _MenuService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MenuService, [{
    type: Injectable
  }], null, null);
})();
var NzIsMenuInsideDropdownToken = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "nz-is-in-dropdown-menu" : "");
var NzMenuServiceLocalToken = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "nz-menu-service-local" : "");
var NzSubmenuService = class _NzSubmenuService {
  nzMenuService = inject(MenuService);
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  nzHostSubmenuService = inject(_NzSubmenuService, {
    optional: true,
    skipSelf: true
  });
  mode$ = this.nzMenuService.mode$.pipe(map((mode) => {
    if (mode === "inline") {
      return "inline";
    } else if (mode === "vertical" || this.nzHostSubmenuService) {
      return "vertical";
    } else {
      return "horizontal";
    }
  }));
  level = 1;
  isCurrentSubMenuOpen$ = new BehaviorSubject(false);
  isChildSubMenuOpen$ = new BehaviorSubject(false);
  /** submenu title & overlay mouse enter status **/
  isMouseEnterTitleOrOverlay$ = new Subject();
  childMenuItemClick$ = new Subject();
  /**
   * menu item inside submenu clicked
   */
  onChildMenuItemClick(menu) {
    this.childMenuItemClick$.next(menu);
  }
  setOpenStateWithoutDebounce(value) {
    this.isCurrentSubMenuOpen$.next(value);
  }
  setMouseEnterTitleOrOverlayState(value) {
    this.isMouseEnterTitleOrOverlay$.next(value);
  }
  constructor() {
    if (this.nzHostSubmenuService) {
      this.level = this.nzHostSubmenuService.level + 1;
    }
    const isClosedByMenuItemClick = this.childMenuItemClick$.pipe(mergeMap(() => this.mode$), filter((mode) => mode !== "inline" || this.isMenuInsideDropdown), map(() => false));
    const isCurrentSubmenuOpen$ = merge(this.isMouseEnterTitleOrOverlay$, isClosedByMenuItemClick);
    const isSubMenuOpenWithDebounce$ = combineLatest([this.isChildSubMenuOpen$, isCurrentSubmenuOpen$]).pipe(map(([isChildSubMenuOpen, isCurrentSubmenuOpen]) => isChildSubMenuOpen || isCurrentSubmenuOpen), auditTime(150));
    isSubMenuOpenWithDebounce$.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe((data) => {
      this.setOpenStateWithoutDebounce(data);
      if (this.nzHostSubmenuService) {
        this.nzHostSubmenuService.isChildSubMenuOpen$.next(data);
      } else {
        this.nzMenuService.isChildSubMenuOpen$.next(data);
      }
    });
  }
  static ɵfac = function NzSubmenuService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzSubmenuService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NzSubmenuService,
    factory: _NzSubmenuService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzSubmenuService, [{
    type: Injectable
  }], () => [], null);
})();
var NzMenuItemComponent = class _NzMenuItemComponent {
  nzMenuService = inject(MenuService);
  destroyRef = inject(DestroyRef);
  cdr = inject(ChangeDetectorRef);
  nzSubmenuService = inject(NzSubmenuService, {
    optional: true
  });
  routerLink = inject(RouterLink, {
    optional: true
  });
  router = inject(Router, {
    optional: true
  });
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  level = this.nzSubmenuService ? this.nzSubmenuService.level + 1 : 1;
  selected$ = new Subject();
  inlinePaddingLeft = null;
  nzPaddingLeft;
  nzDisabled = false;
  nzSelected = false;
  nzDanger = false;
  nzMatchRouterExact = false;
  nzMatchRouter = false;
  listOfRouterLink;
  /** clear all item selected status except this */
  clickMenuItem(e) {
    if (this.nzDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.nzMenuService.onDescendantMenuItemClick(this);
    if (this.nzSubmenuService) {
      this.nzSubmenuService.onChildMenuItemClick(this);
    } else {
      this.nzMenuService.onChildMenuItemClick(this);
    }
  }
  setSelectedState(value) {
    this.nzSelected = value;
    this.selected$.next(value);
  }
  updateRouterActive() {
    if (!this.listOfRouterLink || !this.router || !this.router.navigated || !this.nzMatchRouter) {
      return;
    }
    Promise.resolve().then(() => {
      const hasActiveLinks = this.hasActiveLinks();
      if (this.nzSelected !== hasActiveLinks) {
        this.nzSelected = hasActiveLinks;
        this.setSelectedState(this.nzSelected);
        this.cdr.markForCheck();
      }
    });
  }
  hasActiveLinks() {
    const isActiveCheckFn = this.isLinkActive(this.router);
    return this.routerLink && isActiveCheckFn(this.routerLink) || this.listOfRouterLink.some(isActiveCheckFn);
  }
  isLinkActive(router) {
    return (link) => router.isActive(link.urlTree || "", {
      paths: this.nzMatchRouterExact ? "exact" : "subset",
      queryParams: this.nzMatchRouterExact ? "exact" : "subset",
      fragment: "ignored",
      matrixParams: "ignored"
    });
  }
  constructor() {
    this.router?.events.pipe(takeUntilDestroyed(), filter((e) => e instanceof NavigationEnd)).subscribe(() => this.updateRouterActive());
  }
  ngOnInit() {
    combineLatest([this.nzMenuService.mode$, this.nzMenuService.inlineIndent$]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([mode, inlineIndent]) => {
      this.inlinePaddingLeft = mode === "inline" ? this.level * inlineIndent : null;
    });
  }
  ngAfterContentInit() {
    this.listOfRouterLink.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateRouterActive());
    this.updateRouterActive();
  }
  ngOnChanges(changes) {
    const {
      nzSelected
    } = changes;
    if (nzSelected) {
      this.setSelectedState(this.nzSelected);
    }
  }
  static ɵfac = function NzMenuItemComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzMenuItemComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzMenuItemComponent,
    selectors: [["", "nz-menu-item", ""]],
    contentQueries: function NzMenuItemComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, RouterLink, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listOfRouterLink = _t);
      }
    },
    hostVars: 18,
    hostBindings: function NzMenuItemComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function NzMenuItemComponent_click_HostBindingHandler($event) {
          return ctx.clickMenuItem($event);
        });
      }
      if (rf & 2) {
        ɵɵstyleProp("padding-inline-start", ctx.nzPaddingLeft || ctx.inlinePaddingLeft, "px");
        ɵɵclassProp("ant-dropdown-menu-item", ctx.isMenuInsideDropdown)("ant-dropdown-menu-item-selected", ctx.isMenuInsideDropdown && ctx.nzSelected)("ant-dropdown-menu-item-danger", ctx.isMenuInsideDropdown && ctx.nzDanger)("ant-dropdown-menu-item-disabled", ctx.isMenuInsideDropdown && ctx.nzDisabled)("ant-menu-item", !ctx.isMenuInsideDropdown)("ant-menu-item-selected", !ctx.isMenuInsideDropdown && ctx.nzSelected)("ant-menu-item-danger", !ctx.isMenuInsideDropdown && ctx.nzDanger)("ant-menu-item-disabled", !ctx.isMenuInsideDropdown && ctx.nzDisabled);
      }
    },
    inputs: {
      nzPaddingLeft: [2, "nzPaddingLeft", "nzPaddingLeft", numberAttributeWithZeroFallback],
      nzDisabled: [2, "nzDisabled", "nzDisabled", booleanAttribute],
      nzSelected: [2, "nzSelected", "nzSelected", booleanAttribute],
      nzDanger: [2, "nzDanger", "nzDanger", booleanAttribute],
      nzMatchRouterExact: [2, "nzMatchRouterExact", "nzMatchRouterExact", booleanAttribute],
      nzMatchRouter: [2, "nzMatchRouter", "nzMatchRouter", booleanAttribute]
    },
    exportAs: ["nzMenuItem"],
    features: [ɵɵNgOnChangesFeature],
    attrs: _c0,
    ngContentSelectors: _c1,
    decls: 2,
    vars: 0,
    consts: [[1, "ant-menu-title-content"]],
    template: function NzMenuItemComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵdomElementStart(0, "span", 0);
        ɵɵprojection(1);
        ɵɵdomElementEnd();
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzMenuItemComponent, [{
    type: Component,
    args: [{
      selector: "[nz-menu-item]",
      exportAs: "nzMenuItem",
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      template: `
    <span class="ant-menu-title-content">
      <ng-content />
    </span>
  `,
      host: {
        "[class.ant-dropdown-menu-item]": `isMenuInsideDropdown`,
        "[class.ant-dropdown-menu-item-selected]": `isMenuInsideDropdown && nzSelected`,
        "[class.ant-dropdown-menu-item-danger]": `isMenuInsideDropdown && nzDanger`,
        "[class.ant-dropdown-menu-item-disabled]": `isMenuInsideDropdown && nzDisabled`,
        "[class.ant-menu-item]": `!isMenuInsideDropdown`,
        "[class.ant-menu-item-selected]": `!isMenuInsideDropdown && nzSelected`,
        "[class.ant-menu-item-danger]": `!isMenuInsideDropdown && nzDanger`,
        "[class.ant-menu-item-disabled]": `!isMenuInsideDropdown && nzDisabled`,
        "[style.padding-inline-start.px]": "nzPaddingLeft || inlinePaddingLeft",
        "(click)": "clickMenuItem($event)"
      }
    }]
  }], () => [], {
    nzPaddingLeft: [{
      type: Input,
      args: [{
        transform: numberAttributeWithZeroFallback
      }]
    }],
    nzDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzSelected: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzDanger: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzMatchRouterExact: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzMatchRouter: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    listOfRouterLink: [{
      type: ContentChildren,
      args: [RouterLink, {
        descendants: true
      }]
    }]
  });
})();
var MENU_PREFIX$1 = "ant-menu";
var NzSubmenuInlineChildComponent = class _NzSubmenuInlineChildComponent {
  dir = inject(Directionality).valueSignal;
  menuClass = input("", ...ngDevMode ? [{
    debugName: "menuClass"
  }] : []);
  open = input(false, ...ngDevMode ? [{
    debugName: "open"
  }] : []);
  leavedClassName = input(generateClassName(MENU_PREFIX$1, "submenu-hidden"), ...ngDevMode ? [{
    debugName: "leavedClassName"
  }] : []);
  mergedClass = computed(() => {
    const customCls = getClassListFromValue(this.menuClass()) || [];
    const cls = [MENU_PREFIX$1, generateClassName(MENU_PREFIX$1, "inline"), generateClassName(MENU_PREFIX$1, "sub"), ...customCls];
    if (this.dir() === "rtl") {
      cls.push(generateClassName(MENU_PREFIX$1, "rtl"));
    }
    return cls;
  }, ...ngDevMode ? [{
    debugName: "mergedClass"
  }] : []);
  static ɵfac = function NzSubmenuInlineChildComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzSubmenuInlineChildComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzSubmenuInlineChildComponent,
    selectors: [["", "nz-submenu-inline-child", ""]],
    hostVars: 2,
    hostBindings: function NzSubmenuInlineChildComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassMap(ctx.mergedClass());
      }
    },
    inputs: {
      menuClass: [1, "menuClass"],
      open: [1, "open"],
      leavedClassName: [1, "leavedClassName"]
    },
    exportAs: ["nzSubmenuInlineChild"],
    features: [ɵɵHostDirectivesFeature([{
      directive: NzAnimationCollapseDirective,
      inputs: ["open", "open", "leavedClassName", "leavedClassName"]
    }])],
    attrs: _c2,
    ngContentSelectors: _c1,
    decls: 1,
    vars: 0,
    template: function NzSubmenuInlineChildComponent_Template(rf, ctx) {
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzSubmenuInlineChildComponent, [{
    type: Component,
    args: [{
      selector: "[nz-submenu-inline-child]",
      exportAs: "nzSubmenuInlineChild",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<ng-content />`,
      hostDirectives: [{
        directive: NzAnimationCollapseDirective,
        inputs: ["open", "leavedClassName"]
      }],
      host: {
        "[class]": "mergedClass()"
      }
    }]
  }], null, {
    menuClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "menuClass",
        required: false
      }]
    }],
    open: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "open",
        required: false
      }]
    }],
    leavedClassName: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "leavedClassName",
        required: false
      }]
    }]
  });
})();
var ANT_PREFIX = "ant";
var MENU_PREFIX = `${ANT_PREFIX}-menu`;
var SUBMENU_PREFIX = `${MENU_PREFIX}-submenu`;
var DROPDOWN_PREFIX = `${ANT_PREFIX}-dropdown`;
var ANIMATION_PREFIX = `${ANT_PREFIX}-zoom-big`;
var ANIMATION_CLASS = {
  vertical: {
    enter: `${ANIMATION_PREFIX}-enter ${ANIMATION_PREFIX}-enter-active`,
    leave: `${ANIMATION_PREFIX}-leave ${ANIMATION_PREFIX}-leave-active`
  },
  horizontal: SLIDE_ANIMATION_CLASS
};
var NzSubmenuNoneInlineChildComponent = class _NzSubmenuNoneInlineChildComponent {
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  dir = inject(Directionality).valueSignal;
  menuClass = input("", ...ngDevMode ? [{
    debugName: "menuClass"
  }] : []);
  theme = input("light", ...ngDevMode ? [{
    debugName: "theme"
  }] : []);
  mode = input("vertical", ...ngDevMode ? [{
    debugName: "mode"
  }] : []);
  position = input("right", ...ngDevMode ? [{
    debugName: "position"
  }] : []);
  open = input(false, ...ngDevMode ? [{
    debugName: "open"
  }] : []);
  nzDisabled = input(false, ...ngDevMode ? [{
    debugName: "nzDisabled"
  }] : []);
  nzTriggerSubMenuAction = input("hover", ...ngDevMode ? [{
    debugName: "nzTriggerSubMenuAction"
  }] : []);
  subMenuMouseState = output();
  animationEnter = withAnimationCheck(() => ANIMATION_CLASS[this.mode()].enter);
  animationLeave = withAnimationCheck(() => ANIMATION_CLASS[this.mode()].leave);
  submenuClass = computed(() => {
    const cls = [SUBMENU_PREFIX, generateClassName(SUBMENU_PREFIX, "popup"), generateClassName(MENU_PREFIX, this.theme() === "dark" ? "dark" : "light")];
    const mode = this.mode();
    const position = this.position() === "left" ? "left" : "right";
    if (mode === "horizontal") {
      cls.push(generateClassName(SUBMENU_PREFIX, "placement-bottom"));
    } else if (mode === "vertical") {
      cls.push(generateClassName(SUBMENU_PREFIX, `placement-${position}`));
    }
    if (this.dir() === "rtl") {
      cls.push(generateClassName(SUBMENU_PREFIX, "rtl"));
    }
    return cls;
  }, ...ngDevMode ? [{
    debugName: "submenuClass"
  }] : []);
  mergedMenuClass = computed(() => {
    const cls = getClassListFromValue(this.menuClass()) || [];
    if (this.isMenuInsideDropdown) {
      cls.push(generateClassName(DROPDOWN_PREFIX, "menu"), generateClassName(DROPDOWN_PREFIX, "menu-sub"), generateClassName(DROPDOWN_PREFIX, "menu-vertical"));
    } else {
      cls.push(MENU_PREFIX, generateClassName(MENU_PREFIX, "sub"), generateClassName(MENU_PREFIX, "vertical"));
    }
    if (this.dir() === "rtl") {
      cls.push(generateClassName(MENU_PREFIX, "rtl"));
    }
    return cls;
  }, ...ngDevMode ? [{
    debugName: "mergedMenuClass"
  }] : []);
  setMouseState(state) {
    if (!this.nzDisabled() && this.nzTriggerSubMenuAction() === "hover") {
      this.subMenuMouseState.emit(state);
    }
  }
  static ɵfac = function NzSubmenuNoneInlineChildComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzSubmenuNoneInlineChildComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzSubmenuNoneInlineChildComponent,
    selectors: [["", "nz-submenu-none-inline-child", ""]],
    hostVars: 2,
    hostBindings: function NzSubmenuNoneInlineChildComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mouseenter", function NzSubmenuNoneInlineChildComponent_mouseenter_HostBindingHandler() {
          return ctx.setMouseState(true);
        })("mouseleave", function NzSubmenuNoneInlineChildComponent_mouseleave_HostBindingHandler() {
          return ctx.setMouseState(false);
        });
        ɵɵanimateEnter(function NzSubmenuNoneInlineChildComponent_HostBindings_animateenter_cb() {
          return ctx.animationEnter();
        });
        ɵɵanimateLeave(function NzSubmenuNoneInlineChildComponent_HostBindings_animateleave_cb() {
          return ctx.animationLeave();
        });
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.submenuClass());
      }
    },
    inputs: {
      menuClass: [1, "menuClass"],
      theme: [1, "theme"],
      mode: [1, "mode"],
      position: [1, "position"],
      open: [1, "open"],
      nzDisabled: [1, "nzDisabled"],
      nzTriggerSubMenuAction: [1, "nzTriggerSubMenuAction"]
    },
    outputs: {
      subMenuMouseState: "subMenuMouseState"
    },
    exportAs: ["nzSubmenuNoneInlineChild"],
    attrs: _c3,
    ngContentSelectors: _c1,
    decls: 2,
    vars: 2,
    template: function NzSubmenuNoneInlineChildComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵdomElementStart(0, "div");
        ɵɵprojection(1);
        ɵɵdomElementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.mergedMenuClass());
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzSubmenuNoneInlineChildComponent, [{
    type: Component,
    args: [{
      selector: "[nz-submenu-none-inline-child]",
      exportAs: "nzSubmenuNoneInlineChild",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    <div [class]="mergedMenuClass()">
      <ng-content />
    </div>
  `,
      host: {
        "[class]": "submenuClass()",
        "(mouseenter)": "setMouseState(true)",
        "(mouseleave)": "setMouseState(false)",
        "[animate.enter]": `animationEnter()`,
        "[animate.leave]": `animationLeave()`
      }
    }]
  }], null, {
    menuClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "menuClass",
        required: false
      }]
    }],
    theme: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "theme",
        required: false
      }]
    }],
    mode: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "mode",
        required: false
      }]
    }],
    position: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "position",
        required: false
      }]
    }],
    open: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "open",
        required: false
      }]
    }],
    nzDisabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzDisabled",
        required: false
      }]
    }],
    nzTriggerSubMenuAction: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzTriggerSubMenuAction",
        required: false
      }]
    }],
    subMenuMouseState: [{
      type: Output,
      args: ["subMenuMouseState"]
    }]
  });
})();
var NzSubMenuTitleComponent = class _NzSubMenuTitleComponent {
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  dir = inject(Directionality).valueSignal;
  nzIcon = null;
  nzTitle = null;
  nzDisabled = false;
  paddingLeft = null;
  mode = "vertical";
  nzTriggerSubMenuAction = "hover";
  toggleSubMenu = new EventEmitter();
  subMenuMouseState = new EventEmitter();
  setMouseState(state) {
    if (!this.nzDisabled && this.nzTriggerSubMenuAction === "hover") {
      this.subMenuMouseState.next(state);
    }
  }
  clickTitle() {
    if ((this.mode === "inline" || this.nzTriggerSubMenuAction === "click") && !this.nzDisabled) {
      this.subMenuMouseState.next(true);
      this.toggleSubMenu.emit();
    }
  }
  static ɵfac = function NzSubMenuTitleComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzSubMenuTitleComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzSubMenuTitleComponent,
    selectors: [["", "nz-submenu-title", ""]],
    hostVars: 6,
    hostBindings: function NzSubMenuTitleComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function NzSubMenuTitleComponent_click_HostBindingHandler() {
          return ctx.clickTitle();
        })("mouseenter", function NzSubMenuTitleComponent_mouseenter_HostBindingHandler() {
          return ctx.setMouseState(true);
        })("mouseleave", function NzSubMenuTitleComponent_mouseleave_HostBindingHandler() {
          return ctx.setMouseState(false);
        });
      }
      if (rf & 2) {
        ɵɵstyleProp("padding-inline-start", ctx.paddingLeft, "px");
        ɵɵclassProp("ant-dropdown-menu-submenu-title", ctx.isMenuInsideDropdown)("ant-menu-submenu-title", !ctx.isMenuInsideDropdown);
      }
    },
    inputs: {
      nzIcon: "nzIcon",
      nzTitle: "nzTitle",
      nzDisabled: "nzDisabled",
      paddingLeft: "paddingLeft",
      mode: "mode",
      nzTriggerSubMenuAction: "nzTriggerSubMenuAction"
    },
    outputs: {
      toggleSubMenu: "toggleSubMenu",
      subMenuMouseState: "subMenuMouseState"
    },
    exportAs: ["nzSubmenuTitle"],
    attrs: _c4,
    ngContentSelectors: _c1,
    decls: 5,
    vars: 3,
    consts: [[3, "nzType"], [4, "nzStringTemplateOutlet"], [1, "ant-dropdown-menu-submenu-expand-icon"], [1, "ant-menu-submenu-arrow"], [1, "ant-menu-title-content"], [1, "ant-dropdown-menu-submenu-arrow-icon", 3, "nzType"]],
    template: function NzSubMenuTitleComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵconditionalCreate(0, NzSubMenuTitleComponent_Conditional_0_Template, 1, 1, "nz-icon", 0);
        ɵɵtemplate(1, NzSubMenuTitleComponent_ng_container_1_Template, 3, 1, "ng-container", 1);
        ɵɵprojection(2);
        ɵɵconditionalCreate(3, NzSubMenuTitleComponent_Conditional_3_Template, 2, 1, "span", 2)(4, NzSubMenuTitleComponent_Conditional_4_Template, 1, 0, "span", 3);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.nzIcon ? 0 : -1);
        ɵɵadvance();
        ɵɵproperty("nzStringTemplateOutlet", ctx.nzTitle);
        ɵɵadvance(2);
        ɵɵconditional(ctx.isMenuInsideDropdown ? 3 : 4);
      }
    },
    dependencies: [NzIconModule, NzIconDirective, NzOutletModule, NzStringTemplateOutletDirective],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzSubMenuTitleComponent, [{
    type: Component,
    args: [{
      selector: "[nz-submenu-title]",
      exportAs: "nzSubmenuTitle",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    @if (nzIcon) {
      <nz-icon [nzType]="nzIcon" />
    }
    <ng-container *nzStringTemplateOutlet="nzTitle">
      <span class="ant-menu-title-content">{{ nzTitle }}</span>
    </ng-container>
    <ng-content />
    @if (isMenuInsideDropdown) {
      <span class="ant-dropdown-menu-submenu-expand-icon">
        <nz-icon [nzType]="dir() === 'rtl' ? 'left' : 'right'" class="ant-dropdown-menu-submenu-arrow-icon" />
      </span>
    } @else {
      <span class="ant-menu-submenu-arrow"></span>
    }
  `,
      host: {
        "[class.ant-dropdown-menu-submenu-title]": "isMenuInsideDropdown",
        "[class.ant-menu-submenu-title]": "!isMenuInsideDropdown",
        "[style.padding-inline-start.px]": "paddingLeft",
        "(click)": "clickTitle()",
        "(mouseenter)": "setMouseState(true)",
        "(mouseleave)": "setMouseState(false)"
      },
      imports: [NzIconModule, NzOutletModule]
    }]
  }], null, {
    nzIcon: [{
      type: Input
    }],
    nzTitle: [{
      type: Input
    }],
    nzDisabled: [{
      type: Input
    }],
    paddingLeft: [{
      type: Input
    }],
    mode: [{
      type: Input
    }],
    nzTriggerSubMenuAction: [{
      type: Input
    }],
    toggleSubMenu: [{
      type: Output
    }],
    subMenuMouseState: [{
      type: Output
    }]
  });
})();
var listOfVerticalPositions = [POSITION_MAP.rightTop, POSITION_MAP.right, POSITION_MAP.rightBottom, POSITION_MAP.leftTop, POSITION_MAP.left, POSITION_MAP.leftBottom];
var listOfHorizontalPositions = [POSITION_MAP.bottomLeft, POSITION_MAP.bottomRight, POSITION_MAP.topRight, POSITION_MAP.topLeft];
var NzSubMenuComponent = class _NzSubMenuComponent {
  nzSubmenuService = inject(NzSubmenuService);
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  noAnimation = inject(NzNoAnimationDirective, {
    optional: true,
    host: true
  });
  dir = inject(Directionality).valueSignal;
  destroyRef = inject(DestroyRef);
  nzMenuService = inject(MenuService);
  cdr = inject(ChangeDetectorRef);
  platform = inject(Platform);
  nzMenuClassName = "";
  nzPaddingLeft = null;
  nzTitle = null;
  nzIcon = null;
  nzTriggerSubMenuAction = "hover";
  nzOpen = false;
  nzDisabled = false;
  nzPlacement = "bottomLeft";
  nzOpenChange = new EventEmitter();
  cdkOverlayOrigin = null;
  // fix errors about circular dependency
  // Can't construct a query for the property ... since the query selector wasn't defined
  listOfNzSubMenuComponent = null;
  listOfNzMenuItemDirective = null;
  level = this.nzSubmenuService.level;
  position = "right";
  triggerWidth = null;
  theme = "light";
  mode = "vertical";
  inlinePaddingLeft = null;
  overlayPositions = listOfVerticalPositions;
  isSelected = false;
  isActive = false;
  /** set the submenu host open status directly **/
  setOpenStateWithoutDebounce(open) {
    this.nzSubmenuService.setOpenStateWithoutDebounce(open);
  }
  toggleSubMenu() {
    this.setOpenStateWithoutDebounce(!this.nzOpen);
  }
  setMouseEnterState(value) {
    this.isActive = value;
    if (this.mode !== "inline") {
      this.nzSubmenuService.setMouseEnterTitleOrOverlayState(value);
    }
  }
  setTriggerWidth() {
    if (this.mode === "horizontal" && this.platform.isBrowser && this.cdkOverlayOrigin && this.nzPlacement === "bottomLeft") {
      this.triggerWidth = this.cdkOverlayOrigin.nativeElement.getBoundingClientRect().width;
    }
  }
  onPositionChange(position) {
    const placement = getPlacementName(position);
    if (placement === "rightTop" || placement === "rightBottom" || placement === "right") {
      this.position = "right";
    } else if (placement === "leftTop" || placement === "leftBottom" || placement === "left") {
      this.position = "left";
    }
  }
  ngOnInit() {
    this.nzMenuService.theme$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((theme) => {
      this.theme = theme;
      this.cdr.markForCheck();
    });
    this.nzSubmenuService.mode$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((mode) => {
      this.mode = mode;
      if (mode === "horizontal") {
        this.overlayPositions = [POSITION_MAP[this.nzPlacement], ...listOfHorizontalPositions];
      } else if (mode === "vertical") {
        this.overlayPositions = listOfVerticalPositions;
      }
      this.cdr.markForCheck();
    });
    combineLatest([this.nzSubmenuService.mode$, this.nzMenuService.inlineIndent$]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([mode, inlineIndent]) => {
      this.inlinePaddingLeft = mode === "inline" ? this.level * inlineIndent : null;
      this.cdr.markForCheck();
    });
    this.nzSubmenuService.isCurrentSubMenuOpen$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((open) => {
      this.isActive = open;
      if (open !== this.nzOpen) {
        this.setTriggerWidth();
        this.nzOpen = open;
        this.nzOpenChange.emit(this.nzOpen);
        this.cdr.markForCheck();
      }
    });
  }
  ngAfterContentInit() {
    this.setTriggerWidth();
    const listOfNzMenuItemDirective = this.listOfNzMenuItemDirective;
    const changes = listOfNzMenuItemDirective.changes;
    const mergedObservable = merge(changes, ...listOfNzMenuItemDirective.map((menu) => menu.selected$));
    changes.pipe(startWith(listOfNzMenuItemDirective), switchMap(() => mergedObservable), startWith(true), map(() => listOfNzMenuItemDirective.some((e) => e.nzSelected)), takeUntilDestroyed(this.destroyRef)).subscribe((selected) => {
      this.isSelected = selected;
      this.cdr.markForCheck();
    });
  }
  ngOnChanges(changes) {
    const {
      nzOpen
    } = changes;
    if (nzOpen) {
      this.nzSubmenuService.setOpenStateWithoutDebounce(this.nzOpen);
      this.setTriggerWidth();
    }
  }
  static ɵfac = function NzSubMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzSubMenuComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzSubMenuComponent,
    selectors: [["", "nz-submenu", ""]],
    contentQueries: function NzSubMenuComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _NzSubMenuComponent, 5)(dirIndex, NzMenuItemComponent, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listOfNzSubMenuComponent = _t);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listOfNzMenuItemDirective = _t);
      }
    },
    viewQuery: function NzSubMenuComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(CdkOverlayOrigin, 7, ElementRef);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.cdkOverlayOrigin = _t.first);
      }
    },
    hostVars: 34,
    hostBindings: function NzSubMenuComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-dropdown-menu-submenu", ctx.isMenuInsideDropdown)("ant-dropdown-menu-submenu-disabled", ctx.isMenuInsideDropdown && ctx.nzDisabled)("ant-dropdown-menu-submenu-open", ctx.isMenuInsideDropdown && ctx.nzOpen)("ant-dropdown-menu-submenu-selected", ctx.isMenuInsideDropdown && ctx.isSelected)("ant-dropdown-menu-submenu-vertical", ctx.isMenuInsideDropdown && ctx.mode === "vertical")("ant-dropdown-menu-submenu-horizontal", ctx.isMenuInsideDropdown && ctx.mode === "horizontal")("ant-dropdown-menu-submenu-inline", ctx.isMenuInsideDropdown && ctx.mode === "inline")("ant-dropdown-menu-submenu-active", ctx.isMenuInsideDropdown && ctx.isActive)("ant-menu-submenu", !ctx.isMenuInsideDropdown)("ant-menu-submenu-disabled", !ctx.isMenuInsideDropdown && ctx.nzDisabled)("ant-menu-submenu-open", !ctx.isMenuInsideDropdown && ctx.nzOpen)("ant-menu-submenu-selected", !ctx.isMenuInsideDropdown && ctx.isSelected)("ant-menu-submenu-vertical", !ctx.isMenuInsideDropdown && ctx.mode === "vertical")("ant-menu-submenu-horizontal", !ctx.isMenuInsideDropdown && ctx.mode === "horizontal")("ant-menu-submenu-inline", !ctx.isMenuInsideDropdown && ctx.mode === "inline")("ant-menu-submenu-active", !ctx.isMenuInsideDropdown && ctx.isActive)("ant-menu-submenu-rtl", ctx.dir() === "rtl");
      }
    },
    inputs: {
      nzMenuClassName: "nzMenuClassName",
      nzPaddingLeft: "nzPaddingLeft",
      nzTitle: "nzTitle",
      nzIcon: "nzIcon",
      nzTriggerSubMenuAction: "nzTriggerSubMenuAction",
      nzOpen: [2, "nzOpen", "nzOpen", booleanAttribute],
      nzDisabled: [2, "nzDisabled", "nzDisabled", booleanAttribute],
      nzPlacement: "nzPlacement"
    },
    outputs: {
      nzOpenChange: "nzOpenChange"
    },
    exportAs: ["nzSubmenu"],
    features: [ɵɵProvidersFeature([NzSubmenuService]), ɵɵNgOnChangesFeature],
    attrs: _c5,
    ngContentSelectors: _c7,
    decls: 7,
    vars: 8,
    consts: [["origin", "cdkOverlayOrigin"], ["subMenuTemplate", ""], ["nz-submenu-title", "", "cdkOverlayOrigin", "", 3, "subMenuMouseState", "toggleSubMenu", "nzIcon", "nzTitle", "mode", "nzDisabled", "paddingLeft", "nzTriggerSubMenuAction"], ["nz-submenu-inline-child", "", "leavedClassName", "ant-menu-submenu-hidden", 3, "open", "menuClass"], ["cdkConnectedOverlay", "", "cdkConnectedOverlayTransformOriginOn", ".ant-menu-submenu", 3, "cdkConnectedOverlayPositions", "cdkConnectedOverlayOrigin", "cdkConnectedOverlayWidth", "cdkConnectedOverlayOpen"], [3, "ngTemplateOutlet"], ["cdkConnectedOverlay", "", "cdkConnectedOverlayTransformOriginOn", ".ant-menu-submenu", 3, "positionChange", "overlayOutsideClick", "cdkConnectedOverlayPositions", "cdkConnectedOverlayOrigin", "cdkConnectedOverlayWidth", "cdkConnectedOverlayOpen"], ["nz-submenu-none-inline-child", "", 3, "subMenuMouseState", "theme", "mode", "open", "position", "menuClass", "nzDisabled", "nzTriggerSubMenuAction", "nzNoAnimation"]],
    template: function NzSubMenuComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef(_c6);
        ɵɵelementStart(0, "div", 2, 0);
        ɵɵlistener("subMenuMouseState", function NzSubMenuComponent_Template_div_subMenuMouseState_0_listener($event) {
          return ctx.setMouseEnterState($event);
        })("toggleSubMenu", function NzSubMenuComponent_Template_div_toggleSubMenu_0_listener() {
          return ctx.toggleSubMenu();
        });
        ɵɵconditionalCreate(2, NzSubMenuComponent_Conditional_2_Template, 1, 0);
        ɵɵelementEnd();
        ɵɵconditionalCreate(3, NzSubMenuComponent_Conditional_3_Template, 2, 3, "div", 3)(4, NzSubMenuComponent_Conditional_4_Template, 1, 4, null, 4);
        ɵɵtemplate(5, NzSubMenuComponent_ng_template_5_Template, 1, 0, "ng-template", null, 1, ɵɵtemplateRefExtractor);
      }
      if (rf & 2) {
        ɵɵproperty("nzIcon", ctx.nzIcon)("nzTitle", ctx.nzTitle)("mode", ctx.mode)("nzDisabled", ctx.nzDisabled)("paddingLeft", ctx.nzPaddingLeft || ctx.inlinePaddingLeft)("nzTriggerSubMenuAction", ctx.nzTriggerSubMenuAction);
        ɵɵadvance(2);
        ɵɵconditional(!ctx.nzTitle ? 2 : -1);
        ɵɵadvance();
        ɵɵconditional(ctx.mode === "inline" ? 3 : 4);
      }
    },
    dependencies: [NgTemplateOutlet, NzSubMenuTitleComponent, NzSubmenuInlineChildComponent, NzNoAnimationDirective, NzSubmenuNoneInlineChildComponent, OverlayModule, CdkConnectedOverlay, CdkOverlayOrigin],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzSubMenuComponent, [{
    type: Component,
    args: [{
      selector: "[nz-submenu]",
      exportAs: "nzSubmenu",
      providers: [NzSubmenuService],
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    <div
      nz-submenu-title
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [nzIcon]="nzIcon"
      [nzTitle]="nzTitle"
      [mode]="mode"
      [nzDisabled]="nzDisabled"
      [paddingLeft]="nzPaddingLeft || inlinePaddingLeft"
      [nzTriggerSubMenuAction]="nzTriggerSubMenuAction"
      (subMenuMouseState)="setMouseEnterState($event)"
      (toggleSubMenu)="toggleSubMenu()"
    >
      @if (!nzTitle) {
        <ng-content select="[title]" />
      }
    </div>
    @if (mode === 'inline') {
      <div
        nz-submenu-inline-child
        [open]="nzOpen"
        [menuClass]="nzMenuClassName"
        leavedClassName="ant-menu-submenu-hidden"
      >
        <ng-template [ngTemplateOutlet]="subMenuTemplate" />
      </div>
    } @else {
      <ng-template
        cdkConnectedOverlay
        (positionChange)="onPositionChange($event)"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayWidth]="triggerWidth!"
        [cdkConnectedOverlayOpen]="nzOpen"
        cdkConnectedOverlayTransformOriginOn=".ant-menu-submenu"
        (overlayOutsideClick)="setMouseEnterState(false)"
      >
        <div
          nz-submenu-none-inline-child
          [theme]="theme"
          [mode]="mode"
          [open]="nzOpen"
          [position]="position"
          [menuClass]="nzMenuClassName"
          [nzDisabled]="nzDisabled"
          [nzTriggerSubMenuAction]="nzTriggerSubMenuAction"
          [nzNoAnimation]="noAnimation?.nzNoAnimation?.()"
          (subMenuMouseState)="setMouseEnterState($event)"
        >
          <ng-template [ngTemplateOutlet]="subMenuTemplate" />
        </div>
      </ng-template>
    }

    <ng-template #subMenuTemplate>
      <ng-content />
    </ng-template>
  `,
      host: {
        "[class.ant-dropdown-menu-submenu]": `isMenuInsideDropdown`,
        "[class.ant-dropdown-menu-submenu-disabled]": `isMenuInsideDropdown && nzDisabled`,
        "[class.ant-dropdown-menu-submenu-open]": `isMenuInsideDropdown && nzOpen`,
        "[class.ant-dropdown-menu-submenu-selected]": `isMenuInsideDropdown && isSelected`,
        "[class.ant-dropdown-menu-submenu-vertical]": `isMenuInsideDropdown && mode === 'vertical'`,
        "[class.ant-dropdown-menu-submenu-horizontal]": `isMenuInsideDropdown && mode === 'horizontal'`,
        "[class.ant-dropdown-menu-submenu-inline]": `isMenuInsideDropdown && mode === 'inline'`,
        "[class.ant-dropdown-menu-submenu-active]": `isMenuInsideDropdown && isActive`,
        "[class.ant-menu-submenu]": `!isMenuInsideDropdown`,
        "[class.ant-menu-submenu-disabled]": `!isMenuInsideDropdown && nzDisabled`,
        "[class.ant-menu-submenu-open]": `!isMenuInsideDropdown && nzOpen`,
        "[class.ant-menu-submenu-selected]": `!isMenuInsideDropdown && isSelected`,
        "[class.ant-menu-submenu-vertical]": `!isMenuInsideDropdown && mode === 'vertical'`,
        "[class.ant-menu-submenu-horizontal]": `!isMenuInsideDropdown && mode === 'horizontal'`,
        "[class.ant-menu-submenu-inline]": `!isMenuInsideDropdown && mode === 'inline'`,
        "[class.ant-menu-submenu-active]": `!isMenuInsideDropdown && isActive`,
        "[class.ant-menu-submenu-rtl]": `dir() === 'rtl'`
      },
      imports: [NgTemplateOutlet, NzSubMenuTitleComponent, NzSubmenuInlineChildComponent, NzNoAnimationDirective, NzSubmenuNoneInlineChildComponent, OverlayModule]
    }]
  }], null, {
    nzMenuClassName: [{
      type: Input
    }],
    nzPaddingLeft: [{
      type: Input
    }],
    nzTitle: [{
      type: Input
    }],
    nzIcon: [{
      type: Input
    }],
    nzTriggerSubMenuAction: [{
      type: Input
    }],
    nzOpen: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzPlacement: [{
      type: Input
    }],
    nzOpenChange: [{
      type: Output
    }],
    cdkOverlayOrigin: [{
      type: ViewChild,
      args: [CdkOverlayOrigin, {
        static: true,
        read: ElementRef
      }]
    }],
    listOfNzSubMenuComponent: [{
      type: ContentChildren,
      args: [forwardRef(() => NzSubMenuComponent), {
        descendants: true
      }]
    }],
    listOfNzMenuItemDirective: [{
      type: ContentChildren,
      args: [NzMenuItemComponent, {
        descendants: true
      }]
    }]
  });
})();
function MenuServiceFactory() {
  const serviceInsideDropdown = inject(MenuService, {
    skipSelf: true,
    optional: true
  });
  const serviceOutsideDropdown = inject(NzMenuServiceLocalToken);
  return serviceInsideDropdown ?? serviceOutsideDropdown;
}
function MenuDropdownTokenFactory() {
  const isMenuInsideDropdownToken = inject(NzIsMenuInsideDropdownToken, {
    skipSelf: true,
    optional: true
  });
  return isMenuInsideDropdownToken ?? false;
}
var NzMenuDirective = class _NzMenuDirective {
  nzMenuService = inject(MenuService);
  destroyRef = inject(DestroyRef);
  cdr = inject(ChangeDetectorRef);
  dir = inject(Directionality).valueSignal;
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  listOfNzMenuItemDirective;
  listOfNzSubMenuComponent;
  nzInlineIndent = 24;
  nzTheme = "light";
  nzMode = "vertical";
  nzInlineCollapsed = false;
  nzSelectable = !this.isMenuInsideDropdown;
  nzClick = new EventEmitter();
  actualMode = "vertical";
  inlineCollapsed$ = new BehaviorSubject(this.nzInlineCollapsed);
  mode$ = new BehaviorSubject(this.nzMode);
  listOfOpenedNzSubMenuComponent = [];
  setInlineCollapsed(inlineCollapsed) {
    this.nzInlineCollapsed = inlineCollapsed;
    this.inlineCollapsed$.next(inlineCollapsed);
  }
  updateInlineCollapse() {
    if (this.listOfNzMenuItemDirective) {
      if (this.nzInlineCollapsed) {
        this.listOfOpenedNzSubMenuComponent = this.listOfNzSubMenuComponent.filter((submenu) => submenu.nzOpen);
        this.listOfNzSubMenuComponent.forEach((submenu) => submenu.setOpenStateWithoutDebounce(false));
      } else {
        this.listOfOpenedNzSubMenuComponent.forEach((submenu) => submenu.setOpenStateWithoutDebounce(true));
        this.listOfOpenedNzSubMenuComponent = [];
      }
    }
  }
  ngOnInit() {
    combineLatest([this.inlineCollapsed$, this.mode$]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([inlineCollapsed, mode]) => {
      this.actualMode = inlineCollapsed ? "vertical" : mode;
      this.nzMenuService.setMode(this.actualMode);
      this.cdr.markForCheck();
    });
    this.nzMenuService.descendantMenuItemClick$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((menu) => {
      this.nzClick.emit(menu);
      if (this.nzSelectable && !menu.nzMatchRouter) {
        this.listOfNzMenuItemDirective.forEach((item) => item.setSelectedState(item === menu));
      }
    });
  }
  ngAfterContentInit() {
    this.inlineCollapsed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateInlineCollapse();
      this.cdr.markForCheck();
    });
  }
  ngOnChanges(changes) {
    const {
      nzInlineCollapsed,
      nzInlineIndent,
      nzTheme,
      nzMode
    } = changes;
    if (nzInlineCollapsed) {
      this.inlineCollapsed$.next(this.nzInlineCollapsed);
    }
    if (nzInlineIndent) {
      this.nzMenuService.setInlineIndent(this.nzInlineIndent);
    }
    if (nzTheme) {
      this.nzMenuService.setTheme(this.nzTheme);
    }
    if (nzMode) {
      this.mode$.next(this.nzMode);
      if (!nzMode.isFirstChange() && this.listOfNzSubMenuComponent) {
        this.listOfNzSubMenuComponent.forEach((submenu) => submenu.setOpenStateWithoutDebounce(false));
      }
    }
  }
  static ɵfac = function NzMenuDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzMenuDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzMenuDirective,
    selectors: [["", "nz-menu", ""]],
    contentQueries: function NzMenuDirective_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, NzMenuItemComponent, 5)(dirIndex, NzSubMenuComponent, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listOfNzMenuItemDirective = _t);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listOfNzSubMenuComponent = _t);
      }
    },
    hostVars: 34,
    hostBindings: function NzMenuDirective_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-dropdown-menu", ctx.isMenuInsideDropdown)("ant-dropdown-menu-root", ctx.isMenuInsideDropdown)("ant-dropdown-menu-light", ctx.isMenuInsideDropdown && ctx.nzTheme === "light")("ant-dropdown-menu-dark", ctx.isMenuInsideDropdown && ctx.nzTheme === "dark")("ant-dropdown-menu-vertical", ctx.isMenuInsideDropdown && ctx.actualMode === "vertical")("ant-dropdown-menu-horizontal", ctx.isMenuInsideDropdown && ctx.actualMode === "horizontal")("ant-dropdown-menu-inline", ctx.isMenuInsideDropdown && ctx.actualMode === "inline")("ant-dropdown-menu-inline-collapsed", ctx.isMenuInsideDropdown && ctx.nzInlineCollapsed)("ant-menu", !ctx.isMenuInsideDropdown)("ant-menu-root", !ctx.isMenuInsideDropdown)("ant-menu-light", !ctx.isMenuInsideDropdown && ctx.nzTheme === "light")("ant-menu-dark", !ctx.isMenuInsideDropdown && ctx.nzTheme === "dark")("ant-menu-vertical", !ctx.isMenuInsideDropdown && ctx.actualMode === "vertical")("ant-menu-horizontal", !ctx.isMenuInsideDropdown && ctx.actualMode === "horizontal")("ant-menu-inline", !ctx.isMenuInsideDropdown && ctx.actualMode === "inline")("ant-menu-inline-collapsed", !ctx.isMenuInsideDropdown && ctx.nzInlineCollapsed)("ant-menu-rtl", ctx.dir() === "rtl");
      }
    },
    inputs: {
      nzInlineIndent: "nzInlineIndent",
      nzTheme: "nzTheme",
      nzMode: "nzMode",
      nzInlineCollapsed: [2, "nzInlineCollapsed", "nzInlineCollapsed", booleanAttribute],
      nzSelectable: [2, "nzSelectable", "nzSelectable", booleanAttribute]
    },
    outputs: {
      nzClick: "nzClick"
    },
    exportAs: ["nzMenu"],
    features: [ɵɵProvidersFeature([
      {
        provide: NzMenuServiceLocalToken,
        useClass: MenuService
      },
      /** use the top level service **/
      {
        provide: MenuService,
        useFactory: MenuServiceFactory
      },
      /** check if menu inside dropdown-menu component **/
      {
        provide: NzIsMenuInsideDropdownToken,
        useFactory: MenuDropdownTokenFactory
      }
    ]), ɵɵNgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzMenuDirective, [{
    type: Directive,
    args: [{
      selector: "[nz-menu]",
      exportAs: "nzMenu",
      providers: [
        {
          provide: NzMenuServiceLocalToken,
          useClass: MenuService
        },
        /** use the top level service **/
        {
          provide: MenuService,
          useFactory: MenuServiceFactory
        },
        /** check if menu inside dropdown-menu component **/
        {
          provide: NzIsMenuInsideDropdownToken,
          useFactory: MenuDropdownTokenFactory
        }
      ],
      host: {
        "[class.ant-dropdown-menu]": `isMenuInsideDropdown`,
        "[class.ant-dropdown-menu-root]": `isMenuInsideDropdown`,
        "[class.ant-dropdown-menu-light]": `isMenuInsideDropdown && nzTheme === 'light'`,
        "[class.ant-dropdown-menu-dark]": `isMenuInsideDropdown && nzTheme === 'dark'`,
        "[class.ant-dropdown-menu-vertical]": `isMenuInsideDropdown && actualMode === 'vertical'`,
        "[class.ant-dropdown-menu-horizontal]": `isMenuInsideDropdown && actualMode === 'horizontal'`,
        "[class.ant-dropdown-menu-inline]": `isMenuInsideDropdown && actualMode === 'inline'`,
        "[class.ant-dropdown-menu-inline-collapsed]": `isMenuInsideDropdown && nzInlineCollapsed`,
        "[class.ant-menu]": `!isMenuInsideDropdown`,
        "[class.ant-menu-root]": `!isMenuInsideDropdown`,
        "[class.ant-menu-light]": `!isMenuInsideDropdown && nzTheme === 'light'`,
        "[class.ant-menu-dark]": `!isMenuInsideDropdown && nzTheme === 'dark'`,
        "[class.ant-menu-vertical]": `!isMenuInsideDropdown && actualMode === 'vertical'`,
        "[class.ant-menu-horizontal]": `!isMenuInsideDropdown && actualMode === 'horizontal'`,
        "[class.ant-menu-inline]": `!isMenuInsideDropdown && actualMode === 'inline'`,
        "[class.ant-menu-inline-collapsed]": `!isMenuInsideDropdown && nzInlineCollapsed`,
        "[class.ant-menu-rtl]": `dir() === 'rtl'`
      }
    }]
  }], null, {
    listOfNzMenuItemDirective: [{
      type: ContentChildren,
      args: [NzMenuItemComponent, {
        descendants: true
      }]
    }],
    listOfNzSubMenuComponent: [{
      type: ContentChildren,
      args: [NzSubMenuComponent, {
        descendants: true
      }]
    }],
    nzInlineIndent: [{
      type: Input
    }],
    nzTheme: [{
      type: Input
    }],
    nzMode: [{
      type: Input
    }],
    nzInlineCollapsed: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzSelectable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzClick: [{
      type: Output
    }]
  });
})();
function MenuGroupFactory() {
  const isMenuInsideDropdownToken = inject(NzIsMenuInsideDropdownToken, {
    optional: true,
    skipSelf: true
  });
  return isMenuInsideDropdownToken ?? false;
}
var NzMenuGroupComponent = class _NzMenuGroupComponent {
  renderer = inject(Renderer2);
  isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  nzTitle;
  titleElement;
  ngAfterViewInit() {
    const ulElement = this.titleElement.nativeElement.nextElementSibling;
    if (ulElement) {
      const className = this.isMenuInsideDropdown ? "ant-dropdown-menu-item-group-list" : "ant-menu-item-group-list";
      this.renderer.addClass(ulElement, className);
    }
  }
  static ɵfac = function NzMenuGroupComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzMenuGroupComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzMenuGroupComponent,
    selectors: [["", "nz-menu-group", ""]],
    viewQuery: function NzMenuGroupComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c8, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.titleElement = _t.first);
      }
    },
    hostVars: 4,
    hostBindings: function NzMenuGroupComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-menu-item-group", !ctx.isMenuInsideDropdown)("ant-dropdown-menu-item-group", ctx.isMenuInsideDropdown);
      }
    },
    inputs: {
      nzTitle: "nzTitle"
    },
    exportAs: ["nzMenuGroup"],
    features: [ɵɵProvidersFeature([
      /** check if menu inside dropdown-menu component **/
      {
        provide: NzIsMenuInsideDropdownToken,
        useFactory: MenuGroupFactory
      }
    ])],
    attrs: _c9,
    ngContentSelectors: _c11,
    decls: 5,
    vars: 6,
    consts: [["titleElement", ""], [4, "nzStringTemplateOutlet"]],
    template: function NzMenuGroupComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef(_c10);
        ɵɵelementStart(0, "div", null, 0);
        ɵɵtemplate(2, NzMenuGroupComponent_ng_container_2_Template, 2, 1, "ng-container", 1);
        ɵɵconditionalCreate(3, NzMenuGroupComponent_Conditional_3_Template, 1, 0);
        ɵɵelementEnd();
        ɵɵprojection(4);
      }
      if (rf & 2) {
        ɵɵclassProp("ant-menu-item-group-title", !ctx.isMenuInsideDropdown)("ant-dropdown-menu-item-group-title", ctx.isMenuInsideDropdown);
        ɵɵadvance(2);
        ɵɵproperty("nzStringTemplateOutlet", ctx.nzTitle);
        ɵɵadvance();
        ɵɵconditional(!ctx.nzTitle ? 3 : -1);
      }
    },
    dependencies: [NzOutletModule, NzStringTemplateOutletDirective],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzMenuGroupComponent, [{
    type: Component,
    args: [{
      selector: "[nz-menu-group]",
      exportAs: "nzMenuGroup",
      providers: [
        /** check if menu inside dropdown-menu component **/
        {
          provide: NzIsMenuInsideDropdownToken,
          useFactory: MenuGroupFactory
        }
      ],
      template: `
    <div
      [class.ant-menu-item-group-title]="!isMenuInsideDropdown"
      [class.ant-dropdown-menu-item-group-title]="isMenuInsideDropdown"
      #titleElement
    >
      <ng-container *nzStringTemplateOutlet="nzTitle">{{ nzTitle }}</ng-container>
      @if (!nzTitle) {
        <ng-content select="[title]" />
      }
    </div>
    <ng-content />
  `,
      imports: [NzOutletModule],
      host: {
        "[class.ant-menu-item-group]": "!isMenuInsideDropdown",
        "[class.ant-dropdown-menu-item-group]": "isMenuInsideDropdown"
      },
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None
    }]
  }], null, {
    nzTitle: [{
      type: Input
    }],
    titleElement: [{
      type: ViewChild,
      args: ["titleElement"]
    }]
  });
})();
var NzMenuDividerDirective = class _NzMenuDividerDirective {
  static ɵfac = function NzMenuDividerDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzMenuDividerDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzMenuDividerDirective,
    selectors: [["", "nz-menu-divider", ""]],
    hostAttrs: [1, "ant-dropdown-menu-item-divider"],
    exportAs: ["nzMenuDivider"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzMenuDividerDirective, [{
    type: Directive,
    args: [{
      selector: "[nz-menu-divider]",
      exportAs: "nzMenuDivider",
      host: {
        class: "ant-dropdown-menu-item-divider"
      }
    }]
  }], null, null);
})();
var NzMenuModule = class _NzMenuModule {
  static ɵfac = function NzMenuModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzMenuModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NzMenuModule,
    imports: [NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent, NzMenuDividerDirective, NzMenuGroupComponent, NzSubMenuTitleComponent, NzSubmenuInlineChildComponent, NzSubmenuNoneInlineChildComponent],
    exports: [NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent, NzMenuDividerDirective, NzMenuGroupComponent]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [NzSubMenuComponent, NzMenuGroupComponent, NzSubMenuTitleComponent]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzMenuModule, [{
    type: NgModule,
    args: [{
      imports: [NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent, NzMenuDividerDirective, NzMenuGroupComponent, NzSubMenuTitleComponent, NzSubmenuInlineChildComponent, NzSubmenuNoneInlineChildComponent],
      exports: [NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent, NzMenuDividerDirective, NzMenuGroupComponent]
    }]
  }], null, null);
})();

export {
  MenuService,
  NzIsMenuInsideDropdownToken,
  NzMenuServiceLocalToken,
  NzSubmenuService,
  NzMenuItemComponent,
  NzSubmenuInlineChildComponent,
  NzSubmenuNoneInlineChildComponent,
  NzSubMenuTitleComponent,
  NzSubMenuComponent,
  NzMenuDirective,
  NzMenuGroupComponent,
  NzMenuDividerDirective,
  NzMenuModule
};
//# sourceMappingURL=chunk-AZICHA7L.js.map
