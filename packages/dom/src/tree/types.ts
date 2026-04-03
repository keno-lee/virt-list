export type TreeNodeData = Record<string, any>;
export type TreeNodeKey = string | number;
export type TreeData = TreeNodeData[];

export interface TreeNode<T = TreeNodeData> {
  key: TreeNodeKey;
  level: number;
  title?: string;
  isLeaf?: boolean;
  isLast?: boolean;
  parent?: TreeNode;
  children?: TreeNode[];
  disableSelect?: boolean;
  disableCheckbox?: boolean;
  searchedIndex?: number;
  data: T;
}

export interface TreeFieldNames {
  key?: string;
  title?: string;
  children?: string;
  disableSelect?: string;
  disableCheckbox?: string;
  disableDragIn?: string;
  disableDragOut?: string;
}

export interface TreeInfo {
  treeNodesMap: Map<TreeNodeKey, TreeNode>;
  treeNodes: TreeNode[];
  levelNodesMap: Map<TreeNodeKey, TreeNode[]>;
  maxLevel: number;
  allNodeKeys: TreeNodeKey[];
}

export interface CheckedInfo {
  checkedKeys: TreeNodeKey[];
  checkedNodes: TreeData;
  halfCheckedKeys: TreeNodeKey[];
  halfCheckedNodes: TreeData;
}

export interface IScrollParams {
  key?: TreeNodeKey;
  align?: 'view' | 'top';
  offset?: number;
}

export interface VirtTreeDOMOptions {
  list: TreeData;
  fieldNames?: TreeFieldNames;
  indent?: number;
  iconSize?: number;
  itemGap?: number;
  buffer?: number;
  minSize?: number;
  fixed?: boolean;
  showLine?: boolean;
  itemClass?: string;
  listClass?: string;
  customGroup?: string;

  defaultExpandAll?: boolean;
  expandedKeys?: TreeNodeKey[];
  expandOnClickNode?: boolean;

  selectable?: boolean;
  selectMultiple?: boolean;
  selectedKeys?: TreeNodeKey[];

  checkable?: boolean;
  checkedKeys?: TreeNodeKey[];
  checkedStrictly?: boolean;
  checkOnClickNode?: boolean;

  focusedKeys?: TreeNodeKey[];

  draggable?: boolean;
  dragClass?: string;
  dragGhostClass?: string;
  dragoverPlacement?: number[];
  crossLevelDraggable?: boolean;

  filterMethod?: (query: string, node: TreeNode) => boolean;

  renderNode?: (node: TreeNode, isExpanded: boolean) => HTMLElement;
  renderContent?: (node: TreeNode) => HTMLElement;
  renderIcon?: (node: TreeNode, isExpanded: boolean) => HTMLElement;
  renderStickyHeader?: () => HTMLElement;
  renderStickyFooter?: () => HTMLElement;
  renderHeader?: () => HTMLElement;
  renderFooter?: () => HTMLElement;
  renderEmpty?: () => HTMLElement;
}

export interface VirtTreeDOMEvents {
  scroll?: (e: Event) => void;
  toTop?: (item: any) => void;
  toBottom?: (item: any) => void;
  itemResize?: (id: string, newSize: number) => void;
  rangeUpdate?: (inViewBegin: number, inViewEnd: number) => void;

  click?: (data: TreeNodeData, node: TreeNode, e: MouseEvent) => void;

  expand?: (
    expandKeys: TreeNodeKey[],
    data: {
      node?: TreeNode;
      expanded: boolean;
      expandedNodes: TreeNodeData[];
    },
  ) => void;

  select?: (
    selectedKeys: TreeNodeKey[],
    data: {
      node: TreeNode;
      selected: boolean;
      selectedKeys: TreeNodeKey[];
      selectedNodes: TreeNodeData[];
    },
  ) => void;

  check?: (
    checkedKeys: TreeNodeKey[],
    data: {
      node: TreeNode;
      checked: boolean;
      checkedKeys: TreeNodeKey[];
      checkedNodes: TreeNodeData[];
      halfCheckedKeys: TreeNodeKey[];
      halfCheckedNodes: TreeNodeData[];
    },
  ) => void;

  dragstart?: (data: { sourceNode: TreeNodeData }) => void;
  dragend?: (data?: {
    node: TreeNode;
    prevNode: TreeNode | undefined;
    parentNode: TreeNode | undefined;
  }) => void;
}
