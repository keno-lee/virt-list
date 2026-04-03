/* eslint-disable @typescript-eslint/no-explicit-any */
import { VirtListDOM } from '../VirtListDOM';
import type {
  TreeNode,
  TreeNodeData,
  TreeNodeKey,
  TreeData,
  TreeFieldNames,
  TreeInfo,
  IScrollParams,
  VirtTreeDOMOptions,
  VirtTreeDOMEvents,
} from './types';
import {
  getScrollParentElement,
  isSiblingElement,
  findAncestorWithClass,
  getPrevSibling,
  getNextSibling,
} from './utils';

const DEFAULT_FIELD_NAMES: Required<TreeFieldNames> = {
  key: 'key',
  title: 'title',
  children: 'children',
  disableSelect: 'disableSelect',
  disableCheckbox: 'disableCheckbox',
  disableDragIn: 'disableDragIn',
  disableDragOut: 'disableDragOut',
};

export class VirtTreeDOM {
  private _options: VirtTreeDOMOptions;
  private _events: VirtTreeDOMEvents;
  private _virtListDOM!: VirtListDOM<TreeNode>;
  private _containerEl: HTMLElement;

  private _fieldNames: Required<TreeFieldNames>;
  private _treeInfo: TreeInfo = {
    treeNodesMap: new Map(),
    treeNodes: [],
    levelNodesMap: new Map(),
    maxLevel: 1,
    allNodeKeys: [],
  };
  private _parentNodeKeys: TreeNodeKey[] = [];

  // State sets
  private _expandedKeysSet: Set<TreeNodeKey> = new Set();
  private _selectedKeysSet: Set<TreeNodeKey> = new Set();
  private _checkedKeysSet: Set<TreeNodeKey> = new Set();
  private _indeterminateKeysSet: Set<TreeNodeKey> = new Set();
  private _focusedKeysSet: Set<TreeNodeKey> = new Set();
  private _hiddenNodeKeySet: Set<TreeNodeKey> = new Set();
  private _hiddenExpandIconKeySet: Set<TreeNodeKey> = new Set();

  private _renderList: TreeNode[] = [];
  private _dragging = false;

  // DOM references for rendered tree nodes
  private _nodeElMap: Map<TreeNodeKey, HTMLElement> = new Map();

  // Drag state
  private _dragState: DragState | null = null;

  constructor(
    container: HTMLElement,
    options: VirtTreeDOMOptions,
    events?: VirtTreeDOMEvents,
  ) {
    this._containerEl = container;
    this._options = { ...options };
    this._events = events ?? {};
    this._fieldNames = { ...DEFAULT_FIELD_NAMES, ...options.fieldNames };

    if (options.focusedKeys) {
      this._focusedKeysSet = new Set(options.focusedKeys);
    }
    if (options.selectedKeys) {
      this._selectedKeysSet = new Set(options.selectedKeys);
    }
    if (options.checkedKeys) {
      this._checkedKeysSet = new Set(options.checkedKeys);
    }
    if (options.expandedKeys) {
      this._expandedKeysSet = new Set(options.expandedKeys);
    }

    this._setTreeData(options.list);
    this._initExpandedKeys();
    this._initCheckedKeys();
    this._computeRenderList();
    this._createVirtList();
  }

  // ==================== Public API ====================

  get treeInfo(): TreeInfo {
    return this._treeInfo;
  }

  getTreeNode(key: TreeNodeKey): TreeNode | undefined {
    return this._treeInfo.treeNodesMap.get(String(key));
  }

  hasExpanded(node: TreeNode): boolean {
    return this._expandedKeysSet.has(node.key);
  }

  hasSelected(node: TreeNode): boolean {
    return this._selectedKeysSet.has(node.key);
  }

  hasChecked(node: TreeNode): boolean {
    return this._checkedKeysSet.has(node.key);
  }

  hasIndeterminate(node: TreeNode): boolean {
    return this._indeterminateKeysSet.has(node.key);
  }

  hasFocused(node: TreeNode): boolean {
    return this._focusedKeysSet.has(node.key);
  }

  // ----- Expand -----

  expandAll(expanded: boolean): void {
    this._expandedKeysSet = new Set(
      expanded ? this._parentNodeKeys : [],
    );
    const expandedNodes: TreeNodeData[] = [];
    this._expandedKeysSet.forEach((key) => {
      const node = this.getTreeNode(key);
      if (node) expandedNodes.push(node.data);
    });
    this._events.expand?.(
      expanded ? [...this._parentNodeKeys] : [],
      { expanded, expandedNodes },
    );
    this._refresh();
  }

  expandNode(
    key: TreeNodeKey | TreeNodeKey[],
    expanded: boolean,
    foldAllNodes?: boolean,
  ): void {
    const targets = Array.isArray(key) ? key : [key];
    for (const k of targets) {
      const node = this.getTreeNode(k);
      if (!node) continue;
      if (expanded) {
        this._expandParents(node);
      } else {
        if (node.isLeaf) {
          if (!node.parent) continue;
          if (foldAllNodes) {
            this._foldParents(node.parent);
          } else {
            this._expandedKeysSet.delete(node.parent.key);
          }
        } else {
          this._expandedKeysSet.delete(node.key);
        }
      }
    }

    const expandedNodes: TreeNodeData[] = [];
    this._expandedKeysSet.forEach((k) => {
      const n = this.getTreeNode(k);
      if (n) expandedNodes.push(n.data);
    });
    this._events.expand?.([...this._expandedKeysSet], {
      node: !Array.isArray(key) ? this.getTreeNode(key) : undefined,
      expanded,
      expandedNodes,
    });
    this._refresh();
  }

  toggleExpand(node: TreeNode): void {
    if (node.isLeaf) return;
    const expanded = this.hasExpanded(node);
    this.expandNode(node.key, !expanded);
  }

  setExpandedKeys(keys: TreeNodeKey[]): void {
    this._expandedKeysSet.clear();
    for (const key of keys) {
      const node = this.getTreeNode(key);
      if (node) this._expandParents(node);
    }
    this._refresh();
  }

  // ----- Select -----

  toggleSelect(node: TreeNode): void {
    if (node.disableSelect) return;
    const selected = this.hasSelected(node);
    if (selected) {
      this._selectedKeysSet.delete(node.key);
    } else {
      if (!this._options.selectMultiple) {
        this._selectedKeysSet.clear();
      }
      this._selectedKeysSet.add(node.key);
    }
    this._afterNodeSelect(node, !selected);
    this._updateRenderedNodeStates();
  }

  selectNode(key: TreeNodeKey | TreeNodeKey[], selected: boolean): void {
    const targets = Array.isArray(key) ? key : [key];
    for (const k of targets) {
      if (selected) {
        this._selectedKeysSet.add(k);
      } else {
        this._selectedKeysSet.delete(k);
      }
    }
    this._updateRenderedNodeStates();
  }

