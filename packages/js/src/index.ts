import { VirtualScrollbar } from './VirtualScrollbar';
import { diffChildren, type VNode } from './listDiff';

// 类型定义
interface VirtListOptions {
  itemKey: string;
  itemGap: number;
  itemPreSize: number;
  fixed: boolean;
  buffer: number;
  bufferTop: number;
  bufferBottom: number;
  horizontal: boolean;
  scrollDistance: number;
  start: number;
  fixSelection: boolean;
  useVirtualScrollbar?: boolean; // 新增：是否使用虚拟滚动条
  itemRender?: (itemData: any) => HTMLElement; // 新增：自定义渲染函数
  renderControl?: (
    inViewBegin: number,
    inViewEnd: number
  ) => { begin: number; end: number };

  // expose events by callback
  scroll: (e: Event) => void;
  toTop: (firstItem: any) => void;
  toBottom: (lastItem: any) => void;
  itemResize: (itemKey: string | number, size: number) => void;
  rangeUpdate: (inViewBegin: number, inViewEnd: number) => void;

  // slot
  slotHeader?: HTMLElement;
  slotFooter?: HTMLElement;
  slotStickyHeader?: HTMLElement;
  slotStickyFooter?: HTMLElement;
}

interface SlotSize {
  clientSize: number;
  headerSize: number;
  footerSize: number;
  stickyHeaderSize: number;
  stickyFooterSize: number;
}

interface ListItem {
  id: number;
  content: string;
  [key: string]: any;
}

interface RenderRange {
  begin: number;
  end: number;
}

const defaultOptions: VirtListOptions = {
  itemKey: 'id',
  itemGap: 0,
  itemPreSize: 40,
  fixed: false,
  horizontal: false,
  scrollDistance: 0,
  start: 0,
  fixSelection: false,
  buffer: 0,
  bufferTop: 0,
  bufferBottom: 0,

  scroll: () => {},
  toTop: () => {},
  toBottom: () => {},
  itemResize: () => {},
  rangeUpdate: () => {},
};

export interface ReactiveData {
  // 滚动距离
  offset: number;
  // 不包含插槽的高度（因为插槽是在列表content外部的）
  listTotalSize: number;
  // 虚拟占位尺寸，是从0到renderBegin的尺寸（padding-top的尺寸）
  virtualSize: number;
  // 可视区的起始下标
  inViewBegin: number;
  // 可视区的结束下标
  inViewEnd: number;
  // 算上buffer后的起始下标
  renderBegin: number;
  // 算上buffer后的结束下标
  renderEnd: number;
  // 顶部buffer个数（会根据options中的buffer或bufferTop计算）
  bufferTop: number;
  // 底部buffer个数（会根据options中的buffer或bufferBottom计算）
  bufferBottom: number;
}

class VirtList {
  private container: HTMLElement;
  private client: HTMLElement;
  private listContainer: HTMLElement;
  private headerPadding: HTMLElement;
  private virtualScrollbar?: VirtualScrollbar; // 新增：虚拟滚动条实例

  private direction: 'forward' | 'backward' = 'forward';
  private fixOffset: boolean = false;
  private forceFixOffset: boolean = false;
  private abortFixOffset: boolean = false;
  private sizesMap: Map<string, number> = new Map();

  private list: ListItem[];
  private options: VirtListOptions;
  private slotSize: SlotSize;
  private resizeObserver: ResizeObserver;
  private currentRenderRange?: RenderRange;
  private isInit: boolean = false;

  oldVNodes: VNode[] = [];

  private reactiveData: ReactiveData = {
    offset: 0,
    listTotalSize: 0,
    virtualSize: 0,
    inViewBegin: 0,
    inViewEnd: 0,
    renderBegin: 0,
    renderEnd: 0,
    bufferTop: 0,
    bufferBottom: 0,
  };

