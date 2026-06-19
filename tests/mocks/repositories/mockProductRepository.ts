import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { IProductRepository } from '../../../src/modules/catalog/domain/repositories/IProductRepository';

export const createMockProductRepository = (): DeepMockProxy<IProductRepository> => {
  return mockDeep<IProductRepository>();
};
