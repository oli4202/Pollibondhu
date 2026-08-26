/**
 * Unit tests — bcrypt utilities
 * Real hashing (cost factor is acceptable in CI) to prove correct behaviour.
 */
import { hashPassword, comparePassword } from '../../../src/utils/bcrypt';

describe('bcrypt utilities', () => {
  it('hashes a password with a salted bcrypt digest', async () => {
    const hash = await hashPassword('Secret123!');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).not.toContain('Secret123!');
  });

  it('produces different hashes for identical passwords (unique salts)', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });

  it('verifies the correct password', async () => {
    const hash = await hashPassword('Secret123!');
    await expect(comparePassword('Secret123!', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Secret123!');
    await expect(comparePassword('wrong', hash)).resolves.toBe(false);
  });
});
