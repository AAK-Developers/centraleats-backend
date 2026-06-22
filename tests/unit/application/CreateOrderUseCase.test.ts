import { CreateOrderUseCase } from "../../../src/modules/orders/application/use-cases/CreateOrderUseCase";
import { createMockOrderRepository } from "../../mocks/repositories/mockOrderRepository";
import { createMockProductRepository } from "../../mocks/repositories/mockProductRepository";
import { StockError } from "../../../src/modules/orders/domain/rules/StockError";
import { OrderStatus } from "../../../src/modules/orders/domain/rules/OrderStatus";

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepo: ReturnType<typeof createMockOrderRepository>;
  let mockProductRepo: ReturnType<typeof createMockProductRepository>;

  beforeEach(() => {
    mockOrderRepo = createMockOrderRepository();
    mockProductRepo = createMockProductRepository();
    useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
  });

  const validOrderInput = {
    userId: "user-1",
    vendorId: "vendor-1",
    totalAmount: 100,
    items: [{ productId: "prod-1", quantity: 2 }]
  };

  it("should create an order successfully when stock is sufficient", async () => {
    // Arrange
    mockProductRepo.findById.mockResolvedValue({
      id: "prod-1",
      name: "Burger",
      description: "A tasty burger",
      price: 50 as any, // bypassing Decimal exact mock for simplicity
      stock: 10,
      imageUrl: null,
      isActive: true,
      vendorId: "vendor-1",
      categoryId: "cat-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdOrder = {
      id: "order-1",
      ...validOrderInput,
      status: OrderStatus.CREATED,
      pickupCode: "XYZ123",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    mockOrderRepo.create.mockResolvedValue(createdOrder);

    // Act
    const result = await useCase.execute(validOrderInput);

    // Assert
    expect(mockProductRepo.findById).toHaveBeenCalledWith("prod-1");
    expect(mockOrderRepo.create).toHaveBeenCalledWith(validOrderInput);
    expect(result).toEqual(createdOrder);
  });

  it("should throw an error if product is not found", async () => {
    // Arrange
    mockProductRepo.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(validOrderInput)).rejects.toThrow("Product prod-1 not found or inactive");
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("should throw StockError when product has insufficient stock", async () => {
    // Arrange
    mockProductRepo.findById.mockResolvedValue({
      id: "prod-1",
      name: "Burger",
      description: "A tasty burger",
      price: 50 as any,
      stock: 1, // Only 1 in stock, but order needs 2
      imageUrl: null,
      isActive: true,
      vendorId: "vendor-1",
      categoryId: "cat-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Act & Assert
    await expect(useCase.execute(validOrderInput)).rejects.toThrow(StockError);
    await expect(useCase.execute(validOrderInput)).rejects.toThrow("Product prod-1 does not have enough stock.");
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });
});
