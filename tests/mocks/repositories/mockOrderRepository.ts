import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { IOrderRepository } from '../../../src/modules/orders/domain/repositories/IOrderRepository';

export const createMockOrderRepository = (): DeepMockProxy<IOrderRepository> => {
  return mockDeep<IOrderRepository>();
};
