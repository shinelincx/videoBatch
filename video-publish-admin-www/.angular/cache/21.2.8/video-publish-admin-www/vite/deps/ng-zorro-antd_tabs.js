import {
  NzDropdownDirective,
  NzDropdownMenuComponent,
  NzDropdownModule
} from "./chunk-BLGSPPJJ.js";
import {
  NzMenuDirective,
  NzMenuItemComponent,
  NzMenuModule
} from "./chunk-AZICHA7L.js";
import {
  NzResizeObserver
} from "./chunk-U3YFQFEB.js";
import {
  isAnimationEnabled
} from "./chunk-5TMQGPK6.js";
import "./chunk-D3DECQHP.js";
import {
  ViewportRuler
} from "./chunk-UXZ7ZQP6.js";
import {
  requestAnimationFrame
} from "./chunk-QYDDKLT3.js";
import {
  NzOutletModule,
  NzStringTemplateOutletDirective
} from "./chunk-QP2ATT6X.js";
import {
  A11yModule,
  CdkMonitorFocus,
  FocusKeyManager
} from "./chunk-4OBKC2YF.js";
import "./chunk-LC5RUENM.js";
import {
  DOWN_ARROW,
  ENTER,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
  hasModifierKey
} from "./chunk-CMKKWBGK.js";
import {
  NzIconDirective,
  NzIconModule
} from "./chunk-2YSKEAYZ.js";
import "./chunk-72DKPDI6.js";
import "./chunk-SJ3NPWEQ.js";
import "./chunk-MR7TIX67.js";
import "./chunk-WUUVWCMF.js";
import {
  NzConfigService,
  WithConfig
} from "./chunk-FQDUROHQ.js";
import {
  takeUntilDestroyed
} from "./chunk-LSZOUFU2.js";
import {
  PREFIX,
  coerceCssPixelValue,
  coerceNumberProperty,
  fromEventOutsideAngular,
  generateClassName,
  isNil,
  wrapIntoObservable
} from "./chunk-OPN2JU7N.js";
import {
  Directionality
} from "./chunk-4L5DI3TQ.js";
import {
  NavigationEnd,
  Router,
  RouterLink
} from "./chunk-DIWUYGV5.js";
import "./chunk-HU2MKBDQ.js";
import "./chunk-UXZ5GYDD.js";
import "./chunk-JZ5DZOX3.js";
import {
  NgTemplateOutlet
} from "./chunk-SSARYQTY.js";
import "./chunk-FFJGBTQB.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  InjectionToken,
  Input,
  NgModule,
  NgZone,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  setClassMetadata,
  signal,
  untracked,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵcontentQuery,
  ɵɵcontentQuerySignal,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomTemplate,
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
  ɵɵpureFunction0,
  ɵɵqueryAdvance,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-VS5U7YU4.js";
