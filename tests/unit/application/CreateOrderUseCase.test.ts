import { CreateOrderUseCase } from "../../../src/modules/orders/application/use-cases/CreateOrderUseCase";
import { createMockOrderRepository } from "../../mocks/repositories/mockOrderRepository";
import { createMockProductRepository } from "../../mocks/repositories/mockProductRepository";
import { StockError } from "../../../src/modules/orders/domain/rules/StockError";
import { OrderStatus } from "@prisma/client";
import { Money } from "../../../src/shared/domain/value-objects/Money";

// We need to mock PrismaUserRepository since the UseCase now resolves userId server-side
jest.mock("../../../src/modules/users/infrastructure/persistence/PrismaUserRepository", () => ({
  PrismaUserRepository: jest.fn().mockImplementation(() => ({
    findByClerkId: jest.fn().mockResolvedValue({
      id: "user-1",
      clerkId: "clerk_user_1",
      email: "test@uce.edu.ec",
      role: "STUDENT",
      isActive: true,
    }),
  })),
}));

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepo: ReturnType<typeof createMockOrderRepository>;
  let mockProductRepo: ReturnType<typeof createMockProductRepository>;

  beforeEach(() => {
    mockOrderRepo = createMockOrderRepository();
    mockProductRepo = createMockProductRepository();
    useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
  });

  const validOrderDTO = {
    clerkId: "clerk_user_1",
    vendorId: "vendor-1",
    items: [{ productId: "prod-1", quantity: 2 }]
  };

  it("should create an order with server-computed totalAmount", async () => {
    // Arrange
    const priceMoney = Money.fromCents(50);
    mockProductRepo.findById.mockResolvedValue({
      id: "prod-1",
      name: "Burger",
      description: "A tasty burger",
      price: priceMoney,
      stock: 10,
      imageUrl: null,
      isActive: true,
      vendorId: "vendor-1",
      categoryId: "cat-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const createdOrder = {
      id: "order-1",
      userId: "user-1",
      vendorId: "vendor-1",
      totalAmount: 100, // 2 × 50 cents, computed server-side
      items: [{ productId: "prod-1", quantity: 2, unitPrice: 50 }],
      status: OrderStatus.PENDING_PAYMENT,
      pickupCode: "XYZ123",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    mockOrderRepo.create.mockResolvedValue(createdOrder);

    // Act
    const result = await useCase.execute(validOrderDTO);

    // Assert
    expect(mockProductRepo.findById).toHaveBeenCalledWith("prod-1");

    // totalAmount is computed server-side: 2 × 50 = 100 cents
    expect(mockOrderRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      vendorId: "vendor-1",
      totalAmount: 100,
      items: [{ productId: "prod-1", quantity: 2, unitPrice: 50 }]
    });
    expect(result).toEqual(createdOrder);
  });

  it("should throw an error if product is not found", async () => {
    // Arrange
    mockProductRepo.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(validOrderDTO)).rejects.toThrow("Product prod-1 not found or inactive");
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should throw StockError when product has insufficient stock", async () => {
    // Arrange
    const priceMoney = Money.fromCents(50);
    mockProductRepo.findById.mockResolvedValue({
      id: "prod-1",
      name: "Burger",
      description: "A tasty burger",
      price: priceMoney,
      stock: 1, // Only 1 in stock, but order needs 2
      imageUrl: null,
      isActive: true,
      vendorId: "vendor-1",
      categoryId: "cat-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Act & Assert
    await expect(useCase.execute(validOrderDTO)).rejects.toThrow(StockError);
    await expect(useCase.execute(validOrderDTO)).rejects.toThrow("Product prod-1 does not have enough stock.");
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });
});
