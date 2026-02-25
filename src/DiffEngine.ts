// 通用diff算法工具类
export interface DiffItem {
  key: string | number;
  [key: string]: any;
}

export interface DiffOptions<T extends DiffItem> {
  // 获取key的函数
  getKey: (item: T) => string | number;
  // 创建节点的函数
  createNode: (item: T) => HTMLElement;
  // 更新节点的函数
  updateNode: (node: HTMLElement, item: T) => void;
  // 销毁节点的函数
  destroyNode?: (node: HTMLElement) => void;
}

export class DiffEngine<T extends DiffItem> {
  private container: HTMLElement;
  private options: DiffOptions<T>;
  private keyToNodeMap = new Map<string, HTMLElement>();

  constructor(container: HTMLElement, options: DiffOptions<T>) {
    this.container = container;
    this.options = options;
  }

  /**
   * 执行diff算法，更新DOM
   * @param newItems 新的项目列表
   * @param lastInsertedNode 最后插入的节点（用于确定插入位置）
   * @returns 更新后的最后插入节点
   */
  public diffAndUpdate(newItems: T[], lastInsertedNode?: HTMLElement): HTMLElement {
    const newKeyToNodeMap = new Map<string, HTMLElement>();
    let currentLastInsertedNode = lastInsertedNode;

    // 1. 收集新项目的key
    newItems.forEach(item => {
      const key = String(this.options.getKey(item));
      newKeyToNodeMap.set(key, null as any); // 占位，稍后填充
    });

    // 2. 移除不再需要的节点
    this.keyToNodeMap.forEach((node, key) => {
      if (!newKeyToNodeMap.has(key)) {
        this.removeNode(node);
        this.options.destroyNode?.(node);
        this.keyToNodeMap.delete(key);
      }
    });

    // 3. 更新和移动现有节点，创建新节点
    newItems.forEach((item) => {
      const key = String(this.options.getKey(item));
      const existingNode = this.keyToNodeMap.get(key);

      if (existingNode) {
        // 节点存在，检查是否需要移动
        if (currentLastInsertedNode && currentLastInsertedNode.nextSibling !== existingNode) {
          this.moveNode(existingNode, currentLastInsertedNode);
        }
        
        // 更新节点内容
        this.options.updateNode(existingNode, item);
        newKeyToNodeMap.set(key, existingNode);
      } else {
        // 创建新节点
        const newNode = this.options.createNode(item);
        this.insertNode(newNode, currentLastInsertedNode);
        newKeyToNodeMap.set(key, newNode);
        this.keyToNodeMap.set(key, newNode);
      }

      // 更新最后插入的节点
      currentLastInsertedNode = newKeyToNodeMap.get(key)!;
    });

    return currentLastInsertedNode!;
  }

  /**
   * 插入节点
   */
  private insertNode(node: HTMLElement, lastInsertedNode?: HTMLElement): void {
    if (lastInsertedNode) {
      this.container.insertBefore(node, lastInsertedNode.nextSibling);
    } else {
      this.container.appendChild(node);
    }
  }

  /**
   * 移动节点
   */
  private moveNode(node: HTMLElement, lastInsertedNode: HTMLElement): void {
    this.container.insertBefore(node, lastInsertedNode.nextSibling);
  }

  /**
   * 移除节点
   */
  private removeNode(node: HTMLElement): void {
    node.remove();
  }

  /**
   * 清空所有节点
   */
  public clear(): void {
    this.keyToNodeMap.forEach((node) => {
      this.removeNode(node);
      this.options.destroyNode?.(node);
    });
    this.keyToNodeMap.clear();
  }

  /**
   * 获取指定key的节点
   */
  public getNode(key: string | number): HTMLElement | undefined {
    return this.keyToNodeMap.get(String(key));
  }

  /**
   * 获取所有节点
   */
  public getAllNodes(): Map<string, HTMLElement> {
    return new Map(this.keyToNodeMap);
  }

  /**
   * 销毁diff引擎
   */
  public destroy(): void {
    this.clear();
  }
}

// 工具函数：基于key的节点更新检查
export function shouldUpdateNode(node: HTMLElement, newKey: string | number): boolean {
  const existingContent = node.querySelector('[key]');
  const currentKey = String(newKey);
  
  if (!existingContent) {
    return true; // 没有key属性，需要更新
  }
  
  return existingContent.getAttribute('key') !== currentKey;
}

// 工具函数：设置节点key
export function setNodeKey(node: HTMLElement, key: string | number): void {
  node.setAttribute('key', String(key));
}

// 工具函数：获取节点key
export function getNodeKey(node: HTMLElement): string | null {
  const keyElement = node.querySelector('[key]');
  return keyElement ? keyElement.getAttribute('key') : null;
}
