import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import PlaygroundHost from './components/PlaygroundHost.vue';
import './styles/playground.css';

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaygroundHost', PlaygroundHost);
  },
};

export default theme;