  selectAll(selected: boolean): void {
    if (selected) {
      const keys = this._treeInfo.allNodeKeys.filter((k) => {
        const n = this.getTreeNode(k);
        return n && !n.disableSelect;
      });
      this._selectedKeysSet = new Set(keys);
    } else {
      this._selectedKeysSet.clear();
    }
    this._updateRenderedNodeStates();
  }

  // ----- Check -----

  toggleCheckbox(node: TreeNode): void {
    const checked = this.hasChecked(node);
    this._toggleCheckboxInternal(node, !checked);
    this._afterNodeCheck(node, !checked);
    this._updateRenderedNodeStates();
  }

  checkAll(checked: boolean): void {
    if (!checked) {
      this._checkedKeysSet.clear();
      this._indeterminateKeysSet.clear();
    } else {
      const keys = this._treeInfo.allNodeKeys.filter((k) => {
        const n = this.getTreeNode(k);
        return n && !n.disableCheckbox;
      });
      this._checkedKeysSet = new Set(keys);
    }
    this._updateRenderedNodeStates();
  }

  checkNode(key: TreeNodeKey | TreeNodeKey[], checked: boolean): void {
    const targets = Array.isArray(key) ? key : [key];
    for (const k of targets) {
      const node = this.getTreeNode(k);
      if (!node) continue;
      this._toggleCheckboxInternal(node, checked);
    }
    this._updateRenderedNodeStates();
  }

  getCheckedKeys(leafOnly = false): TreeNodeKey[] {
    const keys: TreeNodeKey[] = [];
    this._checkedKeysSet.forEach((key) => {
      const node = this.getTreeNode(key);
      if (node && (!leafOnly || node.isLeaf)) keys.push(key);
    });
    return keys;
  }

  getHalfCheckedKeys(): TreeNodeKey[] {
    return [...this._indeterminateKeysSet];
  }

  // ----- Focus -----

  setFocusedKeys(keys: TreeNodeKey[]): void {
    this._focusedKeysSet = new Set(keys);
    this._updateRenderedNodeStates();
  }

  // ----- Filter -----

  filter(query: string): void {
    if (typeof this._options.filterMethod !== 'function') return;

    const expandKeySet = new Set<TreeNodeKey>();
    const hiddenKeys = this._hiddenNodeKeySet;
    const hiddenExpandIconKeys = this._hiddenExpandIconKeySet;
    const family: TreeNode[] = [];
    const nodes = this._treeInfo.treeNodes || [];
    const filterFn = this._options.filterMethod;
    hiddenKeys.clear();

    const traverse = (nodeList: TreeNode[]) => {
      for (const node of nodeList) {
        node.searchedIndex =
          query === ''
            ? -1
            : node.title?.toLowerCase().indexOf(query.toLowerCase());

        family.push(node);
        if (filterFn(query, node)) {
          for (const member of family) {
            if (!member.isLeaf) expandKeySet.add(member.key);
          }
        } else if (node.isLeaf) {
          hiddenKeys.add(node.key);
        }
        if (node.children) traverse(node.children);
        if (!node.isLeaf) {
          if (!expandKeySet.has(node.key)) {
            hiddenKeys.add(node.key);
          } else if (node.children) {
            let allHidden = true;
            for (const child of node.children) {
              if (!hiddenKeys.has(child.key)) {
                allHidden = false;
                break;
              }
            }
            if (allHidden) {
              hiddenExpandIconKeys.add(node.key);
            } else {
              hiddenExpandIconKeys.delete(node.key);
            }
          }
        }
        family.pop();
      }
    };
    traverse(nodes);

    if (expandKeySet.size > 0) {
      this.expandNode([...expandKeySet], true);
    }
    this._virtListDOM.scrollToTop();
    this._refresh();
  }

  // ----- Scroll -----

  scrollTo(scroll: IScrollParams): void {
    const { key, align, offset } = scroll;
    if (offset !== undefined && offset >= 0) {
      this._virtListDOM.scrollToOffset(offset);
      return;
    }
    if (!key) return;
    if (align === 'top') {
      this._scrollToTarget(key, true);
    } else {
      this._scrollToTarget(key, false);
    }
  }

  scrollToTop(): void {
    this._virtListDOM.scrollToTop();
  }

  scrollToBottom(): void {
    this._virtListDOM.scrollToBottom();
  }

  // ----- Data -----

  setList(list: TreeData): void {
    this._options.list = list;
    this._parentNodeKeys.length = 0;
    this._treeInfo.treeNodesMap.clear();
    this._treeInfo.allNodeKeys.length = 0;
    this._setTreeData(list);
    this._initExpandedKeys();
    this._initCheckedKeys();
    this._nodeElMap.clear();
    this._virtListDOM.clearItemPool();
    this._refresh();
  }

  forceUpdate(): void {
    this._parentNodeKeys.length = 0;
    this._treeInfo.treeNodesMap.clear();
    this._treeInfo.allNodeKeys.length = 0;
    this._setTreeData(this._options.list);
    this._initExpandedKeys();
    this._initCheckedKeys();
    this._nodeElMap.clear();
    this._virtListDOM.clearItemPool();
    this._refresh();
  }

  updateOptions(partial: Partial<VirtTreeDOMOptions>): void {
    if (partial.expandedKeys !== undefined) {
      this._expandedKeysSet = new Set(partial.expandedKeys);
    }
    if (partial.selectedKeys !== undefined) {
      this._selectedKeysSet = new Set(partial.selectedKeys);
    }
    if (partial.checkedKeys !== undefined) {
      this._checkedKeysSet = new Set(partial.checkedKeys);
      this._updateCheckedKeys();
    }
    if (partial.focusedKeys !== undefined) {
      this._focusedKeysSet = new Set(partial.focusedKeys);
    }
    Object.assign(this._options, partial);
    if (partial.list) {
      this.setList(partial.list);
    } else {
      this._refresh();
    }
  }

  destroy(): void {
    this._cleanupDrag();
    this._virtListDOM.destroy();
    this._nodeElMap.clear();
  }

  // ==================== Private: Tree Data ====================

