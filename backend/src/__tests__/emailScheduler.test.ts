import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { createEmailSchema, rescheduleEmailSchema, emailQuerySchema } from '../validators/email.js';

describe('Email Validation Schemas', () => {
  test('validates valid email creation payload', () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();
    const payload = {
      recipient: 'user@example.com',
      subject: 'Test Subject',
      body: 'This is a test body',
      scheduledAt: futureDate,
    };

    const result = createEmailSchema.safeParse(payload);
    assert.strictEqual(result.success, true);
  });

  test('rejects invalid recipient email', () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();
    const payload = {
      recipient: 'invalid-email',
      subject: 'Test Subject',
      body: 'This is a test body',
      scheduledAt: futureDate,
    };

    const result = createEmailSchema.safeParse(payload);
    assert.strictEqual(result.success, false);
  });

  test('rejects past scheduledAt date', () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    const payload = {
      recipient: 'user@example.com',
      subject: 'Test Subject',
      body: 'This is a test body',
      scheduledAt: pastDate,
    };

    const result = createEmailSchema.safeParse(payload);
    assert.strictEqual(result.success, false);
  });

  test('validates reschedule payload', () => {
    const futureDate = new Date(Date.now() + 120000).toISOString();
    const result = rescheduleEmailSchema.safeParse({ scheduledAt: futureDate });
    assert.strictEqual(result.success, true);
  });

  test('validates email query pagination defaults', () => {
    const result = emailQuerySchema.safeParse({});
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.page, 1);
      assert.strictEqual(result.data.limit, 10);
      assert.strictEqual(result.data.sortBy, 'createdAt');
    }
  });
});
