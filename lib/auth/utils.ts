// Simple auth utilities for admin-only access
// Note: For production, use NextAuth.js or Clerk

export function hashPassword(password: string): string {
  // This is a placeholder - in production use bcrypt or similar
  // For now, just use a simple hash for demo
  return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Session management (simple cookie-based for demo)
export interface Session {
  userId: string;
  email: string;
  name: string;
  role: string;
}