  private _setTreeData(list: TreeData): void {
    const fieldNames = this._fieldNames;
    const levelNodesMap = new Map<TreeNodeKey, TreeNode[]>();
    let maxLevel = 1;

    const flat = (
      nodes: TreeData,
      level: number = 1,
      parent?: TreeNode,
    ): TreeNode[] => {
      const currNodes: TreeNode[] = [];
      let index = 0;
      for (const rawNode of nodes) {
        index++;
        const key = rawNode[fieldNames.key];
        const title = rawNode[fieldNames.title];
        const children = rawNode[fieldNames.children];
        const disableSelect = rawNode[fieldNames.disableSelect];
        const disableCheckbox = rawNode[fieldNames.disableCheckbox];

        const node: TreeNode = {
          data: rawNode,
          key,
          parent,
          level,
          title,
          disableSelect,
          disableCheckbox,
          isLeaf: !children || children.length === 0,
          isLast: index === nodes.length,
        };
        if (children && children.length) {
          node.children = flat(children, level + 1, node);
          this._parentNodeKeys.push(node.key);
        }
        currNodes.push(node);
        this._treeInfo.treeNodesMap.set(String(key), node);
        this._treeInfo.allNodeKeys.push(key);
        if (level > maxLevel) maxLevel = level;

        const levelInfo = levelNodesMap.get(level);
        if (levelInfo) {
          levelInfo.push(node);
        } else {
          levelNodesMap.set(level, [node]);
        }
      }
      return currNodes;
    };

    this._treeInfo.treeNodes = flat(list);
    this._treeInfo.levelNodesMap = levelNodesMap;
    this._treeInfo.maxLevel = maxLevel;
  }

  private _initExpandedKeys(): void {
    if (this._options.defaultExpandAll) {
      this._expandedKeysSet = new Set(this._parentNodeKeys);
    } else if (this._options.expandedKeys !== undefined) {
      this._expandedKeysSet.clear();
      for (const key of this._options.expandedKeys) {
        const node = this.getTreeNode(key);
        if (node) this._expandParents(node);
      }
    }
  }

  private _initCheckedKeys(): void {
    this._checkedKeysSet.clear();
    this._indeterminateKeysSet.clear();
    if (this._options.checkable && this._options.checkedKeys) {
      for (const key of this._options.checkedKeys) {
        const node = this.getTreeNode(key);
        if (node && !this.hasChecked(node)) {
          this._toggleCheckboxInternal(node, true);
        }
      }
    }
  }

  // ==================== Private: Expand ====================

  private _expandParents(node: TreeNode): void {
    if (!node.isLeaf) this._expandedKeysSet.add(node.key);
    if (node.parent) this._expandParents(node.parent);
  }

  private _foldParents(node: TreeNode): void {
    this._expandedKeysSet.delete(node.key);
    if (node.parent) this._foldParents(node.parent);
  }

  // ==================== Private: Check ====================

  private _toggleCheckboxInternal(node: TreeNode, isChecked: boolean): void {
    if (node.disableCheckbox) return;
    const toggle = (n: TreeNode, checked: boolean) => {
      this._checkedKeysSet[checked ? 'add' : 'delete'](n.key);
      if (n.children && !this._options.checkedStrictly) {
        for (const child of n.children) {
          if (!child.disableCheckbox) toggle(child, checked);
        }
      }
    };
    toggle(node, isChecked);
    if (!this._options.checkedStrictly) {
      this._updateCheckedKeys();
    }
  }

  private _updateCheckedKeys(): void {
    if (!this._options.checkable) return;
    const { maxLevel, levelNodesMap } = this._treeInfo;
    const checkedKeySet = this._checkedKeysSet;
    const indeterminateKeySet = new Set<TreeNodeKey>();

    for (let level = maxLevel - 1; level >= 1; level--) {
      const nodes = levelNodesMap.get(level);
      if (!nodes) continue;
      for (const node of nodes) {
        const children = node.children;
        if (!children) continue;
        let allChecked = true;
        let hasChecked = false;
        for (const child of children) {
          if (child.disableCheckbox) continue;
          if (checkedKeySet.has(child.key)) {
            hasChecked = true;
          } else if (indeterminateKeySet.has(child.key)) {
            allChecked = false;
            hasChecked = true;
            break;
          } else {
            allChecked = false;
          }
        }
        if (allChecked && !node.disableCheckbox) {
          checkedKeySet.add(node.key);
        } else if (hasChecked && !node.disableCheckbox) {
          indeterminateKeySet.add(node.key);
          checkedKeySet.delete(node.key);
        } else {
          checkedKeySet.delete(node.key);
          indeterminateKeySet.delete(node.key);
        }
      }
    }
    this._indeterminateKeysSet = indeterminateKeySet;
  }

  private _afterNodeCheck(node: TreeNode, checked: boolean): void {
    const checkedKeys: TreeNodeKey[] = [];
    const checkedNodes: TreeNodeData[] = [];
    this._checkedKeysSet.forEach((k) => {
      const n = this.getTreeNode(k);
      if (n) {
        checkedKeys.push(k);
        checkedNodes.push(n.data);
      }
    });
    const halfCheckedKeys: TreeNodeKey[] = [];
    const halfCheckedNodes: TreeNodeData[] = [];
    this._indeterminateKeysSet.forEach((k) => {
      const n = this.getTreeNode(k);
      if (n) {
        halfCheckedKeys.push(k);
        halfCheckedNodes.push(n.data);
      }
    });
    this._events.check?.(checkedKeys, {
      node,
      checked,
      checkedKeys,
      checkedNodes,
      halfCheckedKeys,
      halfCheckedNodes,
    });
  }

  // ==================== Private: Select ====================

  private _afterNodeSelect(node: TreeNode, selected: boolean): void {
    const selectedKeys = [...this._selectedKeysSet];
    const selectedNodes: TreeNodeData[] = [];
    for (const k of selectedKeys) {
      const n = this.getTreeNode(k);
      if (n) selectedNodes.push(n.data);
    }
    this._events.select?.(selectedKeys, {
      node,
      selected,
      selectedKeys,
      selectedNodes,
    });
  }

  // ==================== Private: Render List ====================

  private _computeRenderList(): void {
    const hiddenNodeKeys = this._hiddenNodeKeySet;
    const nodes = this._treeInfo.treeNodes || [];
    const flattenNodes: TreeNode[] = [];
    const stack: TreeNode[] = [];

    for (let i = nodes.length - 1; i >= 0; --i) {
      stack.push(nodes[i]);
    }
    while (stack.length) {
      const node = stack.pop();
      if (!node) continue;
      if (!hiddenNodeKeys.has(node.key)) {
        flattenNodes.push(node);
      }
      if (this.hasExpanded(node) && node.children) {
        for (let i = node.children.length - 1; i >= 0; --i) {
          stack.push(node.children[i]);
        }
      }
    }
    this._renderList = flattenNodes;
  }

  private _refresh(): void {
    this._computeRenderList();
    this._virtListDOM.setList(this._renderList);
    this._virtListDOM.forceUpdate();
    this._updateRenderedNodeStates();
  }

  // ==================== Private: Scroll ====================

  private _scrollToTarget(key: TreeNodeKey, isTop: boolean): void {
    let idx = this._renderList.findIndex((l) => l.key === key);
    if (idx < 0) {
      this.expandNode(key, true);
      this._computeRenderList();
      this._virtListDOM.setList(this._renderList);
      idx = this._renderList.findIndex((l) => l.key === key);
    }
    if (idx < 0) return;
    if (isTop) {
      this._virtListDOM.scrollToIndex(idx);
    } else {
      this._virtListDOM.scrollIntoView(idx);
    }
  }

