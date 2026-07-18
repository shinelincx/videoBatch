import {
  NzEmbedEmptyComponent,
  NzEmptyModule,
  NzSelectClearComponent,
  NzSelectItemComponent,
  NzSelectPlaceholderComponent,
  NzSelectSearchComponent
} from "./chunk-LFAE2TDI.js";
import {
  NzI18nService
} from "./chunk-THKCQLZL.js";
import {
  NzNoAnimationDirective,
  slideAnimationEnter,
  slideAnimationLeave
} from "./chunk-5TMQGPK6.js";
import {
  DEFAULT_CASCADER_POSITIONS,
  NzConnectedOverlayDirective,
  NzOverlayModule,
  POSITION_MAP,
  getPlacementName
} from "./chunk-D3DECQHP.js";
import {
  CdkConnectedOverlay,
  OverlayModule
} from "./chunk-UXZ7ZQP6.js";
import "./chunk-QYDDKLT3.js";
import "./chunk-LYDJ6F5C.js";
import {
  NZ_SPACE_COMPACT_ITEM_TYPE,
  NZ_SPACE_COMPACT_SIZE,
  NzSpaceCompactItemDirective
} from "./chunk-F3PAL4AQ.js";
import {
  NzOutletModule,
  NzStringTemplateOutletDirective
} from "./chunk-QP2ATT6X.js";
import "./chunk-4OBKC2YF.js";
import "./chunk-LC5RUENM.js";
import {
  BACKSPACE,
  DOWN_ARROW,
  ENTER,
  ESCAPE,
  LEFT_ARROW,
  RIGHT_ARROW,
  UP_ARROW
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
import "./chunk-72DKPDI6.js";
import "./chunk-SJ3NPWEQ.js";
import {
  _getEventTarget
} from "./chunk-MR7TIX67.js";
import "./chunk-WUUVWCMF.js";
import {
  FormsModule,
  NG_VALUE_ACCESSOR
} from "./chunk-YZ7GQAMP.js";
import {
  WithConfig,
  onConfigChangeEventForComponent
} from "./chunk-FQDUROHQ.js";
import {
  takeUntilDestroyed
} from "./chunk-LSZOUFU2.js";
import {
  arraysEqual,
  encodeEntities,
  fromEventOutsideAngular,
  getStatusClassNames,
  isNotNil,
  toArray,
  wrapIntoObservable
} from "./chunk-OPN2JU7N.js";
import {
  Dir,
  Directionality
} from "./chunk-4L5DI3TQ.js";
import "./chunk-HU2MKBDQ.js";
import "./chunk-UXZ5GYDD.js";
import "./chunk-JZ5DZOX3.js";
import {
  NgTemplateOutlet,
  SlicePipe
} from "./chunk-SSARYQTY.js";
import "./chunk-FFJGBTQB.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  NgZone,
  Output,
  Pipe,
  Renderer2,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  numberAttribute,
  setClassMetadata,
  signal,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵanimateEnter,
  ɵɵanimateLeave,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdefinePipe,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind3,
  ɵɵpipeBind4,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵviewQuery
} from "./chunk-VS5U7YU4.js";
import "./chunk-SR2LXFJL.js";
import {
  merge
} from "./chunk-V37RSN4D.js";
import {
  BehaviorSubject,
  Subject,
  __esDecorate,
  __runInitializers,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
  withLatestFrom
} from "./chunk-VUVMRRXW.js";
import "./chunk-EIB7IA3J.js";

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-core-tree.mjs
var NzTreeNode = class _NzTreeNode {
  _title = "";
  key;
  level = 0;
  origin;
  // Parent Node
  parentNode = null;
  _icon = "";
  _children = [];
  _isLeaf = false;
  _isChecked = false;
  _isSelectable = false;
  _isDisabled = false;
  _isDisableCheckbox = false;
  _isExpanded = false;
  _isHalfChecked = false;
  _isSelected = false;
  _isLoading = false;
  canHide = false;
  isMatched = false;
  service = null;
  component;
  /** New added in Tree for easy data access */
  isStart;
  isEnd;
  get treeService() {
    return this.service || this.parentNode && this.parentNode.treeService;
  }
  /**
   * Init nzTreeNode
   *
   * @param option option user's input
   * @param parent parent node
   * @param service base nzTreeService
   */
  constructor(option, parent = null, service = null) {
    if (option instanceof _NzTreeNode) {
      return option;
    }
    this.service = service || null;
    this.origin = option;
    this.key = option.key;
    this.parentNode = parent;
    this._title = option.title || "---";
    this._icon = option.icon || "";
    this._isLeaf = option.isLeaf || false;
    this._children = [];
    this._isChecked = option.checked || false;
    this._isSelectable = option.disabled || option.selectable !== false;
    this._isDisabled = option.disabled || false;
    this._isDisableCheckbox = option.disableCheckbox || false;
    this._isExpanded = option.isLeaf ? false : option.expanded || false;
    this._isHalfChecked = false;
    this._isSelected = !option.disabled && option.selected || false;
    this._isLoading = false;
    this.isMatched = false;
    if (parent) {
      this.level = parent.level + 1;
    } else {
      this.level = 0;
    }
    const s = this.treeService;
    s?.treeNodePostProcessor?.(this);
    if (typeof option.children !== "undefined" && option.children !== null) {
      option.children.forEach((nodeOptions) => {
        if (s && !s.isCheckStrictly && option.checked && !option.disabled && !nodeOptions.disabled && !nodeOptions.disableCheckbox) {
          nodeOptions.checked = option.checked;
        }
        this._children.push(new _NzTreeNode(nodeOptions, this));
      });
    }
  }
  /**
   * auto generate
   * get
   * set
   */
  get title() {
    return this._title;
  }
  set title(value) {
    this._title = value;
    this.update();
  }
  get icon() {
    return this._icon;
  }
  set icon(value) {
    this._icon = value;
    this.update();
  }
  get children() {
    return this._children;
  }
  set children(value) {
    this._children = value;
    this.update();
  }
  get isLeaf() {
    return this._isLeaf;
  }
  set isLeaf(value) {
    this._isLeaf = value;
    this.update();
  }
  get isChecked() {
    return this._isChecked;
  }
  set isChecked(value) {
    this._isChecked = value;
    this.origin.checked = value;
    this.afterValueChange("isChecked");
  }
  get isHalfChecked() {
    return this._isHalfChecked;
  }
  set isHalfChecked(value) {
    this._isHalfChecked = value;
    this.afterValueChange("isHalfChecked");
  }
  get isSelectable() {
    return this._isSelectable;
  }
  set isSelectable(value) {
    this._isSelectable = value;
    this.update();
  }
  get isDisabled() {
    return this._isDisabled;
  }
  set isDisabled(value) {
    this._isDisabled = value;
    this.update();
  }
  get isDisableCheckbox() {
    return this._isDisableCheckbox;
  }
  set isDisableCheckbox(value) {
    this._isDisableCheckbox = value;
    this.update();
  }
  get isExpanded() {
    return this._isExpanded;
  }
  set isExpanded(value) {
    this._isExpanded = value;
    this.origin.expanded = value;
    this.afterValueChange("isExpanded");
    this.afterValueChange("reRender");
  }
  get isSelected() {
    return this._isSelected;
  }
  set isSelected(value) {
    this._isSelected = value;
    this.origin.selected = value;
    this.afterValueChange("isSelected");
  }
  get isLoading() {
    return this._isLoading;
  }
  set isLoading(value) {
    this._isLoading = value;
    this.update();
  }
  setSyncChecked(checked = false, halfChecked = false) {
    this.setChecked(checked, halfChecked);
    if (this.treeService && !this.treeService.isCheckStrictly) {
      this.treeService.conduct(this);
    }
  }
  setChecked(checked = false, halfChecked = false) {
    this.origin.checked = checked;
    this.isChecked = checked;
    this.isHalfChecked = halfChecked;
  }
  setExpanded(value) {
    this._isExpanded = value;
    this.origin.expanded = value;
    this.afterValueChange("isExpanded");
  }
  getParentNode() {
    return this.parentNode;
  }
  getChildren() {
    return this.children;
  }
  /**
   * Support appending child nodes by position. Leaf node cannot be appended.
   */
  addChildren(children, childPos = -1) {
    if (!this.isLeaf) {
      children.forEach((node) => {
        const refreshLevel = (n) => {
          n.getChildren().forEach((c) => {
            c.level = c.getParentNode().level + 1;
            c.origin.level = c.level;
            refreshLevel(c);
          });
        };
        let child = node;
        if (child instanceof _NzTreeNode) {
          child.parentNode = this;
        } else {
          child = new _NzTreeNode(node, this);
        }
        child.level = this.level + 1;
        child.origin.level = child.level;
        refreshLevel(child);
        try {
          childPos === -1 ? this.children.push(child) : this.children.splice(childPos, 0, child);
        } catch (e) {
        }
      });
      this.origin.children = this.getChildren().map((v) => v.origin);
      this.isLoading = false;
    }
    this.afterValueChange("addChildren");
    this.afterValueChange("reRender");
  }
  clearChildren() {
    this.afterValueChange("clearChildren");
    this.children = [];
    this.origin.children = [];
    this.afterValueChange("reRender");
  }
  remove() {
    const parentNode = this.getParentNode();
    if (parentNode) {
      parentNode.children = parentNode.getChildren().filter((v) => v.key !== this.key);
      parentNode.origin.children = parentNode.origin.children.filter((v) => v.key !== this.key);
      this.afterValueChange("remove");
      this.afterValueChange("reRender");
    }
  }
  afterValueChange(key) {
    if (this.treeService) {
      switch (key) {
        case "isChecked":
          this.treeService.setCheckedNodeList(this);
          break;
        case "isHalfChecked":
          this.treeService.setHalfCheckedNodeList(this);
          break;
        case "isExpanded":
          this.treeService.setExpandedNodeList(this);
          break;
        case "isSelected":
          this.treeService.setNodeActive(this);
          break;
        case "clearChildren":
          this.treeService.afterRemove(this.getChildren());
          break;
        case "remove":
          this.treeService.afterRemove([this]);
          break;
        case "reRender":
          this.treeService.flattenTreeData(this.treeService.rootNodes, this.treeService.getExpandedNodeList().map((v) => v.key));
          break;
      }
    }
    this.update();
  }
  update() {
    if (this.component) {
      this.component.markForCheck();
    }
  }
};
function isCheckDisabled(node) {
  const {
    isDisabled,
    isDisableCheckbox
  } = node;
  return !!(isDisabled || isDisableCheckbox);
}
function isInArray(needle, haystack) {
  return haystack.length > 0 && haystack.indexOf(needle) > -1;
}
function getPosition(level, index) {
  return `${level}-${index}`;
}
function getKey(key, pos) {
  if (key !== null && key !== void 0) {
    return key;
  }
  return pos;
}
function flattenTreeData(treeNodeList = [], expandedKeys = []) {
  const expandedKeySet = new Set(expandedKeys === true ? [] : expandedKeys);
  const flattenList = [];
  function dig(list, parent = null) {
    return list.map((treeNode, index) => {
      const pos = getPosition(parent ? parent.pos : "0", index);
      const mergedKey = getKey(treeNode.key, pos);
      treeNode.isStart = [...parent ? parent.isStart : [], index === 0];
      treeNode.isEnd = [...parent ? parent.isEnd : [], index === list.length - 1];
      const flattenNode = {
        parent,
        pos,
        children: [],
        data: treeNode,
        isStart: [...parent ? parent.isStart : [], index === 0],
        isEnd: [...parent ? parent.isEnd : [], index === list.length - 1]
      };
      flattenList.push(flattenNode);
      if (expandedKeys === true || expandedKeySet.has(mergedKey) || treeNode.isExpanded) {
        flattenNode.children = dig(treeNode.children || [], flattenNode);
      } else {
        flattenNode.children = [];
      }
      return flattenNode;
    });
  }
  dig(treeNodeList);
  return flattenList;
}
var NzTreeBaseService = class _NzTreeBaseService {
  DRAG_SIDE_RANGE = 0.25;
  DRAG_MIN_GAP = 2;
  isCheckStrictly = false;
  isMultiple = false;
  selectedNode;
  rootNodes = [];
  flattenNodes$ = new BehaviorSubject([]);
  selectedNodeList = [];
  expandedNodeList = [];
  checkedNodeList = [];
  halfCheckedNodeList = [];
  matchedNodeList = [];
  /**
   * handle to post process a tree node when it's instantiating, note that its children haven't been initiated yet
   */
  treeNodePostProcessor;
  /**
   * reset tree nodes will clear default node list
   */
  initTree(nzNodes) {
    this.rootNodes = nzNodes;
    this.expandedNodeList = [];
    this.selectedNodeList = [];
    this.halfCheckedNodeList = [];
    this.checkedNodeList = [];
    this.matchedNodeList = [];
  }
  flattenTreeData(nzNodes, expandedKeys = []) {
    this.flattenNodes$.next(flattenTreeData(nzNodes, expandedKeys).map((item) => item.data));
  }
  getSelectedNode() {
    return this.selectedNode;
  }
  /**
   * get some list
   */
  getSelectedNodeList() {
    return this.conductNodeState("select");
  }
  /**
   * get checked node keys
   */
  getCheckedNodeKeys() {
    const keys = [];
    const checkedNodes = this.getCheckedNodeList();
    const calc = (nodes) => {
      nodes.forEach((node) => {
        keys.push(node.key);
        if (node.children.length < 1) return;
        calc(node.children);
      });
    };
    calc(checkedNodes);
    return keys;
  }
  /**
   * return checked nodes
   */
  getCheckedNodeList() {
    return this.conductNodeState("check");
  }
  getHalfCheckedNodeList() {
    return this.conductNodeState("halfCheck");
  }
  /**
   * return expanded nodes
   */
  getExpandedNodeList() {
    return this.conductNodeState("expand");
  }
  /**
   * return search matched nodes
   */
  getMatchedNodeList() {
    return this.conductNodeState("match");
  }
  isArrayOfNzTreeNode(value) {
    return value.every((item) => item instanceof NzTreeNode);
  }
  /**
   * set drag node
   */
  setSelectedNode(node) {
    this.selectedNode = node;
  }
  /**
   * set node selected status
   */
  setNodeActive(node) {
    if (!this.isMultiple && node.isSelected) {
      this.selectedNodeList.forEach((n) => {
        if (node.key !== n.key) {
          n.isSelected = false;
        }
      });
      this.selectedNodeList = [];
    }
    this.setSelectedNodeList(node, this.isMultiple);
  }
  /**
   * add or remove node to selectedNodeList
   */
  setSelectedNodeList(node, isMultiple = false) {
    const index = this.getIndexOfArray(this.selectedNodeList, node.key);
    if (isMultiple) {
      if (node.isSelected && index === -1) {
        this.selectedNodeList.push(node);
      }
    } else {
      if (node.isSelected && index === -1) {
        this.selectedNodeList = [node];
      }
    }
    if (!node.isSelected) {
      this.selectedNodeList = this.selectedNodeList.filter((n) => n.key !== node.key);
    }
  }
  /**
   * merge checked nodes
   */
  setHalfCheckedNodeList(node) {
    const index = this.getIndexOfArray(this.halfCheckedNodeList, node.key);
    if (node.isHalfChecked && index === -1) {
      this.halfCheckedNodeList.push(node);
    } else if (!node.isHalfChecked && index > -1) {
      this.halfCheckedNodeList = this.halfCheckedNodeList.filter((n) => node.key !== n.key);
    }
  }
  setCheckedNodeList(node) {
    const index = this.getIndexOfArray(this.checkedNodeList, node.key);
    if (node.isChecked && index === -1) {
      this.checkedNodeList.push(node);
    } else if (!node.isChecked && index > -1) {
      this.checkedNodeList = this.checkedNodeList.filter((n) => node.key !== n.key);
    }
  }
  /**
   * conduct checked/selected/expanded keys
   */
  conductNodeState(type = "check") {
    let resultNodesList = [];
    switch (type) {
      case "select":
        resultNodesList = this.selectedNodeList;
        break;
      case "expand":
        resultNodesList = this.expandedNodeList;
        break;
      case "match":
        resultNodesList = this.matchedNodeList;
        break;
      case "check": {
        resultNodesList = this.checkedNodeList;
        const isIgnore = (node) => {
          const parentNode = node.getParentNode();
          if (parentNode) {
            if (this.checkedNodeList.findIndex((n) => n.key === parentNode.key) > -1) {
              return true;
            } else {
              return isIgnore(parentNode);
            }
          }
          return false;
        };
        if (!this.isCheckStrictly) {
          resultNodesList = this.checkedNodeList.filter((n) => !isIgnore(n));
        }
        break;
      }
      case "halfCheck":
        if (!this.isCheckStrictly) {
          resultNodesList = this.halfCheckedNodeList;
        }
        break;
    }
    return resultNodesList;
  }
  /**
   * set expanded nodes
   */
  setExpandedNodeList(node) {
    if (node.isLeaf) {
      return;
    }
    const index = this.getIndexOfArray(this.expandedNodeList, node.key);
    if (node.isExpanded && index === -1) {
      this.expandedNodeList.push(node);
    } else if (!node.isExpanded && index > -1) {
      this.expandedNodeList.splice(index, 1);
    }
  }
  setMatchedNodeList(node) {
    const index = this.getIndexOfArray(this.matchedNodeList, node.key);
    if (node.isMatched && index === -1) {
      this.matchedNodeList.push(node);
    } else if (!node.isMatched && index > -1) {
      this.matchedNodeList.splice(index, 1);
    }
  }
  /**
   * check state
   *
   * @param isCheckStrictly
   */
  refreshCheckState(isCheckStrictly = false) {
    if (isCheckStrictly) {
      return;
    }
    this.checkedNodeList.forEach((node) => {
      this.conduct(node, isCheckStrictly);
    });
  }
  // reset other node checked state based current node
  conduct(node, isCheckStrictly = false) {
    const isChecked = node.isChecked;
    if (node && !isCheckStrictly) {
      this.conductUp(node);
      this.conductDown(node, isChecked);
    }
  }
  /**
   * 1、children half checked
   * 2、children all checked, parent checked
   * 3、no children checked
   */
  conductUp(node) {
    const parentNode = node.getParentNode();
    if (parentNode) {
      if (!isCheckDisabled(parentNode)) {
        if (parentNode.children.every((child) => isCheckDisabled(child) || !child.isHalfChecked && child.isChecked)) {
          parentNode.isChecked = true;
          parentNode.isHalfChecked = false;
        } else if (parentNode.children.some((child) => child.isHalfChecked || child.isChecked)) {
          parentNode.isChecked = false;
          parentNode.isHalfChecked = true;
        } else {
          parentNode.isChecked = false;
          parentNode.isHalfChecked = false;
        }
      }
      this.setCheckedNodeList(parentNode);
      this.setHalfCheckedNodeList(parentNode);
      this.conductUp(parentNode);
    }
  }
  /**
   * reset child check state
   */
  conductDown(node, value) {
    if (!isCheckDisabled(node)) {
      node.isChecked = value;
      node.isHalfChecked = false;
      this.setCheckedNodeList(node);
      this.setHalfCheckedNodeList(node);
      node.children.forEach((n) => {
        this.conductDown(n, value);
      });
    }
  }
  /**
   * flush after delete node
   */
  afterRemove(nodes) {
    const loopNode = (node) => {
      this.selectedNodeList = this.selectedNodeList.filter((n) => n.key !== node.key);
      this.expandedNodeList = this.expandedNodeList.filter((n) => n.key !== node.key);
      this.checkedNodeList = this.checkedNodeList.filter((n) => n.key !== node.key);
      if (node.children) {
        node.children.forEach((child) => {
          loopNode(child);
        });
      }
    };
    nodes.forEach((n) => {
      loopNode(n);
    });
    this.refreshCheckState(this.isCheckStrictly);
  }
  /**
   * drag event
   */
  refreshDragNode(node) {
    if (node.children.length === 0) {
      this.conductUp(node);
    } else {
      node.children.forEach((child) => {
        this.refreshDragNode(child);
      });
    }
  }
  // reset node level
  resetNodeLevel(node) {
    const parentNode = node.getParentNode();
    if (parentNode) {
      node.level = parentNode.level + 1;
    } else {
      node.level = 0;
    }
    for (const child of node.children) {
      this.resetNodeLevel(child);
    }
  }
  calcDropPosition(event) {
    const {
      clientY
    } = event;
    const {
      top,
      bottom,
      height
    } = event.target.getBoundingClientRect();
    const des = Math.max(height * this.DRAG_SIDE_RANGE, this.DRAG_MIN_GAP);
    if (clientY <= top + des) {
      return -1;
    } else if (clientY >= bottom - des) {
      return 1;
    }
    return 0;
  }
  /**
   * drop
   * 0: inner -1: pre 1: next
   */
  dropAndApply(targetNode, dragPos = -1) {
    if (!targetNode || dragPos > 1) {
      return;
    }
    const treeService = targetNode.treeService;
    const targetParent = targetNode.getParentNode();
    const isSelectedRootNode = this.selectedNode.getParentNode();
    if (isSelectedRootNode) {
      isSelectedRootNode.children = isSelectedRootNode.children.filter((n) => n.key !== this.selectedNode.key);
    } else {
      this.rootNodes = this.rootNodes.filter((n) => n.key !== this.selectedNode.key);
    }
    switch (dragPos) {
      case 0:
        targetNode.addChildren([this.selectedNode]);
        this.resetNodeLevel(targetNode);
        break;
      case -1:
      case 1: {
        const tIndex = dragPos === 1 ? 1 : 0;
        if (targetParent) {
          targetParent.addChildren([this.selectedNode], targetParent.children.indexOf(targetNode) + tIndex);
          const parentNode = this.selectedNode.getParentNode();
          if (parentNode) {
            this.resetNodeLevel(parentNode);
          }
        } else {
          const targetIndex = this.rootNodes.indexOf(targetNode) + tIndex;
          this.rootNodes.splice(targetIndex, 0, this.selectedNode);
          this.rootNodes[targetIndex].parentNode = null;
          this.resetNodeLevel(this.rootNodes[targetIndex]);
        }
        break;
      }
    }
    this.rootNodes.forEach((child) => {
      if (!child.treeService) {
        child.service = treeService;
      }
      this.refreshDragNode(child);
    });
  }
  /**
   * emit Structure
   * eventName
   * node
   * event: MouseEvent / DragEvent
   * dragNode
   */
  formatEvent(eventName, node, event) {
    const emitStructure = {
      eventName,
      node,
      event
    };
    switch (eventName) {
      case "dragstart":
      case "dragenter":
      case "dragover":
      case "dragleave":
      case "drop":
      case "dragend":
        Object.assign(emitStructure, {
          dragNode: this.getSelectedNode()
        });
        break;
      case "click":
      case "dblclick":
        Object.assign(emitStructure, {
          selectedKeys: this.selectedNodeList
        });
        Object.assign(emitStructure, {
          nodes: this.selectedNodeList
        });
        Object.assign(emitStructure, {
          keys: this.selectedNodeList.map((n) => n.key)
        });
        break;
      case "check": {
        const checkedNodeList = this.getCheckedNodeList();
        Object.assign(emitStructure, {
          checkedKeys: checkedNodeList
        });
        Object.assign(emitStructure, {
          nodes: checkedNodeList
        });
        Object.assign(emitStructure, {
          keys: checkedNodeList.map((n) => n.key)
        });
        break;
      }
      case "search":
        Object.assign(emitStructure, {
          matchedKeys: this.getMatchedNodeList()
        });
        Object.assign(emitStructure, {
          nodes: this.getMatchedNodeList()
        });
        Object.assign(emitStructure, {
          keys: this.getMatchedNodeList().map((n) => n.key)
        });
        break;
      case "expand":
        Object.assign(emitStructure, {
          nodes: this.expandedNodeList
        });
        Object.assign(emitStructure, {
          keys: this.expandedNodeList.map((n) => n.key)
        });
        break;
    }
    return emitStructure;
  }
  /**
   * New functions for flatten nodes
   */
  getIndexOfArray(list, key) {
    return list.findIndex((v) => v.key === key);
  }
  /**
   * Render by nzCheckedKeys
   * When keys equals null, just render with checkStrictly
   *
   * @param keys
   * @param checkStrictly
   */
  conductCheck(keys, checkStrictly) {
    this.checkedNodeList = [];
    this.halfCheckedNodeList = [];
    const calc = (nodes) => {
      nodes.forEach((node) => {
        if (keys === null) {
          node.isChecked = !!node.origin.checked;
        } else {
          if (isInArray(node.key, keys || [])) {
            node.isChecked = true;
            node.isHalfChecked = false;
          } else {
            node.isChecked = false;
            node.isHalfChecked = false;
          }
        }
        if (node.children.length > 0) {
          calc(node.children);
        }
      });
    };
    calc(this.rootNodes);
    this.refreshCheckState(checkStrictly);
  }
  conductExpandedKeys(keys = []) {
    const expandedKeySet = new Set(keys === true ? [] : keys);
    this.expandedNodeList = [];
    const calc = (nodes) => {
      nodes.forEach((node) => {
        node.setExpanded(keys === true || expandedKeySet.has(node.key) || node.isExpanded === true);
        if (node.isExpanded) {
          this.setExpandedNodeList(node);
        }
        if (node.children.length > 0) {
          calc(node.children);
        }
      });
    };
    calc(this.rootNodes);
  }
  conductSelectedKeys(keys, isMulti) {
    this.selectedNodeList.forEach((node) => node.isSelected = false);
    this.selectedNodeList = [];
    const calc = (nodes) => nodes.every((node) => {
      if (isInArray(node.key, keys)) {
        node.isSelected = true;
        this.setSelectedNodeList(node);
        if (!isMulti) {
          return false;
        }
      } else {
        node.isSelected = false;
      }
      if (node.children.length > 0) {
        return calc(node.children);
      }
      return true;
    });
    calc(this.rootNodes);
  }
  /**
   * Expand parent nodes by child node
   *
   * @param node
   */
  expandNodeAllParentBySearch(node) {
    const calc = (n) => {
      if (n) {
        n.canHide = false;
        n.setExpanded(true);
        this.setExpandedNodeList(n);
        if (n.getParentNode()) {
          return calc(n.getParentNode());
        }
      }
    };
    calc(node.getParentNode());
  }
  static ɵfac = function NzTreeBaseService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzTreeBaseService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NzTreeBaseService,
    factory: _NzTreeBaseService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzTreeBaseService, [{
    type: Injectable
  }], null, null);
})();
var NzTreeHigherOrderServiceToken = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "nz-tree-higher-order" : "");
var NzTreeBase = class {
  nzTreeService;
  constructor(nzTreeService) {
    this.nzTreeService = nzTreeService;
  }
  /**
   * Coerces a value({@link any[]}) to a TreeNodes({@link NzTreeNode[]})
   */
  coerceTreeNodes(value) {
    let nodes = [];
    if (!this.nzTreeService.isArrayOfNzTreeNode(value)) {
      nodes = value.map((item) => new NzTreeNode(item, null, this.nzTreeService));
    } else {
      nodes = value.map((item) => {
        item.service = this.nzTreeService;
        return item;
      });
    }
    return nodes;
  }
  /**
   * Get all nodes({@link NzTreeNode})
   */
  getTreeNodes() {
    return this.nzTreeService.rootNodes;
  }
  /**
   * Get {@link NzTreeNode} with key
   */
  getTreeNodeByKey(key) {
    const nodes = [];
    const getNode = (node) => {
      nodes.push(node);
      node.getChildren().forEach((n) => {
        getNode(n);
      });
    };
    this.getTreeNodes().forEach((n) => {
      getNode(n);
    });
    return nodes.find((n) => n.key === key) || null;
  }
  /**
   * Get checked nodes(merged)
   */
  getCheckedNodeList() {
    return this.nzTreeService.getCheckedNodeList();
  }
  /**
   * Get selected nodes
   */
  getSelectedNodeList() {
    return this.nzTreeService.getSelectedNodeList();
  }
  /**
   * Get half checked nodes
   */
  getHalfCheckedNodeList() {
    return this.nzTreeService.getHalfCheckedNodeList();
  }
  /**
   * Get expanded nodes
   */
  getExpandedNodeList() {
    return this.nzTreeService.getExpandedNodeList();
  }
  /**
   * Get matched nodes(if nzSearchValue is not null)
   */
  getMatchedNodeList() {
    return this.nzTreeService.getMatchedNodeList();
  }
};

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-core-highlight.mjs
var NzHighlightPipe = class _NzHighlightPipe {
  UNIQUE_WRAPPERS = ["##==-open_tag-==##", "##==-close_tag-==##"];
  transform(value, highlightValue, flags, klass) {
    if (!highlightValue) {
      return value;
    }
    const searchValue = new RegExp(highlightValue.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$&"), flags);
    const wrapValue = value.replace(searchValue, `${this.UNIQUE_WRAPPERS[0]}$&${this.UNIQUE_WRAPPERS[1]}`);
    return encodeEntities(wrapValue).replace(new RegExp(this.UNIQUE_WRAPPERS[0], "g"), klass ? `<span class="${klass}">` : "<span>").replace(new RegExp(this.UNIQUE_WRAPPERS[1], "g"), "</span>");
  }
  static ɵfac = function NzHighlightPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzHighlightPipe)();
  };
  static ɵpipe = ɵɵdefinePipe({
    name: "nzHighlight",
    type: _NzHighlightPipe,
    pure: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzHighlightPipe, [{
    type: Pipe,
    args: [{
      name: "nzHighlight"
    }]
  }], null, null);
})();

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-cascader.mjs
var _c0 = ["nz-cascader-option", ""];
var _c1 = (a0, a1) => ({
  $implicit: a0,
  index: a1
});
function NzCascaderOptionComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "span", 4);
    ɵɵlistener("click", function NzCascaderOptionComponent_Conditional_0_Template_span_click_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onCheckboxClick($event));
    });
    ɵɵelement(1, "span", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassProp("ant-cascader-checkbox-checked", ctx_r1.checked)("ant-cascader-checkbox-indeterminate", ctx_r1.halfChecked)("ant-cascader-checkbox-disabled", ctx_r1.disabled);
  }
}
function NzCascaderOptionComponent_Conditional_1_ng_template_0_Template(rf, ctx) {
}
function NzCascaderOptionComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzCascaderOptionComponent_Conditional_1_ng_template_0_Template, 0, 0, "ng-template", 1);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.optionTemplate)("ngTemplateOutletContext", ɵɵpureFunction2(2, _c1, ctx_r1.node.origin, ctx_r1.columnIndex));
  }
}
function NzCascaderOptionComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "div", 2);
    ɵɵpipe(1, "nzHighlight");
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("innerHTML", ɵɵpipeBind4(1, 1, ctx_r1.node.title, ctx_r1.highlightText, "g", "ant-cascader-menu-item-keyword"), ɵɵsanitizeHtml);
  }
}
function NzCascaderOptionComponent_Conditional_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 6);
  }
}
function NzCascaderOptionComponent_Conditional_3_Conditional_2_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵelement(1, "nz-icon", 8);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵproperty("nzType", ctx_r1.expandIcon);
  }
}
function NzCascaderOptionComponent_Conditional_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzCascaderOptionComponent_Conditional_3_Conditional_2_ng_container_0_Template, 2, 1, "ng-container", 7);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("nzStringTemplateOutlet", ctx_r1.expandIcon);
  }
}
function NzCascaderOptionComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 3);
    ɵɵconditionalCreate(1, NzCascaderOptionComponent_Conditional_3_Conditional_1_Template, 1, 0, "nz-icon", 6)(2, NzCascaderOptionComponent_Conditional_3_Conditional_2_Template, 1, 1, "ng-container");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵconditional(ctx_r1.node.isLoading ? 1 : 2);
  }
}
var _c2 = ["selectContainer"];
var _c3 = ["menu"];
var _c4 = ["*"];
function NzCascaderComponent_Conditional_0_Conditional_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const prefix_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵtextInterpolate(prefix_r1);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 4);
    ɵɵtemplate(1, NzCascaderComponent_Conditional_0_Conditional_2_ng_container_1_Template, 2, 1, "ng-container", 9);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    ɵɵadvance();
    ɵɵproperty("nzStringTemplateOutlet", ctx);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_4_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 10)(1, "nz-select-item", 13);
    ɵɵlistener("delete", function NzCascaderComponent_Conditional_0_Conditional_4_For_2_Template_nz_select_item_delete_1_listener() {
      const node_r4 = ɵɵrestoreView(_r3).$implicit;
      const ctx_r4 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r4.removeSelected(node_r4));
    });
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const node_r4 = ctx.$implicit;
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵproperty("disabled", ctx_r4.nzDisabled)("label", ctx_r4.nzDisplayWith(ctx_r4.getAncestorOptionList(node_r4)));
  }
}
function NzCascaderComponent_Conditional_0_Conditional_4_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 10);
    ɵɵelement(1, "nz-select-item", 14);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵproperty("label", "+ " + (ctx_r4.selectedNodes.length - ctx_r4.nzMaxTagCount) + " ...");
  }
}
function NzCascaderComponent_Conditional_0_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 6);
    ɵɵrepeaterCreate(1, NzCascaderComponent_Conditional_0_Conditional_4_For_2_Template, 2, 2, "div", 10, ɵɵrepeaterTrackByIdentity);
    ɵɵpipe(3, "slice");
    ɵɵconditionalCreate(4, NzCascaderComponent_Conditional_0_Conditional_4_Conditional_4_Template, 2, 1, "div", 10);
    ɵɵelementStart(5, "div", 11)(6, "nz-select-search", 12);
    ɵɵlistener("isComposingChange", function NzCascaderComponent_Conditional_0_Conditional_4_Template_nz_select_search_isComposingChange_6_listener($event) {
      ɵɵrestoreView(_r2);
      const ctx_r4 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r4.isComposingChange($event));
    })("valueChange", function NzCascaderComponent_Conditional_0_Conditional_4_Template_nz_select_search_valueChange_6_listener($event) {
      ɵɵrestoreView(_r2);
      const ctx_r4 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r4.inputValue = $event);
    });
    ɵɵelementEnd()()();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵrepeater(ɵɵpipeBind3(3, 7, ctx_r4.selectedNodes, 0, ctx_r4.nzMaxTagCount));
    ɵɵadvance(3);
    ɵɵconditional(ctx_r4.selectedNodes.length > ctx_r4.nzMaxTagCount ? 4 : -1);
    ɵɵadvance(2);
    ɵɵproperty("showInput", !!ctx_r4.nzShowSearch)("value", ctx_r4.inputValue)("mirrorSync", true)("disabled", ctx_r4.nzDisabled)("autofocus", ctx_r4.nzAutoFocus)("focusTrigger", ctx_r4.menuVisible());
  }
}
function NzCascaderComponent_Conditional_0_Conditional_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-select-item", 15);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵproperty("disabled", ctx_r4.nzDisabled)("label", ctx_r4.labelRenderText)("contentTemplateOutlet", ctx_r4.isLabelRenderTemplate ? ctx_r4.nzLabelRender : null)("contentTemplateOutletContext", ctx_r4.labelRenderContext);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "nz-select-search", 12);
    ɵɵlistener("isComposingChange", function NzCascaderComponent_Conditional_0_Conditional_5_Template_nz_select_search_isComposingChange_0_listener($event) {
      ɵɵrestoreView(_r6);
      const ctx_r4 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r4.isComposingChange($event));
    })("valueChange", function NzCascaderComponent_Conditional_0_Conditional_5_Template_nz_select_search_valueChange_0_listener($event) {
      ɵɵrestoreView(_r6);
      const ctx_r4 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r4.inputValue = $event);
    });
    ɵɵelementEnd();
    ɵɵconditionalCreate(1, NzCascaderComponent_Conditional_0_Conditional_5_Conditional_1_Template, 1, 4, "nz-select-item", 15);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(2);
    ɵɵproperty("showInput", !!ctx_r4.nzShowSearch)("value", ctx_r4.inputValue)("mirrorSync", false)("disabled", ctx_r4.nzDisabled)("autofocus", ctx_r4.nzAutoFocus)("focusTrigger", ctx_r4.menuVisible());
    ɵɵadvance();
    ɵɵconditional(ctx_r4.showLabelRender ? 1 : -1);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-select-placeholder", 16);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(2);
    ɵɵstyleProp("display", ctx_r4.inputValue || ctx_r4.isComposing ? "none" : "block");
    ɵɵproperty("placeholder", ctx_r4.nzPlaceHolder || (ctx_r4.locale == null ? null : ctx_r4.locale.placeholder));
  }
}
function NzCascaderComponent_Conditional_0_Conditional_7_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 21);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵclassProp("ant-cascader-picker-arrow-expand", ctx_r4.menuVisible());
    ɵɵproperty("nzType", ctx_r4.nzSuffixIcon);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_7_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-icon", 19);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_7_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "nz-form-item-feedback-icon", 20);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵproperty("status", ctx_r4.status);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 17);
    ɵɵconditionalCreate(1, NzCascaderComponent_Conditional_0_Conditional_7_Conditional_1_Template, 1, 3, "nz-icon", 18)(2, NzCascaderComponent_Conditional_0_Conditional_7_Conditional_2_Template, 1, 0, "nz-icon", 19);
    ɵɵconditionalCreate(3, NzCascaderComponent_Conditional_0_Conditional_7_Conditional_3_Template, 1, 1, "nz-form-item-feedback-icon", 20);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(2);
    ɵɵclassProp("ant-select-arrow-loading", ctx_r4.isLoading);
    ɵɵadvance();
    ɵɵconditional(!ctx_r4.isLoading ? 1 : 2);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r4.hasFeedback && !!ctx_r4.status ? 3 : -1);
  }
}
function NzCascaderComponent_Conditional_0_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "nz-select-clear", 22);
    ɵɵlistener("clear", function NzCascaderComponent_Conditional_0_Conditional_8_Template_nz_select_clear_clear_0_listener($event) {
      ɵɵrestoreView(_r7);
      const ctx_r4 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r4.clearSelection($event));
    });
    ɵɵelementEnd();
  }
}
function NzCascaderComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 3, 0);
    ɵɵconditionalCreate(2, NzCascaderComponent_Conditional_0_Conditional_2_Template, 2, 1, "div", 4);
    ɵɵelementStart(3, "span", 5);
    ɵɵconditionalCreate(4, NzCascaderComponent_Conditional_0_Conditional_4_Template, 7, 11, "div", 6)(5, NzCascaderComponent_Conditional_0_Conditional_5_Template, 2, 7);
    ɵɵconditionalCreate(6, NzCascaderComponent_Conditional_0_Conditional_6_Template, 1, 3, "nz-select-placeholder", 7);
    ɵɵelementEnd()();
    ɵɵconditionalCreate(7, NzCascaderComponent_Conditional_0_Conditional_7_Template, 4, 4, "span", 8);
    ɵɵconditionalCreate(8, NzCascaderComponent_Conditional_0_Conditional_8_Template, 1, 0, "nz-select-clear");
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r4 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵconditional((tmp_2_0 = ctx_r4.nzPrefix) ? 2 : -1, tmp_2_0);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r4.nzMultiple ? 4 : 5);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r4.showPlaceholder ? 6 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r4.nzShowArrow ? 7 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r4.clearIconVisible ? 8 : -1);
  }
}
function NzCascaderComponent_ng_template_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "ul", 26)(1, "li", 27);
    ɵɵelement(2, "nz-embed-empty", 28);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(2);
    ɵɵstyleProp("width", ctx_r4.dropdownWidthStyle)("height", ctx_r4.dropdownHeightStyle);
    ɵɵadvance(2);
    ɵɵproperty("specificContent", ctx_r4.nzNotFoundContent);
  }
}
function NzCascaderComponent_ng_template_2_Conditional_4_For_1_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "li", 32);
    ɵɵlistener("mouseenter", function NzCascaderComponent_ng_template_2_Conditional_4_For_1_For_2_Template_li_mouseenter_0_listener($event) {
      const option_r10 = ɵɵrestoreView(_r9).$implicit;
      const ɵ$index_71_r11 = ɵɵnextContext().$index;
      const ctx_r4 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r4.onOptionMouseEnter(option_r10, ɵ$index_71_r11, $event));
    })("mouseleave", function NzCascaderComponent_ng_template_2_Conditional_4_For_1_For_2_Template_li_mouseleave_0_listener($event) {
      const option_r10 = ɵɵrestoreView(_r9).$implicit;
      const ɵ$index_71_r11 = ɵɵnextContext().$index;
      const ctx_r4 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r4.onOptionMouseLeave(option_r10, ɵ$index_71_r11, $event));
    })("click", function NzCascaderComponent_ng_template_2_Conditional_4_For_1_For_2_Template_li_click_0_listener($event) {
      const option_r10 = ɵɵrestoreView(_r9).$implicit;
      const ɵ$index_71_r11 = ɵɵnextContext().$index;
      const ctx_r4 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r4.onOptionClick(option_r10, ɵ$index_71_r11, $event));
    })("check", function NzCascaderComponent_ng_template_2_Conditional_4_For_1_For_2_Template_li_check_0_listener() {
      const option_r10 = ɵɵrestoreView(_r9).$implicit;
      const ɵ$index_71_r11 = ɵɵnextContext().$index;
      const ctx_r4 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r4.onOptionCheck(option_r10, ɵ$index_71_r11));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const option_r10 = ctx.$implicit;
    const ɵ$index_71_r11 = ɵɵnextContext().$index;
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵproperty("expandIcon", ctx_r4.nzExpandIcon)("columnIndex", ɵ$index_71_r11)("nzLabelProperty", ctx_r4.nzLabelProperty)("optionTemplate", ctx_r4.nzOptionRender)("activated", ctx_r4.isOptionActivated(option_r10, ɵ$index_71_r11))("highlightText", ctx_r4.inSearchingMode ? ctx_r4.inputValue : "")("node", option_r10)("dir", ctx_r4.dir)("checkable", ctx_r4.nzMultiple);
  }
}
function NzCascaderComponent_ng_template_2_Conditional_4_For_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "ul", 30);
    ɵɵrepeaterCreate(1, NzCascaderComponent_ng_template_2_Conditional_4_For_1_For_2_Template, 1, 9, "li", 31, ɵɵrepeaterTrackByIdentity);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const options_r12 = ctx.$implicit;
    const ctx_r4 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r4.nzColumnClassName);
    ɵɵstyleProp("height", ctx_r4.dropdownHeightStyle);
    ɵɵadvance();
    ɵɵrepeater(options_r12);
  }
}
function NzCascaderComponent_ng_template_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵrepeaterCreate(0, NzCascaderComponent_ng_template_2_Conditional_4_For_1_Template, 3, 4, "ul", 29, ɵɵrepeaterTrackByIdentity);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(2);
    ɵɵrepeater(ctx_r4.cascaderService.columns);
  }
}
function NzCascaderComponent_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 23);
    ɵɵanimateLeave(function NzCascaderComponent_ng_template_2_Template_animateleave_cb() {
      ɵɵrestoreView(_r8);
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.cascaderAnimationLeave());
    });
    ɵɵanimateEnter(function NzCascaderComponent_ng_template_2_Template_animateenter_cb() {
      ɵɵrestoreView(_r8);
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.cascaderAnimationEnter());
    });
    ɵɵlistener("mouseenter", function NzCascaderComponent_ng_template_2_Template_div_mouseenter_0_listener() {
      ɵɵrestoreView(_r8);
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onTriggerMouseEnter());
    })("mouseleave", function NzCascaderComponent_ng_template_2_Template_div_mouseleave_0_listener($event) {
      ɵɵrestoreView(_r8);
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onTriggerMouseLeave($event));
    });
    ɵɵelementStart(1, "div", 24, 1);
    ɵɵconditionalCreate(3, NzCascaderComponent_ng_template_2_Conditional_3_Template, 3, 5, "ul", 25)(4, NzCascaderComponent_ng_template_2_Conditional_4_Template, 2, 0);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext();
    ɵɵclassProp("ant-select-dropdown-placement-bottomLeft", ctx_r4.dropdownPosition === "bottomLeft")("ant-select-dropdown-placement-bottomRight", ctx_r4.dropdownPosition === "bottomRight")("ant-select-dropdown-placement-topLeft", ctx_r4.dropdownPosition === "topLeft")("ant-select-dropdown-placement-topRight", ctx_r4.dropdownPosition === "topRight")("ant-cascader-dropdown-rtl", ctx_r4.dir === "rtl");
    ɵɵproperty("nzNoAnimation", ctx_r4.noAnimation == null ? null : ctx_r4.noAnimation.nzNoAnimation == null ? null : ctx_r4.noAnimation.nzNoAnimation());
    ɵɵadvance();
    ɵɵstyleMap(ctx_r4.nzMenuStyle);
    ɵɵclassMap(ctx_r4.nzMenuClassName);
    ɵɵclassProp("ant-cascader-rtl", ctx_r4.dir === "rtl")("ant-cascader-menus-hidden", !ctx_r4.menuVisible())("ant-cascader-menu-empty", ctx_r4.shouldShowEmpty);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r4.shouldShowEmpty ? 3 : 4);
  }
}
function isShowSearchObject(options) {
  return typeof options !== "boolean";
}
function isChildNode(node) {
  return node.isLeaf || !node.children || !node.children.length;
}
function isParentNode(node) {
  return !!node.children && !!node.children.length && !node.isLeaf;
}
var NzCascaderOptionComponent = class _NzCascaderOptionComponent {
  cdr = inject(ChangeDetectorRef);
  optionTemplate = null;
  node;
  activated = false;
  highlightText;
  nzLabelProperty = "label";
  columnIndex;
  expandIcon = "";
  dir = "ltr";
  checkable = false;
  check = new EventEmitter();
  nativeElement = inject(ElementRef).nativeElement;
  ngOnInit() {
    if (this.expandIcon === "" && this.dir === "rtl") {
      this.expandIcon = "left";
    } else if (this.expandIcon === "") {
      this.expandIcon = "right";
    }
  }
  get checked() {
    return this.node.isChecked;
  }
  get halfChecked() {
    return this.node.isHalfChecked;
  }
  get disabled() {
    return this.node.isDisabled || this.node.isDisableCheckbox;
  }
  markForCheck() {
    this.cdr.markForCheck();
  }
  onCheckboxClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.checkable) {
      return;
    }
    this.check.emit();
  }
  static ɵfac = function NzCascaderOptionComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzCascaderOptionComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NzCascaderOptionComponent,
    selectors: [["", "nz-cascader-option", ""]],
    hostAttrs: [1, "ant-cascader-menu-item", "ant-cascader-menu-item-expanded"],
    hostVars: 7,
    hostBindings: function NzCascaderOptionComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("title", ctx.node.title);
        ɵɵclassProp("ant-cascader-menu-item-active", ctx.activated)("ant-cascader-menu-item-expand", !ctx.node.isLeaf)("ant-cascader-menu-item-disabled", ctx.node.isDisabled);
      }
    },
    inputs: {
      optionTemplate: "optionTemplate",
      node: "node",
      activated: "activated",
      highlightText: "highlightText",
      nzLabelProperty: "nzLabelProperty",
      columnIndex: [2, "columnIndex", "columnIndex", numberAttribute],
      expandIcon: "expandIcon",
      dir: "dir",
      checkable: [2, "checkable", "checkable", booleanAttribute]
    },
    outputs: {
      check: "check"
    },
    exportAs: ["nzCascaderOption"],
    attrs: _c0,
    decls: 4,
    vars: 3,
    consts: [[1, "ant-cascader-checkbox", 3, "ant-cascader-checkbox-checked", "ant-cascader-checkbox-indeterminate", "ant-cascader-checkbox-disabled"], [3, "ngTemplateOutlet", "ngTemplateOutletContext"], [1, "ant-cascader-menu-item-content", 3, "innerHTML"], [1, "ant-cascader-menu-item-expand-icon"], [1, "ant-cascader-checkbox", 3, "click"], [1, "ant-cascader-checkbox-inner"], ["nzType", "loading"], [4, "nzStringTemplateOutlet"], [3, "nzType"]],
    template: function NzCascaderOptionComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, NzCascaderOptionComponent_Conditional_0_Template, 2, 6, "span", 0);
        ɵɵconditionalCreate(1, NzCascaderOptionComponent_Conditional_1_Template, 1, 5, null, 1)(2, NzCascaderOptionComponent_Conditional_2_Template, 2, 6, "div", 2);
        ɵɵconditionalCreate(3, NzCascaderOptionComponent_Conditional_3_Template, 3, 1, "div", 3);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.checkable ? 0 : -1);
        ɵɵadvance();
        ɵɵconditional(ctx.optionTemplate ? 1 : 2);
        ɵɵadvance(2);
        ɵɵconditional(!ctx.node.isLeaf || (ctx.node.children == null ? null : ctx.node.children.length) || ctx.node.isLoading ? 3 : -1);
      }
    },
    dependencies: [NgTemplateOutlet, NzIconModule, NzIconDirective, NzOutletModule, NzStringTemplateOutletDirective, NzHighlightPipe],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzCascaderOptionComponent, [{
    type: Component,
    args: [{
      selector: "[nz-cascader-option]",
      exportAs: "nzCascaderOption",
      imports: [NgTemplateOutlet, NzHighlightPipe, NzIconModule, NzOutletModule],
      template: `
    @if (checkable) {
      <span
        class="ant-cascader-checkbox"
        [class.ant-cascader-checkbox-checked]="checked"
        [class.ant-cascader-checkbox-indeterminate]="halfChecked"
        [class.ant-cascader-checkbox-disabled]="disabled"
        (click)="onCheckboxClick($event)"
      >
        <span class="ant-cascader-checkbox-inner"></span>
      </span>
    }

    @if (optionTemplate) {
      <ng-template
        [ngTemplateOutlet]="optionTemplate"
        [ngTemplateOutletContext]="{ $implicit: node.origin, index: columnIndex }"
      />
    } @else {
      <div
        class="ant-cascader-menu-item-content"
        [innerHTML]="node.title | nzHighlight: highlightText : 'g' : 'ant-cascader-menu-item-keyword'"
      ></div>
    }

    @if (!node.isLeaf || node.children?.length || node.isLoading) {
      <div class="ant-cascader-menu-item-expand-icon">
        @if (node.isLoading) {
          <nz-icon nzType="loading" />
        } @else {
          <ng-container *nzStringTemplateOutlet="expandIcon">
            <nz-icon [nzType]="$any(expandIcon)" />
          </ng-container>
        }
      </div>
    }
  `,
      host: {
        class: "ant-cascader-menu-item ant-cascader-menu-item-expanded",
        "[attr.title]": "node.title",
        "[class.ant-cascader-menu-item-active]": "activated",
        "[class.ant-cascader-menu-item-expand]": "!node.isLeaf",
        "[class.ant-cascader-menu-item-disabled]": "node.isDisabled"
      },
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None
    }]
  }], null, {
    optionTemplate: [{
      type: Input
    }],
    node: [{
      type: Input
    }],
    activated: [{
      type: Input
    }],
    highlightText: [{
      type: Input
    }],
    nzLabelProperty: [{
      type: Input
    }],
    columnIndex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    expandIcon: [{
      type: Input
    }],
    dir: [{
      type: Input
    }],
    checkable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    check: [{
      type: Output
    }]
  });
})();
var NzCascaderTreeService = class _NzCascaderTreeService extends NzTreeBaseService {
  fieldNames = {
    label: "label",
    value: "value"
  };
  treeNodePostProcessor = (node) => {
    node.key = this.getOptionValue(node);
    node.title = this.getOptionLabel(node);
  };
  getOptionValue(node) {
    return node.origin[this.fieldNames.value || "value"];
  }
  getOptionLabel(node) {
    return node.origin[this.fieldNames.label || "label"];
  }
  get children() {
    return this.rootNodes;
  }
  set children(value) {
    this.rootNodes = value.map((v) => v instanceof NzTreeNode ? v : new NzTreeNode(v, null));
  }
  /**
   * Map list of nodes to list of option
   */
  toOptions(nodes) {
    return nodes.map((node) => node.origin);
  }
  getAncestorNodeList(node) {
    if (!node) {
      return [];
    }
    if (node.parentNode) {
      return [...this.getAncestorNodeList(node.parentNode), node];
    }
    return [node];
  }
  /**
   * Render by nzCheckedKeys
   * When keys equals null, just render with checkStrictly
   *
   * @param paths
   * @param checkStrictly
   */
  conductCheckPaths(paths, checkStrictly) {
    this.checkedNodeList = [];
    this.halfCheckedNodeList = [];
    const existsPathList = [];
    const calc = (nodes) => {
      nodes.forEach((node) => {
        if (paths === null) {
          node.isChecked = !!node.origin.checked;
        } else {
          const nodePath = this.getAncestorNodeList(node).map((n) => this.getOptionValue(n));
          if (paths.some((keys) => arraysEqual(nodePath, keys))) {
            node.isChecked = true;
            node.isHalfChecked = false;
            existsPathList.push(nodePath);
          } else {
            node.isChecked = false;
            node.isHalfChecked = false;
          }
        }
        if (node.children.length > 0) {
          calc(node.children);
        }
      });
    };
    calc(this.rootNodes);
    this.refreshCheckState(checkStrictly);
    this.handleMissingNodeList(paths, existsPathList);
  }
  conductSelectedPaths(paths) {
    this.selectedNodeList.forEach((node) => node.isSelected = false);
    this.selectedNodeList = [];
    const existsPathList = [];
    const calc = (nodes) => nodes.every((node) => {
      const nodePath = this.getAncestorNodeList(node).map((n) => this.getOptionValue(n));
      if (paths.some((keys) => arraysEqual(nodePath, keys))) {
        node.isSelected = true;
        this.setSelectedNodeList(node);
        existsPathList.push(nodePath);
        return false;
      } else {
        node.isSelected = false;
      }
      if (node.children.length > 0) {
        return calc(node.children);
      }
      return true;
    });
    calc(this.rootNodes);
    this.handleMissingNodeList(paths, existsPathList);
  }
  handleMissingNodeList(paths, existsPathList) {
    const missingNodeList = this.getMissingNodeList(paths, existsPathList);
    missingNodeList.forEach((node) => {
      this.setSelectedNodeList(node);
    });
  }
  getMissingNodeList(paths, existsPathList) {
    if (!paths) {
      return [];
    }
    return paths.filter((path) => !existsPathList.some((keys) => arraysEqual(path, keys))).map((path) => this.createMissingNode(path)).filter(isNotNil);
  }
  createMissingNode(path) {
    if (!path?.length) {
      return null;
    }
    const createOption = (key) => {
      return {
        [this.fieldNames.value || "value"]: key,
        [this.fieldNames.label || "label"]: key
      };
    };
    let node = new NzTreeNode(createOption(path[0]), null, this);
    for (let i = 1; i < path.length; i++) {
      const childNode = new NzTreeNode(createOption(path[i]));
      node.addChildren([childNode]);
      node = childNode;
    }
    if (this.isMultiple) {
      node.isChecked = true;
      node.isHalfChecked = false;
    } else {
      node.isSelected = true;
    }
    return node;
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵNzCascaderTreeService_BaseFactory;
    return function NzCascaderTreeService_Factory(__ngFactoryType__) {
      return (ɵNzCascaderTreeService_BaseFactory || (ɵNzCascaderTreeService_BaseFactory = ɵɵgetInheritedFactory(_NzCascaderTreeService)))(__ngFactoryType__ || _NzCascaderTreeService);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _NzCascaderTreeService,
    factory: _NzCascaderTreeService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzCascaderTreeService, [{
    type: Injectable
  }], null, null);
})();
var NzCascaderService = class _NzCascaderService {
  destroyRef = inject(DestroyRef);
  /** Activated options in each column. */
  activatedNodes = [];
  /** An array to store cascader items arranged in different layers. */
  columns = [];
  /** If user has entered searching mode. */
  inSearchingMode = false;
  values = [];
  /**
   * Emit an event when loading state changes.
   * Emit true if nzOptions is loading by `nzLoadData`.
   */
  $loading = new BehaviorSubject(false);
  /**
   * Emit an event to notify cascader it needs to redraw because activated or
   * selected options are changed.
   */
  $redraw = new Subject();
  /**
   * Emit an event when an option gets selected.
   * Emit true if a leaf options is selected.
   */
  $nodeSelected = new Subject();
  /**
   * Emit an event to notify cascader it needs to quit searching mode.
   * Only emit when user do select a searching option.
   */
  $quitSearching = new Subject();
  /** To hold columns before entering searching mode. */
  columnSnapshot = [[]];
  cascaderComponent;
  searchOptionPathMap = /* @__PURE__ */ new Map();
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.$redraw.complete();
      this.$quitSearching.complete();
      this.$nodeSelected.complete();
      this.$loading.complete();
      this.searchOptionPathMap.clear();
    });
  }
  /** Return cascader options in the first layer. */
  get nzOptions() {
    return this.cascaderComponent.treeService.toOptions(this.columns[0] || []);
  }
  /**
   * Bind cascader component so this service could use inputs.
   */
  withComponent(cascaderComponent) {
    this.cascaderComponent = cascaderComponent;
  }
  /**
   * Try to set an option as activated.
   *
   * @param node Cascader option node
   * @param columnIndex Of which column this option is in
   * @param performSelect Select
   * @param multiple Multiple mode
   * @param loadingChildren Try to load children asynchronously.
   */
  setNodeActivated(node, columnIndex, performSelect = false, multiple = false, loadingChildren = true) {
    if (node.isDisabled) {
      return;
    }
    this.activatedNodes[columnIndex] = node;
    this.trackAncestorActivatedNodes(columnIndex);
    this.dropBehindActivatedNodes(columnIndex);
    if (isParentNode(node)) {
      this.setColumnData(node.children, columnIndex + 1);
    } else if (!node.isLeaf && loadingChildren) {
      this.loadChildren(node, columnIndex);
    } else if (node.isLeaf) {
      this.dropBehindColumns(columnIndex);
    }
    if (performSelect && node.isSelectable) {
      this.setNodeSelected(node, columnIndex, multiple);
    }
    this.$redraw.next();
  }
  /**
   * Set an option as selected.
   * @param node
   * @param index
   * @param multiple
   */
  setNodeSelected(node, index, multiple = false) {
    const changeOn = this.cascaderComponent.nzChangeOn;
    const shouldPerformSelection = (o, i) => typeof changeOn === "function" ? changeOn(o, i) : false;
    if (multiple || node.isLeaf || this.cascaderComponent.nzChangeOnSelect || shouldPerformSelection(node.origin, index)) {
      node.isSelected = true;
      this.cascaderComponent.treeService.setSelectedNodeList(node, multiple);
      this.cascaderComponent.updateSelectedNodes();
      this.$redraw.next();
      this.$nodeSelected.next(node);
    }
  }
  setNodeDeactivatedSinceColumn(column) {
    this.dropBehindActivatedNodes(column - 1);
    this.dropBehindColumns(column);
    this.$redraw.next();
  }
  /**
   * Set a searching option as selected, finishing up things.
   *
   * @param node
   * @param multiple
   */
  setSearchOptionSelected(node, multiple = false) {
    this.setNodeSelected(node, node.level, multiple);
    setTimeout(() => {
      this.$quitSearching.next();
      this.$redraw.next();
    }, 200);
  }
  /**
   * Reset node's `title` and `disabled` status and clear `searchOptionPathMap`.
   */
  clearSearchOptions() {
    for (const node of this.searchOptionPathMap.keys()) {
      node.isDisabled = node.origin.disabled || false;
      node.title = this.getOptionLabel(node.origin);
    }
    this.searchOptionPathMap.clear();
  }
  /**
   * Filter cascader options to reset `columns`.
   *
   * @param searchValue The string user wants to search.
   */
  prepareSearchOptions(searchValue) {
    const results = [];
    const path = [];
    const defaultFilter = (i, p) => p.some((o) => {
      const label = this.getOptionLabel(o);
      return !!label && label.indexOf(i) !== -1;
    });
    const showSearch = this.cascaderComponent.nzShowSearch;
    const filter = isShowSearchObject(showSearch) && showSearch.filter ? showSearch.filter : defaultFilter;
    const sorter = isShowSearchObject(showSearch) && showSearch.sorter ? showSearch.sorter : null;
    const loopChild = (node, forceDisabled = false) => {
      path.push(node);
      const cPath = this.cascaderComponent.treeService.toOptions(path);
      if (filter(searchValue, cPath)) {
        this.searchOptionPathMap.set(node, cPath);
        node.isDisabled = forceDisabled || node.isDisabled;
        node.title = cPath.map((p) => this.getOptionLabel(p)).join(" / ");
        results.push(node);
      }
      path.pop();
    };
    const loopParent = (node, forceDisabled = false) => {
      const disabled = forceDisabled || node.isDisabled;
      path.push(node);
      node.children.forEach((sNode) => {
        if (!sNode.isLeaf) {
          loopParent(sNode, disabled);
        }
        if (sNode.isLeaf || !sNode.children || !sNode.children.length) {
          loopChild(sNode, disabled);
        }
      });
      path.pop();
    };
    if (!this.columnSnapshot.length) {
      this.columns = [[]];
      return;
    }
    this.columnSnapshot[0].forEach((o) => isChildNode(o) ? loopChild(o) : loopParent(o));
    if (sorter) {
      results.sort((a, b) => sorter(this.searchOptionPathMap.get(a), this.searchOptionPathMap.get(b), searchValue));
    }
    this.columns = [results];
    this.$redraw.next();
  }
  /**
   * Set searching mode by UI. It deals with things not directly related to UI.
   *
   * @param toSearching If this cascader is entering searching mode
   */
  setSearchingMode(toSearching) {
    this.inSearchingMode = toSearching;
    if (toSearching) {
      this.clearSearchOptions();
      this.columnSnapshot = [...this.columns];
      this.activatedNodes = [];
    } else {
      this.clearSearchOptions();
      this.activatedNodes = [];
      setTimeout(() => {
        this.columns = [...this.columnSnapshot];
        if (this.cascaderComponent.selectedNodes.length) {
          const activatedNode = this.cascaderComponent.selectedNodes[0];
          const columnIndex = activatedNode.level;
          this.activatedNodes[columnIndex] = activatedNode;
          this.trackAncestorActivatedNodes(columnIndex);
          this.trackAncestorColumnData(columnIndex);
        }
        this.$redraw.next();
      });
    }
    this.$redraw.next();
  }
  /**
   * Clear selected options.
   */
  clear() {
    this.values = [];
    this.activatedNodes = [];
    this.dropBehindColumns(0);
    this.$redraw.next();
    this.$nodeSelected.next(null);
  }
  getOptionLabel(o) {
    return o[this.cascaderComponent.nzLabelProperty || "label"];
  }
  getOptionValue(o) {
    return o[this.cascaderComponent.nzValueProperty || "value"];
  }
  /**
   * Try to insert options into a column.
   *
   * @param nodes Options to insert
   * @param columnIndex Position
   */
  setColumnData(nodes, columnIndex) {
    this.columns[columnIndex] = nodes;
    this.dropBehindColumns(columnIndex);
  }
  /**
   * Set all columns data according to activate option's path
   */
  trackAncestorColumnData(startIndex) {
    const node = this.activatedNodes[startIndex];
    if (!node) {
      return;
    }
    this.dropBehindColumns(startIndex);
    for (let i = 0; i < startIndex; i++) {
      this.columns[i + 1] = this.activatedNodes[i].children;
    }
  }
  /**
   * Set all ancestor options as activated.
   */
  trackAncestorActivatedNodes(startIndex) {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (!this.activatedNodes[i]) {
        this.activatedNodes[i] = this.activatedNodes[i + 1].parentNode;
      }
    }
  }
  dropBehindActivatedNodes(lastReserveIndex) {
    this.activatedNodes = this.activatedNodes.splice(0, lastReserveIndex + 1);
  }
  dropBehindColumns(lastReserveIndex) {
    if (lastReserveIndex < this.columns.length - 1) {
      this.columns = this.columns.slice(0, lastReserveIndex + 1);
    }
  }
  /**
   * Load children of an option asynchronously.
   */
  loadChildren(node, columnIndex, onLoaded) {
    const isRoot = columnIndex < 0 || !isNotNil(node);
    const option = node?.origin || {};
    const loadFn = this.cascaderComponent.nzLoadData;
    if (loadFn) {
      this.$loading.next(isRoot);
      if (node) {
        node.isLoading = true;
      }
      wrapIntoObservable(loadFn(option, columnIndex)).pipe(finalize(() => {
        node && (node.isLoading = false);
        this.$loading.next(false);
        this.$redraw.next();
      })).subscribe({
        next: () => {
          if (option.children) {
            if (!isRoot) {
              const nodes = option.children.map((o) => new NzTreeNode(o, node));
              node.children = nodes;
              this.setColumnData(nodes, columnIndex + 1);
            } else {
              const nodes = this.cascaderComponent.coerceTreeNodes(option.children);
              this.cascaderComponent.treeService.initTree(nodes);
              this.setColumnData(nodes, 0);
            }
            onLoaded?.(option.children);
          }
        },
        error: () => {
          node && (node.isLeaf = true);
        }
      });
    }
  }
  isLoaded(index) {
    return !!this.columns[index] && this.columns[index].length > 0;
  }
  static ɵfac = function NzCascaderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzCascaderService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NzCascaderService,
    factory: _NzCascaderService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzCascaderService, [{
    type: Injectable
  }], () => [], null);
})();
var NZ_CONFIG_MODULE_NAME = "cascader";
var defaultDisplayRender = (labels) => labels.join(" / ");
var NzCascaderComponent = (() => {
  let _classSuper = NzTreeBase;
  let _nzVariant_decorators;
  let _nzVariant_initializers = [];
  let _nzVariant_extraInitializers = [];
  let _nzSize_decorators;
  let _nzSize_initializers = [];
  let _nzSize_extraInitializers = [];
  let _nzBackdrop_decorators;
  let _nzBackdrop_initializers = [];
  let _nzBackdrop_extraInitializers = [];
  return class NzCascaderComponent2 extends _classSuper {
    static {
      const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
      _nzVariant_decorators = [WithConfig()];
      _nzSize_decorators = [WithConfig()];
      _nzBackdrop_decorators = [WithConfig()];
      __esDecorate(null, null, _nzVariant_decorators, {
        kind: "field",
        name: "nzVariant",
        static: false,
        private: false,
        access: {
          has: (obj) => "nzVariant" in obj,
          get: (obj) => obj.nzVariant,
          set: (obj, value) => {
            obj.nzVariant = value;
          }
        },
        metadata: _metadata
      }, _nzVariant_initializers, _nzVariant_extraInitializers);
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
      __esDecorate(null, null, _nzBackdrop_decorators, {
        kind: "field",
        name: "nzBackdrop",
        static: false,
        private: false,
        access: {
          has: (obj) => "nzBackdrop" in obj,
          get: (obj) => obj.nzBackdrop,
          set: (obj, value) => {
            obj.nzBackdrop = value;
          }
        },
        metadata: _metadata
      }, _nzBackdrop_initializers, _nzBackdrop_extraInitializers);
      if (_metadata) Object.defineProperty(this, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata
      });
    }
    ngZone = inject(NgZone);
    cdr = inject(ChangeDetectorRef);
    i18nService = inject(NzI18nService);
    elementRef = inject(ElementRef);
    renderer = inject(Renderer2);
    directionality = inject(Directionality);
    destroyRef = inject(DestroyRef);
    _nzModuleName = NZ_CONFIG_MODULE_NAME;
    selectContainer;
    cascaderAnimationEnter = slideAnimationEnter();
    cascaderAnimationLeave = slideAnimationLeave();
    set input(inputComponent) {
      this.input$.next(inputComponent?.inputElement);
    }
    get input() {
      return this.input$.getValue();
    }
    /** Used to store the native `<input type="search" />` element since it might be set asynchronously. */
    input$ = new BehaviorSubject(void 0);
    menu;
    overlay;
    cascaderItems;
    nzOpen;
    nzOptions = [];
    nzOptionRender = null;
    nzShowInput = true;
    nzShowArrow = true;
    nzAllowClear = true;
    nzAutoFocus = false;
    nzChangeOnSelect = false;
    nzDisabled = false;
    nzColumnClassName;
    nzExpandTrigger = "click";
    nzValueProperty = "value";
    nzLabelProperty = "label";
    nzLabelRender = null;
    nzVariant = __runInitializers(this, _nzVariant_initializers, void 0);
    nzNotFoundContent = __runInitializers(this, _nzVariant_extraInitializers);
    nzSize = __runInitializers(this, _nzSize_initializers, "default");
    nzBackdrop = (__runInitializers(this, _nzSize_extraInitializers), __runInitializers(this, _nzBackdrop_initializers, false));
    nzShowSearch = (__runInitializers(this, _nzBackdrop_extraInitializers), false);
    nzPlaceHolder = "";
    nzMenuClassName;
    nzMenuStyle = null;
    /**
     * Duration in milliseconds before opening the menu when the mouse enters the trigger.
     * @default 150
     */
    nzMouseLeaveDelay = 150;
    /**
     * Duration in milliseconds before closing the menu when the mouse leaves the trigger.
     * @default 150
     */
    nzMouseEnterDelay = 150;
    nzStatus = "";
    nzMultiple = false;
    nzMaxTagCount = Infinity;
    nzPlacement = "bottomLeft";
    nzTriggerAction = ["click"];
    nzChangeOn;
    nzLoadData;
    nzDisplayWith = (nodes) => {
      return defaultDisplayRender(nodes.map((n) => this.cascaderService.getOptionLabel(n)));
    };
    // TODO: RTL
    nzPrefix = null;
    nzSuffixIcon = "down";
    nzExpandIcon = "";
    get treeService() {
      return this.nzTreeService;
    }
    nzVisibleChange = new EventEmitter();
    nzSelectionChange = new EventEmitter();
    nzRemoved = new EventEmitter();
    nzClear = new EventEmitter();
    prefixCls = "ant-select";
    statusCls = {};
    status = "";
    hasFeedback = false;
    /**
     * If the dropdown should show the empty content.
     * `true` if there's no options.
     */
    shouldShowEmpty = false;
    el = this.elementRef.nativeElement;
    menuVisible = signal(false, ...ngDevMode ? [{
      debugName: "menuVisible"
    }] : []);
    isLoading = false;
    labelRenderText;
    labelRenderContext = {};
    onChange = Function.prototype;
    onTouched = Function.prototype;
    positions = [...DEFAULT_CASCADER_POSITIONS];
    /**
     * Dropdown width in pixel.
     */
    dropdownWidthStyle;
    dropdownHeightStyle = "";
    dropdownPosition = "bottomLeft";
    isFocused = false;
    locale;
    dir = "ltr";
    isComposing = false;
    get overlayOrigin() {
      return this.elementRef;
    }
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
    finalVariant = computed(() => this.variant() || this.formVariant?.() || "outlined", ...ngDevMode ? [{
      debugName: "finalVariant"
    }] : []);
    size = signal(this.nzSize, ...ngDevMode ? [{
      debugName: "size"
    }] : []);
    variant = signal(this.nzVariant, ...ngDevMode ? [{
      debugName: "variant"
    }] : []);
    formSize = inject(NZ_FORM_SIZE, {
      optional: true
    });
    formVariant = inject(NZ_FORM_VARIANT, {
      optional: true
    });
    compactSize = inject(NZ_SPACE_COMPACT_SIZE, {
      optional: true
    });
    inputString = "";
    isOpening = false;
    delayMenuTimer;
    delaySelectTimer;
    isNzDisableFirstChange = true;
    selectedNodes = [];
    get inSearchingMode() {
      return this.cascaderService.inSearchingMode;
    }
    set inputValue(inputValue) {
      this.inputString = inputValue;
      this.toggleSearchingMode(!!inputValue);
    }
    get inputValue() {
      return this.inputString;
    }
    get hasInput() {
      return !!this.inputValue;
    }
    get hasValue() {
      return this.cascaderService.values && this.cascaderService.values.length > 0;
    }
    get showLabelRender() {
      return !this.hasInput && !!this.selectedNodes.length;
    }
    get showPlaceholder() {
      return !(this.hasInput || this.hasValue);
    }
    get clearIconVisible() {
      return this.nzAllowClear && !this.nzDisabled && (this.hasValue || this.hasInput);
    }
    get isLabelRenderTemplate() {
      return !!this.nzLabelRender;
    }
    get openControlled() {
      return this.nzOpen !== void 0;
    }
    noAnimation = inject(NzNoAnimationDirective, {
      host: true,
      optional: true
    });
    nzFormStatusService = inject(NzFormStatusService, {
      optional: true
    });
    nzFormNoStatusService = inject(NzFormNoStatusService, {
      optional: true
    });
    cascaderService = inject(NzCascaderService);
    constructor() {
      super(inject(NzCascaderTreeService));
      this.cascaderService.withComponent(this);
      this.renderer.addClass(this.elementRef.nativeElement, "ant-select");
      this.renderer.addClass(this.elementRef.nativeElement, "ant-cascader");
      this.destroyRef.onDestroy(() => {
        this.clearDelayMenuTimer();
        this.clearDelaySelectTimer();
      });
      onConfigChangeEventForComponent(NZ_CONFIG_MODULE_NAME, () => {
        this.size.set(this.nzSize);
        this.cdr.markForCheck();
      });
    }
    ngOnInit() {
      this.nzFormStatusService?.formStatusChanges.pipe(distinctUntilChanged((pre, cur) => pre.status === cur.status && pre.hasFeedback === cur.hasFeedback), withLatestFrom(this.nzFormNoStatusService ? this.nzFormNoStatusService.noFormStatus : of(false)), map(([{
        status,
        hasFeedback
      }, noStatus]) => ({
        status: noStatus ? "" : status,
        hasFeedback
      })), takeUntilDestroyed(this.destroyRef)).subscribe(({
        status,
        hasFeedback
      }) => this.setStatusStyles(status, hasFeedback));
      const srv = this.cascaderService;
      srv.$redraw.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.checkChildren();
        this.setDisplayLabel();
        this.cdr.detectChanges();
        this.reposition();
        this.setDropdownStyles();
      });
      srv.$loading.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => {
        this.isLoading = loading;
      });
      srv.$nodeSelected.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((node) => {
        if (!node) {
          this.emitValue([]);
          this.nzSelectionChange.emit([]);
        } else {
          const shouldClose = (
            // keep menu opened if multiple mode
            !this.nzMultiple && (node.isLeaf || this.nzChangeOnSelect && this.nzExpandTrigger === "hover") && !this.openControlled
          );
          if (shouldClose) {
            this.delaySetMenuVisible(false);
          }
          this.nzSelectionChange.emit(this.getAncestorOptionList(node));
          this.cdr.markForCheck();
        }
      });
      srv.$quitSearching.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.inputValue = "";
        this.dropdownWidthStyle = "";
      });
      this.i18nService.localeChange.pipe(startWith(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.setLocale());
      this.size.set(this.nzSize);
      this.dir = this.directionality.value;
      this.directionality.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.dir = this.directionality.value;
        srv.$redraw.next();
      });
      this.setupSelectionChangeListener();
      this.setupChangeListener();
      this.setupKeydownListener();
      this.setupFocusListener();
    }
    ngOnChanges(changes) {
      const {
        nzOpen,
        nzStatus,
        nzSize,
        nzPlacement,
        nzOptions,
        nzVariant
      } = changes;
      if (nzOpen && this.openControlled) {
        this.setMenuVisible(nzOpen.currentValue);
      }
      if (nzOptions) {
        this.updateOptions();
      }
      if (nzStatus) {
        this.setStatusStyles(this.nzStatus, this.hasFeedback);
      }
      if (nzSize) {
        this.size.set(nzSize.currentValue);
      }
      if (nzVariant) {
        this.variant.set(nzVariant.currentValue);
      }
      if (nzPlacement) {
        const {
          currentValue
        } = nzPlacement;
        this.dropdownPosition = currentValue;
        const listOfPlacement = ["bottomLeft", "topLeft", "bottomRight", "topRight"];
        if (currentValue && listOfPlacement.includes(currentValue)) {
          this.positions = [POSITION_MAP[currentValue]];
        } else {
          this.positions = listOfPlacement.map((e) => POSITION_MAP[e]);
        }
      }
    }
    registerOnChange(fn) {
      this.onChange = fn;
    }
    registerOnTouched(fn) {
      this.onTouched = fn;
    }
    writeValue(value) {
      if (isNotNil(value)) {
        if (this.nzMultiple) {
          this.cascaderService.values = toArray(value);
        } else {
          this.cascaderService.values = [toArray(value)];
        }
        this.clearSelectedNodes();
        this.updateSelectedNodes(true, false);
      } else {
        this.cascaderService.values = [];
        this.clearSelectedNodes();
        this.selectedNodes = [];
        this.cascaderService.$redraw.next();
      }
    }
    setupSelectionChangeListener() {
      merge(this.nzSelectionChange, this.nzRemoved, this.nzClear).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.updateSelectedNodes();
        this.emitValue(this.cascaderService.values);
        this.cascaderService.$redraw.next();
      });
    }
    delaySetMenuVisible(visible, delay = 100, setOpening = false) {
      this.clearDelayMenuTimer();
      if (delay) {
        if (visible && setOpening) {
          this.isOpening = true;
        }
        this.delayMenuTimer = setTimeout(() => {
          this.setMenuVisible(visible);
          this.cdr.detectChanges();
          this.clearDelayMenuTimer();
          if (visible) {
            setTimeout(() => {
              this.isOpening = false;
            }, 100);
          }
        }, delay);
      } else {
        this.setMenuVisible(visible);
      }
    }
    setMenuVisible(visible) {
      if (this.nzDisabled || this.menuVisible() === visible) {
        return;
      }
      if (visible) {
        this.cascaderService.$redraw.next();
        this.updateSelectedNodes(true);
        this.scrollToActivatedOptions();
      } else {
        this.inputValue = "";
      }
      this.menuVisible.set(visible);
      this.nzVisibleChange.emit(visible);
      this.cdr.detectChanges();
    }
    clearDelayMenuTimer() {
      if (this.delayMenuTimer) {
        clearTimeout(this.delayMenuTimer);
        this.delayMenuTimer = void 0;
      }
    }
    clearSelection(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.clearSelectedNodes();
      this.labelRenderText = "";
      this.labelRenderContext = {};
      this.inputValue = "";
      if (!this.openControlled) {
        this.setMenuVisible(false);
      }
      this.cascaderService.clear();
      this.nzClear.emit();
    }
    clearSelectedNodes() {
      this.selectedNodes.forEach((node) => {
        this.removeSelected(node, false);
      });
    }
    emitValue(values) {
      if (this.nzMultiple) {
        this.onChange(values);
      } else {
        this.onChange(values?.length ? values[0] : []);
      }
    }
    /**
     * @internal
     */
    getSubmitValue() {
      if (this.nzMultiple) {
        return this.cascaderService.values;
      } else {
        return this.cascaderService.values?.length ? this.cascaderService.values[0] : [];
      }
    }
    focus() {
      if (!this.isFocused) {
        (this.input?.nativeElement || this.el).focus();
        this.isFocused = true;
      }
    }
    blur() {
      if (this.isFocused) {
        (this.input?.nativeElement || this.el).blur();
        this.isFocused = false;
      }
    }
    handleInputBlur() {
      this.menuVisible() ? this.focus() : this.blur();
    }
    handleInputFocus() {
      this.focus();
    }
    isComposingChange(isComposing) {
      this.isComposing = isComposing;
    }
    onTriggerClick() {
      if (this.nzDisabled || this.openControlled) {
        return;
      }
      if (this.nzShowSearch) {
        this.focus();
      }
      if (this.isActionTrigger("click")) {
        this.delaySetMenuVisible(!this.menuVisible(), 100);
      }
      this.onTouched();
    }
    onTriggerMouseEnter() {
      if (this.nzDisabled || !this.isActionTrigger("hover") || this.openControlled) {
        return;
      }
      this.delaySetMenuVisible(true, this.nzMouseEnterDelay, true);
    }
    onTriggerMouseLeave(event) {
      if (this.nzDisabled || !this.menuVisible() || this.isOpening || !this.isActionTrigger("hover") || this.openControlled) {
        event.preventDefault();
        return;
      }
      const mouseTarget = event.relatedTarget;
      const hostEl = this.el;
      const menuEl = this.menu && this.menu.nativeElement;
      if (hostEl.contains(mouseTarget) || menuEl && menuEl.contains(mouseTarget)) {
        return;
      }
      this.delaySetMenuVisible(false, this.nzMouseLeaveDelay);
    }
    onOptionMouseEnter(node, columnIndex, event) {
      event.preventDefault();
      if (this.nzExpandTrigger === "hover") {
        if (!node.isLeaf) {
          this.delaySetOptionActivated(node, columnIndex, false);
        } else {
          this.cascaderService.setNodeDeactivatedSinceColumn(columnIndex);
        }
      }
    }
    onOptionMouseLeave(node, _columnIndex, event) {
      event.preventDefault();
      if (this.nzExpandTrigger === "hover" && !node.isLeaf) {
        this.clearDelaySelectTimer();
      }
    }
    /**
     * Get ancestor options of a node
     */
    getAncestorOptionList(node) {
      const ancestors = this.treeService.getAncestorNodeList(node);
      return this.treeService.toOptions(ancestors);
    }
    updateSelectedNodes(init = false, updateValue = true) {
      const value = this.cascaderService.values;
      const multiple = this.nzMultiple;
      const updateNodesAndValue = (shouldUpdateValue) => {
        this.selectedNodes = [...this.nzMultiple ? this.getCheckedNodeList() : this.getSelectedNodeList()].sort((a, b) => {
          const indexA = value.indexOf(a.key);
          const indexB = value.indexOf(b.key);
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          if (indexA !== -1) {
            return -1;
          }
          if (indexB !== -1) {
            return 1;
          }
          return 0;
        });
        if (shouldUpdateValue) {
          this.cascaderService.values = this.selectedNodes.map((node) => this.getAncestorOptionList(node).map((o) => this.cascaderService.getOptionValue(o)));
        }
        this.cascaderService.$redraw.next();
      };
      if (init) {
        const defaultValue = value[0];
        const lastColumnIndex = defaultValue?.length ? defaultValue.length - 1 : 0;
        this.treeService.fieldNames = {
          value: this.nzValueProperty,
          label: this.nzLabelProperty
        };
        this.treeService.isMultiple = multiple;
        this.treeService.isCheckStrictly = false;
        const checkNodeStates = () => {
          if (multiple) {
            this.treeService.conductCheckPaths(value, this.treeService.isCheckStrictly);
          } else {
            this.treeService.conductSelectedPaths(value);
          }
        };
        const initColumnWithIndex = (columnIndex = 0) => {
          const activatedOptionSetter = () => {
            const currentValue = defaultValue?.[columnIndex];
            if (!isNotNil(currentValue)) {
              this.cascaderService.$redraw.next();
              return;
            }
            const node = this.cascaderService.columns[columnIndex].find((n) => this.cascaderService.getOptionValue(n.origin) === currentValue) || null;
            if (isNotNil(node)) {
              this.cascaderService.setNodeActivated(node, columnIndex, false, multiple, false);
              if (columnIndex < lastColumnIndex) {
                initColumnWithIndex(columnIndex + 1);
              }
            }
            checkNodeStates();
            updateNodesAndValue(false);
          };
          if (this.cascaderService.isLoaded(columnIndex) || !this.nzLoadData) {
            activatedOptionSetter();
          } else {
            const node = this.cascaderService.activatedNodes[columnIndex - 1];
            this.cascaderService.loadChildren(node, columnIndex - 1, activatedOptionSetter);
          }
        };
        if (this.nzLoadData) {
          initColumnWithIndex();
        } else {
          const nodes = this.coerceTreeNodes(this.nzOptions || []);
          this.treeService.initTree(nodes);
          this.cascaderService.setColumnData(nodes, 0);
          initColumnWithIndex();
        }
      }
      updateNodesAndValue(updateValue);
    }
    onOptionClick(node, columnIndex, event) {
      if (event) {
        event.preventDefault();
      }
      if (node && node.isDisabled) {
        return;
      }
      this.el.focus();
      if (this.nzMultiple && node.isLeaf) {
        this.onOptionCheck(node, columnIndex, true);
      } else {
        this.inSearchingMode ? this.cascaderService.setSearchOptionSelected(node, this.nzMultiple) : this.cascaderService.setNodeActivated(node, columnIndex, !this.nzMultiple);
      }
    }
    onOptionCheck(node, columnIndex, performActivate = false) {
      if (!this.nzMultiple || node.isDisabled || node.isDisableCheckbox) {
        return;
      }
      node.isChecked = !node.isChecked;
      node.isHalfChecked = false;
      this.treeService.setCheckedNodeList(node);
      this.treeService.conduct(node, this.treeService.isCheckStrictly);
      if (this.inSearchingMode) {
        this.cascaderService.setSearchOptionSelected(node, true);
      } else if (performActivate) {
        this.cascaderService.setNodeActivated(node, columnIndex, true, true);
      } else {
        this.cascaderService.setNodeSelected(node, columnIndex, true);
      }
    }
    removeSelected(node, emitEvent = true) {
      node.isSelected = false;
      node.isChecked = false;
      if (this.nzMultiple) {
        this.treeService.conduct(node, this.treeService.isCheckStrictly);
      }
      this.treeService.setSelectedNodeList(node, this.nzMultiple);
      if (emitEvent) {
        this.nzRemoved.emit(node.origin);
      }
    }
    onClickOutside(event) {
      const target = _getEventTarget(event);
      if (!this.el.contains(target) && !this.openControlled) {
        this.closeMenu();
      }
    }
    onPositionChange(position) {
      const placement = getPlacementName(position);
      this.dropdownPosition = placement;
    }
    updateOptions() {
      const nodes = this.coerceTreeNodes(this.nzOptions || []);
      this.treeService.initTree(nodes);
      this.cascaderService.setColumnData(nodes, 0);
      this.updateSelectedNodes(true);
      if (this.inSearchingMode) {
        this.cascaderService.setSearchingMode(this.inSearchingMode);
        this.cascaderService.prepareSearchOptions(this.inputValue);
      }
    }
    isActionTrigger(action) {
      return typeof this.nzTriggerAction === "string" ? this.nzTriggerAction === action : this.nzTriggerAction.indexOf(action) !== -1;
    }
    onEnter() {
      const columnIndex = Math.max(this.cascaderService.activatedNodes.length - 1, 0);
      const node = this.cascaderService.activatedNodes[columnIndex];
      if (node && !node.isDisabled) {
        this.nzMultiple ? this.onOptionCheck(node, columnIndex, true) : this.inSearchingMode ? this.cascaderService.setSearchOptionSelected(node) : this.cascaderService.setNodeActivated(node, columnIndex, true);
      }
    }
    moveUpOrDown(isUp) {
      const columnIndex = Math.max(this.cascaderService.activatedNodes.length - 1, 0);
      const activatedNode = this.cascaderService.activatedNodes[columnIndex];
      const options = this.cascaderService.columns[columnIndex] || [];
      const length = options.length;
      let nextIndex = -1;
      if (!activatedNode) {
        nextIndex = isUp ? length : -1;
      } else {
        nextIndex = options.indexOf(activatedNode);
      }
      while (true) {
        nextIndex = isUp ? nextIndex - 1 : nextIndex + 1;
        if (nextIndex < 0 || nextIndex >= length) {
          break;
        }
        const nextOption = options[nextIndex];
        if (!nextOption || nextOption.isDisabled || nextOption.isDisableCheckbox) {
          continue;
        }
        this.cascaderService.setNodeActivated(nextOption, columnIndex);
        break;
      }
    }
    prevColumn() {
      if (this.cascaderService.activatedNodes.length) {
        this.cascaderService.activatedNodes.pop();
        this.cascaderService.setNodeDeactivatedSinceColumn(this.cascaderService.activatedNodes.length);
        if (!this.cascaderService.activatedNodes.length) {
          this.setMenuVisible(false);
        }
      }
    }
    nextColumn() {
      const length = this.cascaderService.activatedNodes.length;
      const options = this.cascaderService.columns[length];
      if (options && options.length) {
        const nextOpt = options.find((o) => !o.isDisabled && !o.isDisableCheckbox);
        if (nextOpt) {
          this.cascaderService.setNodeActivated(nextOpt, length);
        }
      }
    }
    clearDelaySelectTimer() {
      if (this.delaySelectTimer) {
        clearTimeout(this.delaySelectTimer);
        this.delaySelectTimer = void 0;
      }
    }
    delaySetOptionActivated(node, columnIndex, performSelect) {
      this.clearDelaySelectTimer();
      this.delaySelectTimer = setTimeout(() => {
        this.cascaderService.setNodeActivated(node, columnIndex, performSelect, this.nzMultiple);
        this.delaySelectTimer = void 0;
      }, 150);
    }
    toggleSearchingMode(toSearching) {
      if (this.inSearchingMode !== toSearching) {
        this.cascaderService.setSearchingMode(toSearching);
      }
      if (this.inSearchingMode) {
        this.cascaderService.prepareSearchOptions(this.inputValue);
      }
    }
    isOptionActivated(node, index) {
      return this.cascaderService.activatedNodes[index] === node;
    }
    setDisabledState(isDisabled) {
      this.nzDisabled = this.isNzDisableFirstChange && this.nzDisabled || isDisabled;
      this.isNzDisableFirstChange = false;
      if (this.nzDisabled) {
        this.closeMenu();
      }
    }
    closeMenu() {
      this.blur();
      this.clearDelayMenuTimer();
      this.setMenuVisible(false);
      if (!this.hasValue && this.cascaderService.columns.length) {
        this.cascaderService.dropBehindColumns(0);
      }
    }
    /**
     * Reposition the cascader panel. When a menu opens, the cascader expands
     * and may exceed the boundary of browser's window.
     */
    reposition() {
      if (this.overlay && this.overlay.overlayRef && this.menuVisible()) {
        Promise.resolve().then(() => {
          this.overlay.overlayRef.updatePosition();
          this.cdr.markForCheck();
        });
      }
    }
    /**
     * When a cascader options is changed, a child needs to know that it should re-render.
     */
    checkChildren() {
      if (this.cascaderItems) {
        this.cascaderItems.forEach((item) => item.markForCheck());
      }
    }
    setDisplayLabel() {
      if (this.nzMultiple) {
        return;
      }
      const node = this.selectedNodes.length ? this.selectedNodes[0] : null;
      const selectedOptions = this.getAncestorOptionList(node);
      const labels = selectedOptions.map((o) => this.cascaderService.getOptionLabel(o));
      if (this.isLabelRenderTemplate) {
        this.labelRenderContext = {
          labels,
          selectedOptions
        };
      }
      this.labelRenderText = defaultDisplayRender.call(this, labels);
    }
    setDropdownStyles() {
      const firstColumn = this.cascaderService.columns[0];
      this.shouldShowEmpty = this.inSearchingMode && (!firstColumn || !firstColumn.length) || // Should show empty when there's no searching result
      !(this.nzOptions && this.nzOptions.length) && !this.nzLoadData;
      this.dropdownHeightStyle = this.shouldShowEmpty ? "auto" : "";
      if (this.input) {
        this.dropdownWidthStyle = this.inSearchingMode || this.shouldShowEmpty ? `${this.selectContainer.nativeElement.offsetWidth}px` : "";
      }
    }
    setStatusStyles(status, hasFeedback) {
      this.status = status;
      this.hasFeedback = hasFeedback;
      this.cdr.markForCheck();
      this.statusCls = getStatusClassNames(this.prefixCls, status, hasFeedback);
      Object.keys(this.statusCls).forEach((status2) => {
        if (this.statusCls[status2]) {
          this.renderer.addClass(this.elementRef.nativeElement, status2);
        } else {
          this.renderer.removeClass(this.elementRef.nativeElement, status2);
        }
      });
    }
    setLocale() {
      this.locale = this.i18nService.getLocaleData("global");
      this.cdr.markForCheck();
    }
    scrollToActivatedOptions() {
      this.ngZone.runOutsideAngular(() => {
        Promise.resolve().then(() => {
          this.cascaderItems.toArray().filter((e) => e.activated).forEach((e) => {
            e.nativeElement.scrollIntoView({
              block: "start",
              inline: "nearest"
            });
          });
        });
      });
    }
    setupChangeListener() {
      this.input$.pipe(switchMap((input) => fromEventOutsideAngular(input?.nativeElement, "change")), takeUntilDestroyed(this.destroyRef)).subscribe((event) => event.stopPropagation());
    }
    setupFocusListener() {
      this.input$.pipe(switchMap((input) => fromEventOutsideAngular(input?.nativeElement, "focus")), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.handleInputFocus());
      this.input$.pipe(switchMap((input) => fromEventOutsideAngular(input?.nativeElement, "blur")), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.handleInputBlur());
    }
    setupKeydownListener() {
      fromEventOutsideAngular(this.el, "keydown").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        const keyCode = event.keyCode;
        if (keyCode !== DOWN_ARROW && keyCode !== UP_ARROW && keyCode !== LEFT_ARROW && keyCode !== RIGHT_ARROW && keyCode !== ENTER && keyCode !== BACKSPACE && keyCode !== ESCAPE) {
          return;
        }
        if (!this.menuVisible() && keyCode !== BACKSPACE && keyCode !== ESCAPE && !this.openControlled) {
          return this.ngZone.run(() => this.setMenuVisible(true));
        }
        if (this.inSearchingMode && (keyCode === BACKSPACE || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW)) {
          return;
        }
        if (!this.menuVisible()) {
          return;
        }
        event.preventDefault();
        this.ngZone.run(() => {
          switch (keyCode) {
            case DOWN_ARROW:
              this.moveUpOrDown(false);
              break;
            case UP_ARROW:
              this.moveUpOrDown(true);
              break;
            case LEFT_ARROW:
              if (this.dir === "rtl") {
                this.nextColumn();
              } else {
                this.prevColumn();
              }
              break;
            case RIGHT_ARROW:
              if (this.dir === "rtl") {
                this.prevColumn();
              } else {
                this.nextColumn();
              }
              break;
            case ENTER:
              this.onEnter();
              break;
            case BACKSPACE:
              this.prevColumn();
              break;
          }
          this.cdr.markForCheck();
        });
      });
    }
    static ɵfac = function NzCascaderComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || NzCascaderComponent2)();
    };
    static ɵcmp = ɵɵdefineComponent({
      type: NzCascaderComponent2,
      selectors: [["nz-cascader"], ["", "nz-cascader", ""]],
      viewQuery: function NzCascaderComponent_Query(rf, ctx) {
        if (rf & 1) {
          ɵɵviewQuery(_c2, 5)(NzSelectSearchComponent, 5)(_c3, 5)(CdkConnectedOverlay, 5)(NzCascaderOptionComponent, 5);
        }
        if (rf & 2) {
          let _t;
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.selectContainer = _t.first);
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.input = _t.first);
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.menu = _t.first);
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.overlay = _t.first);
          ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.cascaderItems = _t);
        }
      },
      hostVars: 31,
      hostBindings: function NzCascaderComponent_HostBindings(rf, ctx) {
        if (rf & 1) {
          ɵɵlistener("click", function NzCascaderComponent_click_HostBindingHandler() {
            return ctx.onTriggerClick();
          })("mouseenter", function NzCascaderComponent_mouseenter_HostBindingHandler() {
            return ctx.onTriggerMouseEnter();
          })("mouseleave", function NzCascaderComponent_mouseleave_HostBindingHandler($event) {
            return ctx.onTriggerMouseLeave($event);
          });
        }
        if (rf & 2) {
          ɵɵattribute("tabIndex", "0");
          ɵɵclassProp("ant-select-in-form-item", !!ctx.nzFormStatusService)("ant-select-lg", ctx.finalSize() === "large")("ant-select-sm", ctx.finalSize() === "small")("ant-select-allow-clear", ctx.nzAllowClear)("ant-select-show-arrow", ctx.nzShowArrow)("ant-select-show-search", !!ctx.nzShowSearch)("ant-select-disabled", ctx.nzDisabled)("ant-select-borderless", ctx.finalVariant() === "borderless")("ant-select-filled", ctx.finalVariant() === "filled")("ant-select-underlined", ctx.finalVariant() === "underlined")("ant-select-open", ctx.menuVisible())("ant-select-focused", ctx.isFocused)("ant-select-multiple", ctx.nzMultiple)("ant-select-single", !ctx.nzMultiple)("ant-select-rtl", ctx.dir === "rtl");
        }
      },
      inputs: {
        nzOpen: "nzOpen",
        nzOptions: "nzOptions",
        nzOptionRender: "nzOptionRender",
        nzShowInput: [2, "nzShowInput", "nzShowInput", booleanAttribute],
        nzShowArrow: [2, "nzShowArrow", "nzShowArrow", booleanAttribute],
        nzAllowClear: [2, "nzAllowClear", "nzAllowClear", booleanAttribute],
        nzAutoFocus: [2, "nzAutoFocus", "nzAutoFocus", booleanAttribute],
        nzChangeOnSelect: [2, "nzChangeOnSelect", "nzChangeOnSelect", booleanAttribute],
        nzDisabled: [2, "nzDisabled", "nzDisabled", booleanAttribute],
        nzColumnClassName: "nzColumnClassName",
        nzExpandTrigger: "nzExpandTrigger",
        nzValueProperty: "nzValueProperty",
        nzLabelProperty: "nzLabelProperty",
        nzLabelRender: "nzLabelRender",
        nzVariant: "nzVariant",
        nzNotFoundContent: "nzNotFoundContent",
        nzSize: "nzSize",
        nzBackdrop: "nzBackdrop",
        nzShowSearch: "nzShowSearch",
        nzPlaceHolder: "nzPlaceHolder",
        nzMenuClassName: "nzMenuClassName",
        nzMenuStyle: "nzMenuStyle",
        nzMouseLeaveDelay: [2, "nzMouseLeaveDelay", "nzMouseLeaveDelay", numberAttribute],
        nzMouseEnterDelay: [2, "nzMouseEnterDelay", "nzMouseEnterDelay", numberAttribute],
        nzStatus: "nzStatus",
        nzMultiple: [2, "nzMultiple", "nzMultiple", booleanAttribute],
        nzMaxTagCount: "nzMaxTagCount",
        nzPlacement: "nzPlacement",
        nzTriggerAction: "nzTriggerAction",
        nzChangeOn: "nzChangeOn",
        nzLoadData: "nzLoadData",
        nzDisplayWith: "nzDisplayWith",
        nzPrefix: "nzPrefix",
        nzSuffixIcon: "nzSuffixIcon",
        nzExpandIcon: "nzExpandIcon"
      },
      outputs: {
        nzVisibleChange: "nzVisibleChange",
        nzSelectionChange: "nzSelectionChange",
        nzRemoved: "nzRemoved",
        nzClear: "nzClear"
      },
      exportAs: ["nzCascader"],
      features: [ɵɵProvidersFeature([{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NzCascaderComponent2),
        multi: true
      }, {
        provide: NZ_SPACE_COMPACT_ITEM_TYPE,
        useValue: "select"
      }, NzCascaderService, NzCascaderTreeService]), ɵɵHostDirectivesFeature([NzSpaceCompactItemDirective]), ɵɵInheritDefinitionFeature, ɵɵNgOnChangesFeature],
      ngContentSelectors: _c4,
      decls: 3,
      vars: 5,
      consts: [["selectContainer", ""], ["menu", ""], ["cdkConnectedOverlay", "", "nzConnectedOverlay", "", "cdkConnectedOverlayTransformOriginOn", ".ant-cascader-dropdown", 3, "overlayOutsideClick", "detach", "positionChange", "cdkConnectedOverlayHasBackdrop", "cdkConnectedOverlayOrigin", "cdkConnectedOverlayPositions", "cdkConnectedOverlayOpen"], [1, "ant-select-selector"], [1, "ant-select-prefix"], [1, "ant-select-selection-wrap"], [1, "ant-select-selection-overflow"], [3, "placeholder", "display"], [1, "ant-select-arrow", 3, "ant-select-arrow-loading"], [4, "nzStringTemplateOutlet"], [1, "ant-select-selection-overflow-item"], [1, "ant-select-selection-overflow-item", "ant-select-selection-overflow-item-suffix"], [3, "isComposingChange", "valueChange", "showInput", "value", "mirrorSync", "disabled", "autofocus", "focusTrigger"], ["deletable", "", 3, "delete", "disabled", "label"], [3, "label"], [3, "disabled", "label", "contentTemplateOutlet", "contentTemplateOutletContext"], [3, "placeholder"], [1, "ant-select-arrow"], [3, "nzType", "ant-cascader-picker-arrow-expand"], ["nzType", "loading"], [3, "status"], [3, "nzType"], [3, "clear"], [1, "ant-select-dropdown", "ant-cascader-dropdown", 3, "mouseenter", "mouseleave", "nzNoAnimation"], [1, "ant-cascader-menus"], [1, "ant-cascader-menu", 3, "width", "height"], [1, "ant-cascader-menu"], [1, "ant-cascader-menu-item", "ant-cascader-menu-item-disabled"], ["nzComponentName", "cascader", 1, "ant-cascader-menu-item-content", 3, "specificContent"], ["role", "menuitemcheckbox", 1, "ant-cascader-menu", 3, "class", "height"], ["role", "menuitemcheckbox", 1, "ant-cascader-menu"], ["nz-cascader-option", "", 3, "expandIcon", "columnIndex", "nzLabelProperty", "optionTemplate", "activated", "highlightText", "node", "dir", "checkable"], ["nz-cascader-option", "", 3, "mouseenter", "mouseleave", "click", "check", "expandIcon", "columnIndex", "nzLabelProperty", "optionTemplate", "activated", "highlightText", "node", "dir", "checkable"]],
      template: function NzCascaderComponent_Template(rf, ctx) {
        if (rf & 1) {
          ɵɵprojectionDef();
          ɵɵconditionalCreate(0, NzCascaderComponent_Conditional_0_Template, 9, 5);
          ɵɵprojection(1);
          ɵɵtemplate(2, NzCascaderComponent_ng_template_2_Template, 5, 22, "ng-template", 2);
          ɵɵlistener("overlayOutsideClick", function NzCascaderComponent_Template_ng_template_overlayOutsideClick_2_listener($event) {
            return ctx.onClickOutside($event);
          })("detach", function NzCascaderComponent_Template_ng_template_detach_2_listener() {
            return ctx.closeMenu();
          })("positionChange", function NzCascaderComponent_Template_ng_template_positionChange_2_listener($event) {
            return ctx.onPositionChange($event);
          });
        }
        if (rf & 2) {
          ɵɵconditional(ctx.nzShowInput ? 0 : -1);
          ɵɵadvance(2);
          ɵɵproperty("cdkConnectedOverlayHasBackdrop", ctx.nzBackdrop)("cdkConnectedOverlayOrigin", ctx.overlayOrigin)("cdkConnectedOverlayPositions", ctx.positions)("cdkConnectedOverlayOpen", ctx.menuVisible());
        }
      },
      dependencies: [OverlayModule, CdkConnectedOverlay, Dir, FormsModule, NzIconModule, NzIconDirective, NzEmptyModule, NzEmbedEmptyComponent, NzFormItemFeedbackIconComponent, NzOverlayModule, NzConnectedOverlayDirective, NzNoAnimationDirective, NzSelectClearComponent, NzSelectItemComponent, NzSelectPlaceholderComponent, NzSelectSearchComponent, NzCascaderOptionComponent, NzStringTemplateOutletDirective, SlicePipe],
      encapsulation: 2,
      changeDetection: 0
    });
  };
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzCascaderComponent, [{
    type: Component,
    args: [{
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      selector: "nz-cascader, [nz-cascader]",
      exportAs: "nzCascader",
      template: `
    @if (nzShowInput) {
      <div #selectContainer class="ant-select-selector">
        @if (nzPrefix; as prefix) {
          <div class="ant-select-prefix">
            <ng-container *nzStringTemplateOutlet="prefix">{{ prefix }}</ng-container>
          </div>
        }
        <span class="ant-select-selection-wrap">
          @if (nzMultiple) {
            <div class="ant-select-selection-overflow">
              @for (node of selectedNodes | slice: 0 : nzMaxTagCount; track node) {
                <div class="ant-select-selection-overflow-item">
                  <nz-select-item
                    deletable
                    [disabled]="nzDisabled"
                    [label]="nzDisplayWith(getAncestorOptionList(node))"
                    (delete)="removeSelected(node)"
                  />
                </div>
              }
              @if (selectedNodes.length > nzMaxTagCount) {
                <div class="ant-select-selection-overflow-item">
                  <nz-select-item [label]="'+ ' + (selectedNodes.length - nzMaxTagCount) + ' ...'" />
                </div>
              }

              <div class="ant-select-selection-overflow-item ant-select-selection-overflow-item-suffix">
                <nz-select-search
                  [showInput]="!!nzShowSearch"
                  (isComposingChange)="isComposingChange($event)"
                  [value]="inputValue"
                  (valueChange)="inputValue = $event"
                  [mirrorSync]="true"
                  [disabled]="nzDisabled"
                  [autofocus]="nzAutoFocus"
                  [focusTrigger]="menuVisible()"
                />
              </div>
            </div>
          } @else {
            <nz-select-search
              [showInput]="!!nzShowSearch"
              (isComposingChange)="isComposingChange($event)"
              [value]="inputValue"
              (valueChange)="inputValue = $event"
              [mirrorSync]="false"
              [disabled]="nzDisabled"
              [autofocus]="nzAutoFocus"
              [focusTrigger]="menuVisible()"
            />

            @if (showLabelRender) {
              <nz-select-item
                [disabled]="nzDisabled"
                [label]="labelRenderText"
                [contentTemplateOutlet]="isLabelRenderTemplate ? nzLabelRender : null"
                [contentTemplateOutletContext]="labelRenderContext"
              />
            }
          }

          @if (showPlaceholder) {
            <nz-select-placeholder
              [placeholder]="nzPlaceHolder || locale?.placeholder!"
              [style.display]="inputValue || isComposing ? 'none' : 'block'"
            />
          }
        </span>
      </div>

      @if (nzShowArrow) {
        <span class="ant-select-arrow" [class.ant-select-arrow-loading]="isLoading">
          @if (!isLoading) {
            <nz-icon [nzType]="$any(nzSuffixIcon)" [class.ant-cascader-picker-arrow-expand]="menuVisible()" />
          } @else {
            <nz-icon nzType="loading" />
          }

          @if (hasFeedback && !!status) {
            <nz-form-item-feedback-icon [status]="status" />
          }
        </span>
      }
      @if (clearIconVisible) {
        <nz-select-clear (clear)="clearSelection($event)" />
      }
    }
    <ng-content />

    <ng-template
      cdkConnectedOverlay
      nzConnectedOverlay
      [cdkConnectedOverlayHasBackdrop]="nzBackdrop"
      [cdkConnectedOverlayOrigin]="overlayOrigin"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayTransformOriginOn=".ant-cascader-dropdown"
      [cdkConnectedOverlayOpen]="menuVisible()"
      (overlayOutsideClick)="onClickOutside($event)"
      (detach)="closeMenu()"
      (positionChange)="onPositionChange($event)"
    >
      <div
        class="ant-select-dropdown ant-cascader-dropdown"
        [class.ant-select-dropdown-placement-bottomLeft]="dropdownPosition === 'bottomLeft'"
        [class.ant-select-dropdown-placement-bottomRight]="dropdownPosition === 'bottomRight'"
        [class.ant-select-dropdown-placement-topLeft]="dropdownPosition === 'topLeft'"
        [class.ant-select-dropdown-placement-topRight]="dropdownPosition === 'topRight'"
        [class.ant-cascader-dropdown-rtl]="dir === 'rtl'"
        [animate.enter]="cascaderAnimationEnter()"
        [animate.leave]="cascaderAnimationLeave()"
        [nzNoAnimation]="noAnimation?.nzNoAnimation?.()"
        (mouseenter)="onTriggerMouseEnter()"
        (mouseleave)="onTriggerMouseLeave($event)"
      >
        <div
          #menu
          class="ant-cascader-menus"
          [class.ant-cascader-rtl]="dir === 'rtl'"
          [class.ant-cascader-menus-hidden]="!menuVisible()"
          [class.ant-cascader-menu-empty]="shouldShowEmpty"
          [class]="nzMenuClassName"
          [style]="nzMenuStyle"
        >
          @if (shouldShowEmpty) {
            <ul class="ant-cascader-menu" [style.width]="dropdownWidthStyle" [style.height]="dropdownHeightStyle">
              <li class="ant-cascader-menu-item ant-cascader-menu-item-disabled">
                <nz-embed-empty
                  class="ant-cascader-menu-item-content"
                  nzComponentName="cascader"
                  [specificContent]="nzNotFoundContent"
                />
              </li>
            </ul>
          } @else {
            @for (options of cascaderService.columns; track options; let i = $index) {
              <ul
                class="ant-cascader-menu"
                role="menuitemcheckbox"
                [class]="nzColumnClassName"
                [style.height]="dropdownHeightStyle"
              >
                @for (option of options; track option) {
                  <li
                    nz-cascader-option
                    [expandIcon]="nzExpandIcon"
                    [columnIndex]="i"
                    [nzLabelProperty]="nzLabelProperty"
                    [optionTemplate]="nzOptionRender"
                    [activated]="isOptionActivated(option, i)"
                    [highlightText]="inSearchingMode ? inputValue : ''"
                    [node]="option"
                    [dir]="dir"
                    [checkable]="nzMultiple"
                    (mouseenter)="onOptionMouseEnter(option, i, $event)"
                    (mouseleave)="onOptionMouseLeave(option, i, $event)"
                    (click)="onOptionClick(option, i, $event)"
                    (check)="onOptionCheck(option, i)"
                  ></li>
                }
              </ul>
            }
          }
        </div>
      </div>
    </ng-template>
  `,
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NzCascaderComponent),
        multi: true
      }, {
        provide: NZ_SPACE_COMPACT_ITEM_TYPE,
        useValue: "select"
      }, NzCascaderService, NzCascaderTreeService],
      host: {
        "[attr.tabIndex]": '"0"',
        "[class.ant-select-in-form-item]": "!!nzFormStatusService",
        "[class.ant-select-lg]": 'finalSize() === "large"',
        "[class.ant-select-sm]": 'finalSize() === "small"',
        "[class.ant-select-allow-clear]": "nzAllowClear",
        "[class.ant-select-show-arrow]": "nzShowArrow",
        "[class.ant-select-show-search]": "!!nzShowSearch",
        "[class.ant-select-disabled]": "nzDisabled",
        "[class.ant-select-borderless]": `finalVariant() === 'borderless'`,
        "[class.ant-select-filled]": `finalVariant() === 'filled'`,
        "[class.ant-select-underlined]": `finalVariant() === 'underlined'`,
        "[class.ant-select-open]": "menuVisible()",
        "[class.ant-select-focused]": "isFocused",
        "[class.ant-select-multiple]": "nzMultiple",
        "[class.ant-select-single]": "!nzMultiple",
        "[class.ant-select-rtl]": `dir === 'rtl'`
      },
      hostDirectives: [NzSpaceCompactItemDirective],
      imports: [SlicePipe, OverlayModule, FormsModule, NzIconModule, NzEmptyModule, NzFormItemFeedbackIconComponent, NzOverlayModule, NzNoAnimationDirective, NzSelectClearComponent, NzSelectItemComponent, NzSelectPlaceholderComponent, NzSelectSearchComponent, NzCascaderOptionComponent, NzStringTemplateOutletDirective]
    }]
  }], () => [], {
    selectContainer: [{
      type: ViewChild,
      args: ["selectContainer", {
        static: false
      }]
    }],
    input: [{
      type: ViewChild,
      args: [NzSelectSearchComponent]
    }],
    menu: [{
      type: ViewChild,
      args: ["menu", {
        static: false
      }]
    }],
    overlay: [{
      type: ViewChild,
      args: [CdkConnectedOverlay, {
        static: false
      }]
    }],
    cascaderItems: [{
      type: ViewChildren,
      args: [NzCascaderOptionComponent]
    }],
    nzOpen: [{
      type: Input
    }],
    nzOptions: [{
      type: Input
    }],
    nzOptionRender: [{
      type: Input
    }],
    nzShowInput: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzShowArrow: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzAllowClear: [{
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
    nzChangeOnSelect: [{
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
    nzColumnClassName: [{
      type: Input
    }],
    nzExpandTrigger: [{
      type: Input
    }],
    nzValueProperty: [{
      type: Input
    }],
    nzLabelProperty: [{
      type: Input
    }],
    nzLabelRender: [{
      type: Input
    }],
    nzVariant: [{
      type: Input
    }],
    nzNotFoundContent: [{
      type: Input
    }],
    nzSize: [{
      type: Input
    }],
    nzBackdrop: [{
      type: Input
    }],
    nzShowSearch: [{
      type: Input
    }],
    nzPlaceHolder: [{
      type: Input
    }],
    nzMenuClassName: [{
      type: Input
    }],
    nzMenuStyle: [{
      type: Input
    }],
    nzMouseLeaveDelay: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    nzMouseEnterDelay: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    nzStatus: [{
      type: Input
    }],
    nzMultiple: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nzMaxTagCount: [{
      type: Input
    }],
    nzPlacement: [{
      type: Input
    }],
    nzTriggerAction: [{
      type: Input
    }],
    nzChangeOn: [{
      type: Input
    }],
    nzLoadData: [{
      type: Input
    }],
    nzDisplayWith: [{
      type: Input
    }],
    nzPrefix: [{
      type: Input
    }],
    nzSuffixIcon: [{
      type: Input
    }],
    nzExpandIcon: [{
      type: Input
    }],
    nzVisibleChange: [{
      type: Output
    }],
    nzSelectionChange: [{
      type: Output
    }],
    nzRemoved: [{
      type: Output
    }],
    nzClear: [{
      type: Output
    }],
    onTriggerClick: [{
      type: HostListener,
      args: ["click"]
    }],
    onTriggerMouseEnter: [{
      type: HostListener,
      args: ["mouseenter"]
    }],
    onTriggerMouseLeave: [{
      type: HostListener,
      args: ["mouseleave", ["$event"]]
    }]
  });
})();
var NzCascaderModule = class _NzCascaderModule {
  static ɵfac = function NzCascaderModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NzCascaderModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NzCascaderModule,
    imports: [NzCascaderComponent],
    exports: [NzCascaderComponent]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [NzCascaderComponent]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzCascaderModule, [{
    type: NgModule,
    args: [{
      imports: [NzCascaderComponent],
      exports: [NzCascaderComponent]
    }]
  }], null, null);
})();
export {
  NzCascaderComponent,
  NzCascaderModule,
  NzCascaderOptionComponent,
  NzCascaderService,
  isChildNode,
  isParentNode,
  isShowSearchObject
};
//# sourceMappingURL=ng-zorro-antd_cascader.js.map
