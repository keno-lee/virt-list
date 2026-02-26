// 虚拟节点类型定义
export interface VNode {
  key: string | number;
  type: string; // 标签类型，如 'div'、'li'
  props?: Record<string, string | number | boolean>;
  children?: string | VNode[]; // 文本内容或子节点
  el?: HTMLElement; // 关联的真实DOM元素
}

// 辅助函数：更新虚拟节点内容
function patchVNode(oldVNode: VNode, newVNode: VNode): void {
  // 复用真实DOM
  newVNode.el = oldVNode.el;
  const el = newVNode.el!;

  // 更新文本内容
  if (
    typeof newVNode.children === 'string' &&
    newVNode.children !== oldVNode.children
  ) {
    el.textContent = newVNode.children;
  }

  // 更新属性
  if (newVNode.props) {
    // 更新或新增属性
    Object.entries(newVNode.props).forEach(([key, value]) => {
      const oldValue = oldVNode.props?.[key];
      if (value !== oldValue) {
        el.setAttribute(key, value.toString());
      }
    });

    // 移除旧节点有而新节点没有的属性
    if (oldVNode.props) {
      Object.keys(oldVNode.props).forEach((key) => {
        if (!(key in newVNode.props!)) {
          el.removeAttribute(key);
        }
      });
    }
  }
}

// 辅助函数：从虚拟节点创建真实DOM
function createEl(vNode: VNode): HTMLElement {
  const el = vNode.el || document.createElement(vNode.type);

  // 设置属性
  if (vNode.props) {
    Object.entries(vNode.props).forEach(([key, value]) => {
      el.setAttribute(key, value.toString());
    });
  }

  // 设置文本内容
  if (typeof vNode.children === 'string') {
    el.textContent = vNode.children;
  } else if (Array.isArray(vNode.children)) {
    vNode.children.forEach((child) => {
      if (child.el) {
        el.appendChild(child.el);
      } else {
        el.appendChild(createEl(child));
      }
    });
  }
  return el;
}

/**
 * 列表diff算法
 * @param oldChildren 旧虚拟节点列表
 * @param newChildren 新虚拟节点列表
 * @param parentEl 父容器 DOM 元素
 */
export function diffChildren(
  oldChildren: VNode[],
  newChildren: VNode[],
  parentEl: HTMLElement,
  createElCallback: (el: HTMLElement) => void,
  destroyElCallback: (el: HTMLElement) => void
): void {
  // console.log('diff', oldChildren, newChildren);
  // TODO 1. 中间变动

  // 2. 首增尾删 & 首删尾增
  const keyToOldNode: Map<string | number, number> = new Map();
  oldChildren.forEach((oldNode, index) => {
    keyToOldNode.set(oldNode.key, index);
  });

  const keyToNewNode: Map<string | number, number> = new Map();
  newChildren.forEach((newNode, index) => {
    keyToNewNode.set(newNode.key, index);
  });

  // 1. 移除不再需要的节点
  keyToOldNode.forEach((oldIndex, key) => {
    if (!keyToNewNode.has(key)) {
      keyToOldNode.delete(key);
      const oldNode = oldChildren[oldIndex];
      destroyElCallback(oldNode.el!);
      oldNode.el!.remove();
    }
  });

  // 2. 单次遍历（从右到左）：仅更新已有节点，按锚点插入新节点
  let nextAnchor: HTMLElement | null = null;
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const newNode = newChildren[i];
    const oldIndex = keyToOldNode.get(newNode.key);

    if (oldIndex !== undefined) {
      // 已有节点：只做 patch，不移动；并将其设为新的锚点
      const oldNode = oldChildren[oldIndex];
      patchVNode(oldNode, newNode);
      nextAnchor = oldNode.el!;
    } else {
      // 新节点：插入到当前锚点之前；若锚点为空则追加到末尾
      const newNodeEl = createEl(newNode);
      newNode.el = newNodeEl;
      parentEl.insertBefore(newNodeEl, nextAnchor);
      createElCallback(newNodeEl);
      // 更新锚点为刚插入的新节点，确保连续新节点保持相对顺序
      nextAnchor = newNodeEl;
    }
  }
}

