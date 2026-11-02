import { describe, it, expect } from 'vitest';
import CorporateChatWidget from '../src/index.js';

describe('CorporateChatWidget Package', () => {
  it('deve exportar o componente Vue corretamente', () => {
    expect(CorporateChatWidget).toBeDefined();
    expect(CorporateChatWidget.name || typeof CorporateChatWidget).toBeDefined();
  });
});