  constructor(container: HTMLElement, options: Partial<VirtListOptions> = {}) {
    this.container = container;
    this.client = document.createElement('div');

    this.client.className = 'virt-list__client';
    this.client.style.width = '100%';
    this.client.style.height = '100%';
    this.client.style.position = 'relative';
    this.client.style.overflow = options.useVirtualScrollbar
      ? 'hidden'
      : 'auto';
    this.client.dataset.id = 'client';
    this.container.appendChild(this.client);

    this.listContainer = document.createElement('div');
    this.listContainer.className = 'list-container';

    // 虚拟滚动条版本不需要这个
    this.headerPadding = document.createElement('div');
    this.headerPadding.className = 'padding-top';
    this.headerPadding.style.willChange = 'height';
    this.listContainer.appendChild(this.headerPadding);

    this.list = [];
    this.options = {
      ...defaultOptions,
      ...options,
    };

    // 初始化 reactiveData
    this.reactiveData = {
      offset: 0,
      listTotalSize: 0,
      virtualSize: 0,
      inViewBegin: 0,
      inViewEnd: 0,
      renderBegin: 0,
      renderEnd: 0,
      bufferTop: this.options.bufferTop ?? this.options.buffer,
      bufferBottom: this.options.bufferBottom ?? this.options.buffer,
    };

    this.slotSize = {
      clientSize: this.client.clientHeight,
      headerSize: 0,
      footerSize: 0,
      stickyHeaderSize: 0,
      stickyFooterSize: 0,
    };

    // 只在非虚拟滚动条模式下添加原生滚动事件监听
    if (!this.options.useVirtualScrollbar) {
      this.client.addEventListener('scroll', this.onScroll.bind(this));
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      // FIXME 这里加了requestIdleCallback会有问题，暂时不知道为什么
      // 延迟执行，快速滚动的时候是没有必要的
      // requestIdleCallback(() => {
      let diff = 0;
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.id;
        if (id) {
          const oldSize = this.getItemSize(id);

          let newSize = 0;
          // 兼容性处理，详情：https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver
          // ios中没有borderBoxSize，只有contentRect
          if (entry.borderBoxSize) {
            // Firefox implements `borderBoxSize` as a single content rect, rather than an array
            const borderBoxSize = Array.isArray(entry.borderBoxSize)
              ? entry.borderBoxSize[0]
              : entry.borderBoxSize;
            newSize = this.options.horizontal
              ? borderBoxSize.inlineSize
              : borderBoxSize.blockSize;
          } else {
            newSize = this.options.horizontal
              ? entry.contentRect.width
              : entry.contentRect.height;
          }

          if (id === 'client') {
            this.slotSize.clientSize = newSize;
            // onClientResize();
          } else if (id === 'header') {
            this.slotSize.headerSize = newSize;
          } else if (id === 'footer') {
            this.slotSize.footerSize = newSize;
          } else if (id === 'stickyHeader') {
            this.slotSize.stickyHeaderSize = newSize;
          } else if (id === 'stickyFooter') {
            this.slotSize.stickyFooterSize = newSize;
          } else if (oldSize !== newSize) {
            this.setItemSize(id, newSize);
            diff += newSize - oldSize;
            this.options.itemResize?.(id, newSize);
          }
        }
      }
      this.updateListTotalSize(diff);

      // 首次渲染后，更新范围
      if (!this.isInit) {
        this.updateRange(this.options.start);
        this.isInit = true;
      }

      // 如果有需要修正的方法进行修正
      // if (this.fixTaskFn) {
      //   this.fixTaskFn();
      // }
      if (
        (this.fixOffset || this.forceFixOffset) &&
        diff !== 0 &&
        !this.abortFixOffset
      ) {
        this.fixOffset = false;
        this.forceFixOffset = false;
        this.scrollToOffset(this.reactiveData.offset + diff);
        // console.log('纠正误差', reactiveData.offset, diff);
      }
      this.abortFixOffset = false;
    });
    this.resizeObserver.observe(this.client);

    if (this.options?.slotStickyHeader) {
      this.options.slotStickyHeader.dataset.id = 'stickyHeader';
      this.options.slotStickyHeader.style.position = 'sticky';
      this.options.slotStickyHeader.style.top = '0';
      this.client.append(this.options.slotStickyHeader);
      this.resizeObserver.observe(this.options.slotStickyHeader);
    }
    if (this.options?.slotHeader) {
      this.options.slotHeader.dataset.id = 'header';
      this.client.append(this.options.slotHeader);
      this.resizeObserver.observe(this.options.slotHeader);
    }

    this.client.appendChild(this.listContainer);

    if (this.options?.slotFooter) {
      this.options.slotFooter.dataset.id = 'footer';
      this.client.append(this.options.slotFooter);
      this.resizeObserver.observe(this.options.slotFooter);
    }
    if (this.options?.slotStickyFooter) {
      this.options.slotStickyFooter.dataset.id = 'stickyFooter';
      this.options.slotStickyFooter.style.position = 'sticky';
      this.options.slotStickyFooter.style.bottom = '0';
      this.client.append(this.options.slotStickyFooter);
      this.resizeObserver.observe(this.options.slotStickyFooter);
    }

    // 初始化虚拟滚动条
    if (this.options.useVirtualScrollbar) {
      this.initVirtualScrollbar();
    }
  }

  init(list: ListItem[]): void {
    // 如果数据为空，那么就重置
    if (list.length <= 0) {
      this.reset();
      return;
    }
    this.list = list;

    // 计算列表总尺寸
    this.updateListTotalSize();
    // update size
    this.updateTopVirtualSize();
    // 初始化范围(list长度发生变化时，需要重新计算范围，start不变)
    this.updateRange(this.options.start);

    // 设置初始滚动位置
    if (this.reactiveData.offset > 0) {
      this.scrollToOffset(this.reactiveData.offset);
    } else if (this.options.start > 0) {
      this.scrollToIndex(this.options.start);
    }
  }

  // 强制更新
  forceUpdate(): void {
    this.renderList();
  }

  // 重置
  reset(): void {
    this.setListTotalSize(0);
    this.setTopVirtualSize(0);

    this.reactiveData.offset = 0;
    this.reactiveData.inViewBegin = 0;
    this.reactiveData.inViewEnd = 0;
    this.reactiveData.renderBegin = 0;
    this.reactiveData.renderEnd = 0;
    this.sizesMap.clear();

    // 当列表为空时，需要重新渲染，否则会残留渲染
    this.forceUpdate();
  }

  renderList(): void {
    // 获取当前需要渲染的项目范围
    const newRenderRange = {
      begin: this.reactiveData.renderBegin,
      end: this.reactiveData.renderEnd,
    };

    // 获取当前已渲染的项目范围
    const oldRenderRange = this.currentRenderRange || { begin: 0, end: 0 };

    // 使用 Vue 3 风格的 diff 算法更新 DOM
    this.diffAndUpdateNodes(oldRenderRange, newRenderRange);

    // 更新当前渲染范围
    this.currentRenderRange = { ...newRenderRange };
  }

  // 从渲染范围生成VNodes
  private generateVNodesFromRange(range: RenderRange): VNode[] {
    const vNodes: VNode[] = [];
    for (let i = range.begin; i <= range.end; i++) {
      if (this.list[i]) {
        const itemData = this.list[i];
        const key = itemData?.[this.options.itemKey];
        // const children = [
        //   {
        //     key,
        //     type: 'div',
        //     el: this.options?.itemRender?.(itemData),
        //   },
        // ];
        // vNodes.push({
        //   key,
        //   type: 'div',
        //   props: {
        //     'data-id': String(key),
        //     class: 'item',
        //   },
        //   children: children || `${itemData.id} - ${itemData.content}`,
        // });
        vNodes.push({
          el: this.options?.itemRender?.(itemData),
          key,
          type: 'div',
          props: {
            'data-id': String(key),
            class: 'item',
          },
        });
      }
    }
    return vNodes;
  }

  // 使用 listDiff.ts 的 diff 算法实现
  private diffAndUpdateNodes(
    oldRange: RenderRange,
    newRange: RenderRange
  ): void {
    console.log('oldRange', oldRange);
    console.log('newRange', newRange);
    // 生成新的VNodes
    const newVNodes = this.generateVNodesFromRange(newRange);

    console.log('newVNodes', newVNodes);

    // 使用缓存的oldVNodes
    const oldVNodes = this.oldVNodes;

    // 执行diff算法
    diffChildren(
      oldVNodes,
      newVNodes,
      this.listContainer,
      (el) => {
        // console.log('observe', el);
        this.resizeObserver.observe(el);
      },
      (el) => {
        // console.log('unobserve', el);
        this.resizeObserver.unobserve(el);
      }
    );

    // 更新缓存
    this.oldVNodes = newVNodes;
  }

  onScroll(event: Event): void {
    this.options.scroll?.(event);

    const target = event.target as HTMLElement;
    const { horizontal = false } = this.options;
    const offset = horizontal ? target.scrollLeft : target.scrollTop;

    if (offset === this.reactiveData.offset) return;
    this.direction = offset < this.reactiveData.offset ? 'forward' : 'backward';
    this.reactiveData.offset = offset;

    this.calcRange();
    this.judgePosition();
  }

  calcRange(): void {
    const { offset, inViewBegin } = this.reactiveData;
    const { headerSize } = this.slotSize;
    const { itemKey } = this.options;

    const offsetWithNoHeader = offset - headerSize;
    let start = inViewBegin;
    let offsetReduce = this.getVirtualSize2beginInView();

    // 当有顶部插槽的时候，快速滚动到顶部，则需要判断，并直接修正
    if (offsetWithNoHeader < 0) {
      this.updateRange(0);
      return;
    }

    if (this.direction === 'forward') {
      // 1. 没发生变化
      if (offsetWithNoHeader >= offsetReduce) {
        // console.log(`👆🏻👆🏻👆🏻👆🏻 for break 没变 start ${start}`);
        return;
      }
      for (let i = start - 1; i >= 0; i -= 1) {
        // 2. 变化了
        const currentSize = this.getItemSize(this.list[i]?.[itemKey]);
        // console.log('currentSize', i, this.list[i]?.[itemKey], currentSize);

        offsetReduce -= currentSize;
        // 要计算2个header插槽的高度
        if (
          offsetReduce <= offsetWithNoHeader &&
          offsetWithNoHeader < offsetReduce + currentSize
        ) {
          start = i;
          // console.log(`👆🏻👆🏻👆🏻👆🏻 for break 变了 start ${start}`);
          break;
        }
      }
    }

    if (this.direction === 'backward') {
      if (offsetWithNoHeader <= offsetReduce) {
        // console.log(`👆🏻👆🏻👆🏻👆🏻 for break 没变 start ${start}`);
        return;
      }
      for (let i = start; i <= this.list.length - 1; i += 1) {
        // 2. 变化了
        const currentSize = this.getItemSize(this.list[i]?.[itemKey]);
        // console.log('currentSize', i, this.list[i]?.[itemKey], currentSize);

        if (
          offsetReduce <= offsetWithNoHeader &&
          offsetWithNoHeader < offsetReduce + currentSize
        ) {
          start = i;
          break;
        }
        offsetReduce += currentSize;
      }

      // 向下滚动不需要修正
      this.fixOffset = false;
    }

    // 节流
    if (start !== this.reactiveData.inViewBegin) {
      this.updateRange(start);
    }
  }

  // 根据起始位置和clientSize计算可视区域的结束位置
  calculateViewEnd(start: number): number {
    const { itemKey } = this.options;
    let currentOffset = 0;

    // 从start开始累加item尺寸，直到超过clientSize
    for (let i = start; i < this.list.length; i++) {
      const itemSize = this.getItemSize(this.list[i]?.[itemKey]);
      currentOffset += itemSize;

      // 如果累加的尺寸超过了可视区域大小，返回当前索引
      if (currentOffset > this.slotSize.clientSize) {
        // 多给1个座位遮盖
        return i + 1;
      }
    }

    // 如果所有item都放得下，返回最后一个索引
    return Math.max(0, this.list.length - 1);
  }

  updateRange(start: number): void {
    if (start < this.reactiveData.inViewBegin) {
      // 向上滚动需要修正
      this.fixOffset = true;
    }

    this.reactiveData.inViewBegin = start;
    this.reactiveData.inViewEnd = this.calculateViewEnd(start);

    // expose
    this.options.rangeUpdate?.(
      this.reactiveData.inViewBegin,
      this.reactiveData.inViewEnd
    );

    // 旧的渲染起始
    const _oldRenderBegin = this.reactiveData.renderBegin;
    // 新的渲染起始
    let _newRenderBegin = this.reactiveData.inViewBegin;
    // 新的渲染结束
    let _newRenderEnd = this.reactiveData.inViewEnd;

    // 计算buffer
    _newRenderBegin = Math.max(
      0,
      _newRenderBegin - this.reactiveData.bufferTop
    );
    _newRenderEnd = Math.min(
      _newRenderEnd + this.reactiveData.bufferBottom,
      this.list.length - 1 > 0 ? this.list.length - 1 : 0
    );

    // 控制层渲染
    if (this.options?.renderControl) {
      const result = this.options.renderControl(
        this.reactiveData.inViewBegin,
        this.reactiveData.inViewEnd
      );
      if (result) {
        _newRenderBegin = result.begin;
        _newRenderEnd = result.end;
      }
    }

    // update render begin
    this.reactiveData.renderBegin = _newRenderBegin;
    // update render end
    this.reactiveData.renderEnd = _newRenderEnd;
    // update virtualSize, diff range size
    if (_newRenderBegin > _oldRenderBegin) {
      const size =
        this.reactiveData.virtualSize +
        this.getRangeSize(_newRenderBegin, _oldRenderBegin);
      this.setTopVirtualSize(size);
    } else {
      const size =
        this.reactiveData.virtualSize -
        this.getRangeSize(_newRenderBegin, _oldRenderBegin);
      this.setTopVirtualSize(size);
    }
    // update render list
    // TODO 改成内部渲染。或者提供起始给外部调用渲染
    // this.options.renderList = this.list.slice(
    //   this.options.renderBegin,
    //   this.options.renderEnd + 1
    // );
    this.renderList();
  }

  getVirtualSize2beginInView(): number {
    return (
      this.reactiveData.virtualSize +
      this.getRangeSize(
        this.reactiveData.renderBegin,
        this.reactiveData.inViewBegin
      )
    );
  }

  getRangeSize(range1: number, range2: number): number {
    const start = Math.min(range1, range2);
    const end = Math.max(range1, range2);
    let re = 0;
    for (let i = start; i < end; i += 1) {
      re += this.getItemSize(this.list[i]?.[this.options.itemKey]);
    }
    return re;
  }

  setItemSize(itemKey: string | number, size: number): void {
    console.log('setItemSize', itemKey, size);
    this.sizesMap.set(String(itemKey), size);
  }

  deleteItemSize(itemKey: string) {
    this.sizesMap.delete(String(itemKey));
  }

  getItemSize(itemKey: string | number): number {
    if (this.options.fixed) return this.options.itemPreSize + this.options.itemGap;
    return (
      this.sizesMap.get(String(itemKey)) ??
      this.options.itemPreSize + this.options.itemGap
    );
  }

  scrollToOffset(offset: number): void {
    this.abortFixOffset = true;
    if (this.options.useVirtualScrollbar && this.virtualScrollbar) {
      this.virtualScrollbar.setOffset(offset);
      this.reactiveData.offset = offset;
      this.calcRange();
    } else {
      const directionKey = this.options.horizontal ? 'scrollLeft' : 'scrollTop';
      if (this.client) (this.client as any)[directionKey] = offset;
    }
  }

  // 初始化虚拟滚动条
  private initVirtualScrollbar(): void {
    if (this.virtualScrollbar) {
      this.virtualScrollbar.destroy();
    }

    this.virtualScrollbar = new VirtualScrollbar({
      container: this.client,
      contentHeight: this.reactiveData.listTotalSize,
      viewportHeight: this.slotSize.clientSize,
      onScroll: (offset: number) => {
        // 更新滚动方向
        this.direction =
          offset < this.reactiveData.offset ? 'forward' : 'backward';
        this.reactiveData.offset = offset;

        console.log('scroll', offset);

        if (this.options?.useVirtualScrollbar) {
          this.listContainer.style.transform = `translateY(${-offset}px)`;
          if (this.options?.slotHeader) {
            this.options.slotHeader.style.transform = `translateY(${-offset}px)`;
          }
          if (this.options?.slotFooter) {
            this.options.slotFooter.style.transform = `translateY(${-offset}px)`;
          }
          console.log('translateY', offset);
        }

        // 计算渲染范围
        this.calcRange();

        // 判断位置并渲染
        this.judgePosition();

        // 触发scroll事件
        this.options.scroll(new Event('scroll'));
      },
    });
  }

  // 更新虚拟滚动条
  private updateVirtualScrollbar(): void {
    if (this.virtualScrollbar) {
      this.virtualScrollbar.updateContentHeight(
        this.reactiveData.listTotalSize +
          this.slotSize.headerSize +
          this.slotSize.footerSize +
          this.slotSize.stickyHeaderSize +
          this.slotSize.stickyFooterSize
      );
      this.virtualScrollbar.updateViewportHeight(this.slotSize.clientSize);
    }
  }

  // 滚动到指定索引
  async scrollToIndex(index: number): Promise<void> {
    if (index < 0) {
      return;
    }

    // 如果要去的位置大于长度，那么就直接调用去底部的方法
    if (index >= this.list.length - 1) {
      this.scrollToBottom();
      return;
    }

    let { top: lastOffset } = this.getItemPosByIndex(index);
    this.scrollToOffset(lastOffset);

    // 这里不适用settimeout，因为无法准确把控延迟时间，3ms有可能页面还拿不到高度。
    // const fixToIndex = () => {
    //   const { top: offset } = this.getItemPosByIndex(index);
    //   this.scrollToOffset(offset);
    //   if (lastOffset !== offset) {
    //     lastOffset = offset;
    //     // fixTaskFn = fixToIndex;
    //     return;
    //   }
    //   // 重置后如果不需要修正，将修正函数置空
    //   // fixTaskFn = null;
    // };
    // fixTaskFn = fixToIndex;
  }

  // 滚动到可视区域
  async scrollIntoView(index: number): Promise<void> {
    const { top: targetMin, bottom: targetMax } = this.getItemPosByIndex(index);
    const offsetMin = this.getOffset();
    const offsetMax = this.getOffset() + this.slotSize.clientSize;
    const currentSize = this.getItemSize(
      this.list[index]?.[this.options.itemKey]
    );

    if (
      targetMin < offsetMin &&
      offsetMin < targetMax &&
      currentSize < this.slotSize.clientSize
    ) {
      // 如果目标元素上方看不到，底部看得到，那么滚动到顶部看得到就行了
      this.scrollToOffset(targetMin);
      return;
    }
    if (
      targetMin + (this.slotSize.stickyHeaderSize || 0) < offsetMax &&
      offsetMax < targetMax + (this.slotSize.stickyHeaderSize || 0) &&
      currentSize < this.slotSize.clientSize
    ) {
      // 如果目标元素上方看得到，底部看不到，那么滚动到底部看得到就行了
      this.scrollToOffset(
        targetMax -
          this.slotSize.clientSize +
          (this.slotSize.stickyHeaderSize || 0)
      );
      return;
    }

    // 屏幕下方
    if (targetMin + (this.slotSize.stickyHeaderSize || 0) >= offsetMax) {
      this.scrollToIndex(index);
      return;
    }

    // 屏幕上方
    if (targetMax <= offsetMin) {
      this.scrollToIndex(index);
      return;
    }

    // 在中间就不动了
  }

  // 滚动到顶部
  async scrollToTop(): Promise<void> {
    let count = 0;
    const loopScrollToTop = () => {
      count += 1;
      this.scrollToOffset(0);
      setTimeout(() => {
        if (count > 10) {
          return;
        }
        const directionKey = this.options.horizontal
          ? 'scrollLeft'
          : 'scrollTop';
        // 因为纠正滚动条会有误差，所以这里需要再次纠正
        if ((this.client as any)?.[directionKey] !== 0) {
          loopScrollToTop();
        }
      }, 3);
    };
    loopScrollToTop();
  }

  // 滚动到底部
  async scrollToBottom(): Promise<void> {
    let count = 0;
    const loopScrollToBottom = () => {
      count += 1;
      this.scrollToOffset(this.getTotalSize());
      setTimeout(() => {
        // 做一次拦截，防止异常导致的死循环
        if (count > 10) {
          return;
        }
        // 修复底部误差，因为缩放屏幕的时候，获取的尺寸都是小数，精度会有问题，这里把误差调整为2px
        if (
          Math.abs(
            Math.round(this.reactiveData.offset + this.slotSize.clientSize) -
              Math.round(this.getTotalSize())
          ) > 2
        ) {
          loopScrollToBottom();
        }
      }, 3);
    };
    loopScrollToBottom();
  }

  // 获取偏移量
  getOffset(): number {
    const directionKey = this.options.horizontal ? 'scrollLeft' : 'scrollTop';
    return this.client ? (this.client as any)[directionKey] : 0;
  }

  // 获取插槽总尺寸
  getSlotSize(): number {
    return (
      this.slotSize.headerSize +
      this.slotSize.footerSize +
      (this.slotSize.stickyHeaderSize || 0) +
      (this.slotSize.stickyFooterSize || 0)
    );
  }

  // 获取总尺寸
  getTotalSize(): number {
    return (
      this.reactiveData.listTotalSize +
      this.slotSize.headerSize +
      this.slotSize.footerSize +
      this.slotSize.stickyHeaderSize +
      this.slotSize.stickyFooterSize
    );
  }

  // 通过下标来获取元素位置信息
  getItemPosByIndex(index: number): {
    top: number;
    current: number;
    bottom: number;
  } {
    if (this.options.fixed) {
      return {
        top: (this.options.itemPreSize + this.options.itemGap) * index,
        current: this.options.itemPreSize + this.options.itemGap,
        bottom: (this.options.itemPreSize + this.options.itemGap) * (index + 1),
      };
    }

    let topReduce = this.slotSize.headerSize;
    for (let i = 0; i <= index - 1; i += 1) {
      const currentSize = this.getItemSize(
        this.list[i]?.[this.options.itemKey]
      );
      topReduce += currentSize;
    }
    const current = this.getItemSize(this.list[index]?.[this.options.itemKey]);
    return {
      top: topReduce,
      current,
      bottom: topReduce + current,
    };
  }

  // 更新总虚拟尺寸
  updateTopVirtualSize(): void {
    let offset = 0;
    const currentFirst = this.reactiveData.renderBegin;
    for (let i = 0; i < currentFirst; i++) {
      offset += this.getItemSize(this.list[i]?.[this.options.itemKey]);
    }
    this.setTopVirtualSize(offset);

    if (this.options.useVirtualScrollbar) {
      // 更新虚拟滚动条
      this.updateVirtualScrollbar();
    }
  }

  setTopVirtualSize(size: number): void {
    this.reactiveData.virtualSize = size;
    this.headerPadding.style.height = `${size}px`;

    if (this.options.useVirtualScrollbar) {
      this.updateVirtualScrollbar();
    }
  }

  // 计算列表总尺寸 并更新dom
  updateListTotalSize(diff?: number): void {
    if (diff !== undefined) {
      this.setListTotalSize(this.reactiveData.listTotalSize + diff);
      return;
    }

    if (this.options.fixed) {
      const size =
        (this.options.itemPreSize + this.options.itemGap) * this.list.length;
      this.setListTotalSize(size);
      return;
    }

    let re = 0;
    for (let i = 0; i <= this.list.length - 1; i += 1) {
      re += this.getItemSize(this.list[i]?.[this.options.itemKey]);
    }
    this.setListTotalSize(re);
  }

  setListTotalSize(size: number): void {
    this.reactiveData.listTotalSize = size;
    if (this.options.useVirtualScrollbar) {
      this.updateVirtualScrollbar();
    } else {
      this.listContainer.style.height = `${size}px`;
    }
  }

  // 删除列表到顶部
  deletedList2Top(deletedList: ListItem[]): void {
    this.updateListTotalSize();
    let deletedListSize = 0;
    deletedList.forEach((item) => {
      deletedListSize += this.getItemSize(item[this.options.itemKey]);
    });
    this.updateTopVirtualSize();
    this.scrollToOffset(this.reactiveData.offset - deletedListSize);
    this.calcRange();
  }

  // 添加列表到顶部
  addedList2Top(addedList: ListItem[]): void {
    this.updateListTotalSize();
    let addedListSize = 0;
    addedList.forEach((item) => {
      addedListSize += this.getItemSize(item[this.options.itemKey]);
    });
    this.updateTopVirtualSize();
    this.scrollToOffset(this.reactiveData.offset + addedListSize);
    this.forceFixOffset = true;
    this.abortFixOffset = false;
    this.calcRange();
  }

  // 判断位置
  judgePosition(): void {
    // 使用2px作为误差范围
    const threshold = Math.max(this.options.scrollDistance, 2);

    if (this.direction === 'forward') {
      if (this.reactiveData.offset - threshold <= 0) {
        // 到达顶部
        console.log('[VirtList] 到达顶部');
        this.options.toTop?.(this.list[0]);
      }
    } else if (this.direction === 'backward') {
      // 使用一个 Math.round 来解决小数点的误差问题
      const scrollSize = Math.round(
        this.reactiveData.offset + this.slotSize.clientSize
      );
      const distanceToBottom = Math.round(this.getTotalSize() - scrollSize);
      if (distanceToBottom <= threshold) {
        // 到达底部
        console.log('[VirtList] 到达底部');
        this.options.toBottom?.(this.list[this.list.length - 1]);
      }
    }
  }

  // expose 手动渲染
  manualRender(newRenderBegin: number, newRenderEnd: number): void {
    // 旧的渲染起始
    const oldRenderBegin = this.reactiveData.renderBegin;

    // update render begin
    this.reactiveData.renderBegin = newRenderBegin;
    // update render end
    this.reactiveData.renderEnd = newRenderEnd;
    // update virtualSize, diff range size
    if (newRenderBegin > oldRenderBegin) {
      const size =
        this.reactiveData.virtualSize +
        this.getRangeSize(newRenderBegin, oldRenderBegin);
      this.setTopVirtualSize(size);
    } else {
      const size =
        this.reactiveData.virtualSize -
        this.getRangeSize(newRenderBegin, oldRenderBegin);
      this.setTopVirtualSize(size);
    }
    // update render list
    // renderList.value = props.list.slice(
    //   reactiveData.renderBegin,
    //   reactiveData.renderEnd + 1
    // );

    // update size
    this.updateTopVirtualSize();
    // 重新渲染
    this.renderList();
  }

  // 获取响应式数据
  getReactiveData(): ReactiveData {
    return { ...this.reactiveData };
  }
}

export { VirtList };
