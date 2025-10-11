import { describe, it, expect, beforeEach, jest } from 'bun:test';
import { MerchantService } from '@/services/merchantService';
import { MerchantQueries } from '@/db/queries/merchantQueries';

// Mock the MerchantQueries
jest.mock('@/db/queries/merchantQueries', () => ({
  MerchantQueries: {
    findByMerchantId: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
  }
}));

describe('MerchantService Unit Tests', () => {
  let merchantService: MerchantService;
  
  const mockMerchant = {
    id: 'merchant-db-id',
    merchantId: 'test-merchant-id',
    name: 'Test Merchant',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    merchantService = new MerchantService();
    jest.clearAllMocks();
  });

  describe('getMerchantById', () => {
    it('should return merchant data for valid merchant ID', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);

      const result = await merchantService.getMerchantById('test-merchant-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...mockMerchant,
        status: 'active' // Ensures proper type casting
      });
      expect(MerchantQueries.findByMerchantId).toHaveBeenCalledWith('test-merchant-id');
    });

    it('should return error for non-existent merchant', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(null);

      const result = await merchantService.getMerchantById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
      expect(result.data).toBeUndefined();
    });

    it('should handle inactive merchant status correctly', async () => {
      const inactiveMerchant = { ...mockMerchant, status: 'inactive' };
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(inactiveMerchant);

      const result = await merchantService.getMerchantById('test-merchant-id');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('inactive');
    });

    it('should handle database errors gracefully', async () => {
      (MerchantQueries.findByMerchantId as any).mockRejectedValue(new Error('Database error'));

      const result = await merchantService.getMerchantById('test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve merchant');
      expect(result.data).toBeUndefined();
    });
  });

  describe('updateMerchant', () => {
    const updateData = {
      name: 'Updated Merchant Name',
      email: 'updated@example.com'
    };

    it('should successfully update merchant with valid data', async () => {
      const updatedMerchant = { ...mockMerchant, ...updateData };
      
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockResolvedValue(null);
      (MerchantQueries.update as any).mockResolvedValue(updatedMerchant);

      const result = await merchantService.updateMerchant('test-merchant-id', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...updatedMerchant,
        status: 'active'
      });
      expect(result.message).toBe('Merchant updated successfully');
      expect(MerchantQueries.update).toHaveBeenCalledWith('merchant-db-id', updateData);
    });

    it('should update only name when provided', async () => {
      const nameUpdate = { name: 'New Name Only' };
      const updatedMerchant = { ...mockMerchant, name: 'New Name Only' };
      
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.update as any).mockResolvedValue(updatedMerchant);

      const result = await merchantService.updateMerchant('test-merchant-id', nameUpdate);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Name Only');
      expect(MerchantQueries.findByEmail).not.toHaveBeenCalled();
    });

    it('should update only email when provided', async () => {
      const emailUpdate = { email: 'newemail@example.com' };
      const updatedMerchant = { ...mockMerchant, email: 'newemail@example.com' };
      
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockResolvedValue(null);
      (MerchantQueries.update as any).mockResolvedValue(updatedMerchant);

      const result = await merchantService.updateMerchant('test-merchant-id', emailUpdate);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('newemail@example.com');
      expect(MerchantQueries.findByEmail).toHaveBeenCalledWith('newemail@example.com');
    });

    it('should return error for non-existent merchant', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(null);

      const result = await merchantService.updateMerchant('non-existent-id', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
      expect(result.data).toBeUndefined();
      expect(MerchantQueries.update).not.toHaveBeenCalled();
    });

    it('should reject update when email already exists for another merchant', async () => {
      const anotherMerchant = { ...mockMerchant, id: 'different-id', email: 'existing@example.com' };
      
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockResolvedValue(anotherMerchant);

      const result = await merchantService.updateMerchant('test-merchant-id', { email: 'existing@example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('A merchant with this email already exists');
      expect(result.data).toBeUndefined();
      expect(MerchantQueries.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same email for same merchant', async () => {
      const updatedMerchant = { ...mockMerchant, name: 'Updated Name' };
      
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockResolvedValue(mockMerchant); // Same merchant
      (MerchantQueries.update as any).mockResolvedValue(updatedMerchant);

      const result = await merchantService.updateMerchant('test-merchant-id', {
        name: 'Updated Name',
        email: mockMerchant.email // Same email
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
      expect(MerchantQueries.update).toHaveBeenCalled();
    });

    it('should handle update failure from database', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockResolvedValue(null);
      (MerchantQueries.update as any).mockResolvedValue(null);

      const result = await merchantService.updateMerchant('test-merchant-id', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update merchant');
      expect(result.data).toBeUndefined();
    });

    it('should handle database errors during update', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockResolvedValue(null);
      (MerchantQueries.update as any).mockRejectedValue(new Error('Database error'));

      const result = await merchantService.updateMerchant('test-merchant-id', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update merchant');
      expect(result.data).toBeUndefined();
    });

    it('should handle database errors during email check', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.findByEmail as any).mockRejectedValue(new Error('Database error'));

      const result = await merchantService.updateMerchant('test-merchant-id', { email: 'test@example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update merchant');
      expect(result.data).toBeUndefined();
    });

    it('should handle database errors during merchant lookup', async () => {
      (MerchantQueries.findByMerchantId as any).mockRejectedValue(new Error('Database error'));

      const result = await merchantService.updateMerchant('test-merchant-id', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update merchant');
      expect(result.data).toBeUndefined();
    });

    it('should handle empty update data', async () => {
      const updatedMerchant = { ...mockMerchant };
      
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(mockMerchant);
      (MerchantQueries.update as any).mockResolvedValue(updatedMerchant);

      const result = await merchantService.updateMerchant('test-merchant-id', {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...updatedMerchant,
        status: 'active'
      });
      expect(MerchantQueries.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and type handling', () => {
    it('should handle undefined status gracefully', async () => {
      const merchantWithUndefinedStatus = { ...mockMerchant, status: undefined };
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(merchantWithUndefinedStatus);

      const result = await merchantService.getMerchantById('test-merchant-id');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBeUndefined();
    });

    it('should handle null responses from database', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(undefined);

      const result = await merchantService.getMerchantById('test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
    });
  });
});