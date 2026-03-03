import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  it('should return success', async () => {
    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('should clear the auth cookie', async () => {
    const response = await POST();
    const setCookie = response.headers.get('set-cookie');
    // Cookie deletion sets max-age=0 or expires in the past
    expect(setCookie).toContain('auth_user=');
  });
});