  // ==================== Private: DOM Rendering ====================

  private _isForceHiddenExpandIcon(node: TreeNode): boolean {
    return this._hiddenExpandIconKeySet.has(node.key);
  }

  private _createVirtList(): void {
    const opts = this._options;
    const defaultSize = opts.itemPreSize ?? 32;
    const customGroup = opts.customGroup ?? 'virt-tree-group';
    const listClass = `${customGroup} ${opts.listClass ?? ''}`;

    this._virtListDOM = new VirtListDOM<TreeNode>(
      this._containerEl,
      {
        list: this._renderList,
        itemKey: 'key',
        itemPreSize: defaultSize,
        fixed: opts.fixed,
        itemGap: opts.itemGap,
        buffer: opts.buffer ?? 2,
        listStyle: 'position:relative;',
        listClass,
        itemClass: (item: TreeNode) => {
          const classes = ['virt-tree-item'];
          if (opts.itemClass) classes.push(opts.itemClass);
          return classes.join(' ');
        },
        renderItem: (node: TreeNode) => this._renderTreeNode(node),
        renderStickyHeader: opts.renderStickyHeader,
        renderStickyFooter: opts.renderStickyFooter,
        renderHeader: opts.renderHeader,
        renderFooter: opts.renderFooter,
        renderEmpty: opts.renderEmpty,
        onItemUnmounted: (el: HTMLElement) => {
          const key = el.dataset.id;
          if (key !== undefined) {
            this._nodeElMap.delete(key);
          }
        },
      },
      {
        scroll: (e) => this._events.scroll?.(e),
        toTop: (item) => this._events.toTop?.(item),
        toBottom: (item) => this._events.toBottom?.(item),
        itemResize: (id, size) => this._events.itemResize?.(id, size),
        rangeUpdate: (begin, end) => this._events.rangeUpdate?.(begin, end),
      },
    );

    if (this._dragging) {
      this._virtListDOM.clientEl.classList.add('is-dragging');
    }
  }

  private _renderTreeNode(node: TreeNode): HTMLElement {
    const opts = this._options;
    const defaultSize = opts.itemPreSize ?? 32;
    const indent = opts.indent ?? 16;
    const iconSize = opts.iconSize ?? 16;
    const fixed = opts.fixed ?? false;
    const showLine = opts.showLine ?? false;
    const itemGap = opts.itemGap ?? 0;
    const checkable = opts.checkable ?? false;
    const draggable = opts.draggable ?? false;

    const isExpanded = this.hasExpanded(node);
    const isSelected = this.hasSelected(node);
    const isChecked = this.hasChecked(node);
    const isIndeterminate = this.hasIndeterminate(node);
    const isFocused = this.hasFocused(node);
    const hiddenExpandIcon = this._isForceHiddenExpandIcon(node);

    if (opts.renderNode) {
      const el = opts.renderNode(node, isExpanded);
      this._nodeElMap.set(String(node.key), el);
      return el;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'virt-tree-node';
    if (isSelected) wrapper.classList.add('is-selected');
    if (node.disableSelect) wrapper.classList.add('is-disabled');
    if (isFocused) wrapper.classList.add('is-focused');
    wrapper.style.minHeight = `${defaultSize}px`;
    if (fixed) wrapper.style.height = `${defaultSize}px`;

    const nodeKey = node.key;

    if (draggable) {
      wrapper.setAttribute('draggable', 'true');
      wrapper.addEventListener('dragstart', (e: MouseEvent) => {
        this._onDragstart(e);
      });
    }

    // Indent blocks
    if (node.level > 1) {
      const indentContainer = document.createElement('div');
      indentContainer.className = 'virt-tree-node-indent';
      for (let i = 0; i <= node.level - 2; i++) {
        const block = document.createElement('div');
        block.className = 'virt-tree-node-indent-block';
        if (showLine) {
          block.classList.add('virt-tree-node-indent-block-line-vertical');
          if (i === node.level - 2) {
            block.classList.add(
              'virt-tree-node-indent-block-line-horizontal',
            );
            if (node.isLast && !isExpanded) {
              block.classList.add(
                'virt-tree-node-indent-block-line-vertical--half',
              );
            }
            if (node.isLeaf) {
              block.classList.add(
                'virt-tree-node-indent-block-line-horizontal--double',
              );
            }
          }
        }
        block.style.width = `${indent}px`;
        block.style.height =
          itemGap > 0 ? `calc(100% + ${itemGap}px)` : '100%';
        block.style.transform = `translateY(-${itemGap / 2}px)`;
        indentContainer.appendChild(block);
      }
      wrapper.appendChild(indentContainer);
    }

    // Expand icon
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'virt-tree-icon-wrapper';
    if (isExpanded) iconWrapper.classList.add('is-expanded');
    iconWrapper.style.width = `${indent}px`;

    const iconEl = document.createElement('div');
    iconEl.className = 'virt-tree-icon';
    iconEl.style.display =
      node.isLeaf || hiddenExpandIcon ? 'none' : 'block';
    iconEl.style.width = `${iconSize}px`;
    iconEl.style.height = `${iconSize}px`;
    iconEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentNode = this.getTreeNode(nodeKey);
      if (currentNode) this._onClickExpandIcon(currentNode);
    });

    if (opts.renderIcon) {
      iconEl.appendChild(opts.renderIcon(node, isExpanded));
    } else {
      iconEl.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.5632 7.72544L10.539 13.2587C10.2728 13.6247 9.72696 13.6247 9.46073 13.2587L5.43658 7.72544C5.11611 7.28479 5.43088 6.66666 5.97573 6.66666L14.024 6.66666C14.5689 6.66666 14.8837 7.28479 14.5632 7.72544Z" fill="var(--virt-tree-color-icon)"/></svg>`;
    }
    iconWrapper.appendChild(iconEl);
    wrapper.appendChild(iconWrapper);

