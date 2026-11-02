import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  sendMessageSchema,
  createDmSchema,
  updateMessageSchema,
  toggleReactionSchema
} from '../src/index.js';

describe('Shared Schemas & Validation', () => {
  it('deve validar registro com dados válidos', () => {
    const valid = {
      name: 'Murilo Vidotti',
      email: 'murilo@empresa.com',
      password: 'senhaSegura123'
    };
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar registro com email inválido ou senha curta', () => {
    const invalid = {
      name: 'M',
      email: 'nao-e-email',
      password: '123'
    };
    const result = registerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('deve validar envio de mensagem', () => {
    const valid = {
      roomId: '123e4567-e89b-12d3-a456-426614174000',
      text: 'Olá equipe!'
    };
    expect(sendMessageSchema.safeParse(valid).success).toBe(true);
  });

  it('deve rejeitar mensagem com texto vazio', () => {
    const invalid = {
      roomId: '123e4567-e89b-12d3-a456-426614174000',
      text: ''
    };
    expect(sendMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('deve validar criação de DM com UUID', () => {
    const valid = {
      targetUserId: '123e4567-e89b-12d3-a456-426614174000'
    };
    expect(createDmSchema.safeParse(valid).success).toBe(true);
  });

  it('deve validar e rejeitar updateMessageSchema com trim e vazio', () => {
    expect(updateMessageSchema.safeParse({ text: '  Texto válido  ' }).success).toBe(true);
    expect(updateMessageSchema.safeParse({ text: '    ' }).success).toBe(false);
    expect(updateMessageSchema.safeParse({ text: '' }).success).toBe(false);
  });

  it('deve validar e rejeitar toggleReactionSchema com trim e max(16)', () => {
    expect(toggleReactionSchema.safeParse({ emoji: '👍' }).success).toBe(true);
    expect(toggleReactionSchema.safeParse({ emoji: '  🚀  ' }).success).toBe(true);
    expect(toggleReactionSchema.safeParse({ emoji: '   ' }).success).toBe(false);
    expect(toggleReactionSchema.safeParse({ emoji: '' }).success).toBe(false);
    expect(toggleReactionSchema.safeParse({ emoji: 'a'.repeat(17) }).success).toBe(false);
  });
});
