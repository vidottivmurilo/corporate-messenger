import { describe, it, expect } from 'vitest';
import CorporateChatWidget, { CorporateChatElement, registerCorporateChatElement } from '../src/index.js';

describe('CorporateChatWidget Package', () => {
  it('deve exportar o componente Vue corretamente', () => {
    expect(CorporateChatWidget).toBeDefined();
    expect(CorporateChatWidget.name || typeof CorporateChatWidget).toBeDefined();
  });

  it('deve exportar o Custom Element W3C', () => {
    expect(CorporateChatElement).toBeDefined();
    expect(typeof registerCorporateChatElement).toBe('function');
  });
});