    // Checkbox
    if (checkable) {
      const cbWrapper = document.createElement('div');
      cbWrapper.className = 'virt-tree-checkbox-wrapper';
      const cb = document.createElement('div');
      cb.className = 'virt-tree-checkbox';
      if (isChecked) cb.classList.add('is-checked');
      if (isIndeterminate) cb.classList.add('is-indeterminate');
      if (node.disableCheckbox) cb.classList.add('is-disabled');
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentNode = this.getTreeNode(nodeKey);
        if (currentNode) this._onClickCheckbox(currentNode);
      });
      cbWrapper.appendChild(cb);
      wrapper.appendChild(cbWrapper);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'virt-tree-node-content';
    if (fixed) content.classList.add('is-fixed-height');
    content.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentNode = this.getTreeNode(nodeKey);
      if (currentNode) this._onClickNodeContent(currentNode);
    });

    if (opts.renderContent) {
      content.appendChild(opts.renderContent(node));
    } else {
      content.textContent = node.title ?? '';
    }
    wrapper.appendChild(content);

    this._nodeElMap.set(String(node.key), wrapper);
    return wrapper;
  }

  private _updateRenderedNodeStates(): void {
    for (const [key, el] of this._nodeElMap) {
      const node = this.getTreeNode(key);
      if (!node) continue;

      el.classList.toggle('is-selected', this.hasSelected(node));
      el.classList.toggle('is-focused', this.hasFocused(node));

      if (this._options.checkable) {
        const cb = el.querySelector('.virt-tree-checkbox');
        if (cb) {
          cb.classList.toggle('is-checked', this.hasChecked(node));
          cb.classList.toggle(
            'is-indeterminate',
            this.hasIndeterminate(node),
          );
        }
      }

      const iconWrapper = el.querySelector('.virt-tree-icon-wrapper');
      if (iconWrapper) {
        iconWrapper.classList.toggle(
          'is-expanded',
          this.hasExpanded(node),
        );
      }
    }
  }

  // ==================== Private: Event Handlers ====================

  private _onClickExpandIcon(node: TreeNode): void {
    if (this._dragging) return;
    this.toggleExpand(node);
  }

  private _onClickCheckbox(node: TreeNode): void {
    if (this._dragging) return;
    this.toggleCheckbox(node);
  }

  private _onClickNodeContent(node: TreeNode): void {
    if (this._dragging) return;
    if (this._options.selectable && !node.disableSelect) {
      this.toggleSelect(node);
    } else if (
      this._options.checkable &&
      !node.disableCheckbox &&
      this._options.checkOnClickNode
    ) {
      this.toggleCheckbox(node);
    } else if (this._options.expandOnClickNode) {
      this.toggleExpand(node);
    }
  }

  // ==================== Private: Drag ====================

  private _cleanupDrag(): void {
    if (this._dragState) {
      document.removeEventListener('mousemove', this._dragState.onMousemove);
      document.removeEventListener('mouseup', this._dragState.onMouseup);
      document.removeEventListener('keydown', this._dragState.onKeydown);
      if (this._dragState.scrollElement) {
        this._dragState.scrollElement.removeEventListener(
          'scroll',
          this._dragState.onScroll,
        );
      }
      if (this._dragState.autoScrollTimer) {
        clearInterval(this._dragState.autoScrollTimer);
      }
      if (this._dragState.hoverExpandTimer) {
        clearTimeout(this._dragState.hoverExpandTimer);
      }
      this._dragState = null;
    }
  }

  private _onDragstart(event: MouseEvent): void {
    if (!this._options.draggable) return;
    event.preventDefault();
    event.stopPropagation();

    const sourceTreeItem = event
      .composedPath()
      .find((v) =>
        (v as HTMLElement).classList?.contains('virt-tree-item'),
      ) as HTMLElement | undefined;

    if (!sourceTreeItem) return;

    const clientElement = this._virtListDOM.clientEl;
    const clientElementRect = clientElement.getBoundingClientRect();
    const scrollElement = getScrollParentElement(clientElement);
    const scrollElementRect = scrollElement?.getBoundingClientRect();

    const opts = this._options;
    const indent = opts.indent ?? 16;
    const crossLevel = opts.crossLevelDraggable !== false;

    const dragBox = document.createElement('div');
    dragBox.classList.add('virt-tree-drag-box');

    const dragLine = document.createElement('div');
    dragLine.classList.add(
      crossLevel ? 'virt-tree-drag-line' : 'virt-tree-drag-line-same-level',
    );
    dragLine.style.paddingLeft = `${indent}px`;

    const levelArrow = document.createElement('div');
    levelArrow.classList.add('virt-tree-drag-line-arrow');

    const allowDragArea = document.createElement('div');
    allowDragArea.classList.add('virt-tree-all-drag-area');

    const state: DragState = {
      startX: 0,
      startY: 0,
      mouseX: 0,
      mouseY: 0,
      dragEffect: false,
      minLevel: 1,
      maxLevel: 1,
      targetLevel: 1,
      dragAreaBottom: false,
      placement: '',
      lastPlacement: '',
      sourceTreeItem,
      cloneTreeItem: null,
      hasStyleTreeItem: null,
      hoverTreeItem: null,
      lastHoverTreeItem: null,
      prevTreeItem: null,
      nextTreeItem: null,
      scrollElement,
      dragAreaParentElement: null,
      scrollElementRect,
      clientElementRect,
      sourceNode: undefined,
      prevElementNode: undefined,
      parentNode: undefined,
      prevNode: undefined,
      nextNode: undefined,
      hoverExpandTimer: null,
      autoScrollTimer: null,
      dragBox,
      dragLine,
      levelArrow,
      allowDragArea,
      onMousemove: () => {},
      onMouseup: () => {},
      onKeydown: () => {},
      onScroll: () => {},
    };

    state.onScroll = () => {
      if (this._dragging) {
        this._dragProcess(state);
      }
    };

    state.onMousemove = (e: MouseEvent) => {
      if (!state.cloneTreeItem) {
        this._dragStartClone(state);
      }
      if (!state.cloneTreeItem) return;

      this._dragging = true;
      this._virtListDOM.clientEl.classList.add('is-dragging');

      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
      const dx = state.mouseX - state.startX;
      const dy = state.mouseY - state.startY;
      state.cloneTreeItem.style.left = `${10 + dx}px`;
      state.cloneTreeItem.style.top = `${10 + dy}px`;

      this._autoScroll(state);
      this._dragProcess(state);
    };

    state.onMouseup = () => {
      if (this._dragging) {
        setTimeout(() => {
          this._dragging = false;
          this._virtListDOM.clientEl.classList.remove('is-dragging');
        }, 0);

        if (!crossLevel && state.allowDragArea) {
          state.allowDragArea.innerHTML = '';
          state.allowDragArea.remove();
          state.dragAreaParentElement = null;
        }

        if (!state.sourceNode) {
          this._cleanupDragDOM(state);
          return;
        }

        if (state.dragAreaBottom && !crossLevel) {
          state.parentNode = state.sourceNode.parent;
          const hoverTreeId = state.hoverTreeItem?.dataset?.id;
          if (hoverTreeId) {
            const hoverTreeNode = this.getTreeNode(hoverTreeId);
            if (hoverTreeNode) {
              state.prevNode = this._findTargetLevelParent(
                hoverTreeNode,
                state.sourceNode.level,
              ) as TreeNode | undefined;
            }
          }
        } else if (state.placement !== 'center') {
          state.parentNode = undefined;
          if (state.prevElementNode) {
            if (state.prevElementNode.level >= state.targetLevel) {
              let diffLevel =
                state.prevElementNode.level - state.targetLevel;
              state.prevNode = state.prevElementNode;
              state.parentNode = state.prevElementNode.parent;
              while (diffLevel > 0) {
                state.prevNode = state.prevNode?.parent;
                state.parentNode = state.parentNode?.parent;
                diffLevel--;
              }
            } else {
              if (
                state.targetLevel - state.prevElementNode.level ===
                1
              ) {
                state.parentNode = state.prevElementNode;
              } else {
                state.parentNode = state.prevElementNode.parent;
                state.prevNode = state.prevElementNode;
              }
            }
          } else if (!crossLevel) {
            state.prevNode = undefined;
          }
        }

        this._events.dragend?.(
          state.dragEffect
            ? {
                node: state.sourceNode as TreeNode,
                prevNode: state.prevNode,
                parentNode: state.parentNode,
              }
            : undefined,
        );
      }
      this._cleanupDragDOM(state);
    };

    state.onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        state.dragEffect = false;
        state.onMouseup();
      }
    };

    scrollElement?.addEventListener('scroll', state.onScroll);
    document.addEventListener('mousemove', state.onMousemove);
    document.addEventListener('mouseup', state.onMouseup);
    document.addEventListener('keydown', state.onKeydown);

    this._dragState = state;
  }

  private _cleanupDragDOM(state: DragState): void {
    if (state.hasStyleTreeItem?.contains(state.dragLine)) {
      state.hasStyleTreeItem.removeChild(state.dragLine);
    }
    if (state.hasStyleTreeItem?.contains(state.dragBox)) {
      state.hasStyleTreeItem.removeChild(state.dragBox);
    }
    if (state.cloneTreeItem) {
      if (this._options.dragGhostClass) {
        state.cloneTreeItem.classList.remove(this._options.dragGhostClass);
      }
      document.body.removeChild(state.cloneTreeItem);
      state.cloneTreeItem = null;
    }
    if (state.sourceTreeItem) {
      if (this._options.dragClass) {
        state.sourceTreeItem.classList.remove(this._options.dragClass);
      }
      state.sourceTreeItem.classList.remove('virt-tree-item--drag');
      state.sourceTreeItem = null;
    }
    if (state.hoverExpandTimer) {
      clearTimeout(state.hoverExpandTimer);
      state.hoverExpandTimer = null;
    }
    if (state.autoScrollTimer) {
      clearInterval(state.autoScrollTimer);
      state.autoScrollTimer = null;
    }
    state.scrollElement?.removeEventListener('scroll', state.onScroll);
    document.removeEventListener('mousemove', state.onMousemove);
    document.removeEventListener('mouseup', state.onMouseup);
    document.removeEventListener('keydown', state.onKeydown);
    this._dragState = null;
  }

  private _dragStartClone(state: DragState): void {
    if (!state.sourceTreeItem) return;

    const nodeKey = state.sourceTreeItem.dataset?.id ?? '';
    state.sourceNode = this.getTreeNode(nodeKey);
    if (!state.sourceNode) return;
    if (state.sourceNode.data?.disableDragOut) return;

    this._events.dragstart?.({ sourceNode: state.sourceNode });

    if (this.hasExpanded(state.sourceNode)) {
      this.expandNode(nodeKey, false);
    }

    if (this._options.crossLevelDraggable === false) {
      this._createDragArea(state, state.sourceNode);
    }

    const rect = state.sourceTreeItem.getBoundingClientRect();
    state.sourceTreeItem.classList.add('virt-tree-item--drag');
    if (this._options.dragClass) {
      state.sourceTreeItem.classList.add(this._options.dragClass);
    }

    state.cloneTreeItem = state.sourceTreeItem.cloneNode(
      true,
    ) as HTMLElement;
    state.cloneTreeItem.classList.add('virt-tree-item--ghost');
    if (this._options.dragGhostClass) {
      state.cloneTreeItem.classList.add(this._options.dragGhostClass);
    }
    state.cloneTreeItem.style.position = 'fixed';
    state.cloneTreeItem.style.width = `${rect.width}px`;
    state.cloneTreeItem.style.height = `${rect.height}px`;
    document.body.append(state.cloneTreeItem);
  }

  private _createDragArea(state: DragState, sourceNode: TreeNode): void {
    const customGroup = this._options.customGroup ?? 'virt-tree-group';
    const dragAreaSize = this._calcDragArea(sourceNode.parent);
    state.dragAreaParentElement = document.querySelector(
      sourceNode.level === 1
        ? `.virt-list__client .${customGroup}`
        : `.${customGroup} [data-id="${sourceNode.parent?.key}"]`,
    ) as HTMLElement;

    if (!state.dragAreaParentElement) return;
    const parentElRect = state.dragAreaParentElement.getBoundingClientRect();
    state.allowDragArea.style.width = `${parentElRect.width}px`;
    state.allowDragArea.style.height = `${dragAreaSize}px`;
    state.allowDragArea.style.top = `${
      sourceNode.level === 1
        ? 0
        : parentElRect.height +
          (state.dragAreaParentElement.offsetTop ?? 0)
    }px`;
    this._virtListDOM.listEl.style.position = 'relative';
    this._virtListDOM.listEl.append(state.allowDragArea);
  }

  private _calcDragArea(parentNode?: TreeNode): number {
    const calcSize = (nodes: TreeNode[]): number => {
      let size = 0;
      for (const child of nodes || []) {
        if (child.children?.length && this.hasExpanded(child)) {
          size += this._calcDragArea(child);
        }
        size += this._virtListDOM.core.getItemSize(String(child.key));
      }
      return size;
    };
    if (!parentNode) return calcSize(this._treeInfo.treeNodes || []);
    return calcSize(parentNode.children || []);
  }

  private _findTargetLevelParent(
    childNode: TreeNode,
    targetLevel?: number,
  ): TreeNode | null {
    if (!childNode || !targetLevel) return null;
    let parentNode = childNode.parent;
    while (parentNode) {
      if (parentNode.level === targetLevel) return parentNode;
      parentNode = parentNode.parent;
    }
    return null;
  }

  private _autoScroll(state: DragState): void {
    if (!state.scrollElement || !state.scrollElementRect) return;
    if (state.autoScrollTimer) {
      clearInterval(state.autoScrollTimer);
      state.autoScrollTimer = null;
    }
    if (state.clientElementRect) {
      if (
        state.mouseX < state.clientElementRect.left ||
        state.mouseX > state.clientElementRect.right ||
        state.mouseY < state.clientElementRect.top ||
        state.mouseY > state.clientElementRect.bottom
      )
        return;
    }
    const equalPart = state.scrollElementRect.height / 4;
    const multiple = 20;
    const rect = state.scrollElementRect;
    const scrollEl = state.scrollElement;
    if (rect.top < state.mouseY && state.mouseY < rect.top + equalPart) {
      const relative =
        (1 - (state.mouseY - rect.top) / equalPart) * multiple;
      state.autoScrollTimer = setInterval(() => {
        scrollEl.scrollTop -= relative;
      }, 10);
    } else if (
      rect.top + equalPart * 3 < state.mouseY &&
      state.mouseY < rect.bottom
    ) {
      const relative =
        ((state.mouseY - (rect.top + equalPart * 3)) / equalPart) * multiple;
      state.autoScrollTimer = setInterval(() => {
        scrollEl.scrollTop += relative;
      }, 10);
    }
  }

  private _buildDragLine(state: DragState, level: number): void {
    const indent = this._options.indent ?? 16;
    state.dragLine.innerHTML = '';
    for (let i = 0; i < level; i++) {
      const lineBlock = document.createElement('div');
      if (i === level - 1) {
        lineBlock.style.flex = '1';
        lineBlock.style.backgroundColor = 'var(--virt-tree-color-drag-line)';
      } else {
        lineBlock.style.width = `${indent - 4}px`;
      }
      lineBlock.style.height = '100%';
      lineBlock.style.position = 'relative';
      state.dragLine.appendChild(lineBlock);
    }
  }

  private _dragProcess(state: DragState): void {
    if (state.clientElementRect) {
      if (
        state.mouseX < state.clientElementRect.left ||
        state.mouseX > state.clientElementRect.right ||
        state.mouseY < state.clientElementRect.top ||
        state.mouseY > state.clientElementRect.bottom
      ) {
        if (state.hasStyleTreeItem?.contains(state.dragLine)) {
          state.hasStyleTreeItem.removeChild(state.dragLine);
        }
        if (state.hasStyleTreeItem?.contains(state.dragBox)) {
          state.hasStyleTreeItem.removeChild(state.dragBox);
        }
        state.lastHoverTreeItem = null;
        state.dragEffect = false;
      }
    }

    const hoverElement = document.elementFromPoint(state.mouseX, state.mouseY);
    if (!hoverElement) return;
    state.hoverTreeItem = findAncestorWithClass(
      hoverElement,
      'virt-tree-item',
    ) as HTMLElement | null;
    if (!state.hoverTreeItem) return;

    const hoverTreeId = state.hoverTreeItem.dataset?.id;
    const sourceTreeId = state.sourceTreeItem?.dataset?.id;
    if (!hoverTreeId || !sourceTreeId) return;

    const hoverTreeNode = this.getTreeNode(hoverTreeId);
    if (!hoverTreeNode) return;

    if (hoverTreeId === sourceTreeId) {
      state.sourceTreeItem = state.hoverTreeItem;
      state.sourceTreeItem.classList.add('virt-tree-item--drag');
      if (state.hasStyleTreeItem?.contains(state.dragLine))
        state.hasStyleTreeItem.removeChild(state.dragLine);
      if (state.hasStyleTreeItem?.contains(state.dragBox))
        state.hasStyleTreeItem.removeChild(state.dragBox);
      state.dragEffect = false;
      return;
    }

    const hoverTreeItemRect = state.hoverTreeItem.getBoundingClientRect();
    const relativeY = state.mouseY - hoverTreeItemRect.top;
    const positionRatio = relativeY / hoverTreeItemRect.height;

    const crossLevel = this._options.crossLevelDraggable !== false;

    if (!crossLevel) {
      this._sameLevelDragProcess(state, hoverTreeNode, positionRatio);
    } else {
      this._crossLevelDragProcess(
        state,
        hoverTreeItemRect,
        hoverTreeNode,
        hoverTreeId,
        positionRatio,
      );
    }
  }

  private _updateDragRelateNode(
    state: DragState,
    hoverTreeItem: HTMLElement,
  ): void {
    hoverTreeItem.appendChild(state.dragLine);
    state.hasStyleTreeItem = hoverTreeItem;

    if (state.placement === 'top') {
      state.dragLine.style.top = '-1px';
      state.dragLine.style.bottom = 'auto';
      state.nextTreeItem = hoverTreeItem;
      state.prevTreeItem = getPrevSibling(hoverTreeItem) as HTMLElement;
    } else {
      state.dragLine.style.top = 'auto';
      state.dragLine.style.bottom = '-1px';
      state.prevTreeItem = hoverTreeItem;
      state.nextTreeItem = getNextSibling(hoverTreeItem) as HTMLElement;
    }

    const prevId = state.prevTreeItem?.dataset?.id;
    const nextId = state.nextTreeItem?.dataset?.id;
    state.prevElementNode = prevId ? this.getTreeNode(prevId) : undefined;
    state.nextNode = nextId ? this.getTreeNode(nextId) : undefined;
  }

  private _sameLevelDragProcess(
    state: DragState,
    hoverTreeNode: TreeNode,
    positionRatio: number,
  ): void {
    if (
      hoverTreeNode.isLast &&
      hoverTreeNode.isLeaf &&
      state.sourceNode
    ) {
      const allDragLevelNode = this._findTargetLevelParent(
        hoverTreeNode,
        state.sourceNode.level,
      );
      if (allDragLevelNode?.isLast) {
        state.placement = 'bottom';
        state.dragEffect = true;
        state.dragAreaBottom = true;
        this._updateDragRelateNode(state, state.hoverTreeItem!);
        state.targetLevel = state.sourceNode.level ?? 1;
        this._buildDragLine(state, state.targetLevel);
        return;
      }
    }
    state.dragAreaBottom = false;

    if (
      !state.sourceNode ||
      hoverTreeNode.level !== state.sourceNode.level ||
      hoverTreeNode.parent?.data.id !== state.sourceNode.parent?.data.id
    ) {
      state.prevTreeItem = null;
      state.nextTreeItem = null;
      return;
    }

    state.placement = positionRatio > 0.33 ? 'bottom' : 'top';

    if (
      state.placement === 'bottom' &&
      this.hasExpanded(hoverTreeNode)
    ) {
      state.lastHoverTreeItem = null;
      state.prevTreeItem = null;
      state.nextTreeItem = null;
      return;
    }

    if (
      state.lastHoverTreeItem !== state.hoverTreeItem ||
      state.placement !== state.lastPlacement
    ) {
      if (
        state.lastHoverTreeItem &&
        !isSiblingElement(state.lastHoverTreeItem, state.hoverTreeItem!)
      ) {
        if (state.hasStyleTreeItem?.contains(state.dragLine)) {
          state.hasStyleTreeItem.removeChild(state.dragLine);
        }
      }
      state.lastPlacement = state.placement;
      state.lastHoverTreeItem = state.hoverTreeItem;
      state.dragEffect = true;
      this._updateDragRelateNode(state, state.hoverTreeItem!);
      state.targetLevel = hoverTreeNode.level ?? 1;
      this._buildDragLine(state, state.targetLevel);
    }
  }

  private _crossLevelDragProcess(
    state: DragState,
    hoverTreeItemRect: DOMRect,
    hoverTreeNode: TreeNode,
    hoverTreeId: TreeNodeKey,
    positionRatio: number,
  ): void {
    const indent = this._options.indent ?? 16;
    let topPlacement = 0.33;
    let bottomPlacement = 0.66;

    if (hoverTreeNode.data?.disableDragIn) {
      topPlacement = 0.5;
      bottomPlacement = 0.5;
    }

    if (positionRatio < topPlacement) {
      state.placement = 'top';
    } else if (positionRatio > bottomPlacement) {
      state.placement = 'bottom';
    } else {
      state.placement = 'center';
    }

    if (
      state.lastHoverTreeItem !== state.hoverTreeItem ||
      state.placement !== state.lastPlacement
    ) {
      if (
        state.lastHoverTreeItem &&
        !isSiblingElement(state.lastHoverTreeItem, state.hoverTreeItem!)
      ) {
        if (state.hasStyleTreeItem?.contains(state.dragLine))
          state.hasStyleTreeItem.removeChild(state.dragLine);
        if (state.hasStyleTreeItem?.contains(state.dragBox))
          state.hasStyleTreeItem.removeChild(state.dragBox);
      }

      state.lastPlacement = state.placement;
      state.lastHoverTreeItem = state.hoverTreeItem;

      if (state.hoverTreeItem === state.sourceTreeItem) {
        if (state.hasStyleTreeItem?.contains(state.dragLine))
          state.hasStyleTreeItem.removeChild(state.dragLine);
        if (state.hasStyleTreeItem?.contains(state.dragBox))
          state.hasStyleTreeItem.removeChild(state.dragBox);
        state.dragEffect = false;
        return;
      }

      if (state.hoverExpandTimer) {
        clearTimeout(state.hoverExpandTimer);
        state.hoverExpandTimer = null;
      }

      if (state.placement === 'center') {
        state.dragEffect = false;
        state.parentNode = hoverTreeNode;
        state.prevNode = undefined;
        if (state.hasStyleTreeItem?.contains(state.dragLine))
          state.hasStyleTreeItem.removeChild(state.dragLine);

        if (hoverTreeNode.data?.disableDragIn) return;

        state.hoverTreeItem!.appendChild(state.dragBox);
        state.hasStyleTreeItem = state.hoverTreeItem;
        state.dragEffect = true;

        if (!this.hasExpanded(hoverTreeNode)) {
          state.hoverExpandTimer = setTimeout(() => {
            this.expandNode(hoverTreeId, true);
            state.hoverExpandTimer = null;
          }, 500);
        }
        return;
      }

      state.dragEffect = true;
      if (state.hasStyleTreeItem?.contains(state.dragBox))
        state.hasStyleTreeItem.removeChild(state.dragBox);

      state.hoverTreeItem!.appendChild(state.dragLine);
      state.hasStyleTreeItem = state.hoverTreeItem;

      if (state.placement === 'top') {
        state.dragLine.style.top = '-1px';
        state.dragLine.style.bottom = 'auto';
        state.nextTreeItem = state.hoverTreeItem;
        state.prevTreeItem = getPrevSibling(
          state.hoverTreeItem!,
        ) as HTMLElement;
      } else {
        state.dragLine.style.top = 'auto';
        state.dragLine.style.bottom = '-1px';
        state.prevTreeItem = state.hoverTreeItem;
        state.nextTreeItem = getNextSibling(
          state.hoverTreeItem!,
        ) as HTMLElement;
      }

      const prevId = state.prevTreeItem?.dataset?.id;
      const nextId = state.nextTreeItem?.dataset?.id;
      state.prevElementNode = prevId
        ? this.getTreeNode(prevId)
        : undefined;
      state.nextNode = nextId ? this.getTreeNode(nextId) : undefined;

      state.minLevel = Math.min(
        state.prevElementNode?.level ?? 1,
        state.nextNode?.level ?? 1,
      );
      state.maxLevel = Math.max(
        state.prevElementNode?.level ?? 1,
        state.nextNode?.level ?? 1,
      );

      state.dragLine.innerHTML = '';
      for (let i = 0; i < state.maxLevel; i++) {
        const lineBlock = document.createElement('div');
        if (i === state.maxLevel - 1) {
          lineBlock.style.flex = '1';
        } else {
          lineBlock.style.width = `${indent - 4}px`;
        }
        lineBlock.style.height = '100%';
        lineBlock.style.position = 'relative';
        state.dragLine.appendChild(lineBlock);
      }
    }

    if (state.placement !== 'center') {
      const relativeX =
        state.mouseX - hoverTreeItemRect.left - indent;
      state.targetLevel = Math.ceil(relativeX / indent);
      if (state.targetLevel <= state.minLevel)
        state.targetLevel = state.minLevel;
      if (state.targetLevel >= state.maxLevel)
        state.targetLevel = state.maxLevel;

      const targetElement = state.dragLine.childNodes[
        state.targetLevel - 1
      ] as HTMLElement;
      if (targetElement) {
        targetElement.appendChild(state.levelArrow);
        for (let i = state.minLevel - 1; i <= state.maxLevel - 1; i++) {
          const current = state.dragLine.childNodes[i] as HTMLElement;
          if (i < state.targetLevel - 1) {
            current.style.backgroundColor =
              'var(--virt-tree-color-drag-line-disabled)';
          } else {
            current.style.backgroundColor =
              'var(--virt-tree-color-drag-line)';
          }
        }
      }
    }
  }
}

