import { defineCustomElement } from 'vue';
import CorporateChatWidget from './CorporateChatWidget.vue';

// Define o Custom Element W3C usando Vue 3
export const CorporateChatElement = defineCustomElement(CorporateChatWidget);

export function registerCorporateChatElement(tagName = 'corporate-chat-box') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, CorporateChatElement);
  }
}

// Auto-registro em ambiente com document/customElements
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  registerCorporateChatElement();
}

export { CorporateChatWidget };
export default CorporateChatWidget;
