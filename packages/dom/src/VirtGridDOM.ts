/* eslint-disable @typescript-eslint/no-explicit-any */
import { VirtListDOM } from './VirtListDOM';
import type { VirtListEvents } from '@virt-list/core';

export interface VirtGridDOMOptions<T extends Record<string, any>> {
  list: T[];
  gridItems: number;
  itemKey: string;
  itemPreSize: number;
  itemGap?: number;
  fixed?: boolean;
  buffer?: number;
  itemStyle?: string;
  renderCell: (item: T, index: number, rowIndex: number) => HTMLElement;
  renderStickyHeader?: () => HTMLElement;
  renderStickyFooter?: () => HTMLElement;
  renderHeader?: () => HTMLElement;
  renderFooter?: () => HTMLElement;
  renderEmpty?: () => HTMLElement;
  stickyHeaderStyle?: string;
}

export interface VirtGridDOMEvents<T extends Record<string, any>> {
  scroll?: (e: Event) => void;
  toTop?: (item: any) => void;
  toBottom?: (item: any) => void;
  itemResize?: (id: string, newSize: number) => void;
  rangeUpdate?: (inViewBegin: number, inViewEnd: number) => void;
}

interface GridRow<T> {
  _id: number;
  children: T[];
  [key: string]: any;
}

export class VirtGridDOM<T extends Record<string, any>> {
  private _options: VirtGridDOMOptions<T>;
  private _virtListDOM: VirtListDOM<GridRow<T>>;
  private _gridList: GridRow<T>[] = [];

  constructor(
    container: HTMLElement,
    options: VirtGridDOMOptions<T>,
    events?: VirtGridDOMEvents<T>,
  ) {
    this._options = options;
    this._updateGridList();

    const listEvents: VirtListEvents<GridRow<T>> = {
      scroll: (e) => events?.scroll?.(e),
      toTop: (item) => events?.toTop?.(item),
      toBottom: (item) => events?.toBottom?.(item),
      itemResize: (id, size) => events?.itemResize?.(id, size),
      rangeUpdate: (begin, end) => events?.rangeUpdate?.(begin, end),
    };

    this._virtListDOM = new VirtListDOM<GridRow<T>>(
      container,
      {
        list: this._gridList,
        itemKey: '_id',
        itemPreSize: options.itemPreSize,
        itemGap: options.itemGap,
        fixed: options.fixed,
        buffer: options.buffer,
        itemStyle: `display:flex;min-width:min-content;${options.itemStyle ?? ''}`,
        renderItem: (rowData: GridRow<T>, rowIndex: number) => {
          const rowEl = document.createDocumentFragment() as unknown as HTMLElement;
          const wrapper = document.createElement('div');
          wrapper.style.display = 'contents';
          for (let i = 0; i < rowData.children.length; i++) {
            const cellEl = this._options.renderCell(
              rowData.children[i],
              rowData._id + i,
              rowIndex,
            );
            wrapper.appendChild(cellEl);
          }
          return wrapper;
        },
        renderStickyHeader: options.renderStickyHeader,
        renderStickyFooter: options.renderStickyFooter,
        renderHeader: options.renderHeader,
        renderFooter: options.renderFooter,
        renderEmpty: options.renderEmpty,
        stickyHeaderStyle: options.stickyHeaderStyle,
      },
      listEvents,
    );
  }

  private _updateGridList(): void {
    const { list, gridItems } = this._options;
    if (gridItems <= 0) return;

    const result: GridRow<T>[] = [];
    for (let i = 0; i < list.length; i += gridItems) {
      const children: T[] = [];
      for (let j = 0; j < gridItems; j++) {
        if (i + j >= list.length) break;
        children.push(list[i + j]);
      }
      result.push({ _id: i, children });
    }
    this._gridList = result;
  }

  setList(list: T[]): void {
    this._options.list = list;
    this._updateGridList();
    this._virtListDOM.setList(this._gridList);
  }

  setGridItems(gridItems: number): void {
    if (gridItems <= 0) return;
    const oldGridItems = this._options.gridItems;
    this._options.gridItems = gridItems;

    const inViewBegin = this._virtListDOM.state.inViewBegin;
    this._updateGridList();
    this._virtListDOM.setList(this._gridList);

    const targetRowIndex = Math.floor(
      (inViewBegin * oldGridItems) / gridItems,
    );
    requestAnimationFrame(() => {
      this._virtListDOM.scrollToIndex(targetRowIndex);
    });
  }

  scrollToIndex(index: number): void {
    const targetRowIndex = Math.floor(index / this._options.gridItems);
    this._virtListDOM.scrollToIndex(targetRowIndex);
  }

  scrollIntoView(index: number): void {
    const targetRowIndex = Math.floor(index / this._options.gridItems);
    this._virtListDOM.scrollIntoView(targetRowIndex);
  }

  scrollToTop(): void {
    this._virtListDOM.scrollToTop();
  }

  scrollToBottom(): void {
    this._virtListDOM.scrollToBottom();
  }

  scrollToOffset(offset: number): void {
    this._virtListDOM.scrollToOffset(offset);
  }

  forceUpdate(): void {
    this._updateGridList();
    this._virtListDOM.setList(this._gridList);
    this._virtListDOM.forceUpdate();
  }

  destroy(): void {
    this._virtListDOM.destroy();
  }
}