import "./chunk-SR2LXFJL.js";
import {
  animationFrameScheduler,
  asapScheduler,
  merge
} from "./chunk-V37RSN4D.js";
import {
  Subject,
  Subscription,
  __esDecorate,
  __runInitializers,
  auditTime,
  delay,
  filter,
  first,
  of,
  startWith
} from "./chunk-VUVMRRXW.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-EIB7IA3J.js";

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-tabs.mjs
function NzTabAddButtonComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelement(1, "nz-icon", 1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const icon_r1 = ctx.$implicit;
    ɵɵadvance();
    ɵɵproperty("nzType", icon_r1);
  }
}
var _c0 = ["nz-tab-body", ""];
function NzTabBodyComponent_ng_template_0_Template(rf, ctx) {
}
function NzTabCloseButtonComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelement(1, "nz-icon", 1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const icon_r1 = ctx.$implicit;
    ɵɵadvance();
    ɵɵproperty("nzType", icon_r1);
  }
}
var _c1 = () => ({
  minWidth: "46px"
});
var _c2 = () => ({
  visible: false
});
function NzTabNavOperationComponent_Conditional_5_For_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const item_r2 = ɵɵnextContext().$implicit;
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", item_r2.tab.label, " ");
  }
}
function NzTabNavOperationComponent_Conditional_5_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "li", 7);
    ɵɵlistener("click", function NzTabNavOperationComponent_Conditional_5_For_2_Template_li_click_0_listener() {
      const item_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onSelect(item_r2));
    })("contextmenu", function NzTabNavOperationComponent_Conditional_5_For_2_Template_li_contextmenu_0_listener($event) {
      const item_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onContextmenu(item_r2, $event));
    });
    ɵɵtemplate(1, NzTabNavOperationComponent_Conditional_5_For_2_ng_container_1_Template, 2, 1, "ng-container", 8);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    ɵɵclassProp("ant-tabs-dropdown-menu-item-disabled", item_r2.disabled);
    ɵɵproperty("nzSelected", item_r2.active)("nzDisabled", item_r2.disabled);
    ɵɵadvance();
    ɵɵproperty("nzStringTemplateOutlet", item_r2.tab.label)("nzStringTemplateOutletContext", ɵɵpureFunction0(6, _c2));
  }
}
function NzTabNavOperationComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "ul", 4);
    ɵɵrepeaterCreate(1, NzTabNavOperationComponent_Conditional_5_For_2_Template, 2, 7, "li", 6, ɵɵrepeaterTrackByIdentity);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵrepeater(ctx_r2.items);
  }
}
function NzTabNavOperationComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 9);
    ɵɵlistener("click", function NzTabNavOperationComponent_Conditional_6_Template_button_click_0_listener() {
      ɵɵrestoreView(_r4);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.addClicked.emit());
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("addIcon", ctx_r2.addIcon);
  }
}
var _c3 = ["navWrap"];
var _c4 = ["navList"];
var _c5 = ["*"];
function NzTabNavBarComponent_Conditional_0_ng_template_1_Template(rf, ctx) {
}
function NzTabNavBarComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 2);
    ɵɵtemplate(1, NzTabNavBarComponent_Conditional_0_ng_template_1_Template, 0, 0, "ng-template", 8);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.startExtraContent().templateRef);
  }
}
function NzTabNavBarComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 9);
    ɵɵlistener("click", function NzTabNavBarComponent_Conditional_6_Template_button_click_0_listener() {
      ɵɵrestoreView(_r2);
      const ctx_r0 = ɵɵnextContext();
      return ɵɵresetView(ctx_r0.addClicked.emit());
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵproperty("addIcon", ctx_r0.addIcon);
    ɵɵattribute("tabindex", -1);
  }
}
function NzTabNavBarComponent_Conditional_9_ng_template_1_Template(rf, ctx) {
}
function NzTabNavBarComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 2);
    ɵɵtemplate(1, NzTabNavBarComponent_Conditional_9_ng_template_1_Template, 0, 0, "ng-template", 8);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.endExtraContent().templateRef);
  }
}
function NzTabNavBarComponent_Conditional_10_ng_template_1_Template(rf, ctx) {
}
function NzTabNavBarComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 2);
    ɵɵtemplate(1, NzTabNavBarComponent_Conditional_10_ng_template_1_Template, 0, 0, "ng-template", 8);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.extraTemplate);
  }
}
var _c6 = ["contentTemplate"];
var _c7 = [[["", "nz-tab-link", ""]], "*"];
var _c8 = ["[nz-tab-link]", "*"];
function NzTabComponent_ng_template_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0);
  }
}
function NzTabComponent_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 1);
  }
}
var _c9 = () => ({
  visible: true
});
function NzTabsComponent_Conditional_0_For_2_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext().$implicit;
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", tab_r5.label, " ");
  }
}
function NzTabsComponent_Conditional_0_For_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 10);
    ɵɵlistener("click", function NzTabsComponent_Conditional_0_For_2_Conditional_3_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r7);
      const $index_r6 = ɵɵnextContext().$index;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onClose($index_r6, $event));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext().$implicit;
    ɵɵproperty("closeIcon", tab_r5.nzCloseIcon);
  }
}
function NzTabsComponent_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 6);
    ɵɵlistener("click", function NzTabsComponent_Conditional_0_For_2_Template_div_click_0_listener($event) {
      const ctx_r3 = ɵɵrestoreView(_r3);
      const tab_r5 = ctx_r3.$implicit;
      const $index_r6 = ctx_r3.$index;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.clickNavItem(tab_r5, $index_r6, $event));
    })("contextmenu", function NzTabsComponent_Conditional_0_For_2_Template_div_contextmenu_0_listener($event) {
      const tab_r5 = ɵɵrestoreView(_r3).$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.contextmenuNavItem(tab_r5, $event));
    });
    ɵɵelementStart(1, "button", 7);
    ɵɵtemplate(2, NzTabsComponent_Conditional_0_For_2_ng_container_2_Template, 2, 1, "ng-container", 8);
    ɵɵconditionalCreate(3, NzTabsComponent_Conditional_0_For_2_Conditional_3_Template, 1, 1, "button", 9);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const tab_r5 = ctx.$implicit;
    const $index_r6 = ctx.$index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵstyleProp("margin-right", ctx_r1.position === "horizontal" ? ctx_r1.nzTabBarGutter : null, "px")("margin-bottom", ctx_r1.position === "vertical" ? ctx_r1.nzTabBarGutter : null, "px");
    ɵɵclassProp("ant-tabs-tab-active", ctx_r1.nzSelectedIndex === $index_r6)("ant-tabs-tab-disabled", tab_r5.nzDisabled);
    ɵɵadvance();
    ɵɵproperty("id", ctx_r1.getTabContentId($index_r6))("disabled", tab_r5.nzDisabled)("tab", tab_r5)("active", ctx_r1.nzSelectedIndex === $index_r6);
    ɵɵattribute("tabIndex", ctx_r1.getTabIndex(tab_r5, $index_r6))("aria-disabled", tab_r5.nzDisabled)("aria-selected", ctx_r1.nzSelectedIndex === $index_r6 && !ctx_r1.nzHideAll)("aria-controls", ctx_r1.getTabContentId($index_r6));
    ɵɵadvance();
    ɵɵproperty("nzStringTemplateOutlet", tab_r5.label)("nzStringTemplateOutletContext", ɵɵpureFunction0(19, _c9));
    ɵɵadvance();
    ɵɵconditional(tab_r5.nzClosable && ctx_r1.closable && !tab_r5.nzDisabled ? 3 : -1);
  }
}
function NzTabsComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "nz-tabs-nav", 4);
    ɵɵlistener("tabScroll", function NzTabsComponent_Conditional_0_Template_nz_tabs_nav_tabScroll_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.nzTabListScroll.emit($event));
    })("selectFocusedIndex", function NzTabsComponent_Conditional_0_Template_nz_tabs_nav_selectFocusedIndex_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.setSelectedIndex($event));
    })("addClicked", function NzTabsComponent_Conditional_0_Template_nz_tabs_nav_addClicked_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onAdd());
    });
    ɵɵrepeaterCreate(1, NzTabsComponent_Conditional_0_For_2_Template, 4, 20, "div", 5, ɵɵrepeaterTrackByIdentity);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵstyleMap(ctx_r1.nzTabBarStyle);
    ɵɵproperty("selectedIndex", ctx_r1.nzSelectedIndex || 0)("inkBarAnimated", ctx_r1.inkBarAnimated)("addable", ctx_r1.addable)("addIcon", ctx_r1.nzAddIcon)("hideBar", ctx_r1.nzHideAll)("position", ctx_r1.position)("extraTemplate", ctx_r1.nzTabBarExtraContent)("extraContents", ctx_r1.extraContents())("indicator", ctx_r1.nzIndicator());
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.tabs);
  }
}
function NzTabsComponent_Conditional_3_For_1_Conditional_0_ng_template_0_Template(rf, ctx) {
}
function NzTabsComponent_Conditional_3_For_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzTabsComponent_Conditional_3_For_1_Conditional_0_ng_template_0_Template, 0, 0, "ng-template", 11);
  }
  if (rf & 2) {
    ɵɵnextContext();
    const tabpaneTmpl_r8 = ɵɵreference(4);
    ɵɵproperty("ngTemplateOutlet", tabpaneTmpl_r8);
  }
}
function NzTabsComponent_Conditional_3_For_1_Conditional_1_Conditional_0_ng_template_0_Template(rf, ctx) {
}
function NzTabsComponent_Conditional_3_For_1_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzTabsComponent_Conditional_3_For_1_Conditional_1_Conditional_0_ng_template_0_Template, 0, 0, "ng-template", 11);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const tabpaneTmpl_r8 = ɵɵreference(4);
    ɵɵproperty("ngTemplateOutlet", tabpaneTmpl_r8);
  }
}
function NzTabsComponent_Conditional_3_For_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzTabsComponent_Conditional_3_For_1_Conditional_1_Conditional_0_Template, 1, 1, null, 11);
  }
  if (rf & 2) {
    const $index_r9 = ɵɵnextContext().$index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵconditional(ctx_r1.nzSelectedIndex === $index_r9 ? 0 : -1);
  }
}
function NzTabsComponent_Conditional_3_For_1_Conditional_2_Conditional_0_ng_template_0_Template(rf, ctx) {
}
function NzTabsComponent_Conditional_3_For_1_Conditional_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzTabsComponent_Conditional_3_For_1_Conditional_2_Conditional_0_ng_template_0_Template, 0, 0, "ng-template", 11);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const tabpaneTmpl_r8 = ɵɵreference(4);
    ɵɵproperty("ngTemplateOutlet", tabpaneTmpl_r8);
  }
}
function NzTabsComponent_Conditional_3_For_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzTabsComponent_Conditional_3_For_1_Conditional_2_Conditional_0_Template, 1, 1, null, 11);
  }
  if (rf & 2) {
    const ctx_r9 = ɵɵnextContext();
    const tab_r11 = ctx_r9.$implicit;
    const $index_r9 = ctx_r9.$index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵconditional(ctx_r1.nzSelectedIndex === $index_r9 || tab_r11.hasBeenActive ? 0 : -1);
  }
}
function NzTabsComponent_Conditional_3_For_1_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "div", 12);
  }
  if (rf & 2) {
    const ctx_r9 = ɵɵnextContext();
    const tab_r11 = ctx_r9.$implicit;
    const $index_r9 = ctx_r9.$index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("id", ctx_r1.getTabContentId($index_r9))("active", ctx_r1.nzSelectedIndex === $index_r9)("content", tab_r11.content)("animated", ctx_r1.tabPaneAnimated);
    ɵɵattribute("aria-labelledby", ctx_r1.getTabContentId($index_r9));
  }
}
function NzTabsComponent_Conditional_3_For_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzTabsComponent_Conditional_3_For_1_Conditional_0_Template, 1, 1, null, 11)(1, NzTabsComponent_Conditional_3_For_1_Conditional_1_Template, 1, 1)(2, NzTabsComponent_Conditional_3_For_1_Conditional_2_Template, 1, 1);
    ɵɵtemplate(3, NzTabsComponent_Conditional_3_For_1_ng_template_3_Template, 1, 5, "ng-template", null, 0, ɵɵtemplateRefExtractor);
  }
  if (rf & 2) {
    const tab_r11 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵconditional(tab_r11.nzForceRender ? 0 : ctx_r1.nzDestroyInactiveTabPane ? 1 : 2);
  }
}
function NzTabsComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵrepeaterCreate(0, NzTabsComponent_Conditional_3_For_1_Template, 5, 1, null, null, ɵɵrepeaterTrackByIdentity);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵrepeater(ctx_r1.tabs);
  }
}
var NzTabChangeEvent = class {
  index;
  tab;
};
var NzTabAddButtonComponent = class _NzTabAddButtonComponent {
  addIcon = "plus";
  element = inject(ElementRef).nativeElement;
  getElementWidth() {
    return this.element?.offsetWidth || 0;
  }
  getElementHeight() {
    return this.element?.offsetHeight || 0;
  }
  static ɵfac = function NzTabAddButtonComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabAddButtonComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTabAddButtonComponent,
    selectors: [["nz-tab-add-button"], ["button", "nz-tab-add-button", ""]],
    hostAttrs: ["aria-label", "Add tab", "type", "button", 1, "ant-tabs-nav-add"],
    inputs: {
      addIcon: "addIcon"
    },
    decls: 1,
    vars: 1,
    consts: [[4, "nzStringTemplateOutlet"], ["nzTheme", "outline", 3, "nzType"]],
    template: function NzTabAddButtonComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, NzTabAddButtonComponent_ng_container_0_Template, 2, 1, "ng-container", 0);
      }
      if (rf & 2) {
        ɵɵproperty("nzStringTemplateOutlet", ctx.addIcon);
      }
    },
    dependencies: [NzOutletModule, NzStringTemplateOutletDirective, NzIconModule, NzIconDirective],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabAddButtonComponent, [{
    type: Component,
    args: [{
      selector: "nz-tab-add-button, button[nz-tab-add-button]",
      template: `
    <ng-container *nzStringTemplateOutlet="addIcon; let icon">
      <nz-icon [nzType]="icon" nzTheme="outline" />
    </ng-container>
  `,
      host: {
        class: "ant-tabs-nav-add",
        "aria-label": "Add tab",
        type: "button"
      },
      imports: [NzOutletModule, NzIconModule]
    }]
  }], null, {
    addIcon: [{
      type: Input
    }]
  });
})();
var NzTabBarExtraContentDirective = class _NzTabBarExtraContentDirective {
  position = input("end", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "position"
  } : {}), {
    alias: "nzTabBarExtraContent"
  }));
  templateRef = inject(TemplateRef);
  static ɵfac = function NzTabBarExtraContentDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabBarExtraContentDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabBarExtraContentDirective,
    selectors: [["", "nzTabBarExtraContent", "", 5, "nz-tabs"]],
    inputs: {
      position: [1, "nzTabBarExtraContent", "position"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabBarExtraContentDirective, [{
    type: Directive,
    args: [{
      selector: "[nzTabBarExtraContent]:not(nz-tabs)"
    }]
  }], null, {
    position: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzTabBarExtraContent",
        required: false
      }]
    }]
  });
})();
var CLASS_NAME = "ant-tabs-tabpane";
var ANIMATION_PREFIX = "ant-tabs-switch";
var ANIMATION_CLASS_MAP = {
  "enter-start": [generateClassName(ANIMATION_PREFIX, "enter"), generateClassName(ANIMATION_PREFIX, "enter-start")],
  "enter-active": [generateClassName(ANIMATION_PREFIX, "enter"), generateClassName(ANIMATION_PREFIX, "enter-active")],
  "leave-start": [generateClassName(ANIMATION_PREFIX, "leave"), generateClassName(ANIMATION_PREFIX, "leave-start")],
  "leave-active": [generateClassName(ANIMATION_PREFIX, "leave"), generateClassName(ANIMATION_PREFIX, "leave-active")],
  // If animation is enabled, we should hide the tabpane after the leave animation is done
  hidden: [generateClassName(CLASS_NAME, "hidden")],
  void: []
};
var NzTabBodyComponent = class _NzTabBodyComponent {
  elementRef = inject(ElementRef);
  content = input(null, ...ngDevMode ? [{
    debugName: "content"
  }] : []);
  active = input(false, ...ngDevMode ? [{
    debugName: "active"
  }] : []);
  animated = input(true, ...ngDevMode ? [{
    debugName: "animated"
  }] : []);
  _animationState = signal("void", ...ngDevMode ? [{
    debugName: "_animationState"
  }] : []);
  _animationEnabled = isAnimationEnabled(() => this.animated());
  class = computed(() => {
    const cls = [CLASS_NAME];
    if (this._animationEnabled()) {
      cls.push(...ANIMATION_CLASS_MAP[this._animationState()]);
    } else if (!this.active()) {
      cls.push(generateClassName(CLASS_NAME, "hidden"));
    }
    return cls;
  }, ...ngDevMode ? [{
    debugName: "class"
  }] : []);
  constructor() {
    effect(() => {
      if (!this._animationEnabled()) {
        return;
      }
      if (!this.active()) {
        untracked(() => this._animationState.set("leave-start"));
        requestAnimationFrame(() => {
          this._animationState.set("leave-active");
        });
      } else {
        untracked(() => this._animationState.set("enter-start"));
        requestAnimationFrame(() => {
          this._animationState.set("enter-active");
        });
      }
    });
  }
  _onTransitionEnd(event) {
    if (event.target !== this.elementRef.nativeElement) {
      return;
    }
    const currentState = this._animationState();
    if (currentState === "enter-active") {
      this._animationState.set("void");
    } else if (currentState === "leave-active") {
      this._animationState.set("hidden");
    }
  }
  static ɵfac = function NzTabBodyComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabBodyComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTabBodyComponent,
    selectors: [["", "nz-tab-body", ""]],
    hostVars: 6,
    hostBindings: function NzTabBodyComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("transitionend", function NzTabBodyComponent_transitionend_HostBindingHandler($event) {
          return ctx._onTransitionEnd($event);
        });
      }
      if (rf & 2) {
        ɵɵattribute("tabindex", ctx.active() ? 0 : -1)("aria-hidden", !ctx.active());
        ɵɵclassMap(ctx.class());
        ɵɵclassProp("ant-tabs-tabpane-active", ctx.active());
      }
    },
    inputs: {
      content: [1, "content"],
      active: [1, "active"],
      animated: [1, "animated"]
    },
    exportAs: ["nzTabBody"],
    attrs: _c0,
    decls: 1,
    vars: 1,
    consts: [[3, "ngTemplateOutlet"]],
    template: function NzTabBodyComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, NzTabBodyComponent_ng_template_0_Template, 0, 0, "ng-template", 0);
      }
      if (rf & 2) {
        ɵɵproperty("ngTemplateOutlet", ctx.content());
      }
    },
    dependencies: [NgTemplateOutlet],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabBodyComponent, [{
    type: Component,
    args: [{
      selector: "[nz-tab-body]",
      exportAs: "nzTabBody",
      imports: [NgTemplateOutlet],
      template: `<ng-template [ngTemplateOutlet]="content()" />`,
      host: {
        "[class]": "class()",
        "[class.ant-tabs-tabpane-active]": "active()",
        "[attr.tabindex]": "active() ? 0 : -1",
        "[attr.aria-hidden]": "!active()",
        "(transitionend)": "_onTransitionEnd($event)"
      },
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }], () => [], {
    content: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "content",
        required: false
      }]
    }],
    active: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "active",
        required: false
      }]
    }],
    animated: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "animated",
        required: false
      }]
    }]
  });
})();
var NzTabCloseButtonComponent = class _NzTabCloseButtonComponent {
  closeIcon = "close";
  static ɵfac = function NzTabCloseButtonComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabCloseButtonComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTabCloseButtonComponent,
    selectors: [["nz-tab-close-button"], ["button", "nz-tab-close-button", ""]],
    hostAttrs: ["aria-label", "Close tab", "type", "button", 1, "ant-tabs-tab-remove"],
    inputs: {
      closeIcon: "closeIcon"
    },
    decls: 1,
    vars: 1,
    consts: [[4, "nzStringTemplateOutlet"], ["nzTheme", "outline", 3, "nzType"]],
    template: function NzTabCloseButtonComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, NzTabCloseButtonComponent_ng_container_0_Template, 2, 1, "ng-container", 0);
      }
      if (rf & 2) {
        ɵɵproperty("nzStringTemplateOutlet", ctx.closeIcon);
      }
    },
    dependencies: [NzOutletModule, NzStringTemplateOutletDirective, NzIconModule, NzIconDirective],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabCloseButtonComponent, [{
    type: Component,
    args: [{
      selector: "nz-tab-close-button, button[nz-tab-close-button]",
      template: `
    <ng-container *nzStringTemplateOutlet="closeIcon; let icon">
      <nz-icon [nzType]="icon" nzTheme="outline" />
    </ng-container>
  `,
      host: {
        class: "ant-tabs-tab-remove",
        "aria-label": "Close tab",
        type: "button"
      },
      imports: [NzOutletModule, NzIconModule]
    }]
  }], null, {
    closeIcon: [{
      type: Input
    }]
  });
})();
var NzTabLinkTemplateDirective = class _NzTabLinkTemplateDirective {
  templateRef = inject(TemplateRef, {
    host: true
  });
  static ɵfac = function NzTabLinkTemplateDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabLinkTemplateDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabLinkTemplateDirective,
    selectors: [["ng-template", "nzTabLink", ""]],
    exportAs: ["nzTabLinkTemplate"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabLinkTemplateDirective, [{
    type: Directive,
    args: [{
      selector: "ng-template[nzTabLink]",
      exportAs: "nzTabLinkTemplate"
    }]
  }], null, null);
})();
var NzTabLinkDirective = class _NzTabLinkDirective {
  elementRef = inject(ElementRef);
  routerLink = inject(RouterLink, {
    self: true,
    optional: true
  });
  static ɵfac = function NzTabLinkDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabLinkDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabLinkDirective,
    selectors: [["a", "nz-tab-link", ""]],
    exportAs: ["nzTabLink"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabLinkDirective, [{
    type: Directive,
    args: [{
      selector: "a[nz-tab-link]",
      exportAs: "nzTabLink"
    }]
  }], null, null);
})();
var NzTabNavItemDirective = class _NzTabNavItemDirective {
  disabled = false;
  tab;
  active = false;
  elementRef = inject(ElementRef);
  el = this.elementRef.nativeElement;
  parentElement = this.el.parentElement;
  focus() {
    this.el.focus({
      preventScroll: true
    });
  }
  get width() {
    return this.parentElement.offsetWidth;
  }
  get height() {
    return this.parentElement.offsetHeight;
  }
  get left() {
    return this.parentElement.offsetLeft;
  }
  get top() {
    return this.parentElement.offsetTop;
  }
  static ɵfac = function NzTabNavItemDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabNavItemDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabNavItemDirective,
    selectors: [["", "nzTabNavItem", ""]],
    inputs: {
      disabled: [2, "disabled", "disabled", booleanAttribute],
      tab: "tab",
      active: [2, "active", "active", booleanAttribute]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabNavItemDirective, [{
    type: Directive,
    args: [{
      selector: "[nzTabNavItem]"
    }]
  }], null, {
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    tab: [{
      type: Input
    }],
    active: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }]
  });
})();
var NzTabNavOperationComponent = class _NzTabNavOperationComponent {
  items = [];
  addable = false;
  addIcon = "plus";
  addClicked = new EventEmitter();
  selected = new EventEmitter();
  closeAnimationWaitTimeoutId;
  menuOpened = false;
  cdr = inject(ChangeDetectorRef);
  element = inject(ElementRef).nativeElement;
  onSelect(item) {
    if (!item.disabled) {
      item.tab.nzClick.emit();
      this.selected.emit(item);
    }
  }
  onContextmenu(item, e) {
    if (!item.disabled) {
      item.tab.nzContextmenu.emit(e);
    }
  }
  showItems() {
    clearTimeout(this.closeAnimationWaitTimeoutId);
    this.menuOpened = true;
    this.cdr.markForCheck();
  }
  menuVisChange(visible) {
    if (!visible) {
      this.closeAnimationWaitTimeoutId = setTimeout(() => {
        this.menuOpened = false;
        this.cdr.markForCheck();
      }, 150);
    }
  }
  getElementWidth() {
    return this.element?.offsetWidth || 0;
  }
  getElementHeight() {
    return this.element?.offsetHeight || 0;
  }
  ngOnDestroy() {
    clearTimeout(this.closeAnimationWaitTimeoutId);
  }
  static ɵfac = function NzTabNavOperationComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabNavOperationComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTabNavOperationComponent,
    selectors: [["nz-tab-nav-operation"]],
    hostAttrs: [1, "ant-tabs-nav-operations"],
    hostVars: 2,
    hostBindings: function NzTabNavOperationComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-tabs-nav-operations-hidden", ctx.items.length === 0);
      }
    },
    inputs: {
      items: "items",
      addable: [2, "addable", "addable", booleanAttribute],
      addIcon: "addIcon"
    },
    outputs: {
      addClicked: "addClicked",
      selected: "selected"
    },
    exportAs: ["nzTabNavOperation"],
    decls: 7,
    vars: 6,
    consts: [["dropdownTrigger", "nzDropdown"], ["menu", "nzDropdownMenu"], ["nz-dropdown", "", "type", "button", "tabindex", "-1", "aria-hidden", "true", "nzOverlayClassName", "nz-tabs-dropdown", 1, "ant-tabs-nav-more", 3, "nzVisibleChange", "mouseenter", "nzDropdownMenu", "nzOverlayStyle", "nzMatchWidthElement"], ["nzType", "ellipsis"], ["nz-menu", ""], ["nz-tab-add-button", "", 3, "addIcon"], ["nz-menu-item", "", 1, "ant-tabs-dropdown-menu-item", 3, "ant-tabs-dropdown-menu-item-disabled", "nzSelected", "nzDisabled"], ["nz-menu-item", "", 1, "ant-tabs-dropdown-menu-item", 3, "click", "contextmenu", "nzSelected", "nzDisabled"], [4, "nzStringTemplateOutlet", "nzStringTemplateOutletContext"], ["nz-tab-add-button", "", 3, "click", "addIcon"]],
    template: function NzTabNavOperationComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "button", 2, 0);
        ɵɵlistener("nzVisibleChange", function NzTabNavOperationComponent_Template_button_nzVisibleChange_0_listener($event) {
          return ctx.menuVisChange($event);
        })("mouseenter", function NzTabNavOperationComponent_Template_button_mouseenter_0_listener() {
          return ctx.showItems();
        });
        ɵɵelement(2, "nz-icon", 3);
        ɵɵelementEnd();
        ɵɵelementStart(3, "nz-dropdown-menu", null, 1);
        ɵɵconditionalCreate(5, NzTabNavOperationComponent_Conditional_5_Template, 3, 0, "ul", 4);
        ɵɵelementEnd();
        ɵɵconditionalCreate(6, NzTabNavOperationComponent_Conditional_6_Template, 1, 1, "button", 5);
      }
      if (rf & 2) {
        const menu_r5 = ɵɵreference(4);
        ɵɵproperty("nzDropdownMenu", menu_r5)("nzOverlayStyle", ɵɵpureFunction0(5, _c1))("nzMatchWidthElement", null);
        ɵɵadvance(5);
        ɵɵconditional(ctx.menuOpened ? 5 : -1);
        ɵɵadvance();
        ɵɵconditional(ctx.addable ? 6 : -1);
      }
    },
    dependencies: [NzDropdownModule, NzMenuDirective, NzMenuItemComponent, NzDropdownDirective, NzDropdownMenuComponent, NzIconModule, NzIconDirective, NzOutletModule, NzStringTemplateOutletDirective, NzTabAddButtonComponent, NzMenuModule],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabNavOperationComponent, [{
    type: Component,
    args: [{
      selector: "nz-tab-nav-operation",
      exportAs: "nzTabNavOperation",
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      template: `
    <button
      nz-dropdown
      class="ant-tabs-nav-more"
      type="button"
      tabindex="-1"
      aria-hidden="true"
      nzOverlayClassName="nz-tabs-dropdown"
      #dropdownTrigger="nzDropdown"
      [nzDropdownMenu]="menu"
      [nzOverlayStyle]="{ minWidth: '46px' }"
      [nzMatchWidthElement]="null"
      (nzVisibleChange)="menuVisChange($event)"
      (mouseenter)="showItems()"
    >
      <nz-icon nzType="ellipsis" />
    </button>
    <nz-dropdown-menu #menu="nzDropdownMenu">
      @if (menuOpened) {
        <ul nz-menu>
          @for (item of items; track item) {
            <li
              nz-menu-item
              class="ant-tabs-dropdown-menu-item"
              [class.ant-tabs-dropdown-menu-item-disabled]="item.disabled"
              [nzSelected]="item.active"
              [nzDisabled]="item.disabled"
              (click)="onSelect(item)"
              (contextmenu)="onContextmenu(item, $event)"
            >
              <ng-container *nzStringTemplateOutlet="item.tab.label; context: { visible: false }">
                {{ item.tab.label }}
              </ng-container>
            </li>
          }
        </ul>
      }
    </nz-dropdown-menu>
    @if (addable) {
      <button nz-tab-add-button [addIcon]="addIcon" (click)="addClicked.emit()"></button>
    }
  `,
      host: {
        class: "ant-tabs-nav-operations",
        "[class.ant-tabs-nav-operations-hidden]": "items.length === 0"
      },
      imports: [NzDropdownModule, NzIconModule, NzOutletModule, NzTabAddButtonComponent, NzMenuModule]
    }]
  }], null, {
    items: [{
      type: Input
    }],
    addable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    addIcon: [{
      type: Input
    }],
    addClicked: [{
      type: Output
    }],
    selected: [{
      type: Output
    }]
  });
})();
var MIN_SWIPE_DISTANCE = 0.1;
var STOP_SWIPE_DISTANCE = 0.01;
var REFRESH_INTERVAL = 20;
var SPEED_OFF_MULTIPLE = 0.995 ** REFRESH_INTERVAL;
var NzTabScrollListDirective = class _NzTabScrollListDirective {
  ngZone = inject(NgZone);
  destroyRef = inject(DestroyRef);
  el = inject(ElementRef).nativeElement;
  lastWheelDirection = null;
  lastWheelTimestamp = 0;
  lastTimestamp = 0;
  lastTimeDiff = 0;
  lastMixedWheel = 0;
  lastWheelPrevent = false;
  touchPosition = null;
  lastOffset = null;
  motion = -1;
  offsetChange = new EventEmitter();
  tabScroll = new EventEmitter();
  ngOnInit() {
    const wheel$ = fromEventOutsideAngular(this.el, "wheel");
    const touchstart$ = fromEventOutsideAngular(this.el, "touchstart");
    const touchmove$ = fromEventOutsideAngular(this.el, "touchmove");
    const touchend$ = fromEventOutsideAngular(this.el, "touchend");
    this.subscribeWrap("wheel", wheel$, this.onWheel);
    this.subscribeWrap("touchstart", touchstart$, this.onTouchStart);
    this.subscribeWrap("touchmove", touchmove$, this.onTouchMove);
    this.subscribeWrap("touchend", touchend$, this.onTouchEnd);
  }
  subscribeWrap(type, observable, handler) {
    return observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.tabScroll.emit({
        type,
        event
      });
      if (!event.defaultPrevented) {
        handler(event);
      }
    });
  }
  onTouchEnd = (e) => {
    if (!this.touchPosition) {
      return;
    }
    const lastOffset = this.lastOffset;
    const lastTimeDiff = this.lastTimeDiff;
    this.lastOffset = this.touchPosition = null;
    if (lastOffset) {
      const distanceX = lastOffset.x / lastTimeDiff;
      const distanceY = lastOffset.y / lastTimeDiff;
      const absX = Math.abs(distanceX);
      const absY = Math.abs(distanceY);
      if (Math.max(absX, absY) < MIN_SWIPE_DISTANCE) {
        return;
      }
      let currentX = distanceX;
      let currentY = distanceY;
      this.motion = window.setInterval(() => {
        if (Math.abs(currentX) < STOP_SWIPE_DISTANCE && Math.abs(currentY) < STOP_SWIPE_DISTANCE) {
          window.clearInterval(this.motion);
          return;
        }
        currentX *= SPEED_OFF_MULTIPLE;
        currentY *= SPEED_OFF_MULTIPLE;
        this.onOffset(currentX * REFRESH_INTERVAL, currentY * REFRESH_INTERVAL, e);
      }, REFRESH_INTERVAL);
    }
  };
  onTouchMove = (e) => {
    if (!this.touchPosition) {
      return;
    }
    e.preventDefault();
    const {
      screenX,
      screenY
    } = e.touches[0];
    const offsetX = screenX - this.touchPosition.x;
    const offsetY = screenY - this.touchPosition.y;
    this.onOffset(offsetX, offsetY, e);
    const now = Date.now();
    this.lastTimeDiff = now - this.lastTimestamp;
    this.lastTimestamp = now;
    this.lastOffset = {
      x: offsetX,
      y: offsetY
    };
    this.touchPosition = {
      x: screenX,
      y: screenY
    };
  };
  onTouchStart = (e) => {
    const {
      screenX,
      screenY
    } = e.touches[0];
    this.touchPosition = {
      x: screenX,
      y: screenY
    };
    window.clearInterval(this.motion);
  };
  onWheel = (e) => {
    const {
      deltaX,
      deltaY
    } = e;
    let mixed;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX === absY) {
      mixed = this.lastWheelDirection === "x" ? deltaX : deltaY;
    } else if (absX > absY) {
      mixed = deltaX;
      this.lastWheelDirection = "x";
    } else {
      mixed = deltaY;
      this.lastWheelDirection = "y";
    }
    const now = Date.now();
    const absMixed = Math.abs(mixed);
    if (now - this.lastWheelTimestamp > 100 || absMixed - this.lastMixedWheel > 10) {
      this.lastWheelPrevent = false;
    }
    this.onOffset(-mixed, -mixed, e);
    if (e.defaultPrevented || this.lastWheelPrevent) {
      this.lastWheelPrevent = true;
    }
    this.lastWheelTimestamp = now;
    this.lastMixedWheel = absMixed;
  };
  onOffset(x, y, event) {
    if (this.offsetChange.observers.length) {
      this.ngZone.run(() => {
        this.offsetChange.emit({
          x,
          y,
          event
        });
      });
    }
  }
  static ɵfac = function NzTabScrollListDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabScrollListDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabScrollListDirective,
    selectors: [["", "nzTabScrollList", ""]],
    outputs: {
      offsetChange: "offsetChange",
      tabScroll: "tabScroll"
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabScrollListDirective, [{
    type: Directive,
    args: [{
      selector: "[nzTabScrollList]"
    }]
  }], null, {
    offsetChange: [{
      type: Output
    }],
    tabScroll: [{
      type: Output
    }]
  });
})();
var NzTabsInkBarDirective = class _NzTabsInkBarDirective {
  ngZone = inject(NgZone);
  el = inject(ElementRef).nativeElement;
  directionality = inject(Directionality).valueSignal;
  position = input("horizontal", ...ngDevMode ? [{
    debugName: "position"
  }] : []);
  animated = input(true, ...ngDevMode ? [{
    debugName: "animated"
  }] : []);
  indicator = input(...ngDevMode ? [void 0, {
    debugName: "indicator"
  }] : []);
  animationEnabled = isAnimationEnabled(() => this.animated());
  alignToElement(element) {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.setStyles(element));
    });
  }
  setStyles(element) {
    const {
      size,
      align
    } = this.indicator() || {};
    if (this.position() === "horizontal") {
      this.el.style.top = "";
      this.el.style.height = "";
      this.el.style.width = coerceCssPixelValue(size ? typeof size === "number" ? size : size(element?.offsetWidth ?? 0) : element?.offsetWidth ?? 0);
      this.el.style.left = this.setIndicatorPosition(element, align);
    } else {
      this.el.style.left = "";
      this.el.style.width = "";
      this.el.style.height = coerceCssPixelValue(!isNil(size) ? typeof size === "number" ? size : size(element?.offsetHeight ?? 0) : element?.offsetHeight ?? 0);
      this.el.style.top = this.setIndicatorPosition(element, align);
    }
  }
  setIndicatorPosition(element, align = "start") {
    const isHorizontal = this.position() === "horizontal";
    const itemOffset = isHorizontal ? element?.offsetLeft ?? 0 : element?.offsetTop ?? 0;
    const itemSize = isHorizontal ? element?.offsetWidth ?? 0 : element?.offsetHeight ?? 0;
    const indicatorSize = isHorizontal ? this.el.offsetWidth : this.el.offsetHeight;
    const isRtl = isHorizontal && this.directionality() === "rtl";
    const resolvedAlign = isRtl && align !== "center" ? align === "start" ? "end" : "start" : align;
    switch (resolvedAlign) {
      case "start":
        return coerceCssPixelValue(itemOffset);
      case "end":
        return coerceCssPixelValue(itemOffset + itemSize - (indicatorSize || 0));
      case "center":
        return coerceCssPixelValue(itemOffset + (itemSize - (indicatorSize || 0)) / 2);
    }
  }
  static ɵfac = function NzTabsInkBarDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabsInkBarDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabsInkBarDirective,
    selectors: [["nz-tabs-ink-bar"], ["", "nz-tabs-ink-bar", ""]],
    hostAttrs: [1, "ant-tabs-ink-bar"],
    hostVars: 2,
    hostBindings: function NzTabsInkBarDirective_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-tabs-ink-bar-animated", ctx.animationEnabled());
      }
    },
    inputs: {
      position: [1, "position"],
      animated: [1, "animated"],
      indicator: [1, "indicator"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabsInkBarDirective, [{
    type: Directive,
    args: [{
      selector: "nz-tabs-ink-bar, [nz-tabs-ink-bar]",
      host: {
        class: "ant-tabs-ink-bar",
        "[class.ant-tabs-ink-bar-animated]": "animationEnabled()"
      }
    }]
  }], null, {
    position: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "position",
        required: false
      }]
    }],
    animated: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "animated",
        required: false
      }]
    }],
    indicator: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "indicator",
        required: false
      }]
    }]
  });
})();
var RESIZE_SCHEDULER = typeof requestAnimationFrame !== "undefined" ? animationFrameScheduler : asapScheduler;
var CSS_TRANSFORM_TIME = 150;
var NzTabNavBarComponent = class _NzTabNavBarComponent {
  cdr = inject(ChangeDetectorRef);
  ngZone = inject(NgZone);
  viewportRuler = inject(ViewportRuler);
  nzResizeObserver = inject(NzResizeObserver);
  dir = inject(Directionality);
  destroyRef = inject(DestroyRef);
  indexFocused = new EventEmitter();
  selectFocusedIndex = new EventEmitter();
  addClicked = new EventEmitter();
  tabScroll = new EventEmitter();
  position = "horizontal";
  addable = false;
  hideBar = false;
  addIcon = "plus";
  inkBarAnimated = true;
  extraTemplate;
  extraContents = input.required(...ngDevMode ? [{
    debugName: "extraContents"
  }] : []);
  indicator = input(...ngDevMode ? [void 0, {
    debugName: "indicator"
  }] : []);
  startExtraContent = computed(() => this.extraContents().find((item) => item.position() === "start"), ...ngDevMode ? [{
    debugName: "startExtraContent"
  }] : []);
  endExtraContent = computed(() => this.extraContents().find((item) => item.position() === "end"), ...ngDevMode ? [{
    debugName: "endExtraContent"
  }] : []);
  get selectedIndex() {
    return this._selectedIndex;
  }
  set selectedIndex(value) {
    const newValue = coerceNumberProperty(value);
    if (this._selectedIndex !== newValue) {
      this._selectedIndex = value;
      this.selectedIndexChanged = true;
      if (this.keyManager) {
        this.keyManager.updateActiveItem(value);
      }
    }
  }
  navWrapRef;
  navListRef;
  operationRef;
  addBtnRef;
  inkBar;
  items;
  /** Tracks which element has focus; used for keyboard navigation */
  get focusIndex() {
    return this.keyManager ? this.keyManager.activeItemIndex : 0;
  }
  /** When the focus index is set, we must manually send focus to the correct label */
  set focusIndex(value) {
    if (!this.isValidIndex(value) || this.focusIndex === value || !this.keyManager) {
      return;
    }
    this.keyManager.setActiveItem(value);
  }
  get showAddButton() {
    return this.hiddenItems.length === 0 && this.addable;
  }
  translate = null;
  transformX = 0;
  transformY = 0;
  pingLeft = false;
  pingRight = false;
  pingTop = false;
  pingBottom = false;
  hiddenItems = [];
  keyManager;
  _selectedIndex = 0;
  wrapperWidth = 0;
  wrapperHeight = 0;
  scrollListWidth = 0;
  scrollListHeight = 0;
  operationWidth = 0;
  operationHeight = 0;
  addButtonWidth = 0;
  addButtonHeight = 0;
  selectedIndexChanged = false;
  lockAnimationTimeoutId;
  cssTransformTimeWaitingId;
  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.lockAnimationTimeoutId);
      clearTimeout(this.cssTransformTimeWaitingId);
    });
  }
  ngAfterViewInit() {
    const dirChange = this.dir ? this.dir.change.asObservable() : of(null);
    const resize = this.viewportRuler.change(150);
    const realign = () => {
      this.updateScrollListPosition();
      this.alignInkBarToSelectedTab();
    };
    this.keyManager = new FocusKeyManager(this.items).withHorizontalOrientation(this.getLayoutDirection()).withWrap();
    this.keyManager.updateActiveItem(this.selectedIndex);
    requestAnimationFrame(realign);
    merge(this.nzResizeObserver.observe(this.navWrapRef), this.nzResizeObserver.observe(this.navListRef)).pipe(takeUntilDestroyed(this.destroyRef), auditTime(16, RESIZE_SCHEDULER)).subscribe(() => {
      realign();
    });
    merge(dirChange, resize, this.items.changes).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      Promise.resolve().then(realign);
      this.keyManager.withHorizontalOrientation(this.getLayoutDirection());
    });
    this.keyManager.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((newFocusIndex) => {
      this.indexFocused.emit(newFocusIndex);
      this.scrollToTab(this.keyManager.activeItem);
    });
  }
  ngAfterContentChecked() {
    if (this.selectedIndexChanged) {
      this.updateScrollListPosition();
      this.alignInkBarToSelectedTab();
      this.selectedIndexChanged = false;
      this.cdr.markForCheck();
    }
  }
  onSelectedFromMenu(tab) {
    const tabIndex = this.items.toArray().findIndex((e) => e === tab);
    if (tabIndex !== -1) {
      this.keyManager.updateActiveItem(tabIndex);
      if (this.focusIndex !== this.selectedIndex) {
        this.selectFocusedIndex.emit(this.focusIndex);
        this.scrollToTab(tab);
      }
    }
  }
  onOffsetChange(e) {
    if (this.position === "horizontal") {
      if (!this.lockAnimationTimeoutId) {
        if (this.transformX >= 0 && e.x > 0) {
          return;
        }
        if (this.transformX <= this.wrapperWidth - this.scrollListWidth && e.x < 0) {
          return;
        }
      }
      e.event.preventDefault();
      this.transformX = this.clampTransformX(this.transformX + e.x);
      this.setTransform(this.transformX, 0);
    } else {
      if (!this.lockAnimationTimeoutId) {
        if (this.transformY >= 0 && e.y > 0) {
          return;
        }
        if (this.transformY <= this.wrapperHeight - this.scrollListHeight && e.y < 0) {
          return;
        }
      }
      e.event.preventDefault();
      this.transformY = this.clampTransformY(this.transformY + e.y);
      this.setTransform(0, this.transformY);
    }
    this.lockAnimation();
    this.setVisibleRange();
    this.setPingStatus();
  }
  handleKeydown(event) {
    const inNavigationList = this.navWrapRef.nativeElement.contains(event.target);
    if (hasModifierKey(event) || !inNavigationList) {
      return;
    }
    switch (event.keyCode) {
      case LEFT_ARROW:
      case UP_ARROW:
      case RIGHT_ARROW:
      case DOWN_ARROW:
        this.lockAnimation();
        this.keyManager.onKeydown(event);
        break;
      case ENTER:
      case SPACE:
        if (this.focusIndex !== this.selectedIndex) {
          this.selectFocusedIndex.emit(this.focusIndex);
        }
        break;
      default:
        this.keyManager.onKeydown(event);
    }
  }
  isValidIndex(index) {
    if (!this.items) {
      return true;
    }
    const tab = this.items ? this.items.toArray()[index] : null;
    return !!tab && !tab.disabled;
  }
  scrollToTab(tab) {
    if (!this.items.find((e) => e === tab)) {
      return;
    }
    const tabs = this.items.toArray();
    if (this.position === "horizontal") {
      let newTransform = this.transformX;
      if (this.getLayoutDirection() === "rtl") {
        const right = tabs[0].left + tabs[0].width - tab.left - tab.width;
        if (right < this.transformX) {
          newTransform = right;
        } else if (right + tab.width > this.transformX + this.wrapperWidth) {
          newTransform = right + tab.width - this.wrapperWidth;
        }
      } else if (tab.left < -this.transformX) {
        newTransform = -tab.left;
      } else if (tab.left + tab.width > -this.transformX + this.wrapperWidth) {
        newTransform = -(tab.left + tab.width - this.wrapperWidth);
      }
      this.transformX = newTransform;
      this.transformY = 0;
      this.setTransform(newTransform, 0);
    } else {
      let newTransform = this.transformY;
      if (tab.top < -this.transformY) {
        newTransform = -tab.top;
      } else if (tab.top + tab.height > -this.transformY + this.wrapperHeight) {
        newTransform = -(tab.top + tab.height - this.wrapperHeight);
      }
      this.transformY = newTransform;
      this.transformX = 0;
      this.setTransform(0, newTransform);
    }
    clearTimeout(this.cssTransformTimeWaitingId);
    this.cssTransformTimeWaitingId = setTimeout(() => {
      this.setVisibleRange();
    }, CSS_TRANSFORM_TIME);
  }
  lockAnimation() {
    if (!this.lockAnimationTimeoutId) {
      this.ngZone.runOutsideAngular(() => {
        this.navListRef.nativeElement.style.transition = "none";
        this.lockAnimationTimeoutId = setTimeout(() => {
          this.navListRef.nativeElement.style.transition = "";
          this.lockAnimationTimeoutId = void 0;
        }, CSS_TRANSFORM_TIME);
      });
    }
  }
  setTransform(x, y) {
    this.navListRef.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
  }
  clampTransformX(transform) {
    const scrollWidth = this.wrapperWidth - this.scrollListWidth;
    if (this.getLayoutDirection() === "rtl") {
      return Math.max(Math.min(scrollWidth, transform), 0);
    } else {
      return Math.min(Math.max(scrollWidth, transform), 0);
    }
  }
  clampTransformY(transform) {
    return Math.min(Math.max(this.wrapperHeight - this.scrollListHeight, transform), 0);
  }
  updateScrollListPosition() {
    this.resetSizes();
    this.transformX = this.clampTransformX(this.transformX);
    this.transformY = this.clampTransformY(this.transformY);
    this.setVisibleRange();
    this.setPingStatus();
    if (this.keyManager) {
      this.keyManager.updateActiveItem(this.keyManager.activeItemIndex);
      if (this.keyManager.activeItem) {
        this.scrollToTab(this.keyManager.activeItem);
      }
    }
  }
  resetSizes() {
    this.addButtonWidth = this.addBtnRef ? this.addBtnRef.getElementWidth() : 0;
    this.addButtonHeight = this.addBtnRef ? this.addBtnRef.getElementHeight() : 0;
    this.operationWidth = this.operationRef.getElementWidth();
    this.operationHeight = this.operationRef.getElementHeight();
    this.wrapperWidth = this.navWrapRef.nativeElement.offsetWidth || 0;
    this.wrapperHeight = this.navWrapRef.nativeElement.offsetHeight || 0;
    this.scrollListHeight = this.navListRef.nativeElement.offsetHeight || 0;
    this.scrollListWidth = this.navListRef.nativeElement.offsetWidth || 0;
  }
  alignInkBarToSelectedTab() {
    const selectedItem = this.items && this.items.length ? this.items.toArray()[this.selectedIndex] : null;
    const selectedItemElement = selectedItem ? selectedItem.elementRef.nativeElement : null;
    if (selectedItemElement) {
      this.inkBar.alignToElement(selectedItemElement.parentElement);
    }
  }
  setPingStatus() {
    const ping = {
      top: false,
      right: false,
      bottom: false,
      left: false
    };
    const navWrap = this.navWrapRef.nativeElement;
    if (this.position === "horizontal") {
      if (this.getLayoutDirection() === "rtl") {
        ping.right = this.transformX > 0;
        ping.left = this.transformX + this.wrapperWidth < this.scrollListWidth;
      } else {
        ping.left = this.transformX < 0;
        ping.right = -this.transformX + this.wrapperWidth < this.scrollListWidth;
      }
    } else {
      ping.top = this.transformY < 0;
      ping.bottom = -this.transformY + this.wrapperHeight < this.scrollListHeight;
    }
    Object.keys(ping).forEach((pos) => {
      const className = `ant-tabs-nav-wrap-ping-${pos}`;
      if (ping[pos]) {
        navWrap.classList.add(className);
      } else {
        navWrap.classList.remove(className);
      }
    });
  }
  setVisibleRange() {
    let unit;
    let position;
    let transformSize;
    let basicSize;
    let tabContentSize;
    let addSize;
    const tabs = this.items.toArray();
    const DEFAULT_SIZE = {
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      right: 0
    };
    const getOffset = (index) => {
      let offset;
      const size = tabs[index] || DEFAULT_SIZE;
      if (position === "right") {
        offset = tabs[0].left + tabs[0].width - tabs[index].left - tabs[index].width;
      } else {
        offset = size[position];
      }
      return offset;
    };
    if (this.position === "horizontal") {
      unit = "width";
      basicSize = this.wrapperWidth;
      tabContentSize = this.scrollListWidth - (this.hiddenItems.length ? this.operationWidth : 0);
      addSize = this.addButtonWidth;
      transformSize = Math.abs(this.transformX);
      if (this.getLayoutDirection() === "rtl") {
        position = "right";
        this.pingRight = this.transformX > 0;
        this.pingLeft = this.transformX + this.wrapperWidth < this.scrollListWidth;
      } else {
        this.pingLeft = this.transformX < 0;
        this.pingRight = -this.transformX + this.wrapperWidth < this.scrollListWidth;
        position = "left";
      }
    } else {
      unit = "height";
      basicSize = this.wrapperHeight;
      tabContentSize = this.scrollListHeight - (this.hiddenItems.length ? this.operationHeight : 0);
      addSize = this.addButtonHeight;
      position = "top";
      transformSize = -this.transformY;
      this.pingTop = this.transformY < 0;
      this.pingBottom = -this.transformY + this.wrapperHeight < this.scrollListHeight;
    }
    let mergedBasicSize = basicSize;
    if (tabContentSize + addSize > basicSize) {
      mergedBasicSize = basicSize - addSize;
    }
    if (!tabs.length) {
      this.hiddenItems = [];
      this.cdr.markForCheck();
      return;
    }
    const len = tabs.length;
    let endIndex = len;
    for (let i = 0; i < len; i += 1) {
      const offset = getOffset(i);
      const size = tabs[i] || DEFAULT_SIZE;
      if (offset + size[unit] > transformSize + mergedBasicSize) {
        endIndex = i - 1;
        break;
      }
    }
    let startIndex = 0;
    for (let i = len - 1; i >= 0; i -= 1) {
      const offset = getOffset(i);
      if (offset < transformSize) {
        startIndex = i + 1;
        break;
      }
    }
    const startHiddenTabs = tabs.slice(0, startIndex);
    const endHiddenTabs = tabs.slice(endIndex + 1);
    this.hiddenItems = [...startHiddenTabs, ...endHiddenTabs];
    this.cdr.markForCheck();
  }
  getLayoutDirection() {
    return this.dir && this.dir.value === "rtl" ? "rtl" : "ltr";
  }
  ngOnChanges(changes) {
    const {
      position,
      indicator
    } = changes;
    if (position && !position.isFirstChange()) {
      this.updateScrollListPosition();
    }
    if (position && !position.isFirstChange() || indicator && !indicator.isFirstChange()) {
      this.alignInkBarToSelectedTab();
      this.lockAnimation();
    }
  }
  static ɵfac = function NzTabNavBarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabNavBarComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTabNavBarComponent,
    selectors: [["nz-tabs-nav"]],
    contentQueries: function NzTabNavBarComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, NzTabNavItemDirective, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.items = _t);
      }
    },
    viewQuery: function NzTabNavBarComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c3, 7)(_c4, 7)(NzTabNavOperationComponent, 7)(NzTabAddButtonComponent, 5)(NzTabsInkBarDirective, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.navWrapRef = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.navListRef = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.operationRef = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.addBtnRef = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.inkBar = _t.first);
      }
    },
    hostAttrs: [1, "ant-tabs-nav"],
    hostBindings: function NzTabNavBarComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("keydown", function NzTabNavBarComponent_keydown_HostBindingHandler($event) {
          return ctx.handleKeydown($event);
        });
      }
    },
    inputs: {
      position: "position",
      addable: [2, "addable", "addable", booleanAttribute],
      hideBar: [2, "hideBar", "hideBar", booleanAttribute],
      addIcon: "addIcon",
      inkBarAnimated: "inkBarAnimated",
      extraTemplate: "extraTemplate",
      extraContents: [1, "extraContents"],
      indicator: [1, "indicator"],
      selectedIndex: "selectedIndex"
    },
    outputs: {
      indexFocused: "indexFocused",
      selectFocusedIndex: "selectFocusedIndex",
      addClicked: "addClicked",
      tabScroll: "tabScroll"
    },
    exportAs: ["nzTabsNav"],
    features: [ɵɵNgOnChangesFeature],
    ngContentSelectors: _c5,
    decls: 11,
    vars: 18,
    consts: [["navWrap", ""], ["navList", ""], [1, "ant-tabs-extra-content"], [1, "ant-tabs-nav-wrap"], ["nzTabScrollList", "", "role", "tablist", 1, "ant-tabs-nav-list", 3, "offsetChange", "tabScroll"], ["role", "tab", "nz-tab-add-button", "", 3, "addIcon"], ["nz-tabs-ink-bar", "", 3, "hidden", "position", "animated", "indicator"], [3, "addClicked", "selected", "addIcon", "addable", "items"], [3, "ngTemplateOutlet"], ["role", "tab", "nz-tab-add-button", "", 3, "click", "addIcon"]],
    template: function NzTabNavBarComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵconditionalCreate(0, NzTabNavBarComponent_Conditional_0_Template, 2, 1, "div", 2);
        ɵɵelementStart(1, "div", 3, 0)(3, "div", 4, 1);
        ɵɵlistener("offsetChange", function NzTabNavBarComponent_Template_div_offsetChange_3_listener($event) {
          return ctx.onOffsetChange($event);
        })("tabScroll", function NzTabNavBarComponent_Template_div_tabScroll_3_listener($event) {
          return ctx.tabScroll.emit($event);
        });
        ɵɵprojection(5);
        ɵɵconditionalCreate(6, NzTabNavBarComponent_Conditional_6_Template, 1, 2, "button", 5);
        ɵɵelement(7, "div", 6);
        ɵɵelementEnd()();
        ɵɵelementStart(8, "nz-tab-nav-operation", 7);
        ɵɵlistener("addClicked", function NzTabNavBarComponent_Template_nz_tab_nav_operation_addClicked_8_listener() {
          return ctx.addClicked.emit();
        })("selected", function NzTabNavBarComponent_Template_nz_tab_nav_operation_selected_8_listener($event) {
          return ctx.onSelectedFromMenu($event);
        });
        ɵɵelementEnd();
        ɵɵconditionalCreate(9, NzTabNavBarComponent_Conditional_9_Template, 2, 1, "div", 2)(10, NzTabNavBarComponent_Conditional_10_Template, 2, 1, "div", 2);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.startExtraContent() ? 0 : -1);
        ɵɵadvance();
        ɵɵclassProp("ant-tabs-nav-wrap-ping-left", ctx.pingLeft)("ant-tabs-nav-wrap-ping-right", ctx.pingRight)("ant-tabs-nav-wrap-ping-top", ctx.pingTop)("ant-tabs-nav-wrap-ping-bottom", ctx.pingBottom);
        ɵɵadvance(5);
        ɵɵconditional(ctx.showAddButton ? 6 : -1);
        ɵɵadvance();
        ɵɵproperty("hidden", ctx.hideBar)("position", ctx.position)("animated", ctx.inkBarAnimated)("indicator", ctx.indicator());
        ɵɵadvance();
        ɵɵproperty("addIcon", ctx.addIcon)("addable", ctx.addable)("items", ctx.hiddenItems);
        ɵɵadvance();
        ɵɵconditional(ctx.endExtraContent() ? 9 : ctx.extraTemplate ? 10 : -1);
      }
    },
    dependencies: [NzTabScrollListDirective, NzTabAddButtonComponent, NzTabsInkBarDirective, NzTabNavOperationComponent, NgTemplateOutlet],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabNavBarComponent, [{
    type: Component,
    args: [{
      selector: "nz-tabs-nav",
      exportAs: "nzTabsNav",
      imports: [NzTabScrollListDirective, NzTabAddButtonComponent, NzTabsInkBarDirective, NzTabNavOperationComponent, NgTemplateOutlet],
      template: `
    @if (startExtraContent()) {
      <div class="ant-tabs-extra-content">
        <ng-template [ngTemplateOutlet]="startExtraContent()!.templateRef" />
      </div>
    }
    <div
      class="ant-tabs-nav-wrap"
      [class.ant-tabs-nav-wrap-ping-left]="pingLeft"
      [class.ant-tabs-nav-wrap-ping-right]="pingRight"
      [class.ant-tabs-nav-wrap-ping-top]="pingTop"
      [class.ant-tabs-nav-wrap-ping-bottom]="pingBottom"
      #navWrap
    >
      <div
        class="ant-tabs-nav-list"
        #navList
        nzTabScrollList
        (offsetChange)="onOffsetChange($event)"
        (tabScroll)="tabScroll.emit($event)"
        role="tablist"
      >
        <ng-content />
        @if (showAddButton) {
          <button
            role="tab"
            [attr.tabindex]="-1"
            nz-tab-add-button
            [addIcon]="addIcon"
            (click)="addClicked.emit()"
          ></button>
        }
        <div
          nz-tabs-ink-bar
          [hidden]="hideBar"
          [position]="position"
          [animated]="inkBarAnimated"
          [indicator]="indicator()"
        ></div>
      </div>
    </div>
    <nz-tab-nav-operation
      (addClicked)="addClicked.emit()"
      (selected)="onSelectedFromMenu($event)"
      [addIcon]="addIcon"
      [addable]="addable"
      [items]="hiddenItems"
    />
    @if (endExtraContent()) {
      <div class="ant-tabs-extra-content">
        <ng-template [ngTemplateOutlet]="endExtraContent()!.templateRef" />
      </div>
    } @else if (extraTemplate) {
      <div class="ant-tabs-extra-content">
        <ng-template [ngTemplateOutlet]="extraTemplate" />
      </div>
    }
  `,
      host: {
        class: "ant-tabs-nav",
        "(keydown)": "handleKeydown($event)"
      },
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None
    }]
  }], () => [], {
    indexFocused: [{
      type: Output
    }],
    selectFocusedIndex: [{
      type: Output
    }],
    addClicked: [{
      type: Output
    }],
    tabScroll: [{
      type: Output
    }],
    position: [{
      type: Input
    }],
    addable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    hideBar: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    addIcon: [{
      type: Input
    }],
    inkBarAnimated: [{
      type: Input
    }],
    extraTemplate: [{
      type: Input
    }],
    extraContents: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "extraContents",
        required: true
      }]
    }],
    indicator: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "indicator",
        required: false
      }]
    }],
    selectedIndex: [{
      type: Input
    }],
    navWrapRef: [{
      type: ViewChild,
      args: ["navWrap", {
        static: true
      }]
    }],
    navListRef: [{
      type: ViewChild,
      args: ["navList", {
        static: true
      }]
    }],
    operationRef: [{
      type: ViewChild,
      args: [NzTabNavOperationComponent, {
        static: true
      }]
    }],
    addBtnRef: [{
      type: ViewChild,
      args: [NzTabAddButtonComponent, {
        static: false
      }]
    }],
    inkBar: [{
      type: ViewChild,
      args: [NzTabsInkBarDirective, {
        static: true
      }]
    }],
    items: [{
      type: ContentChildren,
      args: [NzTabNavItemDirective, {
        descendants: true
      }]
    }]
  });
})();
var NzTabDirective = class _NzTabDirective {
  static ɵfac = function NzTabDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzTabDirective,
    selectors: [["", "nz-tab", ""]],
    exportAs: ["nzTab"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabDirective, [{
    type: Directive,
    args: [{
      selector: "[nz-tab]",
      exportAs: "nzTab"
    }]
  }], null, null);
})();
var NZ_TAB_SET = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "nz-tabs" : "");
var NzTabComponent = class _NzTabComponent {
  nzTitle = "";
  nzClosable = false;
  nzCloseIcon = "close";
  nzDisabled = false;
  nzForceRender = false;
  nzSelect = new EventEmitter();
  nzDeselect = new EventEmitter();
  nzClick = new EventEmitter();
  nzContextmenu = new EventEmitter();
  nzTabLinkTemplateDirective;
  template = null;
  linkDirective;
  contentTemplate;
  isActive = false;
  hasBeenActive = false;
  position = null;
  origin = null;
  closestTabSet = inject(NZ_TAB_SET);
  stateChanges = new Subject();
  get content() {
    return this.template || this.contentTemplate;
  }
  get label() {
    return this.nzTitle || this.nzTabLinkTemplateDirective?.templateRef;
  }
  ngOnChanges(changes) {
    const {
      nzTitle,
      nzDisabled,
      nzForceRender
    } = changes;
    if (nzTitle || nzDisabled || nzForceRender) {
      this.stateChanges.next();
    }
  }
  ngOnDestroy() {
    this.stateChanges.complete();
  }
  setActive(active) {
    this.isActive = active;
    if (active) {
      this.hasBeenActive = true;
    }
  }
  static ɵfac = function NzTabComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTabComponent,
    selectors: [["nz-tab"]],
    contentQueries: function NzTabComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, NzTabLinkTemplateDirective, 5)(dirIndex, NzTabDirective, 5, TemplateRef)(dirIndex, NzTabLinkDirective, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.nzTabLinkTemplateDirective = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.template = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.linkDirective = _t.first);
      }
    },
    viewQuery: function NzTabComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c6, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.contentTemplate = _t.first);
      }
    },
    inputs: {
      nzTitle: "nzTitle",
      nzClosable: [2, "nzClosable", "nzClosable", booleanAttribute],
      nzCloseIcon: "nzCloseIcon",
      nzDisabled: [2, "nzDisabled", "nzDisabled", booleanAttribute],
      nzForceRender: [2, "nzForceRender", "nzForceRender", booleanAttribute]
    },
    outputs: {
      nzSelect: "nzSelect",
      nzDeselect: "nzDeselect",
      nzClick: "nzClick",
      nzContextmenu: "nzContextmenu"
    },
    exportAs: ["nzTab"],
    features: [ɵɵNgOnChangesFeature],
    ngContentSelectors: _c8,
    decls: 4,
    vars: 0,
    consts: [["tabLinkTemplate", ""], ["contentTemplate", ""]],
    template: function NzTabComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef(_c7);
        ɵɵdomTemplate(0, NzTabComponent_ng_template_0_Template, 1, 0, "ng-template", null, 0, ɵɵtemplateRefExtractor)(2, NzTabComponent_ng_template_2_Template, 1, 0, "ng-template", null, 1, ɵɵtemplateRefExtractor);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabComponent, [{
    type: Component,
    args: [{
      selector: "nz-tab",
      exportAs: "nzTab",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    <ng-template #tabLinkTemplate>
      <ng-content select="[nz-tab-link]" />
    </ng-template>
    <ng-template #contentTemplate>
      <ng-content />
    </ng-template>
  `
    }]
  }], null, {
    nzTitle: [{
      type: Input
    }],
    nzClosable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzCloseIcon: [{
      type: Input
    }],
    nzDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzForceRender: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzSelect: [{
      type: Output
    }],
    nzDeselect: [{
      type: Output
    }],
    nzClick: [{
      type: Output
    }],
    nzContextmenu: [{
      type: Output
    }],
    nzTabLinkTemplateDirective: [{
      type: ContentChild,
      args: [NzTabLinkTemplateDirective, {
        static: false
      }]
    }],
    template: [{
      type: ContentChild,
      args: [NzTabDirective, {
        static: false,
        read: TemplateRef
      }]
    }],
    linkDirective: [{
      type: ContentChild,
      args: [NzTabLinkDirective, {
        static: false
      }]
    }],
    contentTemplate: [{
      type: ViewChild,
      args: ["contentTemplate", {
        static: true
      }]
    }]
  });
})();
var NZ_CONFIG_MODULE_NAME = "tabs";
var nextId = 0;
var NzTabsComponent = (() => {
  let _nzType_decorators;
  let _nzType_initializers = [];
  let _nzType_extraInitializers = [];
  let _nzSize_decorators;
  let _nzSize_initializers = [];
  let _nzSize_extraInitializers = [];
  let _nzAnimated_decorators;
  let _nzAnimated_initializers = [];
  let _nzAnimated_extraInitializers = [];
  let _nzTabBarGutter_decorators;
  let _nzTabBarGutter_initializers = [];
  let _nzTabBarGutter_extraInitializers = [];
  return class NzTabsComponent2 {
    static {
      const _metadata = typeof Symbol === "function" && Symbol.metadata ? /* @__PURE__ */ Object.create(null) : void 0;
      _nzType_decorators = [WithConfig()];
      _nzSize_decorators = [WithConfig()];
      _nzAnimated_decorators = [WithConfig()];
      _nzTabBarGutter_decorators = [WithConfig()];
      __esDecorate(null, null, _nzType_decorators, {
        kind: "field",
        name: "nzType",
        static: false,
        private: false,
        access: {
          has: (obj) => "nzType" in obj,
          get: (obj) => obj.nzType,
          set: (obj, value) => {
            obj.nzType = value;
          }
        },
        metadata: _metadata
      }, _nzType_initializers, _nzType_extraInitializers);
      __esDecorate(null, null, _nzSize_decorators, {
        kind: "field",
        name: "nzSize",
        static: false,
        private: false,
        access: {
          has: (obj) => "nzSize" in obj,
          get: (obj) => obj.nzSize,
          set: (obj, value) => {
            obj.nzSize = value;
          }
        },
        metadata: _metadata
      }, _nzSize_initializers, _nzSize_extraInitializers);
      __esDecorate(null, null, _nzAnimated_decorators, {
        kind: "field",
        name: "nzAnimated",
        static: false,
        private: false,
        access: {
          has: (obj) => "nzAnimated" in obj,
          get: (obj) => obj.nzAnimated,
          set: (obj, value) => {
            obj.nzAnimated = value;
          }
        },
        metadata: _metadata
      }, _nzAnimated_initializers, _nzAnimated_extraInitializers);
      __esDecorate(null, null, _nzTabBarGutter_decorators, {
        kind: "field",
        name: "nzTabBarGutter",
        static: false,
        private: false,
        access: {
          has: (obj) => "nzTabBarGutter" in obj,
          get: (obj) => obj.nzTabBarGutter,
          set: (obj, value) => {
            obj.nzTabBarGutter = value;
          }
        },
        metadata: _metadata
      }, _nzTabBarGutter_initializers, _nzTabBarGutter_extraInitializers);
      if (_metadata) Object.defineProperty(this, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata
      });
    }
    _nzModuleName = NZ_CONFIG_MODULE_NAME;
    nzConfigService = inject(NzConfigService);
    ngZone = inject(NgZone);
    cdr = inject(ChangeDetectorRef);
    directionality = inject(Directionality);
    destroyRef = inject(DestroyRef);
    get nzSelectedIndex() {
      return this.selectedIndex;
    }
    set nzSelectedIndex(value) {
      this.indexToSelect = coerceNumberProperty(value, null);
    }
    nzTabPosition = "top";
    nzTabBarExtraContent;
    nzCanDeactivate = null;
    nzAddIcon = "plus";
    nzTabBarStyle = null;
    nzType = __runInitializers(this, _nzType_initializers, "line");
    nzSize = (__runInitializers(this, _nzType_extraInitializers), __runInitializers(this, _nzSize_initializers, "default"));
    nzAnimated = (__runInitializers(this, _nzSize_extraInitializers), __runInitializers(this, _nzAnimated_initializers, true));
    nzTabBarGutter = (__runInitializers(this, _nzAnimated_extraInitializers), __runInitializers(this, _nzTabBarGutter_initializers, void 0));
    nzHideAdd = (__runInitializers(this, _nzTabBarGutter_extraInitializers), false);
    nzCentered = false;
    nzHideAll = false;
    nzLinkRouter = false;
    nzLinkExact = true;
    nzDestroyInactiveTabPane = false;
    nzIndicator = input(...ngDevMode ? [void 0, {
      debugName: "nzIndicator"
    }] : []);
    nzSelectChange = new EventEmitter(true);
    nzSelectedIndexChange = new EventEmitter();
    nzTabListScroll = new EventEmitter();
    nzClose = new EventEmitter();
    nzAdd = new EventEmitter();
    get position() {
      return ["top", "bottom"].indexOf(this.nzTabPosition) === -1 ? "vertical" : "horizontal";
    }
    get addable() {
      return this.nzType === "editable-card" && !this.nzHideAdd;
    }
    get closable() {
      return this.nzType === "editable-card";
    }
    get line() {
      return this.nzType === "line";
    }
    get inkBarAnimated() {
      return this.line && (typeof this.nzAnimated === "boolean" ? this.nzAnimated : this.nzAnimated.inkBar);
    }
    get tabPaneAnimated() {
      return typeof this.nzAnimated === "boolean" ? this.nzAnimated : this.nzAnimated.tabPane;
    }
    // Pick up only direct descendants under ivy rendering engine
    // We filter out only the tabs that belong to this tab set in `tabs`.
    allTabs = new QueryList();
    tabLinks = new QueryList();
    tabNavBarRef;
    // All the direct tabs for this tab set
    tabs = new QueryList();
    extraContents = contentChildren(NzTabBarExtraContentDirective, ...ngDevMode ? [{
      debugName: "extraContents"
    }] : []);
    dir = "ltr";
    tabSetId;
    indexToSelect = 0;
    selectedIndex = null;
    tabLabelSubscription = Subscription.EMPTY;
    canDeactivateSubscription = Subscription.EMPTY;
    router = inject(Router, {
      optional: true
    });
    constructor() {
      this.tabSetId = nextId++;
      this.destroyRef.onDestroy(() => {
        this.tabs.destroy();
        this.tabLabelSubscription.unsubscribe();
        this.canDeactivateSubscription.unsubscribe();
      });
    }
    ngOnInit() {
      this.dir = this.directionality.value;
      this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((direction) => {
        this.dir = direction;
        this.cdr.detectChanges();
      });
    }
    ngAfterContentInit() {
      this.ngZone.runOutsideAngular(() => {
        Promise.resolve().then(() => this.setUpRouter());
      });
      this.subscribeToTabLabels();
      this.subscribeToAllTabChanges();
      this.tabs.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        const indexToSelect = this.clampTabIndex(this.indexToSelect);
        if (indexToSelect === this.selectedIndex) {
          const tabs = this.tabs.toArray();
          for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].isActive) {
              this.indexToSelect = this.selectedIndex = i;
              break;
            }
          }
        }
        this.subscribeToTabLabels();
        this.cdr.markForCheck();
      });
    }
    ngAfterContentChecked() {
      const indexToSelect = this.indexToSelect = this.clampTabIndex(this.indexToSelect);
      if (this.selectedIndex !== indexToSelect) {
        const isFirstRun = this.selectedIndex == null;
        if (!isFirstRun) {
          this.nzSelectChange.emit(this.createChangeEvent(indexToSelect));
        }
        Promise.resolve().then(() => {
          this.tabs.forEach((tab, index) => tab.setActive(index === indexToSelect));
          if (!isFirstRun) {
            this.nzSelectedIndexChange.emit(indexToSelect);
          }
        });
      }
      this.tabs.forEach((tab, index) => {
        tab.position = index - indexToSelect;
        if (this.selectedIndex != null && tab.position === 0 && !tab.origin) {
          tab.origin = indexToSelect - this.selectedIndex;
        }
      });
      if (this.selectedIndex !== indexToSelect) {
        this.selectedIndex = indexToSelect;
        this.cdr.markForCheck();
      }
    }
    onClose(index, e) {
      e.preventDefault();
      e.stopPropagation();
      this.nzClose.emit({
        index
      });
    }
    onAdd() {
      this.nzAdd.emit();
    }
    clampTabIndex(index) {
      return Math.min(this.tabs.length - 1, Math.max(index || 0, 0));
    }
    createChangeEvent(index) {
      const event = new NzTabChangeEvent();
      event.index = index;
      if (this.tabs && this.tabs.length) {
        event.tab = this.tabs.toArray()[index];
        this.tabs.forEach((tab, i) => {
          if (i !== index) {
            tab.nzDeselect.emit();
          }
        });
        event.tab.nzSelect.emit();
      }
      return event;
    }
    subscribeToTabLabels() {
      if (this.tabLabelSubscription) {
        this.tabLabelSubscription.unsubscribe();
      }
      this.tabLabelSubscription = merge(...this.tabs.map((tab) => tab.stateChanges)).subscribe(() => this.cdr.markForCheck());
    }
    subscribeToAllTabChanges() {
      this.allTabs.changes.pipe(startWith(this.allTabs)).subscribe((tabs) => {
        this.tabs.reset(tabs.filter((tab) => tab.closestTabSet === this));
        this.tabs.notifyOnChanges();
      });
    }
    canDeactivateFun(pre, next) {
      if (typeof this.nzCanDeactivate === "function") {
        const observable = wrapIntoObservable(this.nzCanDeactivate(pre, next));
        return observable.pipe(first(), takeUntilDestroyed(this.destroyRef));
      } else {
        return of(true);
      }
    }
    clickNavItem(tab, index, e) {
      if (!tab.nzDisabled) {
        tab.nzClick.emit();
        if (!this.isRouterLinkClickEvent(index, e)) {
          this.setSelectedIndex(index);
        }
      }
    }
    isRouterLinkClickEvent(index, event) {
      const target = event.target;
      if (this.nzLinkRouter) {
        return !!this.tabs.toArray()[index]?.linkDirective?.elementRef.nativeElement.contains(target);
      } else {
        return false;
      }
    }
    contextmenuNavItem(tab, e) {
      if (!tab.nzDisabled) {
        tab.nzContextmenu.emit(e);
      }
    }
    setSelectedIndex(index) {
      this.canDeactivateSubscription.unsubscribe();
      this.canDeactivateSubscription = this.canDeactivateFun(this.selectedIndex, index).subscribe((can) => {
        if (can) {
          this.nzSelectedIndex = index;
          this.tabNavBarRef.focusIndex = index;
          this.cdr.markForCheck();
        }
      });
    }
    getTabIndex(tab, index) {
      if (tab.nzDisabled) {
        return null;
      }
      return this.selectedIndex === index ? 0 : -1;
    }
    getTabContentId(i) {
      return `nz-tabs-${this.tabSetId}-tab-${i}`;
    }
    setUpRouter() {
      if (this.nzLinkRouter) {
        if (!this.router) {
          throw new Error(`${PREFIX} you should import 'RouterModule' if you want to use 'nzLinkRouter'!`);
        }
        merge(this.router.events.pipe(filter((e) => e instanceof NavigationEnd)), this.tabLinks.changes).pipe(startWith(true), delay(0), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.updateRouterActive();
          this.cdr.markForCheck();
        });
      }
    }
    updateRouterActive() {
      if (this.router?.navigated) {
        const index = this.findShouldActiveTabIndex();
        if (index !== this.selectedIndex) {
          this.setSelectedIndex(index);
        }
        Promise.resolve().then(() => this.nzHideAll = index === -1);
      }
    }
    findShouldActiveTabIndex() {
      const tabs = this.tabs.toArray();
      const isActive = this.isLinkActive(this.router);
      return tabs.findIndex((tab) => {
        const c = tab.linkDirective;
        return c ? isActive(c.routerLink) : false;
      });
    }
    isLinkActive(router) {
      return (link) => link ? !!router?.isActive(link.urlTree || "", {
        paths: this.nzLinkExact ? "exact" : "subset",
        queryParams: this.nzLinkExact ? "exact" : "subset",
        fragment: "ignored",
        matrixParams: "ignored"
      }) : false;
    }
    static ɵfac = function NzTabsComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || NzTabsComponent2)();
    };
    static ɵcmp = ɵɵdefineComponent({
      type: NzTabsComponent2,
      selectors: [["nz-tabs"]],
      contentQueries: function NzTabsComponent_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          ɵɵcontentQuerySignal(dirIndex, ctx.extraContents, NzTabBarExtraContentDirective, 4);
          ɵɵcontentQuery(dirIndex, NzTabComponent, 5)(dirIndex, NzTabLinkDirective, 5);
        }
        if (rf & 2) {
          ɵɵqueryAdvance();
          let _t;
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.allTabs = _t);
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.tabLinks = _t);
        }
      },
      viewQuery: function NzTabsComponent_Query(rf, ctx) {
        if (rf & 1) {
          ɵɵviewQuery(NzTabNavBarComponent, 5);
        }
        if (rf & 2) {
          let _t;
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.tabNavBarRef = _t.first);
        }
      },
      hostAttrs: [1, "ant-tabs"],
      hostVars: 24,
      hostBindings: function NzTabsComponent_HostBindings(rf, ctx) {
        if (rf & 2) {
          ɵɵclassProp("ant-tabs-card", ctx.nzType === "card" || ctx.nzType === "editable-card")("ant-tabs-editable", ctx.nzType === "editable-card")("ant-tabs-editable-card", ctx.nzType === "editable-card")("ant-tabs-centered", ctx.nzCentered)("ant-tabs-rtl", ctx.dir === "rtl")("ant-tabs-top", ctx.nzTabPosition === "top")("ant-tabs-bottom", ctx.nzTabPosition === "bottom")("ant-tabs-left", ctx.nzTabPosition === "left")("ant-tabs-right", ctx.nzTabPosition === "right")("ant-tabs-default", ctx.nzSize === "default")("ant-tabs-small", ctx.nzSize === "small")("ant-tabs-large", ctx.nzSize === "large");
        }
      },
      inputs: {
        nzSelectedIndex: "nzSelectedIndex",
        nzTabPosition: "nzTabPosition",
        nzTabBarExtraContent: "nzTabBarExtraContent",
        nzCanDeactivate: "nzCanDeactivate",
        nzAddIcon: "nzAddIcon",
        nzTabBarStyle: "nzTabBarStyle",
        nzType: "nzType",
        nzSize: "nzSize",
        nzAnimated: "nzAnimated",
        nzTabBarGutter: "nzTabBarGutter",
        nzHideAdd: [2, "nzHideAdd", "nzHideAdd", booleanAttribute],
        nzCentered: [2, "nzCentered", "nzCentered", booleanAttribute],
        nzHideAll: [2, "nzHideAll", "nzHideAll", booleanAttribute],
        nzLinkRouter: [2, "nzLinkRouter", "nzLinkRouter", booleanAttribute],
        nzLinkExact: [2, "nzLinkExact", "nzLinkExact", booleanAttribute],
        nzDestroyInactiveTabPane: [2, "nzDestroyInactiveTabPane", "nzDestroyInactiveTabPane", booleanAttribute],
        nzIndicator: [1, "nzIndicator"]
      },
      outputs: {
        nzSelectChange: "nzSelectChange",
        nzSelectedIndexChange: "nzSelectedIndexChange",
        nzTabListScroll: "nzTabListScroll",
        nzClose: "nzClose",
        nzAdd: "nzAdd"
      },
      exportAs: ["nzTabs"],
      features: [ɵɵProvidersFeature([{
        provide: NZ_TAB_SET,
        useExisting: forwardRef(() => NzTabsComponent2)
      }])],
      decls: 4,
      vars: 12,
      consts: [["tabpaneTmpl", ""], [3, "style", "selectedIndex", "inkBarAnimated", "addable", "addIcon", "hideBar", "position", "extraTemplate", "extraContents", "indicator"], [1, "ant-tabs-content-holder"], [1, "ant-tabs-content"], [3, "tabScroll", "selectFocusedIndex", "addClicked", "selectedIndex", "inkBarAnimated", "addable", "addIcon", "hideBar", "position", "extraTemplate", "extraContents", "indicator"], [1, "ant-tabs-tab", 3, "margin-right", "margin-bottom", "ant-tabs-tab-active", "ant-tabs-tab-disabled"], [1, "ant-tabs-tab", 3, "click", "contextmenu"], ["type", "button", "role", "tab", "nzTabNavItem", "", "cdkMonitorElementFocus", "", 1, "ant-tabs-tab-btn", 3, "id", "disabled", "tab", "active"], [4, "nzStringTemplateOutlet", "nzStringTemplateOutletContext"], ["type", "button", "nz-tab-close-button", "", 3, "closeIcon"], ["type", "button", "nz-tab-close-button", "", 3, "click", "closeIcon"], [3, "ngTemplateOutlet"], ["role", "tabpanel", "nz-tab-body", "", 3, "id", "active", "content", "animated"]],
      template: function NzTabsComponent_Template(rf, ctx) {
        if (rf & 1) {
          ɵɵconditionalCreate(0, NzTabsComponent_Conditional_0_Template, 3, 11, "nz-tabs-nav", 1);
          ɵɵelementStart(1, "div", 2)(2, "div", 3);
          ɵɵconditionalCreate(3, NzTabsComponent_Conditional_3_Template, 2, 0);
          ɵɵelementEnd()();
        }
        if (rf & 2) {
          ɵɵconditional(ctx.tabs.length || ctx.addable ? 0 : -1);
          ɵɵadvance(2);
          ɵɵclassProp("ant-tabs-content-top", ctx.nzTabPosition === "top")("ant-tabs-content-bottom", ctx.nzTabPosition === "bottom")("ant-tabs-content-left", ctx.nzTabPosition === "left")("ant-tabs-content-right", ctx.nzTabPosition === "right")("ant-tabs-content-animated", ctx.tabPaneAnimated);
          ɵɵadvance();
          ɵɵconditional(!ctx.nzHideAll ? 3 : -1);
        }
      },
      dependencies: [NzTabNavBarComponent, NgTemplateOutlet, NzTabNavItemDirective, A11yModule, CdkMonitorFocus, NzOutletModule, NzStringTemplateOutletDirective, NzTabCloseButtonComponent, NzTabBodyComponent],
      encapsulation: 2
    });
  };
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabsComponent, [{
    type: Component,
    args: [{
      selector: "nz-tabs",
      exportAs: "nzTabs",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.Default,
      providers: [{
        provide: NZ_TAB_SET,
        useExisting: forwardRef(() => NzTabsComponent)
      }],
      template: `
    @if (tabs.length || addable) {
      <nz-tabs-nav
        [style]="nzTabBarStyle"
        [selectedIndex]="nzSelectedIndex || 0"
        [inkBarAnimated]="inkBarAnimated"
        [addable]="addable"
        [addIcon]="nzAddIcon"
        [hideBar]="nzHideAll"
        [position]="position"
        [extraTemplate]="nzTabBarExtraContent"
        [extraContents]="extraContents()"
        [indicator]="nzIndicator()"
        (tabScroll)="nzTabListScroll.emit($event)"
        (selectFocusedIndex)="setSelectedIndex($event)"
        (addClicked)="onAdd()"
      >
        @for (tab of tabs; track tab) {
          <div
            class="ant-tabs-tab"
            [style.margin-right.px]="position === 'horizontal' ? nzTabBarGutter : null"
            [style.margin-bottom.px]="position === 'vertical' ? nzTabBarGutter : null"
            [class.ant-tabs-tab-active]="nzSelectedIndex === $index"
            [class.ant-tabs-tab-disabled]="tab.nzDisabled"
            (click)="clickNavItem(tab, $index, $event)"
            (contextmenu)="contextmenuNavItem(tab, $event)"
          >
            <button
              type="button"
              role="tab"
              [id]="getTabContentId($index)"
              [attr.tabIndex]="getTabIndex(tab, $index)"
              [attr.aria-disabled]="tab.nzDisabled"
              [attr.aria-selected]="nzSelectedIndex === $index && !nzHideAll"
              [attr.aria-controls]="getTabContentId($index)"
              [disabled]="tab.nzDisabled"
              [tab]="tab"
              [active]="nzSelectedIndex === $index"
              class="ant-tabs-tab-btn"
              nzTabNavItem
              cdkMonitorElementFocus
            >
              <ng-container *nzStringTemplateOutlet="tab.label; context: { visible: true }">
                {{ tab.label }}
              </ng-container>
              @if (tab.nzClosable && closable && !tab.nzDisabled) {
                <button
                  type="button"
                  nz-tab-close-button
                  [closeIcon]="tab.nzCloseIcon"
                  (click)="onClose($index, $event)"
                ></button>
              }
            </button>
          </div>
        }
      </nz-tabs-nav>
    }
    <div class="ant-tabs-content-holder">
      <div
        class="ant-tabs-content"
        [class.ant-tabs-content-top]="nzTabPosition === 'top'"
        [class.ant-tabs-content-bottom]="nzTabPosition === 'bottom'"
        [class.ant-tabs-content-left]="nzTabPosition === 'left'"
        [class.ant-tabs-content-right]="nzTabPosition === 'right'"
        [class.ant-tabs-content-animated]="tabPaneAnimated"
      >
        @if (!nzHideAll) {
          @for (tab of tabs; track tab) {
            @if (tab.nzForceRender) {
              <ng-template [ngTemplateOutlet]="tabpaneTmpl" />
            } @else if (nzDestroyInactiveTabPane) {
              @if (nzSelectedIndex === $index) {
                <ng-template [ngTemplateOutlet]="tabpaneTmpl" />
              }
            } @else {
              @if (nzSelectedIndex === $index || tab.hasBeenActive) {
                <ng-template [ngTemplateOutlet]="tabpaneTmpl" />
              }
            }

            <ng-template #tabpaneTmpl>
              <div
                role="tabpanel"
                [id]="getTabContentId($index)"
                [attr.aria-labelledby]="getTabContentId($index)"
                nz-tab-body
                [active]="nzSelectedIndex === $index"
                [content]="tab.content"
                [animated]="tabPaneAnimated"
              ></div>
            </ng-template>
          }
        }
      </div>
    </div>
  `,
      host: {
        class: "ant-tabs",
        "[class.ant-tabs-card]": `nzType === 'card' || nzType === 'editable-card'`,
        "[class.ant-tabs-editable]": `nzType === 'editable-card'`,
        "[class.ant-tabs-editable-card]": `nzType === 'editable-card'`,
        "[class.ant-tabs-centered]": `nzCentered`,
        "[class.ant-tabs-rtl]": `dir === 'rtl'`,
        "[class.ant-tabs-top]": `nzTabPosition === 'top'`,
        "[class.ant-tabs-bottom]": `nzTabPosition === 'bottom'`,
        "[class.ant-tabs-left]": `nzTabPosition === 'left'`,
        "[class.ant-tabs-right]": `nzTabPosition === 'right'`,
        "[class.ant-tabs-default]": `nzSize === 'default'`,
        "[class.ant-tabs-small]": `nzSize === 'small'`,
        "[class.ant-tabs-large]": `nzSize === 'large'`
      },
      imports: [NzTabNavBarComponent, NgTemplateOutlet, NzTabNavItemDirective, A11yModule, NzOutletModule, NzTabCloseButtonComponent, NzTabBodyComponent]
    }]
  }], () => [], {
    nzSelectedIndex: [{
      type: Input
    }],
    nzTabPosition: [{
      type: Input
    }],
    nzTabBarExtraContent: [{
      type: Input
    }],
    nzCanDeactivate: [{
      type: Input
    }],
    nzAddIcon: [{
      type: Input
    }],
    nzTabBarStyle: [{
      type: Input
    }],
    nzType: [{
      type: Input
    }],
    nzSize: [{
      type: Input
    }],
    nzAnimated: [{
      type: Input
    }],
    nzTabBarGutter: [{
      type: Input
    }],
    nzHideAdd: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzCentered: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzHideAll: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzLinkRouter: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzLinkExact: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzDestroyInactiveTabPane: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzIndicator: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzIndicator",
        required: false
      }]
    }],
    nzSelectChange: [{
      type: Output
    }],
    nzSelectedIndexChange: [{
      type: Output
    }],
    nzTabListScroll: [{
      type: Output
    }],
    nzClose: [{
      type: Output
    }],
    nzAdd: [{
      type: Output
    }],
    allTabs: [{
      type: ContentChildren,
      args: [NzTabComponent, {
        descendants: true
      }]
    }],
    tabLinks: [{
      type: ContentChildren,
      args: [NzTabLinkDirective, {
        descendants: true
      }]
    }],
    tabNavBarRef: [{
      type: ViewChild,
      args: [NzTabNavBarComponent, {
        static: false
      }]
    }],
    extraContents: [{
      type: ContentChildren,
      args: [forwardRef(() => NzTabBarExtraContentDirective), {
        isSignal: true
      }]
    }]
  });
})();
var DIRECTIVES = [NzTabsComponent, NzTabComponent, NzTabNavBarComponent, NzTabNavItemDirective, NzTabsInkBarDirective, NzTabScrollListDirective, NzTabNavOperationComponent, NzTabAddButtonComponent, NzTabCloseButtonComponent, NzTabDirective, NzTabBodyComponent, NzTabLinkDirective, NzTabLinkTemplateDirective, NzTabBarExtraContentDirective];
var NzTabsModule = class _NzTabsModule {
  static ɵfac = function NzTabsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTabsModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NzTabsModule,
    imports: [NzTabsComponent, NzTabComponent, NzTabNavBarComponent, NzTabNavItemDirective, NzTabsInkBarDirective, NzTabScrollListDirective, NzTabNavOperationComponent, NzTabAddButtonComponent, NzTabCloseButtonComponent, NzTabDirective, NzTabBodyComponent, NzTabLinkDirective, NzTabLinkTemplateDirective, NzTabBarExtraContentDirective],
    exports: [NzTabsComponent, NzTabComponent, NzTabNavBarComponent, NzTabNavItemDirective, NzTabsInkBarDirective, NzTabScrollListDirective, NzTabNavOperationComponent, NzTabAddButtonComponent, NzTabCloseButtonComponent, NzTabDirective, NzTabBodyComponent, NzTabLinkDirective, NzTabLinkTemplateDirective, NzTabBarExtraContentDirective]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [NzTabsComponent, NzTabNavBarComponent, NzTabNavOperationComponent, NzTabAddButtonComponent, NzTabCloseButtonComponent]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTabsModule, [{
    type: NgModule,
    args: [{
      imports: [DIRECTIVES],
      exports: [DIRECTIVES]
    }]
  }], null, null);
})();
export {
  NZ_TAB_SET,
  NzTabBarExtraContentDirective,
  NzTabChangeEvent,
  NzTabComponent,
  NzTabDirective,
  NzTabLinkDirective,
  NzTabLinkTemplateDirective,
  NzTabsComponent,
  NzTabsModule,
  NzTabAddButtonComponent as ɵNzTabAddButtonComponent,
  NzTabBodyComponent as ɵNzTabBodyComponent,
  NzTabCloseButtonComponent as ɵNzTabCloseButtonComponent,
  NzTabNavBarComponent as ɵNzTabNavBarComponent,
  NzTabNavItemDirective as ɵNzTabNavItemDirective,
  NzTabNavOperationComponent as ɵNzTabNavOperationComponent,
  NzTabScrollListDirective as ɵNzTabScrollListDirective,
  NzTabsInkBarDirective as ɵNzTabsInkBarDirective
};
//# sourceMappingURL=ng-zorro-antd_tabs.js.map
