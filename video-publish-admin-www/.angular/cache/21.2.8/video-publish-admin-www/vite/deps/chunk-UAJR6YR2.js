import {
  NzResizeService
} from "./chunk-K7BRVBLV.js";
import {
  NzButtonComponent,
  NzButtonModule
} from "./chunk-PJ74F7FC.js";
import {
  NzWaveDirective
} from "./chunk-VC4FDBZ3.js";
import {
  NZ_SPACE_COMPACT_ITEM_TYPE,
  NZ_SPACE_COMPACT_SIZE,
  NzSpaceCompactItemDirective
} from "./chunk-F3PAL4AQ.js";
import {
  NzTransitionPatchDirective
} from "./chunk-QXKQZRWQ.js";
import {
  NzOutletModule,
  NzStringTemplateOutletDirective
} from "./chunk-QP2ATT6X.js";
import {
  FocusMonitor
} from "./chunk-4OBKC2YF.js";
import {
  BACKSPACE,
  LEFT_ARROW,
  RIGHT_ARROW
} from "./chunk-CMKKWBGK.js";
import {
  NZ_FORM_SIZE,
  NZ_FORM_VARIANT,
  NzFormItemFeedbackIconComponent,
  NzFormNoStatusService,
  NzFormStatusService
} from "./chunk-ZXU766DR.js";
import {
  NzIconDirective,
  NzIconModule
} from "./chunk-2YSKEAYZ.js";
import {
  Platform
} from "./chunk-MR7TIX67.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlDirective,
  MaxLengthValidator,
  NG_VALUE_ACCESSOR,
  NgControl,
  NgControlStatus,
  ReactiveFormsModule,
  Validators
} from "./chunk-YZ7GQAMP.js";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal
} from "./chunk-LSZOUFU2.js";
import {
  getStatusClassNames,
  getVariantClassNames,
  isNotNil,
  isNumberFinite,
  triggerFocus
} from "./chunk-OPN2JU7N.js";
import {
  Directionality
} from "./chunk-4L5DI3TQ.js";
import {
  NgTemplateOutlet
} from "./chunk-SSARYQTY.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Input,
  NgModule,
  NgZone,
  Output,
  Renderer2,
  TemplateRef,
  ViewChildren,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  numberAttribute,
  output,
  setClassMetadata,
  signal,
  ɵɵHostDirectivesFeature,
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
  ɵɵdeclareLet,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
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
  ɵɵpureFunction1,
  ɵɵqueryAdvance,
  ɵɵqueryRefresh,
  ɵɵreadContextLet,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstoreLet,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-VS5U7YU4.js";
