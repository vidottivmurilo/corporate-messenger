import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import type { RegisterInput, LoginInput, AuthResponse, UserDto } from '@corp-messenger/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'corporate-messenger-super-secret-key-32chars';

export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<UserDto> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email)
    });

    if (existing) {
      const error: any = new Error('Email já cadastrado');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const [created] = await db.insert(users).values({
      name: input.name,
      email: input.email,
      passwordHash
    }).returning();

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      createdAt: created.createdAt.toISOString()
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email)
    });

    if (!user) {
      const error: any = new Error('Credenciais inválidas');
      error.statusCode = 401;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      const error: any = new Error('Credenciais inválidas');
      error.statusCode = 401;
      throw error;
    }

    const payload: JwtPayload = {
      userId: user.id,
      name: user.name,
      email: user.email
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString()
      }
    };
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }
}

export const authService = new AuthService();