interface DragState {
  startX: number;
  startY: number;
  mouseX: number;
  mouseY: number;
  dragEffect: boolean;
  minLevel: number;
  maxLevel: number;
  targetLevel: number;
  dragAreaBottom: boolean;
  placement: string;
  lastPlacement: string;
  sourceTreeItem: HTMLElement | null;
  cloneTreeItem: HTMLElement | null;
  hasStyleTreeItem: HTMLElement | null;
  hoverTreeItem: HTMLElement | null;
  lastHoverTreeItem: HTMLElement | null;
  prevTreeItem: HTMLElement | null;
  nextTreeItem: HTMLElement | null;
  scrollElement: HTMLElement | null;
  dragAreaParentElement: HTMLElement | null;
  scrollElementRect: DOMRect | undefined;
  clientElementRect: DOMRect | undefined;
  sourceNode: TreeNode | undefined;
  prevElementNode: TreeNode | undefined;
  parentNode: TreeNode | undefined;
  prevNode: TreeNode | undefined;
  nextNode: TreeNode | undefined;
  hoverExpandTimer: ReturnType<typeof setTimeout> | null;
  autoScrollTimer: ReturnType<typeof setInterval> | null;
  dragBox: HTMLElement;
  dragLine: HTMLElement;
  levelArrow: HTMLElement;
  allowDragArea: HTMLElement;
  onMousemove: (e: MouseEvent) => void;
  onMouseup: () => void;
  onKeydown: (e: KeyboardEvent) => void;
  onScroll: () => void;
}
