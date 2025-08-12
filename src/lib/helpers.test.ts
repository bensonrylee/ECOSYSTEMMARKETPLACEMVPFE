import { describe, it, expect } from 'vitest';

// Slot generation helper
export function generateSlots(date: Date, duration: number = 60, count: number = 8) {
  const slots = [];
  const startHour = 9; // 9 AM
  
  for (let i = 0; i < count; i++) {
    const start = new Date(date);
    start.setHours(startHour + i, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    
    slots.push({
      start_at: start.toISOString(),
      end_at: end.toISOString()
    });
  }
  
  return slots;
}

// Booking conflict checker
export function hasConflict(
  newStart: Date,
  newEnd: Date,
  existingBookings: Array<{ start_at: string; end_at: string }>
): boolean {
  return existingBookings.some(booking => {
    const existingStart = new Date(booking.start_at);
    const existingEnd = new Date(booking.end_at);
    
    // Check for overlap
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
}

// Payment client wrapper
export class PaymentClient {
  private baseUrl: string;
  private authToken: string;
  
  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }
  
  async createCheckout(params: {
    amount_cents: number;
    currency: string;
    provider_connect_id: string;
    booking_id: string;
    success_url: string;
    cancel_url: string;
  }) {
    const response = await fetch(`${this.baseUrl}/functions/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Checkout failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getConnectLink(returnUrl: string, accountId?: string) {
    const response = await fetch(`${this.baseUrl}/functions/v1/stripe-connect-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ returnUrl, accountId })
    });
    
    if (!response.ok) {
      throw new Error(`Connect link failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Unit tests
describe('Slot Generation', () => {
  it('should generate correct number of slots', () => {
    const date = new Date('2024-01-15');
    const slots = generateSlots(date, 60, 4);
    
    expect(slots).toHaveLength(4);
  });
  
  it('should generate slots with correct duration', () => {
    const date = new Date('2024-01-15');
    const slots = generateSlots(date, 90, 2);
    
    const firstStart = new Date(slots[0].start_at);
    const firstEnd = new Date(slots[0].end_at);
    const duration = (firstEnd.getTime() - firstStart.getTime()) / 60000;
    
    expect(duration).toBe(90);
  });
  
  it('should start slots at 9 AM', () => {
    const date = new Date('2024-01-15');
    const slots = generateSlots(date, 60, 1);
    
    const start = new Date(slots[0].start_at);
    expect(start.getHours()).toBe(9);
    expect(start.getMinutes()).toBe(0);
  });
});

describe('Booking Conflict Detection', () => {
  const existingBookings = [
    { start_at: '2024-01-15T10:00:00Z', end_at: '2024-01-15T11:00:00Z' },
    { start_at: '2024-01-15T14:00:00Z', end_at: '2024-01-15T15:00:00Z' }
  ];
  
  it('should detect exact overlap', () => {
    const hasConflictResult = hasConflict(
      new Date('2024-01-15T10:00:00Z'),
      new Date('2024-01-15T11:00:00Z'),
      existingBookings
    );
    
    expect(hasConflictResult).toBe(true);
  });
  
  it('should detect partial overlap at start', () => {
    const hasConflictResult = hasConflict(
      new Date('2024-01-15T09:30:00Z'),
      new Date('2024-01-15T10:30:00Z'),
      existingBookings
    );
    
    expect(hasConflictResult).toBe(true);
  });
  
  it('should detect partial overlap at end', () => {
    const hasConflictResult = hasConflict(
      new Date('2024-01-15T10:30:00Z'),
      new Date('2024-01-15T11:30:00Z'),
      existingBookings
    );
    
    expect(hasConflictResult).toBe(true);
  });
  
  it('should detect booking within existing booking', () => {
    const hasConflictResult = hasConflict(
      new Date('2024-01-15T10:15:00Z'),
      new Date('2024-01-15T10:45:00Z'),
      existingBookings
    );
    
    expect(hasConflictResult).toBe(true);
  });
  
  it('should detect booking that encompasses existing booking', () => {
    const hasConflictResult = hasConflict(
      new Date('2024-01-15T09:00:00Z'),
      new Date('2024-01-15T12:00:00Z'),
      existingBookings
    );
    
    expect(hasConflictResult).toBe(true);
  });
  
  it('should not detect conflict for non-overlapping times', () => {
    const hasConflictResult = hasConflict(
      new Date('2024-01-15T12:00:00Z'),
      new Date('2024-01-15T13:00:00Z'),
      existingBookings
    );
    
    expect(hasConflictResult).toBe(false);
  });
});

describe('Payment Client', () => {
  const client = new PaymentClient(
    'https://ftozjjjrhifbblpslixk.supabase.co',
    'test-token'
  );
  
  it('should build correct checkout request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/test' })
    });
    
    const result = await client.createCheckout({
      amount_cents: 5000,
      currency: 'cad',
      provider_connect_id: 'acct_123',
      booking_id: 'booking_123',
      success_url: 'http://localhost/success',
      cancel_url: 'http://localhost/cancel'
    });
    
    expect(fetch).toHaveBeenCalledWith(
      'https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('5000')
      })
    );
    
    expect(result.url).toBe('https://checkout.stripe.com/test');
  });
  
  it('should build correct connect link request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 
        url: 'https://connect.stripe.com/test',
        accountId: 'acct_new'
      })
    });
    
    const result = await client.getConnectLink('http://localhost/return');
    
    expect(fetch).toHaveBeenCalledWith(
      'https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-connect-link',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('http://localhost/return')
      })
    );
    
    expect(result.accountId).toBe('acct_new');
  });
});