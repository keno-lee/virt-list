export interface VirtualScrollbarOptions {
  container: HTMLElement;
  contentHeight: number;
  viewportHeight: number;
  onScroll?: (offset: number) => void;
  scrollbarWidth?: number;
  scrollbarColor?: string;
  scrollbarTrackColor?: string;
  scrollbarThumbColor?: string;
}

export class VirtualScrollbar {
  private container: HTMLElement;
  private scrollbarContainer: HTMLElement;
  private scrollbarTrack: HTMLElement;
  private scrollbarThumb: HTMLElement;
  private contentHeight: number;
  private viewportHeight: number;
  private scrollbarWidth: number;
  private onScroll?: (offset: number) => void;
  
  private isDragging = false;
  private dragStartY = 0;
  private dragStartOffset = 0;
  private currentOffset = 0;
  private hideTimeout?: number;
  
  constructor(options: VirtualScrollbarOptions) {
    this.container = options.container;
    this.contentHeight = options.contentHeight;
    this.viewportHeight = options.viewportHeight;
    this.scrollbarWidth = options.scrollbarWidth || 12;
    this.onScroll = options.onScroll;
    
    this.createScrollbar();
    this.bindEvents();
    this.updateScrollbar();
  }
  
  private createScrollbar(): void {
    // 创建滚动条容器
    this.scrollbarContainer = document.createElement('div');
    this.scrollbarContainer.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: ${this.scrollbarWidth}px;
      height: 100%;
      background: transparent;
      cursor: pointer;
      z-index: 1000;
      pointer-events: none;
      transition: opacity 0.3s ease;
      opacity: 0;
    `;
    
    // 创建滚动条轨道
    this.scrollbarTrack = document.createElement('div');
    this.scrollbarTrack.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      pointer-events: auto;
    `;
    
    // 创建滚动条滑块
    this.scrollbarThumb = document.createElement('div');
    this.scrollbarThumb.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: ${this.scrollbarWidth}px;
      background: ${this.getScrollbarThumbColor()};
      border-radius: ${this.scrollbarWidth / 2}px;
      cursor: grab;
      transition: all 0.2s ease;
      opacity: 0.6;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    `;
    
    this.scrollbarThumb.addEventListener('mouseenter', () => {
      this.scrollbarThumb.style.backgroundColor = this.getScrollbarThumbHoverColor();
      this.scrollbarThumb.style.opacity = '0.8';
    });
    
    this.scrollbarThumb.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.scrollbarThumb.style.backgroundColor = this.getScrollbarThumbColor();
        this.scrollbarThumb.style.opacity = '0.6';
      }
    });
    
    this.scrollbarTrack.appendChild(this.scrollbarThumb);
    this.scrollbarContainer.appendChild(this.scrollbarTrack);
    this.container.appendChild(this.scrollbarContainer);
  }
  
  private bindEvents(): void {
    // 滚动条轨道点击事件
    this.scrollbarTrack.addEventListener('click', (e) => {
      if (e.target === this.scrollbarTrack) {
        const rect = this.scrollbarTrack.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const thumbHeight = this.getThumbHeight();
        const maxThumbTop = this.viewportHeight - thumbHeight;
        const thumbTop = Math.min(Math.max(clickY - thumbHeight / 2, 0), maxThumbTop);
        
        this.currentOffset = (thumbTop / maxThumbTop) * (this.contentHeight - this.viewportHeight);
        this.updateScrollbar();
        this.onScroll?.(this.currentOffset);
      }
    });
    
    // 滑块拖拽事件
    this.scrollbarThumb.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.clientY;
      this.dragStartOffset = this.currentOffset;
      this.scrollbarThumb.style.cursor = 'grabbing';
      this.scrollbarThumb.style.backgroundColor = this.getScrollbarThumbActiveColor();
      this.scrollbarThumb.style.opacity = '1';
      
      e.preventDefault();
    });
    
    // 全局鼠标移动和释放事件
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 鼠标滚轮事件
    this.container.addEventListener('wheel', this.handleWheel.bind(this));
    
    // 鼠标进入和离开事件，用于自动隐藏滚动条
    this.container.addEventListener('mouseenter', this.showScrollbar.bind(this));
    this.container.addEventListener('mouseleave', this.hideScrollbar.bind(this));
  }
  
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const deltaY = e.clientY - this.dragStartY;
    const thumbHeight = this.getThumbHeight();
    const maxThumbTop = this.viewportHeight - thumbHeight;
    const trackHeight = this.viewportHeight;
    
    const deltaRatio = deltaY / trackHeight;
    const deltaOffset = deltaRatio * (this.contentHeight - this.viewportHeight);
    
    this.currentOffset = Math.min(Math.max(this.dragStartOffset + deltaOffset, 0), this.contentHeight - this.viewportHeight);
    
    this.updateScrollbar();
    this.onScroll?.(this.currentOffset);
  }
  
  private handleMouseUp(): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.scrollbarThumb.style.cursor = 'grab';
    this.scrollbarThumb.style.backgroundColor = this.getScrollbarThumbColor();
    this.scrollbarThumb.style.opacity = '0.6';
  }
  
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const deltaY = e.deltaY;
    const scrollSpeed = 50; // 滚动速度
    const deltaOffset = deltaY * scrollSpeed / 100;
    
    // 修复滚动方向：向下滚动时增加offset，向上滚动时减少offset
    this.currentOffset = Math.min(Math.max(this.currentOffset + deltaOffset, 0), this.contentHeight - this.viewportHeight);
    
    this.updateScrollbar();
    this.onScroll?.(this.currentOffset);
  }
  
  private updateScrollbar(): void {
    const thumbHeight = this.getThumbHeight();
    const maxThumbTop = this.viewportHeight - thumbHeight;
    const thumbTop = (this.currentOffset / (this.contentHeight - this.viewportHeight)) * maxThumbTop;
    
    this.scrollbarThumb.style.top = `${thumbTop}px`;
    this.scrollbarThumb.style.height = `${thumbHeight}px`;
  }
  
  private showScrollbar(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
    this.scrollbarContainer.style.opacity = '1';
  }
  
  private hideScrollbar(): void {
    if (this.isDragging) return;
    
    this.hideTimeout = window.setTimeout(() => {
      this.scrollbarContainer.style.opacity = '0';
    }, 1000); // 1秒后隐藏
  }
  
  private getThumbHeight(): number {
    const ratio = this.viewportHeight / this.contentHeight;
    return Math.max(ratio * this.viewportHeight, 20); // 最小高度20px
  }
  
  // 公共方法
  public setOffset(offset: number): void {
    this.currentOffset = Math.min(Math.max(offset, 0), this.contentHeight - this.viewportHeight);
    this.updateScrollbar();
  }
  
  public getOffset(): number {
    return this.currentOffset;
  }
  
  public updateContentHeight(height: number): void {
    this.contentHeight = height;
    console.log('updateContentHeight', height);
    this.updateScrollbar();
  }
  
  public updateViewportHeight(height: number): void {
    this.viewportHeight = height;
    this.updateScrollbar();
  }
  
  public destroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.scrollbarContainer.remove();
  }
  
  // 样式相关方法
  private getScrollbarTrackColor(): string {
    return 'transparent';
  }
  
  private getScrollbarThumbColor(): string {
    return 'rgba(0, 0, 0, 0.3)';
  }
  
  private getScrollbarThumbHoverColor(): string {
    return 'rgba(0, 0, 0, 0.5)';
  }
  
  private getScrollbarThumbActiveColor(): string {
    return 'rgba(0, 0, 0, 0.7)';
  }
}
