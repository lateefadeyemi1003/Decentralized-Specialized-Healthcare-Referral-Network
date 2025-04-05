import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockClarity = () => {
  let providers = new Map();
  let nextProviderId = 1;
  let admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Example principal
  
  return {
    registerProvider: (name, specialty, licenseNumber, credentials) => {
      const providerId = nextProviderId;
      
      if (providers.has(providerId)) {
        return { error: 'ERR_ALREADY_REGISTERED' };
      }
      
      providers.set(providerId, {
        name,
        specialty,
        licenseNumber,
        isVerified: false,
        verificationDate: 0,
        credentials,
        rating: 0
      });
      
      nextProviderId++;
      return { ok: providerId };
    },
    
    verifyProvider: (providerId, sender) => {
      if (sender !== admin) {
        return { error: 'ERR_UNAUTHORIZED' };
      }
      
      if (!providers.has(providerId)) {
        return { error: 'ERR_NOT_FOUND' };
      }
      
      const provider = providers.get(providerId);
      provider.isVerified = true;
      provider.verificationDate = 123; // Mock block height
      providers.set(providerId, provider);
      
      return { ok: true };
    },
    
    getProvider: (providerId) => {
      return providers.get(providerId) || null;
    },
    
    isProviderVerified: (providerId) => {
      const provider = providers.get(providerId);
      return provider ? provider.isVerified : false;
    },
    
    setAdmin: (newAdmin, sender) => {
      if (sender !== admin) {
        return { error: 'ERR_UNAUTHORIZED' };
      }
      
      admin = newAdmin;
      return { ok: true };
    }
  };
};

describe('Provider Verification Contract', () => {
  let contract;
  
  beforeEach(() => {
    contract = mockClarity();
  });
  
  it('should register a new provider', () => {
    const result = contract.registerProvider(
        'Dr. Smith',
        'Cardiology',
        'MD12345',
        ['Board Certified', 'Harvard Medical School']
    );
    
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(1);
    
    const provider = contract.getProvider(1);
    expect(provider).not.toBeNull();
    expect(provider.name).toBe('Dr. Smith');
    expect(provider.specialty).toBe('Cardiology');
    expect(provider.isVerified).toBe(false);
  });
  
  it('should verify a provider', () => {
    // First register a provider
    contract.registerProvider(
        'Dr. Smith',
        'Cardiology',
        'MD12345',
        ['Board Certified', 'Harvard Medical School']
    );
    
    // Then verify the provider
    const result = contract.verifyProvider(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(true);
    
    const provider = contract.getProvider(1);
    expect(provider.isVerified).toBe(true);
    expect(provider.verificationDate).toBe(123);
  });
  
  it('should not verify a provider with unauthorized sender', () => {
    // First register a provider
    contract.registerProvider(
        'Dr. Smith',
        'Cardiology',
        'MD12345',
        ['Board Certified', 'Harvard Medical School']
    );
    
    // Try to verify with wrong sender
    const result = contract.verifyProvider(1, 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    expect(result).toHaveProperty('error');
    expect(result.error).toBe('ERR_UNAUTHORIZED');
    
    const provider = contract.getProvider(1);
    expect(provider.isVerified).toBe(false);
  });
  
  it('should check if a provider is verified', () => {
    // Register a provider
    contract.registerProvider(
        'Dr. Smith',
        'Cardiology',
        'MD12345',
        ['Board Certified', 'Harvard Medical School']
    );
    
    // Initially not verified
    expect(contract.isProviderVerified(1)).toBe(false);
    
    // Verify the provider
    contract.verifyProvider(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    // Now should be verified
    expect(contract.isProviderVerified(1)).toBe(true);
  });
  
  it('should change admin', () => {
    const newAdmin = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = contract.setAdmin(newAdmin, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(true);
    
    // Try to verify with old admin (should fail)
    const verifyResult = contract.verifyProvider(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(verifyResult).toHaveProperty('error');
    
    // Register a provider first
    contract.registerProvider(
        'Dr. Smith',
        'Cardiology',
        'MD12345',
        ['Board Certified', 'Harvard Medical School']
    );
    
    // Try to verify with new admin (should succeed)
    const verifyResult2 = contract.verifyProvider(1, newAdmin);
    expect(verifyResult2).toHaveProperty('ok');
  });
});
