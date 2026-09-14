import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

export interface Address {
  id: string | number;
  userId?: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  commune?: string;
  streetLine: string;
  isDefault?: boolean;
}

export interface CreateAddressData {
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  commune: string;
  streetLine: string;
  isDefault?: boolean;
}

export const fetchAddressesApi = async (): Promise<Address[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.ADDRESSES.LIST);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return [];
  }
};

export const createAddressApi = async (data: CreateAddressData): Promise<Address> => {
  const response = await apiClient.post(ENDPOINTS.ADDRESSES.CREATE, data);
  return response.data;
};

export const setDefaultAddressApi = async (id: string | number): Promise<Address> => {
  const response = await apiClient.patch(ENDPOINTS.ADDRESSES.SET_DEFAULT(String(id)));
  return response.data;
};

export const deleteAddressApi = async (id: string | number): Promise<boolean> => {
  try {
    await apiClient.delete(ENDPOINTS.ADDRESSES.DELETE(String(id)));
    return true;
  } catch (error) {
    console.error('Failed to delete address:', error);
    return false;
  }
};

