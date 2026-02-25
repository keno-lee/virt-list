export class VirtualList {
  constructor(container, options = {}) {
    this.container = container;
    this.itemHeight = options.itemHeight ?? 72;
    this.overscan = options.overscan ?? 3;
    this.itemRender = options.itemRender ?? ((item) => item);
    this.data = [];
    this.viewportHeight = this.container.clientHeight;

    this.scroller = document.createElement('div');
    this.scroller.style.position = 'relative';
    this.container.appendChild(this.scroller);

    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.left = '0';
    this.content.style.right = '0';
    this.scroller.appendChild(this.content);

    this.handleScroll = this.handleScroll.bind(this);
    this.container.addEventListener('scroll', this.handleScroll);
  }

  init(data) {
    this.data = data;
    this.scroller.style.height = `${this.data.length * this.itemHeight}px`;
    this.render();
  }

  handleScroll() {
    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const end = Math.min(
      this.data.length,
      Math.ceil((scrollTop + this.viewportHeight) / this.itemHeight) + this.overscan,
    );
    const fragment = document.createDocumentFragment();

    this.content.innerHTML = '';
    this.content.style.top = `${start * this.itemHeight}px`;

    for (let i = start; i < end; i += 1) {
      fragment.appendChild(this.itemRender(this.data[i], i));
    }
    this.content.appendChild(fragment);
  }

  scrollToTop() {
    this.container.scrollTop = 0;
  }

  scrollToBottom() {
    this.container.scrollTop = this.data.length * this.itemHeight;
  }

  scrollToIndex(index) {
    this.container.scrollTop = index * this.itemHeight;
  }

  scrollToOffset(offset) {
    this.container.scrollTop = offset;
  }

  scrollIntoView(index) {
    const top = index * this.itemHeight;
    const bottom = top + this.itemHeight;
    const viewTop = this.container.scrollTop;
    const viewBottom = viewTop + this.viewportHeight;

    if (top < viewTop) {
      this.container.scrollTop = top;
    } else if (bottom > viewBottom) {
      this.container.scrollTop = bottom - this.viewportHeight;
    }
  }
}