import {
  merge
} from "./chunk-V37RSN4D.js";
import {
  EMPTY,
  distinctUntilChanged,
  map,
  mergeMap,
  startWith,
  switchMap,
  tap
} from "./chunk-VUVMRRXW.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-EIB7IA3J.js";

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-input.mjs
var _c0 = ["nz-input-group-slot", ""];
var _c1 = ["*"];
function NzInputGroupSlotComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 0);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵproperty("nzType", ctx_r0.icon);
  }
}
function NzInputGroupSlotComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r0.template);
  }
}
function NzInputGroupComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 3);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("icon", ctx_r0.nzAddOnBeforeIcon)("template", ctx_r0.nzAddOnBefore);
  }
}
function NzInputGroupComponent_Conditional_0_Conditional_2_ng_template_1_Template(rf, ctx) {
}
function NzInputGroupComponent_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 6);
    ɵɵtemplate(1, NzInputGroupComponent_Conditional_0_Conditional_2_ng_template_1_Template, 0, 0, "ng-template", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    const affixTemplate_r2 = ɵɵreference(3);
    ɵɵclassMap(ctx_r0.affixInGroupStatusCls);
    ɵɵclassProp("ant-input-affix-wrapper-disabled", ctx_r0.disabled)("ant-input-affix-wrapper-sm", ctx_r0.isSmall)("ant-input-affix-wrapper-lg", ctx_r0.isLarge)("ant-input-affix-wrapper-focused", ctx_r0.focused);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", affixTemplate_r2);
  }
}
function NzInputGroupComponent_Conditional_0_Conditional_3_ng_template_0_Template(rf, ctx) {
}
function NzInputGroupComponent_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputGroupComponent_Conditional_0_Conditional_3_ng_template_0_Template, 0, 0, "ng-template", 5);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const contentTemplate_r3 = ɵɵreference(5);
    ɵɵproperty("ngTemplateOutlet", contentTemplate_r3);
  }
}
function NzInputGroupComponent_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 3);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("icon", ctx_r0.nzAddOnAfterIcon)("template", ctx_r0.nzAddOnAfter);
  }
}
function NzInputGroupComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 2);
    ɵɵconditionalCreate(1, NzInputGroupComponent_Conditional_0_Conditional_1_Template, 1, 2, "span", 3);
    ɵɵconditionalCreate(2, NzInputGroupComponent_Conditional_0_Conditional_2_Template, 2, 11, "span", 4)(3, NzInputGroupComponent_Conditional_0_Conditional_3_Template, 1, 1, null, 5);
    ɵɵconditionalCreate(4, NzInputGroupComponent_Conditional_0_Conditional_4_Template, 1, 2, "span", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵconditional(ctx_r0.nzAddOnBefore || ctx_r0.nzAddOnBeforeIcon ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r0.isAffix || ctx_r0.hasFeedback ? 2 : 3);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r0.nzAddOnAfter || ctx_r0.nzAddOnAfterIcon ? 4 : -1);
  }
}
function NzInputGroupComponent_Conditional_1_Conditional_0_ng_template_0_Template(rf, ctx) {
}
function NzInputGroupComponent_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputGroupComponent_Conditional_1_Conditional_0_ng_template_0_Template, 0, 0, "ng-template", 5);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const affixTemplate_r2 = ɵɵreference(3);
    ɵɵproperty("ngTemplateOutlet", affixTemplate_r2);
  }
}
function NzInputGroupComponent_Conditional_1_Conditional_1_ng_template_0_Template(rf, ctx) {
}
function NzInputGroupComponent_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputGroupComponent_Conditional_1_Conditional_1_ng_template_0_Template, 0, 0, "ng-template", 5);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const contentTemplate_r3 = ɵɵreference(5);
    ɵɵproperty("ngTemplateOutlet", contentTemplate_r3);
  }
}
function NzInputGroupComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzInputGroupComponent_Conditional_1_Conditional_0_Template, 1, 1, null, 5)(1, NzInputGroupComponent_Conditional_1_Conditional_1_Template, 1, 1, null, 5);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵconditional(ctx_r0.isAffix ? 0 : 1);
  }
}
function NzInputGroupComponent_ng_template_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 7);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("icon", ctx_r0.nzPrefixIcon)("template", ctx_r0.nzPrefix);
  }
}
function NzInputGroupComponent_ng_template_2_ng_template_1_Template(rf, ctx) {
}
function NzInputGroupComponent_ng_template_2_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-form-item-feedback-icon", 9);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(3);
    ɵɵproperty("status", ctx_r0.status);
  }
}
function NzInputGroupComponent_ng_template_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 8);
    ɵɵconditionalCreate(1, NzInputGroupComponent_ng_template_2_Conditional_2_Conditional_1_Template, 1, 1, "nz-form-item-feedback-icon", 9);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵproperty("icon", ctx_r0.nzSuffixIcon)("template", ctx_r0.nzSuffix);
    ɵɵadvance();
    ɵɵconditional(ctx_r0.isFeedback ? 1 : -1);
  }
}
function NzInputGroupComponent_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzInputGroupComponent_ng_template_2_Conditional_0_Template, 1, 2, "span", 7);
    ɵɵtemplate(1, NzInputGroupComponent_ng_template_2_ng_template_1_Template, 0, 0, "ng-template", 5);
    ɵɵconditionalCreate(2, NzInputGroupComponent_ng_template_2_Conditional_2_Template, 2, 3, "span", 8);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    const contentTemplate_r3 = ɵɵreference(5);
    ɵɵconditional(ctx_r0.nzPrefix || ctx_r0.nzPrefixIcon ? 0 : -1);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", contentTemplate_r3);
    ɵɵadvance();
    ɵɵconditional(ctx_r0.nzSuffix || ctx_r0.nzSuffixIcon || ctx_r0.isFeedback ? 2 : -1);
  }
}
function NzInputGroupComponent_ng_template_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 10);
    ɵɵelement(1, "nz-form-item-feedback-icon", 9);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("status", ctx_r0.status);
  }
}
function NzInputGroupComponent_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0);
    ɵɵconditionalCreate(1, NzInputGroupComponent_ng_template_4_Conditional_1_Template, 2, 1, "span", 10);
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵconditional(!ctx_r0.isAddOn && !ctx_r0.isAffix && ctx_r0.isFeedback ? 1 : -1);
  }
}
var _c2 = ["otpInput"];
function NzInputOtpComponent_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "input", 2, 0);
    ɵɵlistener("input", function NzInputOtpComponent_For_1_Template_input_input_0_listener($event) {
      const $index_r2 = ɵɵrestoreView(_r1).$index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onInput($index_r2, $event));
    })("focus", function NzInputOtpComponent_For_1_Template_input_focus_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onFocus($event));
    })("keydown", function NzInputOtpComponent_For_1_Template_input_keydown_0_listener($event) {
      const $index_r2 = ɵɵrestoreView(_r1).$index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onKeyDown($index_r2, $event));
    })("paste", function NzInputOtpComponent_For_1_Template_input_paste_0_listener($event) {
      const $index_r2 = ɵɵrestoreView(_r1).$index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onPaste($index_r2, $event));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r4 = ctx.$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("nzSize", ctx_r2.nzSize)("formControl", item_r4)("nzStatus", ctx_r2.nzStatus);
  }
}
var _c3 = [[["", "nzInputAddonBefore", ""]], [["", "nzInputAddonAfter", ""]], [["", "nzInputSearchEnterButton", ""]], [["", "nzInputPrefix", ""]], [["", "nzInputSuffix", ""]], [["", "nzInputClearIcon", ""]], [["", "nz-input", ""]]];
var _c4 = ["[nzInputAddonBefore]", "[nzInputAddonAfter]", "[nzInputSearchEnterButton]", "[nzInputPrefix]", "[nzInputSuffix]", "[nzInputClearIcon]", "[nz-input]"];
var _c5 = (a0) => ({
  $implicit: a0
});
function NzInputWrapperComponent_Conditional_0_ng_template_0_Template(rf, ctx) {
}
function NzInputWrapperComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputWrapperComponent_Conditional_0_ng_template_0_Template, 0, 0, "ng-template", 4);
  }
  if (rf & 2) {
    ɵɵnextContext();
    const inputWithAddonInner_r1 = ɵɵreference(4);
    ɵɵproperty("ngTemplateOutlet", inputWithAddonInner_r1);
  }
}
function NzInputWrapperComponent_Conditional_1_ng_template_0_Template(rf, ctx) {
}
function NzInputWrapperComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputWrapperComponent_Conditional_1_ng_template_0_Template, 0, 0, "ng-template", 4);
  }
  if (rf & 2) {
    ɵɵnextContext();
    const inputWithAffixInner_r2 = ɵɵreference(8);
    ɵɵproperty("ngTemplateOutlet", inputWithAffixInner_r2);
  }
}
function NzInputWrapperComponent_Conditional_2_ng_template_0_Template(rf, ctx) {
}
function NzInputWrapperComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputWrapperComponent_Conditional_2_ng_template_0_Template, 0, 0, "ng-template", 4);
  }
  if (rf & 2) {
    ɵɵnextContext();
    const input_r3 = ɵɵreference(10);
    ɵɵproperty("ngTemplateOutlet", input_r3);
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_1_ProjectionFallback_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵtextInterpolate(ctx_r3.nzAddonBefore());
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 6);
    ɵɵprojection(1, 0, null, NzInputWrapperComponent_ng_template_3_Conditional_1_ProjectionFallback_1_Template, 1, 1);
    ɵɵelementEnd();
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_2_ng_template_0_Template(rf, ctx) {
}
function NzInputWrapperComponent_ng_template_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputWrapperComponent_ng_template_3_Conditional_2_ng_template_0_Template, 0, 0, "ng-template", 4);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const inputWithAffix_r5 = ɵɵreference(6);
    ɵɵproperty("ngTemplateOutlet", inputWithAffix_r5);
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_3_ng_template_0_Template(rf, ctx) {
}
function NzInputWrapperComponent_ng_template_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputWrapperComponent_ng_template_3_Conditional_3_ng_template_0_Template, 0, 0, "ng-template", 4);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const input_r3 = ɵɵreference(10);
    ɵɵproperty("ngTemplateOutlet", input_r3);
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_ProjectionFallback_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    ɵɵnextContext(2);
    const nzEnterButton_r7 = ɵɵreadContextLet(0);
    ɵɵtextInterpolate1(" ", nzEnterButton_r7, " ");
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_ProjectionFallback_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 9);
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_ProjectionFallback_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_ProjectionFallback_2_Conditional_0_Template, 1, 1)(1, NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_ProjectionFallback_2_Conditional_1_Template, 1, 0, "nz-icon", 9);
  }
  if (rf & 2) {
    ɵɵnextContext();
    const nzEnterButton_r7 = ɵɵreadContextLet(0);
    ɵɵconditional(nzEnterButton_r7 && typeof nzEnterButton_r7 === "string" ? 0 : 1);
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = ɵɵgetCurrentView();
    ɵɵdeclareLet(0);
    ɵɵelementStart(1, "button", 8);
    ɵɵlistener("click", function NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_Template_button_click_1_listener($event) {
      ɵɵrestoreView(_r6);
      const ctx_r3 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r3.inputSearchDir.search($event));
    });
    ɵɵprojection(2, 2, null, NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_ProjectionFallback_2_Template, 2, 1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    const nzEnterButton_r8 = ɵɵstoreLet(ctx_r3.inputSearchDir.nzEnterButton());
    const hasEnterButton_r9 = ctx_r3.inputSearchEnterButton() ?? nzEnterButton_r8 !== false;
    ɵɵadvance();
    ɵɵproperty("nzType", hasEnterButton_r9 ? "primary" : "default")("nzSize", ctx_r3.size())("nzLoading", ctx_r3.inputSearchDir.nzLoading());
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_4_ProjectionFallback_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵtextInterpolate(ctx_r3.nzAddonAfter());
  }
}
function NzInputWrapperComponent_ng_template_3_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 6);
    ɵɵconditionalCreate(1, NzInputWrapperComponent_ng_template_3_Conditional_4_Conditional_1_Template, 4, 4, "button", 7);
    ɵɵprojection(2, 1, null, NzInputWrapperComponent_ng_template_3_Conditional_4_ProjectionFallback_2_Template, 1, 1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵconditional(ctx_r3.inputSearchDir ? 1 : -1);
  }
}
function NzInputWrapperComponent_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 5);
    ɵɵconditionalCreate(1, NzInputWrapperComponent_ng_template_3_Conditional_1_Template, 3, 0, "span", 6);
    ɵɵconditionalCreate(2, NzInputWrapperComponent_ng_template_3_Conditional_2_Template, 1, 1, null, 4)(3, NzInputWrapperComponent_ng_template_3_Conditional_3_Template, 1, 1, null, 4);
    ɵɵconditionalCreate(4, NzInputWrapperComponent_ng_template_3_Conditional_4_Template, 4, 1, "span", 6);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵconditional(ctx_r3.hasAddonBefore() ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r3.hasAffix() ? 2 : 3);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r3.hasAddonAfter() ? 4 : -1);
  }
}
function NzInputWrapperComponent_ng_template_5_ng_template_1_Template(rf, ctx) {
}
function NzInputWrapperComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span");
    ɵɵtemplate(1, NzInputWrapperComponent_ng_template_5_ng_template_1_Template, 0, 0, "ng-template", 4);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext();
    const inputWithAffixInner_r2 = ɵɵreference(8);
    ɵɵclassMap(ctx_r3.affixWrapperClass());
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", inputWithAffixInner_r2);
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_0_ProjectionFallback_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵtextInterpolate(ctx_r3.nzPrefix());
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 10);
    ɵɵprojection(1, 3, null, NzInputWrapperComponent_ng_template_7_Conditional_0_ProjectionFallback_1_Template, 1, 1);
    ɵɵelementEnd();
  }
}
function NzInputWrapperComponent_ng_template_7_ng_template_1_Template(rf, ctx) {
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_1_ProjectionFallback_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 17);
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "span", 16);
    ɵɵlistener("click", function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_1_Template_span_click_0_listener($event) {
      ɵɵrestoreView(_r10);
      const ctx_r3 = ɵɵnextContext(3);
      ctx_r3.clear();
      return ɵɵresetView(ctx_r3.inputSearchDir == null ? null : ctx_r3.inputSearchDir.search($event, "clear"));
    });
    ɵɵprojection(1, 5, null, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_1_ProjectionFallback_1_Template, 1, 0);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵclassProp("ant-input-clear-icon-has-suffix", ctx_r3.nzSuffix() || ctx_r3.suffix() || ctx_r3.hasFeedback() || (ctx_r3.inputPasswordDir == null ? null : ctx_r3.inputPasswordDir.nzVisibilityToggle()))("ant-input-clear-icon-hidden", !ctx_r3.inputDir().value() || ctx_r3.disabled() || ctx_r3.readOnly());
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 13);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r3.dataCount());
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Conditional_1_ng_template_0_Template(rf, ctx) {
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Conditional_1_ng_template_0_Template, 0, 0, "ng-template", 19);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(4);
    ɵɵproperty("ngTemplateOutlet", ctx)("ngTemplateOutletContext", ɵɵpureFunction1(2, _c5, ctx_r3.inputPasswordDir.nzVisible()));
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 20);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(4);
    ɵɵproperty("nzType", ctx_r3.inputPasswordDir.nzVisible() ? "eye" : "eye-invisible");
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "span", 18);
    ɵɵlistener("click", function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Template_span_click_0_listener() {
      ɵɵrestoreView(_r11);
      const ctx_r3 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r3.inputPasswordDir.toggleVisible());
    });
    ɵɵconditionalCreate(1, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Conditional_1_Template, 1, 4, null, 19)(2, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Conditional_2_Template, 1, 1, "nz-icon", 20);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    let tmp_7_0;
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵconditional((tmp_7_0 = ctx_r3.inputPasswordIconTmpl()) ? 1 : 2, tmp_7_0);
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_ProjectionFallback_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵtextInterpolate(ctx_r3.nzSuffix());
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-form-item-feedback-icon", 15);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(3);
    ɵɵproperty("status", ctx_r3.status());
  }
}
function NzInputWrapperComponent_ng_template_7_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 11);
    ɵɵconditionalCreate(1, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_1_Template, 3, 4, "span", 12);
    ɵɵconditionalCreate(2, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_2_Template, 2, 1, "span", 13);
    ɵɵconditionalCreate(3, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_3_Template, 3, 1, "span", 14);
    ɵɵprojection(4, 4, null, NzInputWrapperComponent_ng_template_7_Conditional_2_ProjectionFallback_4_Template, 1, 1);
    ɵɵconditionalCreate(6, NzInputWrapperComponent_ng_template_7_Conditional_2_Conditional_6_Template, 1, 1, "nz-form-item-feedback-icon", 15);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵconditional(ctx_r3.nzAllowClear() ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r3.nzShowCount() ? 2 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r3.inputPasswordDir && ctx_r3.inputPasswordDir.nzVisibilityToggle() ? 3 : -1);
    ɵɵadvance(3);
    ɵɵconditional(ctx_r3.hasFeedback() && ctx_r3.status() ? 6 : -1);
  }
}
function NzInputWrapperComponent_ng_template_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, NzInputWrapperComponent_ng_template_7_Conditional_0_Template, 3, 0, "span", 10);
    ɵɵtemplate(1, NzInputWrapperComponent_ng_template_7_ng_template_1_Template, 0, 0, "ng-template", 4);
    ɵɵconditionalCreate(2, NzInputWrapperComponent_ng_template_7_Conditional_2_Template, 7, 4, "span", 11);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext();
    const input_r3 = ɵɵreference(10);
    ɵɵconditional(ctx_r3.hasPrefix() ? 0 : -1);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", input_r3);
    ɵɵadvance();
    ɵɵconditional(ctx_r3.hasSuffix() ? 2 : -1);
  }
}
function NzInputWrapperComponent_ng_template_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 6);
  }
}
var _c6 = [[["textarea", "nz-input", ""]]];
var _c7 = ["textarea[nz-input]"];
var NzAutosizeDirective = class _NzAutosizeDirective {
  ngZone = inject(NgZone);
  platform = inject(Platform);
  destroyRef = inject(DestroyRef);
  resizeService = inject(NzResizeService);
  el = inject(ElementRef).nativeElement;
  autosize = false;
  cachedLineHeight;
  previousValue;
  previousMinRows;
  minRows;
  maxRows;
  maxHeight = null;
  minHeight = null;
  inputGap = 10;
  destroyed = false;
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }
  set nzAutosize(value) {
    const isAutoSizeType = (data) => typeof data !== "string" && typeof data !== "boolean" && (!!data.maxRows || !!data.minRows);
    if (typeof value === "string" || value === true) {
      this.autosize = true;
    } else if (isAutoSizeType(value)) {
      this.autosize = true;
      this.minRows = value.minRows;
      this.maxRows = value.maxRows;
      this.maxHeight = this.setMaxHeight();
      this.minHeight = this.setMinHeight();
    }
  }
  resizeToFitContent(force = false) {
    this.cacheTextareaLineHeight();
    if (!this.cachedLineHeight) {
      return;
    }
    const textarea = this.el;
    const value = textarea.value;
    if (!force && this.minRows === this.previousMinRows && value === this.previousValue) {
      return;
    }
    const placeholderText = textarea.placeholder;
    textarea.classList.add("nz-textarea-autosize-measuring");
    textarea.placeholder = "";
    let height = Math.round((textarea.scrollHeight - this.inputGap) / this.cachedLineHeight) * this.cachedLineHeight + this.inputGap;
    if (this.maxHeight !== null && height > this.maxHeight) {
      height = this.maxHeight;
    }
    if (this.minHeight !== null && height < this.minHeight) {
      height = this.minHeight;
    }
    textarea.style.height = `${height}px`;
    textarea.classList.remove("nz-textarea-autosize-measuring");
    textarea.placeholder = placeholderText;
    if (typeof requestAnimationFrame !== "undefined") {
      this.ngZone.runOutsideAngular(() => requestAnimationFrame(() => {
        const {
          selectionStart,
          selectionEnd
        } = textarea;
        if (!this.destroyed && document.activeElement === textarea) {
          textarea.setSelectionRange(selectionStart, selectionEnd);
        }
      }));
    }
    this.previousValue = value;
    this.previousMinRows = this.minRows;
  }
  cacheTextareaLineHeight() {
    if (this.cachedLineHeight >= 0 || !this.el.parentNode) {
      return;
    }
    const textareaClone = this.el.cloneNode(false);
    textareaClone.rows = 1;
    textareaClone.style.position = "absolute";
    textareaClone.style.visibility = "hidden";
    textareaClone.style.border = "none";
    textareaClone.style.padding = "0";
    textareaClone.style.height = "";
    textareaClone.style.minHeight = "";
    textareaClone.style.maxHeight = "";
    textareaClone.style.overflow = "hidden";
    this.el.parentNode.appendChild(textareaClone);
    this.cachedLineHeight = textareaClone.clientHeight - this.inputGap;
    this.el.parentNode.removeChild(textareaClone);
    this.maxHeight = this.setMaxHeight();
    this.minHeight = this.setMinHeight();
  }
  setMinHeight() {
    const minHeight = this.minRows && this.cachedLineHeight ? this.minRows * this.cachedLineHeight + this.inputGap : null;
    if (minHeight !== null) {
      this.el.style.minHeight = `${minHeight}px`;
    }
    return minHeight;
  }
  setMaxHeight() {
    const maxHeight = this.maxRows && this.cachedLineHeight ? this.maxRows * this.cachedLineHeight + this.inputGap : null;
    if (maxHeight !== null) {
      this.el.style.maxHeight = `${maxHeight}px`;
    }
    return maxHeight;
  }
  noopInputHandler() {
  }
  ngAfterViewInit() {
    if (this.autosize && this.platform.isBrowser) {
      this.resizeToFitContent();
      this.resizeService.connect().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resizeToFitContent(true));
    }
  }
  ngDoCheck() {
    if (this.autosize && this.platform.isBrowser) {
      this.resizeToFitContent();
    }
  }
  static ɵfac = function NzAutosizeDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzAutosizeDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzAutosizeDirective,
    selectors: [["textarea", "nzAutosize", ""]],
    hostAttrs: ["rows", "1"],
    hostBindings: function NzAutosizeDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("input", function NzAutosizeDirective_input_HostBindingHandler() {
          return ctx.noopInputHandler();
        });
      }
    },
    inputs: {
      nzAutosize: "nzAutosize"
    },
    exportAs: ["nzAutosize"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzAutosizeDirective, [{
    type: Directive,
    args: [{
      selector: "textarea[nzAutosize]",
      exportAs: "nzAutosize",
      host: {
        // Textarea elements that have the directive applied should have a single row by default.
        // Browsers normally show two rows by default and therefore this limits the minRows binding.
        rows: "1",
        "(input)": "noopInputHandler()"
      }
    }]
  }], () => [], {
    nzAutosize: [{
      type: Input
    }]
  });
})();
var NzInputAddonBeforeDirective = class _NzInputAddonBeforeDirective {
  static ɵfac = function NzInputAddonBeforeDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputAddonBeforeDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputAddonBeforeDirective,
    selectors: [["", "nzInputAddonBefore", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputAddonBeforeDirective, [{
    type: Directive,
    args: [{
      selector: "[nzInputAddonBefore]"
    }]
  }], null, null);
})();
var NzInputAddonAfterDirective = class _NzInputAddonAfterDirective {
  static ɵfac = function NzInputAddonAfterDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputAddonAfterDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputAddonAfterDirective,
    selectors: [["", "nzInputAddonAfter", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputAddonAfterDirective, [{
    type: Directive,
    args: [{
      selector: "[nzInputAddonAfter]"
    }]
  }], null, null);
})();
var NzInputPrefixDirective = class _NzInputPrefixDirective {
  static ɵfac = function NzInputPrefixDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputPrefixDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputPrefixDirective,
    selectors: [["", "nzInputPrefix", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputPrefixDirective, [{
    type: Directive,
    args: [{
      selector: "[nzInputPrefix]"
    }]
  }], null, null);
})();
var NzInputSuffixDirective = class _NzInputSuffixDirective {
  static ɵfac = function NzInputSuffixDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputSuffixDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputSuffixDirective,
    selectors: [["", "nzInputSuffix", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputSuffixDirective, [{
    type: Directive,
    args: [{
      selector: "[nzInputSuffix]"
    }]
  }], null, null);
})();
var NzInputGroupSlotComponent = class _NzInputGroupSlotComponent {
  icon = null;
  type = null;
  template = null;
  static ɵfac = function NzInputGroupSlotComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputGroupSlotComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzInputGroupSlotComponent,
    selectors: [["", "nz-input-group-slot", ""]],
    hostVars: 6,
    hostBindings: function NzInputGroupSlotComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-input-group-addon", ctx.type === "addon")("ant-input-prefix", ctx.type === "prefix")("ant-input-suffix", ctx.type === "suffix");
      }
    },
    inputs: {
      icon: "icon",
      type: "type",
      template: "template"
    },
    attrs: _c0,
    ngContentSelectors: _c1,
    decls: 3,
    vars: 2,
    consts: [[3, "nzType"], [4, "nzStringTemplateOutlet"]],
    template: function NzInputGroupSlotComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵconditionalCreate(0, NzInputGroupSlotComponent_Conditional_0_Template, 1, 1, "nz-icon", 0);
        ɵɵtemplate(1, NzInputGroupSlotComponent_ng_container_1_Template, 2, 1, "ng-container", 1);
        ɵɵprojection(2);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.icon ? 0 : -1);
        ɵɵadvance();
        ɵɵproperty("nzStringTemplateOutlet", ctx.template);
      }
    },
    dependencies: [NzIconModule, NzIconDirective, NzOutletModule, NzStringTemplateOutletDirective],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputGroupSlotComponent, [{
    type: Component,
    args: [{
      selector: "[nz-input-group-slot]",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    @if (icon) {
      <nz-icon [nzType]="icon" />
    }
    <ng-container *nzStringTemplateOutlet="template">{{ template }}</ng-container>
    <ng-content />
  `,
      host: {
        "[class.ant-input-group-addon]": `type === 'addon'`,
        "[class.ant-input-prefix]": `type === 'prefix'`,
        "[class.ant-input-suffix]": `type === 'suffix'`
      },
      imports: [NzIconModule, NzOutletModule]
    }]
  }], null, {
    icon: [{
      type: Input
    }],
    type: [{
      type: Input
    }],
    template: [{
      type: Input
    }]
  });
})();
var NzInputPasswordDirective = class _NzInputPasswordDirective {
  nzVisibilityToggle = input(true, ...ngDevMode ? [{
    debugName: "nzVisibilityToggle"
  }] : []);
  nzVisible = model(false, ...ngDevMode ? [{
    debugName: "nzVisible"
  }] : []);
  toggleVisible() {
    this.nzVisible.update((value) => !value);
  }
  static ɵfac = function NzInputPasswordDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputPasswordDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputPasswordDirective,
    selectors: [["nz-input-password"]],
    hostAttrs: [1, "ant-input-password"],
    inputs: {
      nzVisibilityToggle: [1, "nzVisibilityToggle"],
      nzVisible: [1, "nzVisible"]
    },
    outputs: {
      nzVisible: "nzVisibleChange"
    },
    exportAs: ["nzInputPassword"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputPasswordDirective, [{
    type: Directive,
    args: [{
      selector: "nz-input-password",
      exportAs: "nzInputPassword",
      host: {
        class: "ant-input-password"
      }
    }]
  }], null, {
    nzVisibilityToggle: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzVisibilityToggle",
        required: false
      }]
    }],
    nzVisible: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzVisible",
        required: false
      }]
    }, {
      type: Output,
      args: ["nzVisibleChange"]
    }]
  });
})();
var NzInputPasswordIconDirective = class _NzInputPasswordIconDirective {
  /**
   * @internal
   */
  static ngTemplateContextGuard(_, context) {
    return true;
  }
  static ɵfac = function NzInputPasswordIconDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputPasswordIconDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputPasswordIconDirective,
    selectors: [["", "nzInputPasswordIcon", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputPasswordIconDirective, [{
    type: Directive,
    args: [{
      selector: "[nzInputPasswordIcon]"
    }]
  }], null, null);
})();
var NZ_INPUT_WRAPPER = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "nz-input-wrapper" : "");
var NZ_INPUT_SEARCH = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "nz-input-search" : "");
var PREFIX_CLS = "ant-input";
var NzInputDirective = class _NzInputDirective {
  elementRef = inject(ElementRef);
  compactSize = inject(NZ_SPACE_COMPACT_SIZE, {
    optional: true
  });
  destroyRef = inject(DestroyRef);
  nzFormStatusService = inject(NzFormStatusService, {
    optional: true
  });
  nzFormNoStatusService = inject(NzFormNoStatusService, {
    optional: true
  });
  inputWrapper = inject(NZ_INPUT_WRAPPER, {
    host: true,
    optional: true
  });
  focusMonitor = inject(FocusMonitor);
  hostView = inject(ViewContainerRef);
  inputPasswordDir = inject(NzInputPasswordDirective, {
    host: true,
    optional: true
  });
  inputSearchDir = inject(NZ_INPUT_SEARCH, {
    host: true,
    optional: true
  });
  ngControl = inject(NgControl, {
    self: true,
    optional: true
  });
  value = signal(this.elementRef.nativeElement.value, ...ngDevMode ? [{
    debugName: "value"
  }] : []);
  nzVariant = input(...ngDevMode ? [void 0, {
    debugName: "nzVariant"
  }] : []);
  nzSize = input("default", ...ngDevMode ? [{
    debugName: "nzSize"
  }] : []);
  /**
   * @deprecated Will be removed in v22.
   */
  nzStepperless = input(true, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "nzStepperless"
  } : {}), {
    transform: booleanAttribute
  }));
  nzStatus = input("", ...ngDevMode ? [{
    debugName: "nzStatus"
  }] : []);
  disabled = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "disabled"
  } : {}), {
    transform: booleanAttribute
  }));
  readonly = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "readonly"
  } : {}), {
    transform: booleanAttribute
  }));
  controlDisabled = signal(false, ...ngDevMode ? [{
    debugName: "controlDisabled"
  }] : []);
  finalDisabled = this.ngControl ? this.controlDisabled : this.disabled;
  dir = inject(Directionality).valueSignal;
  // TODO: When the input group is removed, we can remove this.
  size = linkedSignal(this.nzSize, ...ngDevMode ? [{
    debugName: "size"
  }] : []);
  formSize = inject(NZ_FORM_SIZE, {
    optional: true
  });
  formVariant = inject(NZ_FORM_VARIANT, {
    optional: true
  });
  status = this.nzFormStatusService ? toSignal(this.nzFormStatusService.formStatusChanges.pipe(map((value) => value.status)), {
    initialValue: ""
  }) : this.nzStatus;
  hasFeedback = toSignal(this.nzFormStatusService?.formStatusChanges.pipe(map((value) => value.hasFeedback)) ?? EMPTY, {
    initialValue: false
  });
  classes = computed(() => getStatusClassNames(PREFIX_CLS, this.status(), this.hasFeedback()), ...ngDevMode ? [{
    debugName: "classes"
  }] : []);
  type = computed(() => {
    if (this.inputPasswordDir) {
      return this.inputPasswordDir.nzVisible() ? "text" : "password";
    }
    if (this.inputSearchDir) {
      return "search";
    }
    return this.elementRef.nativeElement.getAttribute("type") || "text";
  }, ...ngDevMode ? [{
    debugName: "type"
  }] : []);
  focused = signal(false, ...ngDevMode ? [{
    debugName: "focused"
  }] : []);
  finalSize = computed(() => {
    if (this.formSize?.()) {
      return this.formSize();
    }
    if (this.compactSize) {
      return this.compactSize();
    }
    return this.size();
  }, ...ngDevMode ? [{
    debugName: "finalSize"
  }] : []);
  finalVariant = computed(() => this.nzVariant() || this.formVariant?.() || "outlined", ...ngDevMode ? [{
    debugName: "finalVariant"
  }] : []);
  feedbackRef = null;
  // TODO: When the input group is removed, we can remove this.
  disabled$ = toObservable(this.finalDisabled);
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
    this.focusMonitor.monitor(this.elementRef, false).pipe(takeUntilDestroyed()).subscribe((origin) => this.focused.set(!!origin));
    effect(() => {
      this.renderFeedbackIcon();
    });
  }
  ngOnInit() {
    this.ngControl?.statusChanges?.pipe(startWith(null), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.controlDisabled.set(!!this.ngControl.disabled);
    });
    this.ngControl?.valueChanges?.pipe(startWith(this.ngControl?.control?.value), takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.value.set(value ?? "");
    });
  }
  renderFeedbackIcon() {
    if (!this.status() || !this.hasFeedback() || this.inputWrapper || !!this.nzFormNoStatusService) {
      this.hostView.clear();
      this.feedbackRef = null;
      return;
    }
    this.feedbackRef = this.feedbackRef || this.hostView.createComponent(NzFormItemFeedbackIconComponent);
    this.feedbackRef.location.nativeElement.classList.add("ant-input-suffix");
    this.feedbackRef.instance.status = this.status();
    this.feedbackRef.instance.updateIcon();
  }
  focus(options) {
    triggerFocus(this.elementRef.nativeElement, options);
  }
  blur() {
    this.elementRef.nativeElement.blur();
  }
  static ɵfac = function NzInputDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputDirective,
    selectors: [["input", "nz-input", ""], ["textarea", "nz-input", ""]],
    hostAttrs: [1, "ant-input"],
    hostVars: 23,
    hostBindings: function NzInputDirective_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("type", ctx.type())("disabled", ctx.finalDisabled() || null)("readonly", ctx.readonly() || null);
        ɵɵclassMap(ctx.classes());
        ɵɵclassProp("ant-input-disabled", ctx.finalDisabled())("ant-input-borderless", ctx.finalVariant() === "borderless")("ant-input-filled", ctx.finalVariant() === "filled")("ant-input-underlined", ctx.finalVariant() === "underlined")("ant-input-lg", ctx.finalSize() === "large")("ant-input-sm", ctx.finalSize() === "small")("ant-input-rtl", ctx.dir() === "rtl")("ant-input-stepperless", ctx.nzStepperless())("ant-input-focused", ctx.focused());
      }
    },
    inputs: {
      nzVariant: [1, "nzVariant"],
      nzSize: [1, "nzSize"],
      nzStepperless: [1, "nzStepperless"],
      nzStatus: [1, "nzStatus"],
      disabled: [1, "disabled"],
      readonly: [1, "readonly"]
    },
    exportAs: ["nzInput"],
    features: [ɵɵProvidersFeature([{
      provide: NZ_SPACE_COMPACT_ITEM_TYPE,
      useValue: "input"
    }]), ɵɵHostDirectivesFeature([NzSpaceCompactItemDirective])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputDirective, [{
    type: Directive,
    args: [{
      selector: "input[nz-input],textarea[nz-input]",
      exportAs: "nzInput",
      host: {
        class: "ant-input",
        "[attr.type]": "type()",
        "[class]": "classes()",
        "[class.ant-input-disabled]": "finalDisabled()",
        "[class.ant-input-borderless]": `finalVariant() === 'borderless'`,
        "[class.ant-input-filled]": `finalVariant() === 'filled'`,
        "[class.ant-input-underlined]": `finalVariant() === 'underlined'`,
        "[class.ant-input-lg]": `finalSize() === 'large'`,
        "[class.ant-input-sm]": `finalSize() === 'small'`,
        "[attr.disabled]": "finalDisabled() || null",
        "[attr.readonly]": "readonly() || null",
        "[class.ant-input-rtl]": `dir() === 'rtl'`,
        "[class.ant-input-stepperless]": `nzStepperless()`,
        "[class.ant-input-focused]": "focused()"
      },
      hostDirectives: [NzSpaceCompactItemDirective],
      providers: [{
        provide: NZ_SPACE_COMPACT_ITEM_TYPE,
        useValue: "input"
      }]
    }]
  }], () => [], {
    nzVariant: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzVariant",
        required: false
      }]
    }],
    nzSize: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzSize",
        required: false
      }]
    }],
    nzStepperless: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzStepperless",
        required: false
      }]
    }],
    nzStatus: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzStatus",
        required: false
      }]
    }],
    disabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disabled",
        required: false
      }]
    }],
    readonly: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "readonly",
        required: false
      }]
    }]
  });
})();
var NzInputGroupWhitSuffixOrPrefixDirective = class _NzInputGroupWhitSuffixOrPrefixDirective {
  elementRef = inject(ElementRef);
  static ɵfac = function NzInputGroupWhitSuffixOrPrefixDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputGroupWhitSuffixOrPrefixDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputGroupWhitSuffixOrPrefixDirective,
    selectors: [["nz-input-group", "nzSuffix", ""], ["nz-input-group", "nzPrefix", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputGroupWhitSuffixOrPrefixDirective, [{
    type: Directive,
    args: [{
      selector: `nz-input-group[nzSuffix], nz-input-group[nzPrefix]`
    }]
  }], null, null);
})();
var NzInputGroupComponent = class _NzInputGroupComponent {
  focusMonitor = inject(FocusMonitor);
  elementRef = inject(ElementRef);
  renderer = inject(Renderer2);
  cdr = inject(ChangeDetectorRef);
  directionality = inject(Directionality);
  destroyRef = inject(DestroyRef);
  nzFormStatusService = inject(NzFormStatusService, {
    optional: true
  });
  nzFormNoStatusService = inject(NzFormNoStatusService, {
    optional: true
  });
  listOfNzInputDirective;
  nzAddOnBeforeIcon = null;
  nzAddOnAfterIcon = null;
  nzPrefixIcon = null;
  nzSuffixIcon = null;
  nzAddOnBefore;
  nzAddOnAfter;
  nzPrefix;
  nzStatus = "";
  nzSuffix;
  nzSize = "default";
  nzSearch = false;
  isLarge = false;
  isSmall = false;
  isAffix = false;
  isAddOn = false;
  isFeedback = false;
  focused = false;
  disabled = false;
  dir = "ltr";
  // status
  prefixCls = "ant-input";
  affixStatusCls = {};
  groupStatusCls = {};
  affixInGroupStatusCls = {};
  status = "";
  hasFeedback = false;
  constructor() {
    this.destroyRef.onDestroy(() => this.focusMonitor.stopMonitoring(this.elementRef));
  }
  updateChildrenInputSize() {
    if (this.listOfNzInputDirective) {
      this.listOfNzInputDirective.forEach((item) => item["size"].set(this.nzSize));
    }
  }
  ngOnInit() {
    this.nzFormStatusService?.formStatusChanges.pipe(distinctUntilChanged((pre, cur) => pre.status === cur.status && pre.hasFeedback === cur.hasFeedback), takeUntilDestroyed(this.destroyRef)).subscribe(({
      status,
      hasFeedback
    }) => {
      this.setStatusStyles(status, hasFeedback);
    });
    this.focusMonitor.monitor(this.elementRef, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((focusOrigin) => {
      this.focused = !!focusOrigin;
      this.cdr.markForCheck();
    });
    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((direction) => {
      this.dir = direction;
    });
  }
  ngAfterContentInit() {
    this.updateChildrenInputSize();
    const listOfInputChange$ = this.listOfNzInputDirective.changes.pipe(startWith(this.listOfNzInputDirective));
    listOfInputChange$.pipe(switchMap((list) => merge(...[listOfInputChange$, ...list.map((input2) => input2.disabled$)])), mergeMap(() => listOfInputChange$), map((list) => list.some((input2) => input2.finalDisabled())), takeUntilDestroyed(this.destroyRef)).subscribe((disabled) => {
      this.disabled = disabled;
      this.cdr.markForCheck();
    });
  }
  ngOnChanges(changes) {
    const {
      nzSize,
      nzSuffix,
      nzPrefix,
      nzPrefixIcon,
      nzSuffixIcon,
      nzAddOnAfter,
      nzAddOnBefore,
      nzAddOnAfterIcon,
      nzAddOnBeforeIcon,
      nzStatus
    } = changes;
    if (nzSize) {
      this.updateChildrenInputSize();
      this.isLarge = this.nzSize === "large";
      this.isSmall = this.nzSize === "small";
    }
    if (nzSuffix || nzPrefix || nzPrefixIcon || nzSuffixIcon) {
      this.isAffix = !!(this.nzSuffix || this.nzPrefix || this.nzPrefixIcon || this.nzSuffixIcon);
    }
    if (nzAddOnAfter || nzAddOnBefore || nzAddOnAfterIcon || nzAddOnBeforeIcon) {
      this.isAddOn = !!(this.nzAddOnAfter || this.nzAddOnBefore || this.nzAddOnAfterIcon || this.nzAddOnBeforeIcon);
      this.nzFormNoStatusService?.noFormStatus?.next(this.isAddOn);
    }
    if (nzStatus) {
      this.setStatusStyles(this.nzStatus, this.hasFeedback);
    }
  }
  setStatusStyles(status, hasFeedback) {
    this.status = status;
    this.hasFeedback = hasFeedback;
    this.isFeedback = !!status && hasFeedback;
    const baseAffix = !!(this.nzSuffix || this.nzPrefix || this.nzPrefixIcon || this.nzSuffixIcon);
    this.isAffix = baseAffix || !this.isAddOn && hasFeedback;
    this.affixInGroupStatusCls = this.isAffix || this.isFeedback ? this.affixStatusCls = getStatusClassNames(`${this.prefixCls}-affix-wrapper`, status, hasFeedback) : {};
    this.cdr.markForCheck();
    this.affixStatusCls = getStatusClassNames(`${this.prefixCls}-affix-wrapper`, this.isAddOn ? "" : status, this.isAddOn ? false : hasFeedback);
    this.groupStatusCls = getStatusClassNames(`${this.prefixCls}-group-wrapper`, this.isAddOn ? status : "", this.isAddOn ? hasFeedback : false);
    const statusCls = __spreadValues(__spreadValues({}, this.affixStatusCls), this.groupStatusCls);
    Object.keys(statusCls).forEach((status2) => {
      if (statusCls[status2]) {
        this.renderer.addClass(this.elementRef.nativeElement, status2);
      } else {
        this.renderer.removeClass(this.elementRef.nativeElement, status2);
      }
    });
  }
  static ɵfac = function NzInputGroupComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputGroupComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzInputGroupComponent,
    selectors: [["nz-input-group"]],
    contentQueries: function NzInputGroupComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, NzInputDirective, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listOfNzInputDirective = _t);
      }
    },
    hostVars: 38,
    hostBindings: function NzInputGroupComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("ant-input-search-enter-button", ctx.nzSearch)("ant-input-search", ctx.nzSearch)("ant-input-search-rtl", ctx.dir === "rtl")("ant-input-search-sm", ctx.nzSearch && ctx.isSmall)("ant-input-search-large", ctx.nzSearch && ctx.isLarge)("ant-input-group-wrapper", ctx.isAddOn)("ant-input-group-wrapper-rtl", ctx.dir === "rtl")("ant-input-group-wrapper-lg", ctx.isAddOn && ctx.isLarge)("ant-input-group-wrapper-sm", ctx.isAddOn && ctx.isSmall)("ant-input-affix-wrapper", ctx.isAffix && !ctx.isAddOn)("ant-input-affix-wrapper-rtl", ctx.dir === "rtl")("ant-input-affix-wrapper-focused", ctx.isAffix && ctx.focused)("ant-input-affix-wrapper-disabled", ctx.isAffix && ctx.disabled)("ant-input-affix-wrapper-lg", ctx.isAffix && !ctx.isAddOn && ctx.isLarge)("ant-input-affix-wrapper-sm", ctx.isAffix && !ctx.isAddOn && ctx.isSmall)("ant-input-group", !ctx.isAffix && !ctx.isAddOn)("ant-input-group-rtl", ctx.dir === "rtl")("ant-input-group-lg", !ctx.isAffix && !ctx.isAddOn && ctx.isLarge)("ant-input-group-sm", !ctx.isAffix && !ctx.isAddOn && ctx.isSmall);
      }
    },
    inputs: {
      nzAddOnBeforeIcon: "nzAddOnBeforeIcon",
      nzAddOnAfterIcon: "nzAddOnAfterIcon",
      nzPrefixIcon: "nzPrefixIcon",
      nzSuffixIcon: "nzSuffixIcon",
      nzAddOnBefore: "nzAddOnBefore",
      nzAddOnAfter: "nzAddOnAfter",
      nzPrefix: "nzPrefix",
      nzStatus: "nzStatus",
      nzSuffix: "nzSuffix",
      nzSize: "nzSize",
      nzSearch: [2, "nzSearch", "nzSearch", booleanAttribute]
    },
    exportAs: ["nzInputGroup"],
    features: [ɵɵProvidersFeature([NzFormNoStatusService, {
      provide: NZ_SPACE_COMPACT_ITEM_TYPE,
      useValue: "input"
    }]), ɵɵHostDirectivesFeature([NzSpaceCompactItemDirective]), ɵɵNgOnChangesFeature],
    ngContentSelectors: _c1,
    decls: 6,
    vars: 1,
    consts: [["affixTemplate", ""], ["contentTemplate", ""], [1, "ant-input-wrapper", "ant-input-group"], ["nz-input-group-slot", "", "type", "addon", 3, "icon", "template"], [1, "ant-input-affix-wrapper", 3, "ant-input-affix-wrapper-disabled", "ant-input-affix-wrapper-sm", "ant-input-affix-wrapper-lg", "ant-input-affix-wrapper-focused", "class"], [3, "ngTemplateOutlet"], [1, "ant-input-affix-wrapper"], ["nz-input-group-slot", "", "type", "prefix", 3, "icon", "template"], ["nz-input-group-slot", "", "type", "suffix", 3, "icon", "template"], [3, "status"], ["nz-input-group-slot", "", "type", "suffix"]],
    template: function NzInputGroupComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵconditionalCreate(0, NzInputGroupComponent_Conditional_0_Template, 5, 3, "span", 2)(1, NzInputGroupComponent_Conditional_1_Template, 2, 1);
        ɵɵtemplate(2, NzInputGroupComponent_ng_template_2_Template, 3, 3, "ng-template", null, 0, ɵɵtemplateRefExtractor)(4, NzInputGroupComponent_ng_template_4_Template, 2, 1, "ng-template", null, 1, ɵɵtemplateRefExtractor);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.isAddOn ? 0 : 1);
      }
    },
    dependencies: [NzInputGroupSlotComponent, NgTemplateOutlet, NzFormItemFeedbackIconComponent],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputGroupComponent, [{
    type: Component,
    args: [{
      selector: "nz-input-group",
      exportAs: "nzInputGroup",
      imports: [NzInputGroupSlotComponent, NgTemplateOutlet, NzFormItemFeedbackIconComponent],
      encapsulation: ViewEncapsulation.None,
      providers: [NzFormNoStatusService, {
        provide: NZ_SPACE_COMPACT_ITEM_TYPE,
        useValue: "input"
      }],
      template: `
    @if (isAddOn) {
      <span class="ant-input-wrapper ant-input-group">
        @if (nzAddOnBefore || nzAddOnBeforeIcon) {
          <span nz-input-group-slot type="addon" [icon]="nzAddOnBeforeIcon" [template]="nzAddOnBefore"></span>
        }

        @if (isAffix || hasFeedback) {
          <span
            class="ant-input-affix-wrapper"
            [class.ant-input-affix-wrapper-disabled]="disabled"
            [class.ant-input-affix-wrapper-sm]="isSmall"
            [class.ant-input-affix-wrapper-lg]="isLarge"
            [class.ant-input-affix-wrapper-focused]="focused"
            [class]="affixInGroupStatusCls"
          >
            <ng-template [ngTemplateOutlet]="affixTemplate" />
          </span>
        } @else {
          <ng-template [ngTemplateOutlet]="contentTemplate" />
        }
        @if (nzAddOnAfter || nzAddOnAfterIcon) {
          <span nz-input-group-slot type="addon" [icon]="nzAddOnAfterIcon" [template]="nzAddOnAfter"></span>
        }
      </span>
    } @else {
      @if (isAffix) {
        <ng-template [ngTemplateOutlet]="affixTemplate" />
      } @else {
        <ng-template [ngTemplateOutlet]="contentTemplate" />
      }
    }

    <!-- affix template -->
    <ng-template #affixTemplate>
      @if (nzPrefix || nzPrefixIcon) {
        <span nz-input-group-slot type="prefix" [icon]="nzPrefixIcon" [template]="nzPrefix"></span>
      }
      <ng-template [ngTemplateOutlet]="contentTemplate" />
      @if (nzSuffix || nzSuffixIcon || isFeedback) {
        <span nz-input-group-slot type="suffix" [icon]="nzSuffixIcon" [template]="nzSuffix">
          @if (isFeedback) {
            <nz-form-item-feedback-icon [status]="status" />
          }
        </span>
      }
    </ng-template>

    <!-- content template -->
    <ng-template #contentTemplate>
      <ng-content />
      @if (!isAddOn && !isAffix && isFeedback) {
        <span nz-input-group-slot type="suffix">
          <nz-form-item-feedback-icon [status]="status" />
        </span>
      }
    </ng-template>
  `,
      host: {
        "[class.ant-input-search-enter-button]": `nzSearch`,
        "[class.ant-input-search]": `nzSearch`,
        "[class.ant-input-search-rtl]": `dir === 'rtl'`,
        "[class.ant-input-search-sm]": `nzSearch && isSmall`,
        "[class.ant-input-search-large]": `nzSearch && isLarge`,
        "[class.ant-input-group-wrapper]": `isAddOn`,
        "[class.ant-input-group-wrapper-rtl]": `dir === 'rtl'`,
        "[class.ant-input-group-wrapper-lg]": `isAddOn && isLarge`,
        "[class.ant-input-group-wrapper-sm]": `isAddOn && isSmall`,
        "[class.ant-input-affix-wrapper]": `isAffix && !isAddOn`,
        "[class.ant-input-affix-wrapper-rtl]": `dir === 'rtl'`,
        "[class.ant-input-affix-wrapper-focused]": `isAffix && focused`,
        "[class.ant-input-affix-wrapper-disabled]": `isAffix && disabled`,
        "[class.ant-input-affix-wrapper-lg]": `isAffix && !isAddOn && isLarge`,
        "[class.ant-input-affix-wrapper-sm]": `isAffix && !isAddOn && isSmall`,
        "[class.ant-input-group]": `!isAffix && !isAddOn`,
        "[class.ant-input-group-rtl]": `dir === 'rtl'`,
        "[class.ant-input-group-lg]": `!isAffix && !isAddOn && isLarge`,
        "[class.ant-input-group-sm]": `!isAffix && !isAddOn && isSmall`
      },
      hostDirectives: [NzSpaceCompactItemDirective],
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }], () => [], {
    listOfNzInputDirective: [{
      type: ContentChildren,
      args: [NzInputDirective]
    }],
    nzAddOnBeforeIcon: [{
      type: Input
    }],
    nzAddOnAfterIcon: [{
      type: Input
    }],
    nzPrefixIcon: [{
      type: Input
    }],
    nzSuffixIcon: [{
      type: Input
    }],
    nzAddOnBefore: [{
      type: Input
    }],
    nzAddOnAfter: [{
      type: Input
    }],
    nzPrefix: [{
      type: Input
    }],
    nzStatus: [{
      type: Input
    }],
    nzSuffix: [{
      type: Input
    }],
    nzSize: [{
      type: Input
    }],
    nzSearch: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }]
  });
})();
var NzInputOtpComponent = class _NzInputOtpComponent {
  formBuilder = inject(FormBuilder);
  destroyRef = inject(DestroyRef);
  otpInputs;
  nzLength = 6;
  nzSize = "default";
  disabled = false;
  nzStatus = "";
  nzFormatter = (value) => value;
  nzMask = null;
  otpArray;
  internalValue = [];
  onChangeCallback;
  onTouched = () => {
  };
  constructor() {
    this.createFormArray();
  }
  ngOnChanges(changes) {
    if (changes["nzLength"]?.currentValue) {
      this.createFormArray();
    }
    if (changes["disabled"]) {
      this.setDisabledState(this.disabled);
    }
  }
  onInput(index, event) {
    const inputElement = event.target;
    const nextInput = this.otpInputs.toArray()[index + 1];
    if (inputElement.value && nextInput) {
      nextInput.nativeElement.focus();
    } else if (!nextInput) {
      this.selectInputBox(index);
    }
  }
  onFocus(event) {
    const inputElement = event.target;
    inputElement.select();
  }
  onKeyDown(index, event) {
    const previousInput = this.otpInputs.toArray()[index - 1];
    if (event.keyCode === BACKSPACE) {
      event.preventDefault();
      this.internalValue[index] = "";
      this.otpArray.at(index).setValue("", {
        emitEvent: false
      });
      if (previousInput) {
        this.selectInputBox(index - 1);
      }
      this.emitValue();
    } else if (event.keyCode === LEFT_ARROW) {
      event.preventDefault();
      this.selectInputBox(index - 1);
    } else if (event.keyCode === RIGHT_ARROW) {
      event.preventDefault();
      this.selectInputBox(index + 1);
    }
  }
  writeValue(value) {
    if (!value) {
      this.otpArray.reset();
      return;
    }
    const controlValues = value.split("");
    this.internalValue = controlValues;
    controlValues.forEach((val, i) => {
      const formattedValue = this.nzFormatter(val);
      const value2 = this.nzMask ? this.nzMask : formattedValue;
      this.otpArray.at(i).setValue(value2, {
        emitEvent: false
      });
    });
  }
  registerOnChange(fn) {
    this.onChangeCallback = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    if (isDisabled) {
      this.otpArray.disable();
    } else {
      this.otpArray.enable();
    }
  }
  onPaste(index, event) {
    const pastedText = event.clipboardData?.getData("text") || "";
    if (!pastedText) return;
    let currentIndex = index;
    for (const char of pastedText.split("")) {
      if (currentIndex < this.nzLength) {
        const formattedChar = this.nzFormatter(char);
        this.internalValue[currentIndex] = char;
        const maskedValue = this.nzMask ? this.nzMask : formattedChar;
        this.otpArray.at(currentIndex).setValue(maskedValue, {
          emitEvent: false
        });
        currentIndex++;
      } else {
        break;
      }
    }
    event.preventDefault();
    this.selectInputBox(currentIndex);
    this.emitValue();
  }
  createFormArray() {
    this.otpArray = this.formBuilder.array([]);
    this.internalValue = new Array(this.nzLength).fill("");
    for (let i = 0; i < this.nzLength; i++) {
      const control = this.formBuilder.nonNullable.control("", [Validators.required]);
      control.valueChanges.pipe(tap((value) => {
        const unmaskedValue = this.nzFormatter(value);
        this.internalValue[i] = unmaskedValue;
        control.setValue(this.nzMask ?? unmaskedValue, {
          emitEvent: false
        });
        this.emitValue();
      }), takeUntilDestroyed(this.destroyRef)).subscribe();
      this.otpArray.push(control);
    }
  }
  emitValue() {
    const result = this.internalValue.join("");
    if (this.onChangeCallback) {
      this.onChangeCallback(result);
    }
  }
  selectInputBox(index) {
    const otpInputArray = this.otpInputs.toArray();
    if (index <= 0) index = 0;
    if (index >= otpInputArray.length) index = otpInputArray.length - 1;
    otpInputArray[index].nativeElement.select();
  }
  static ɵfac = function NzInputOtpComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputOtpComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzInputOtpComponent,
    selectors: [["nz-input-otp"]],
    viewQuery: function NzInputOtpComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c2, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.otpInputs = _t);
      }
    },
    hostAttrs: [1, "ant-otp"],
    inputs: {
      nzLength: [2, "nzLength", "nzLength", numberAttribute],
      nzSize: "nzSize",
      disabled: [2, "disabled", "disabled", booleanAttribute],
      nzStatus: "nzStatus",
      nzFormatter: "nzFormatter",
      nzMask: "nzMask"
    },
    exportAs: ["nzInputOtp"],
    features: [ɵɵProvidersFeature([{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _NzInputOtpComponent),
      multi: true
    }]), ɵɵNgOnChangesFeature],
    decls: 2,
    vars: 0,
    consts: [["otpInput", ""], ["nz-input", "", "type", "text", "maxlength", "1", "size", "1", 1, "ant-otp-input", 3, "nzSize", "formControl", "nzStatus"], ["nz-input", "", "type", "text", "maxlength", "1", "size", "1", 1, "ant-otp-input", 3, "input", "focus", "keydown", "paste", "nzSize", "formControl", "nzStatus"]],
    template: function NzInputOtpComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵrepeaterCreate(0, NzInputOtpComponent_For_1_Template, 2, 3, "input", 1, ɵɵrepeaterTrackByIndex);
      }
      if (rf & 2) {
        ɵɵrepeater(ctx.otpArray.controls);
      }
    },
    dependencies: [NzInputDirective, ReactiveFormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, FormControlDirective],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputOtpComponent, [{
    type: Component,
    args: [{
      selector: "nz-input-otp",
      exportAs: "nzInputOtp",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
    @for (item of otpArray.controls; track $index) {
      <input
        nz-input
        class="ant-otp-input"
        type="text"
        maxlength="1"
        size="1"
        [nzSize]="nzSize"
        [formControl]="item"
        [nzStatus]="nzStatus"
        (input)="onInput($index, $event)"
        (focus)="onFocus($event)"
        (keydown)="onKeyDown($index, $event)"
        (paste)="onPaste($index, $event)"
        #otpInput
      />
    }
  `,
      host: {
        class: "ant-otp"
      },
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NzInputOtpComponent),
        multi: true
      }],
      imports: [NzInputDirective, ReactiveFormsModule]
    }]
  }], () => [], {
    otpInputs: [{
      type: ViewChildren,
      args: ["otpInput"]
    }],
    nzLength: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    nzSize: [{
      type: Input
    }],
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzStatus: [{
      type: Input
    }],
    nzFormatter: [{
      type: Input
    }],
    nzMask: [{
      type: Input
    }]
  });
})();
var NzInputSearchDirective = class _NzInputSearchDirective {
  inputDir = contentChild.required(NzInputDirective);
  inputRef = contentChild.required(NzInputDirective, {
    read: ElementRef
  });
  nzEnterButton = input(false, ...ngDevMode ? [{
    debugName: "nzEnterButton"
  }] : []);
  nzLoading = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "nzLoading"
  } : {}), {
    transform: booleanAttribute
  }));
  nzSearch = output();
  size = computed(() => this.inputDir().nzSize(), ...ngDevMode ? [{
    debugName: "size"
  }] : []);
  search(event, source = "input") {
    if (!this.nzLoading()) {
      this.nzSearch.emit({
        value: this.inputRef().nativeElement.value,
        event,
        source
      });
    }
  }
  onEnter(event) {
    if (event.target === this.inputRef().nativeElement) {
      this.search(event);
    }
  }
  static ɵfac = function NzInputSearchDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputSearchDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputSearchDirective,
    selectors: [["nz-input-search"]],
    contentQueries: function NzInputSearchDirective_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuerySignal(dirIndex, ctx.inputDir, NzInputDirective, 5)(dirIndex, ctx.inputRef, NzInputDirective, 5, ElementRef);
      }
      if (rf & 2) {
        ɵɵqueryAdvance(2);
      }
    },
    hostAttrs: [1, "ant-input-search"],
    hostVars: 6,
    hostBindings: function NzInputSearchDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("keydown.enter", function NzInputSearchDirective_keydown_enter_HostBindingHandler($event) {
          return ctx.onEnter($event);
        });
      }
      if (rf & 2) {
        ɵɵclassProp("ant-input-search-large", ctx.size() === "large")("ant-input-search-small", ctx.size() === "small")("ant-input-search-with-button", ctx.nzEnterButton() !== false);
      }
    },
    inputs: {
      nzEnterButton: [1, "nzEnterButton"],
      nzLoading: [1, "nzLoading"]
    },
    outputs: {
      nzSearch: "nzSearch"
    },
    exportAs: ["nzInputSearch"],
    features: [ɵɵProvidersFeature([{
      provide: NZ_INPUT_SEARCH,
      useExisting: forwardRef(() => _NzInputSearchDirective)
    }])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputSearchDirective, [{
    type: Directive,
    args: [{
      selector: "nz-input-search",
      exportAs: "nzInputSearch",
      providers: [{
        provide: NZ_INPUT_SEARCH,
        useExisting: forwardRef(() => NzInputSearchDirective)
      }],
      host: {
        class: "ant-input-search",
        "[class.ant-input-search-large]": `size() === 'large'`,
        "[class.ant-input-search-small]": `size() === 'small'`,
        "[class.ant-input-search-with-button]": "nzEnterButton() !== false",
        "(keydown.enter)": "onEnter($any($event))"
      }
    }]
  }], null, {
    inputDir: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputDirective), {
        isSignal: true
      }]
    }],
    inputRef: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputDirective), __spreadProps(__spreadValues({}, {
        read: ElementRef
      }), {
        isSignal: true
      })]
    }],
    nzEnterButton: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzEnterButton",
        required: false
      }]
    }],
    nzLoading: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzLoading",
        required: false
      }]
    }],
    nzSearch: [{
      type: Output,
      args: ["nzSearch"]
    }]
  });
})();
var NzInputSearchEnterButtonDirective = class _NzInputSearchEnterButtonDirective {
  static ɵfac = function NzInputSearchEnterButtonDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputSearchEnterButtonDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NzInputSearchEnterButtonDirective,
    selectors: [["", "nzInputSearchEnterButton", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputSearchEnterButtonDirective, [{
    type: Directive,
    args: [{
      selector: "[nzInputSearchEnterButton]"
    }]
  }], null, null);
})();
var NzInputWrapperComponent = class _NzInputWrapperComponent {
  focusMonitor = inject(FocusMonitor);
  inputPasswordDir = inject(NzInputPasswordDirective, {
    self: true,
    optional: true
  });
  inputSearchDir = inject(NzInputSearchDirective, {
    self: true,
    optional: true
  });
  inputRef = contentChild.required(NzInputDirective, {
    read: ElementRef
  });
  inputDir = contentChild.required(NzInputDirective);
  prefix = contentChild(NzInputPrefixDirective, ...ngDevMode ? [{
    debugName: "prefix"
  }] : []);
  suffix = contentChild(NzInputSuffixDirective, ...ngDevMode ? [{
    debugName: "suffix"
  }] : []);
  addonBefore = contentChild(NzInputAddonBeforeDirective, ...ngDevMode ? [{
    debugName: "addonBefore"
  }] : []);
  addonAfter = contentChild(NzInputAddonAfterDirective, ...ngDevMode ? [{
    debugName: "addonAfter"
  }] : []);
  inputPasswordIconTmpl = contentChild(NzInputPasswordIconDirective, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "inputPasswordIconTmpl"
  } : {}), {
    read: TemplateRef
  }));
  inputSearchEnterButton = contentChild(NzInputSearchEnterButtonDirective, ...ngDevMode ? [{
    debugName: "inputSearchEnterButton"
  }] : []);
  nzAllowClear = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "nzAllowClear"
  } : {}), {
    transform: booleanAttribute
  }));
  nzPrefix = input(...ngDevMode ? [void 0, {
    debugName: "nzPrefix"
  }] : []);
  nzSuffix = input(...ngDevMode ? [void 0, {
    debugName: "nzSuffix"
  }] : []);
  nzAddonBefore = input(...ngDevMode ? [void 0, {
    debugName: "nzAddonBefore"
  }] : []);
  nzAddonAfter = input(...ngDevMode ? [void 0, {
    debugName: "nzAddonAfter"
  }] : []);
  nzShowCount = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "nzShowCount"
  } : {}), {
    transform: booleanAttribute
  }));
  nzCount = input(...ngDevMode ? [void 0, {
    debugName: "nzCount"
  }] : []);
  nzClear = output();
  size = computed(() => this.inputDir().nzSize(), ...ngDevMode ? [{
    debugName: "size"
  }] : []);
  variant = computed(() => this.inputDir().nzVariant(), ...ngDevMode ? [{
    debugName: "variant"
  }] : []);
  disabled = computed(() => this.inputDir().finalDisabled(), ...ngDevMode ? [{
    debugName: "disabled"
  }] : []);
  readOnly = computed(() => this.inputDir().readonly(), ...ngDevMode ? [{
    debugName: "readOnly"
  }] : []);
  status = computed(() => this.inputDir().status(), ...ngDevMode ? [{
    debugName: "status"
  }] : []);
  hasFeedback = computed(() => this.inputDir().hasFeedback(), ...ngDevMode ? [{
    debugName: "hasFeedback"
  }] : []);
  hasPrefix = computed(() => !!this.nzPrefix() || !!this.prefix(), ...ngDevMode ? [{
    debugName: "hasPrefix"
  }] : []);
  hasSuffix = computed(() => !!this.nzSuffix() || !!this.suffix() || this.nzAllowClear() || this.hasFeedback() || this.nzShowCount() || this.inputPasswordDir, ...ngDevMode ? [{
    debugName: "hasSuffix"
  }] : []);
  hasAffix = computed(() => this.hasPrefix() || this.hasSuffix(), ...ngDevMode ? [{
    debugName: "hasAffix"
  }] : []);
  hasAddonBefore = computed(() => !!this.nzAddonBefore() || !!this.addonBefore(), ...ngDevMode ? [{
    debugName: "hasAddonBefore"
  }] : []);
  hasAddonAfter = computed(() => !!this.nzAddonAfter() || !!this.addonAfter() || !!this.inputSearchDir, ...ngDevMode ? [{
    debugName: "hasAddonAfter"
  }] : []);
  hasAddon = computed(() => this.hasAddonBefore() || this.hasAddonAfter(), ...ngDevMode ? [{
    debugName: "hasAddon"
  }] : []);
  compactSize = inject(NZ_SPACE_COMPACT_SIZE, {
    optional: true
  });
  dir = inject(Directionality).valueSignal;
  focused = signal(false, ...ngDevMode ? [{
    debugName: "focused"
  }] : []);
  isTextarea = computed(() => this.inputRef().nativeElement instanceof HTMLTextAreaElement, ...ngDevMode ? [{
    debugName: "isTextarea"
  }] : []);
  finalSize = computed(() => {
    if (this.compactSize) {
      return this.compactSize();
    }
    return this.size();
  }, ...ngDevMode ? [{
    debugName: "finalSize"
  }] : []);
  class = computed(() => {
    if (this.hasAddon()) {
      return this.groupWrapperClass();
    }
    if (this.hasAffix()) {
      return this.affixWrapperClass();
    }
    return null;
  }, ...ngDevMode ? [{
    debugName: "class"
  }] : []);
  affixWrapperClass = computed(() => {
    return __spreadValues(__spreadValues({
      "ant-input-affix-wrapper": true,
      "ant-input-affix-wrapper-lg": this.finalSize() === "large",
      "ant-input-affix-wrapper-sm": this.finalSize() === "small",
      "ant-input-affix-wrapper-disabled": this.disabled(),
      "ant-input-affix-wrapper-readonly": this.readOnly(),
      "ant-input-affix-wrapper-focused": this.focused(),
      "ant-input-affix-wrapper-rtl": this.dir() === "rtl"
    }, getStatusClassNames("ant-input-affix-wrapper", this.status(), this.hasFeedback())), getVariantClassNames("ant-input-affix-wrapper", this.variant()));
  }, ...ngDevMode ? [{
    debugName: "affixWrapperClass"
  }] : []);
  groupWrapperClass = computed(() => {
    return __spreadValues(__spreadValues({
      "ant-input-group-wrapper": true,
      "ant-input-group-wrapper-sm": this.finalSize() === "small",
      "ant-input-group-wrapper-lg": this.finalSize() === "large",
      "ant-input-group-wrapper-rtl": this.dir() === "rtl"
    }, getStatusClassNames("ant-input-group-wrapper", this.status(), this.hasFeedback())), getVariantClassNames("ant-input-group-wrapper", this.variant()));
  }, ...ngDevMode ? [{
    debugName: "groupWrapperClass"
  }] : []);
  inputValue = toSignal(toObservable(this.inputDir).pipe(switchMap((inputDir) => {
    const ngControl = inputDir.ngControl;
    if (!ngControl) return EMPTY;
    return (ngControl.valueChanges ?? EMPTY).pipe(startWith(ngControl.value));
  })));
  formattedValue = computed(() => {
    const countConfig = this.nzCount();
    const inputValue = this.inputValue();
    const countMax = countConfig?.max ?? 0;
    const value = isNotNil(inputValue) ? String(inputValue) : "";
    let formattedValue = value;
    if (countConfig?.exceedFormatter) {
      formattedValue = countConfig.exceedFormatter(value, {
        max: countMax
      });
    }
    return formattedValue;
  }, ...ngDevMode ? [{
    debugName: "formattedValue"
  }] : []);
  computedCount = computed(() => {
    const countConfig = this.nzCount();
    const formattedValue = this.formattedValue();
    let computedCount = formattedValue.length;
    if (countConfig?.strategy) {
      computedCount = countConfig.strategy(formattedValue);
    }
    return computedCount;
  }, ...ngDevMode ? [{
    debugName: "computedCount"
  }] : []);
  dataCount = computed(() => {
    const countConfig = this.nzCount();
    const computedCount = this.computedCount();
    const countMax = countConfig?.max;
    return `${computedCount}${countMax ? `/${countMax}` : ``}`;
  }, ...ngDevMode ? [{
    debugName: "dataCount"
  }] : []);
  isOutOfRange = computed(() => {
    const countConfig = this.nzCount();
    const countMax = countConfig?.max;
    if (isNumberFinite(countMax)) {
      return this.computedCount() > countMax;
    }
    return false;
  }, ...ngDevMode ? [{
    debugName: "isOutOfRange"
  }] : []);
  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.inputRef();
      this.focusMonitor.monitor(element).pipe(takeUntilDestroyed(destroyRef)).subscribe((origin) => {
        this.focused.set(!!origin);
      });
      destroyRef.onDestroy(() => {
        this.focusMonitor.stopMonitoring(element);
      });
    });
    effect(() => {
      if (this.nzCount()) {
        const inputValue = this.inputValue();
        const formattedValue = this.formattedValue();
        if (isNotNil(inputValue) && formattedValue !== inputValue) {
          this.inputDir().ngControl?.control?.setValue(formattedValue);
        }
      }
    });
  }
  clear() {
    this.inputDir().ngControl?.control?.setValue("");
    this.nzClear.emit();
  }
  static ɵfac = function NzInputWrapperComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputWrapperComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzInputWrapperComponent,
    selectors: [["nz-input-wrapper"], ["nz-input-password"], ["nz-input-search"]],
    contentQueries: function NzInputWrapperComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuerySignal(dirIndex, ctx.inputRef, NzInputDirective, 5, ElementRef)(dirIndex, ctx.inputDir, NzInputDirective, 5)(dirIndex, ctx.prefix, NzInputPrefixDirective, 5)(dirIndex, ctx.suffix, NzInputSuffixDirective, 5)(dirIndex, ctx.addonBefore, NzInputAddonBeforeDirective, 5)(dirIndex, ctx.addonAfter, NzInputAddonAfterDirective, 5)(dirIndex, ctx.inputPasswordIconTmpl, NzInputPasswordIconDirective, 5, TemplateRef)(dirIndex, ctx.inputSearchEnterButton, NzInputSearchEnterButtonDirective, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance(8);
      }
    },
    hostVars: 8,
    hostBindings: function NzInputWrapperComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassMap(ctx.class());
        ɵɵclassProp("ant-input-disabled", ctx.disabled())("ant-input-out-of-range", ctx.nzShowCount() && ctx.isOutOfRange())("ant-input-affix-wrapper-textarea-with-clear-btn", ctx.nzAllowClear() && ctx.isTextarea());
      }
    },
    inputs: {
      nzAllowClear: [1, "nzAllowClear"],
      nzPrefix: [1, "nzPrefix"],
      nzSuffix: [1, "nzSuffix"],
      nzAddonBefore: [1, "nzAddonBefore"],
      nzAddonAfter: [1, "nzAddonAfter"],
      nzShowCount: [1, "nzShowCount"],
      nzCount: [1, "nzCount"]
    },
    outputs: {
      nzClear: "nzClear"
    },
    exportAs: ["nzInputWrapper"],
    features: [ɵɵProvidersFeature([{
      provide: NZ_SPACE_COMPACT_ITEM_TYPE,
      useValue: "input"
    }, {
      provide: NZ_INPUT_WRAPPER,
      useExisting: forwardRef(() => _NzInputWrapperComponent)
    }]), ɵɵHostDirectivesFeature([NzSpaceCompactItemDirective])],
    ngContentSelectors: _c4,
    decls: 11,
    vars: 1,
    consts: [["inputWithAddonInner", ""], ["inputWithAffix", ""], ["inputWithAffixInner", ""], ["input", ""], [3, "ngTemplateOutlet"], [1, "ant-input-wrapper", "ant-input-group"], [1, "ant-input-group-addon"], ["nz-button", "", "type", "button", 1, "ant-input-search-button", 3, "nzType", "nzSize", "nzLoading"], ["nz-button", "", "type", "button", 1, "ant-input-search-button", 3, "click", "nzType", "nzSize", "nzLoading"], ["nzType", "search", "nzTheme", "outline"], [1, "ant-input-prefix"], [1, "ant-input-suffix"], ["role", "button", "tabindex", "-1", 1, "ant-input-clear-icon", 3, "ant-input-clear-icon-has-suffix", "ant-input-clear-icon-hidden"], [1, "ant-input-show-count-suffix"], ["role", "button", "tabindex", "-1", 1, "ant-input-password-icon"], [3, "status"], ["role", "button", "tabindex", "-1", 1, "ant-input-clear-icon", 3, "click"], ["nzType", "close-circle", "nzTheme", "fill"], ["role", "button", "tabindex", "-1", 1, "ant-input-password-icon", 3, "click"], [3, "ngTemplateOutlet", "ngTemplateOutletContext"], ["nzTheme", "outline", 3, "nzType"]],
    template: function NzInputWrapperComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef(_c3);
        ɵɵconditionalCreate(0, NzInputWrapperComponent_Conditional_0_Template, 1, 1, null, 4)(1, NzInputWrapperComponent_Conditional_1_Template, 1, 1, null, 4)(2, NzInputWrapperComponent_Conditional_2_Template, 1, 1, null, 4);
        ɵɵtemplate(3, NzInputWrapperComponent_ng_template_3_Template, 5, 3, "ng-template", null, 0, ɵɵtemplateRefExtractor)(5, NzInputWrapperComponent_ng_template_5_Template, 2, 3, "ng-template", null, 1, ɵɵtemplateRefExtractor)(7, NzInputWrapperComponent_ng_template_7_Template, 3, 3, "ng-template", null, 2, ɵɵtemplateRefExtractor)(9, NzInputWrapperComponent_ng_template_9_Template, 1, 0, "ng-template", null, 3, ɵɵtemplateRefExtractor);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.hasAddon() ? 0 : ctx.hasAffix() ? 1 : 2);
      }
    },
    dependencies: [NzIconModule, NzIconDirective, NzButtonModule, NzButtonComponent, NzTransitionPatchDirective, NzWaveDirective, NzFormItemFeedbackIconComponent, NgTemplateOutlet],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputWrapperComponent, [{
    type: Component,
    args: [{
      selector: "nz-input-wrapper,nz-input-password,nz-input-search",
      exportAs: "nzInputWrapper",
      imports: [NzIconModule, NzButtonModule, NzFormItemFeedbackIconComponent, NgTemplateOutlet],
      template: `
    @if (hasAddon()) {
      <ng-template [ngTemplateOutlet]="inputWithAddonInner" />
    } @else if (hasAffix()) {
      <ng-template [ngTemplateOutlet]="inputWithAffixInner" />
    } @else {
      <ng-template [ngTemplateOutlet]="input" />
    }

    <ng-template #inputWithAddonInner>
      <span class="ant-input-wrapper ant-input-group">
        @if (hasAddonBefore()) {
          <span class="ant-input-group-addon">
            <ng-content select="[nzInputAddonBefore]">{{ nzAddonBefore() }}</ng-content>
          </span>
        }

        @if (hasAffix()) {
          <ng-template [ngTemplateOutlet]="inputWithAffix" />
        } @else {
          <ng-template [ngTemplateOutlet]="input" />
        }

        @if (hasAddonAfter()) {
          <span class="ant-input-group-addon">
            @if (inputSearchDir) {
              @let nzEnterButton = inputSearchDir.nzEnterButton();
              @let hasEnterButton = inputSearchEnterButton() ?? nzEnterButton !== false;
              <button
                nz-button
                [nzType]="hasEnterButton ? 'primary' : 'default'"
                [nzSize]="size()"
                [nzLoading]="inputSearchDir.nzLoading()"
                type="button"
                class="ant-input-search-button"
                (click)="inputSearchDir.search($event)"
              >
                <ng-content select="[nzInputSearchEnterButton]">
                  @if (nzEnterButton && typeof nzEnterButton === 'string') {
                    {{ nzEnterButton }}
                  } @else {
                    <nz-icon nzType="search" nzTheme="outline" />
                  }
                </ng-content>
              </button>
            }
            <ng-content select="[nzInputAddonAfter]">{{ nzAddonAfter() }}</ng-content>
          </span>
        }
      </span>
    </ng-template>

    <ng-template #inputWithAffix>
      <span [class]="affixWrapperClass()">
        <ng-template [ngTemplateOutlet]="inputWithAffixInner" />
      </span>
    </ng-template>

    <ng-template #inputWithAffixInner>
      @if (hasPrefix()) {
        <span class="ant-input-prefix">
          <ng-content select="[nzInputPrefix]">{{ nzPrefix() }}</ng-content>
        </span>
      }
      <ng-template [ngTemplateOutlet]="input" />
      @if (hasSuffix()) {
        <span class="ant-input-suffix">
          @if (nzAllowClear()) {
            <span
              class="ant-input-clear-icon"
              [class.ant-input-clear-icon-has-suffix]="
                nzSuffix() || suffix() || hasFeedback() || inputPasswordDir?.nzVisibilityToggle()
              "
              [class.ant-input-clear-icon-hidden]="!inputDir().value() || disabled() || readOnly()"
              role="button"
              tabindex="-1"
              (click)="clear(); inputSearchDir?.search($event, 'clear')"
            >
              <ng-content select="[nzInputClearIcon]">
                <nz-icon nzType="close-circle" nzTheme="fill" />
              </ng-content>
            </span>
          }
          @if (nzShowCount()) {
            <span class="ant-input-show-count-suffix">{{ dataCount() }}</span>
          }
          @if (inputPasswordDir && inputPasswordDir.nzVisibilityToggle()) {
            <span
              class="ant-input-password-icon"
              role="button"
              tabindex="-1"
              (click)="inputPasswordDir.toggleVisible()"
            >
              @if (inputPasswordIconTmpl(); as tmpl) {
                <ng-template
                  [ngTemplateOutlet]="tmpl"
                  [ngTemplateOutletContext]="{ $implicit: inputPasswordDir.nzVisible() }"
                />
              } @else {
                <nz-icon [nzType]="inputPasswordDir.nzVisible() ? 'eye' : 'eye-invisible'" nzTheme="outline" />
              }
            </span>
          }
          <ng-content select="[nzInputSuffix]">{{ nzSuffix() }}</ng-content>
          @if (hasFeedback() && status()) {
            <nz-form-item-feedback-icon [status]="status()" />
          }
        </span>
      }
    </ng-template>

    <ng-template #input>
      <ng-content select="[nz-input]" />
    </ng-template>
  `,
      providers: [{
        provide: NZ_SPACE_COMPACT_ITEM_TYPE,
        useValue: "input"
      }, {
        provide: NZ_INPUT_WRAPPER,
        useExisting: forwardRef(() => NzInputWrapperComponent)
      }],
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      hostDirectives: [NzSpaceCompactItemDirective],
      host: {
        "[class]": "class()",
        "[class.ant-input-disabled]": "disabled()",
        "[class.ant-input-out-of-range]": "nzShowCount() && isOutOfRange()",
        "[class.ant-input-affix-wrapper-textarea-with-clear-btn]": "nzAllowClear() && isTextarea()"
      }
    }]
  }], () => [], {
    inputRef: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputDirective), __spreadProps(__spreadValues({}, {
        read: ElementRef
      }), {
        isSignal: true
      })]
    }],
    inputDir: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputDirective), {
        isSignal: true
      }]
    }],
    prefix: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputPrefixDirective), {
        isSignal: true
      }]
    }],
    suffix: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputSuffixDirective), {
        isSignal: true
      }]
    }],
    addonBefore: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputAddonBeforeDirective), {
        isSignal: true
      }]
    }],
    addonAfter: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputAddonAfterDirective), {
        isSignal: true
      }]
    }],
    inputPasswordIconTmpl: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputPasswordIconDirective), __spreadProps(__spreadValues({}, {
        read: TemplateRef
      }), {
        isSignal: true
      })]
    }],
    inputSearchEnterButton: [{
      type: ContentChild,
      args: [forwardRef(() => NzInputSearchEnterButtonDirective), {
        isSignal: true
      }]
    }],
    nzAllowClear: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzAllowClear",
        required: false
      }]
    }],
    nzPrefix: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzPrefix",
        required: false
      }]
    }],
    nzSuffix: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzSuffix",
        required: false
      }]
    }],
    nzAddonBefore: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzAddonBefore",
        required: false
      }]
    }],
    nzAddonAfter: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzAddonAfter",
        required: false
      }]
    }],
    nzShowCount: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzShowCount",
        required: false
      }]
    }],
    nzCount: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "nzCount",
        required: false
      }]
    }],
    nzClear: [{
      type: Output,
      args: ["nzClear"]
    }]
  });
})();
var NzTextareaCountComponent = class _NzTextareaCountComponent {
  renderer = inject(Renderer2);
  destroyRef = inject(DestroyRef);
  elementRef = inject(ElementRef);
  nzInputDirective;
  nzMaxCharacterCount = 0;
  nzComputeCharacterCount = (v) => v.length;
  nzFormatter = (c, m) => `${c}${m > 0 ? `/${m}` : ``}`;
  ngAfterContentInit() {
    if (!this.nzInputDirective && isDevMode()) {
      throw new Error("[nz-textarea-count]: Could not find matching textarea[nz-input] child.");
    }
    if (this.nzInputDirective.ngControl) {
      const valueChanges = this.nzInputDirective.ngControl.valueChanges || EMPTY;
      valueChanges.pipe(takeUntilDestroyed(this.destroyRef), map(() => this.nzInputDirective.ngControl.value), startWith(this.nzInputDirective.ngControl.value)).subscribe((value) => {
        this.setDataCount(value);
      });
    }
  }
  setDataCount(value) {
    const inputValue = isNotNil(value) ? String(value) : "";
    const currentCount = this.nzComputeCharacterCount(inputValue);
    const dataCount = this.nzFormatter(currentCount, this.nzMaxCharacterCount);
    this.renderer.setAttribute(this.elementRef.nativeElement, "data-count", dataCount);
  }
  static ɵfac = function NzTextareaCountComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTextareaCountComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzTextareaCountComponent,
    selectors: [["nz-textarea-count"]],
    contentQueries: function NzTextareaCountComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, NzInputDirective, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.nzInputDirective = _t.first);
      }
    },
    hostAttrs: [1, "ant-input-textarea-show-count"],
    inputs: {
      nzMaxCharacterCount: [2, "nzMaxCharacterCount", "nzMaxCharacterCount", numberAttribute],
      nzComputeCharacterCount: "nzComputeCharacterCount",
      nzFormatter: "nzFormatter"
    },
    ngContentSelectors: _c7,
    decls: 1,
    vars: 0,
    template: function NzTextareaCountComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef(_c6);
        ɵɵprojection(0);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTextareaCountComponent, [{
    type: Component,
    args: [{
      selector: "nz-textarea-count",
      template: `<ng-content select="textarea[nz-input]" />`,
      host: {
        class: "ant-input-textarea-show-count"
      },
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }], null, {
    nzInputDirective: [{
      type: ContentChild,
      args: [NzInputDirective, {
        static: true
      }]
    }],
    nzMaxCharacterCount: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    nzComputeCharacterCount: [{
      type: Input
    }],
    nzFormatter: [{
      type: Input
    }]
  });
})();
var NzInputModule = class _NzInputModule {
  static ɵfac = function NzInputModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzInputModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NzInputModule,
    imports: [NzTextareaCountComponent, NzInputDirective, NzInputWrapperComponent, NzInputPasswordDirective, NzInputPasswordIconDirective, NzInputSearchDirective, NzInputSearchEnterButtonDirective, NzInputAddonBeforeDirective, NzInputAddonAfterDirective, NzInputPrefixDirective, NzInputSuffixDirective, NzInputGroupComponent, NzAutosizeDirective, NzInputGroupSlotComponent, NzInputGroupWhitSuffixOrPrefixDirective, NzInputOtpComponent],
    exports: [NzTextareaCountComponent, NzInputDirective, NzInputWrapperComponent, NzInputPasswordDirective, NzInputPasswordIconDirective, NzInputSearchDirective, NzInputSearchEnterButtonDirective, NzInputAddonBeforeDirective, NzInputAddonAfterDirective, NzInputPrefixDirective, NzInputSuffixDirective, NzInputGroupComponent, NzAutosizeDirective, NzInputGroupWhitSuffixOrPrefixDirective, NzInputOtpComponent]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [NzInputWrapperComponent, NzInputGroupComponent, NzInputGroupSlotComponent, NzInputOtpComponent]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzInputModule, [{
    type: NgModule,
    args: [{
      imports: [NzTextareaCountComponent, NzInputDirective, NzInputWrapperComponent, NzInputPasswordDirective, NzInputPasswordIconDirective, NzInputSearchDirective, NzInputSearchEnterButtonDirective, NzInputAddonBeforeDirective, NzInputAddonAfterDirective, NzInputPrefixDirective, NzInputSuffixDirective, NzInputGroupComponent, NzAutosizeDirective, NzInputGroupSlotComponent, NzInputGroupWhitSuffixOrPrefixDirective, NzInputOtpComponent],
      exports: [NzTextareaCountComponent, NzInputDirective, NzInputWrapperComponent, NzInputPasswordDirective, NzInputPasswordIconDirective, NzInputSearchDirective, NzInputSearchEnterButtonDirective, NzInputAddonBeforeDirective, NzInputAddonAfterDirective, NzInputPrefixDirective, NzInputSuffixDirective, NzInputGroupComponent, NzAutosizeDirective, NzInputGroupWhitSuffixOrPrefixDirective, NzInputOtpComponent]
    }]
  }], null, null);
})();

export {
  NzAutosizeDirective,
  NzInputAddonBeforeDirective,
  NzInputAddonAfterDirective,
  NzInputPrefixDirective,
  NzInputSuffixDirective,
  NzInputGroupSlotComponent,
  NzInputPasswordDirective,
  NzInputPasswordIconDirective,
  NZ_INPUT_WRAPPER,
  NZ_INPUT_SEARCH,
  NzInputDirective,
  NzInputGroupWhitSuffixOrPrefixDirective,
  NzInputGroupComponent,
  NzInputOtpComponent,
  NzInputSearchDirective,
  NzInputSearchEnterButtonDirective,
  NzInputWrapperComponent,
  NzTextareaCountComponent,
  NzInputModule
};
//# sourceMappingURL=chunk-UAJR6YR2.js.map
