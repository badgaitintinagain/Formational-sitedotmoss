import { hashPassword, verifyPassword, generateId, generateSlug } from '@/lib/auth/utils';

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should return a bcrypt hash string', async () => {
      const hash = await hashPassword('testpassword');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      // bcrypt hash starts with $2a$ or $2b$
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('should produce different hashes for the same password', async () => {
      const hash1 = await hashPassword('samepassword');
      const hash2 = await hashPassword('samepassword');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce a hash with correct bcrypt rounds (12)', async () => {
      const hash = await hashPassword('test');
      // $2a$12$ or $2b$12$ indicates 12 rounds
      expect(hash).toMatch(/^\$2[ab]\$12\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctpassword';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await verifyPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against valid hash', async () => {
      const hash = await hashPassword('somepassword');
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should return a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should contain a timestamp component', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();
      const timestamp = parseInt(id.split('-')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('should have format: timestamp-randomstring', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parts[0]).toMatch(/^\d+$/); // timestamp is digits
      expect(parts[1]).toMatch(/^[a-z0-9]+$/); // random part is alphanumeric
    });
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with dashes', () => {
      expect(generateSlug('my blog post')).toBe('my-blog-post');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello! World? #Test')).toBe('hello-world-test');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
    });

    it('should replace underscores with dashes', () => {
      expect(generateSlug('hello_world_test')).toBe('hello-world-test');
    });

    it('should remove leading and trailing dashes', () => {
      expect(generateSlug('-hello world-')).toBe('hello-world');
    });

    it('should collapse multiple dashes', () => {
      expect(generateSlug('hello---world')).toBe('hello-world');
    });

    it('should trim whitespace', () => {
      expect(generateSlug('  hello world  ')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle strings with only special characters', () => {
      expect(generateSlug('!@#$%')).toBe('');
    });

    it('should preserve numbers', () => {
      expect(generateSlug('Top 10 Posts 2024')).toBe('top-10-posts-2024');
    });

    it('should handle mixed case and special chars', () => {
      expect(generateSlug('My Fancy Post! (Part 2)')).toBe('my-fancy-post-part-2');
    });
  });
});
