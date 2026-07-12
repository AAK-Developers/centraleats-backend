import { UpdateOrderStatusUseCase } from "../../../src/modules/orders/application/use-cases/UpdateOrderStatusUseCase";
import { createMockOrderRepository } from "../../mocks/repositories/mockOrderRepository";
import { OrderStatus } from "@prisma/client";
import { Order } from "../../../src/modules/orders/domain/entities/Order";
import { AppError } from "../../../src/shared/errors/AppError";

// Setup mocks for PrismaUserRepository and PrismaVendorRepository
const mockFindByClerkId = jest.fn();
const mockFindByOwnerId = jest.fn();

jest.mock("../../../src/modules/users/infrastructure/persistence/PrismaUserRepository", () => ({
  PrismaUserRepository: jest.fn().mockImplementation(() => ({
    findByClerkId: mockFindByClerkId,
  })),
}));

jest.mock("../../../src/modules/vendors/infrastructure/persistence/PrismaVendorRepository", () => ({
  PrismaVendorRepository: jest.fn().mockImplementation(() => ({
    findByOwnerId: mockFindByOwnerId,
  })),
}));

jest.mock("../../../src/infrastructure/websocket/socketServer", () => ({
  emitOrderUpdated: jest.fn(),
}));

describe("UpdateOrderStatusUseCase", () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockOrderRepo: ReturnType<typeof createMockOrderRepository>;

  const getFreshOrder = (status = OrderStatus.PENDING_PAYMENT) => {
    return Order.reconstitute(
      "order-1",
      "student-1",
      "vendor-1",
      500,
      status,
      null,
      "no onions",
      new Date(),
      new Date()
    );
  };

  beforeEach(() => {
    mockOrderRepo = createMockOrderRepository();
    useCase = new UpdateOrderStatusUseCase(mockOrderRepo);
    jest.clearAllMocks();
  });

  const studentUser = {
    id: "student-1",
    clerkId: "clerk_student_1",
    role: "STUDENT",
    isActive: true,
  };

  const vendorUser = {
    id: "vendor-owner-1",
    clerkId: "clerk_vendor_1",
    role: "VENDOR",
    isActive: true,
  };

  const adminUser = {
    id: "admin-1",
    clerkId: "clerk_admin_1",
    role: "ADMIN",
    isActive: true,
  };

  it("should allow student who placed the order to pay it", async () => {
    // Arrange
    const testOrder = getFreshOrder();
    mockFindByClerkId.mockResolvedValue(studentUser);
    mockOrderRepo.findById.mockResolvedValue(testOrder);
    mockOrderRepo.updateStatus.mockResolvedValue({ ...testOrder.toPrimitives(), status: OrderStatus.PAID } as any);

    // Act
    const result = await useCase.execute("order-1", OrderStatus.PAID, "clerk_student_1");

    // Assert
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith("order-1", OrderStatus.PAID);
    expect(result.status).toBe(OrderStatus.PAID);
  });

  it("should block another student from paying the order", async () => {
    // Arrange
    const testOrder = getFreshOrder();
    mockFindByClerkId.mockResolvedValue({
      ...studentUser,
      id: "student-2",
      clerkId: "clerk_student_2",
    });
    mockOrderRepo.findById.mockResolvedValue(testOrder);

    // Act & Assert
    await expect(
      useCase.execute("order-1", OrderStatus.PAID, "clerk_student_2")
    ).rejects.toThrow("Forbidden: Only the student who placed the order can confirm payment");
    expect(mockOrderRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("should allow the vendor owning the restaurant to transition PAID to RECEIVED", async () => {
    // Arrange
    const paidOrder = getFreshOrder(OrderStatus.PAID);

    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockFindByOwnerId.mockResolvedValue({ id: "vendor-1", ownerId: "vendor-owner-1" });
    mockOrderRepo.findById.mockResolvedValue(paidOrder);
    mockOrderRepo.updateStatus.mockResolvedValue({ ...paidOrder.toPrimitives(), status: OrderStatus.RECEIVED } as any);

    // Act
    const result = await useCase.execute("order-1", OrderStatus.RECEIVED, "clerk_vendor_1");

    // Assert
    expect(mockFindByOwnerId).toHaveBeenCalledWith("vendor-owner-1");
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith("order-1", OrderStatus.RECEIVED);
    expect(result.status).toBe(OrderStatus.RECEIVED);
  });

  it("should block a vendor who does not own the restaurant from updating order status", async () => {
    // Arrange
    const testOrder = getFreshOrder();
    mockFindByClerkId.mockResolvedValue(vendorUser);
    // Vendor owner owns vendor-2, but order is for vendor-1
    mockFindByOwnerId.mockResolvedValue({ id: "vendor-2", ownerId: "vendor-owner-1" });
    mockOrderRepo.findById.mockResolvedValue(testOrder);

    // Act & Assert
    await expect(
      useCase.execute("order-1", OrderStatus.RECEIVED, "clerk_vendor_1")
    ).rejects.toThrow("Forbidden: You do not own the restaurant for this order");
    expect(mockOrderRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("should allow admin to perform any transitions", async () => {
    // Arrange
    const testOrder = getFreshOrder();
    mockFindByClerkId.mockResolvedValue(adminUser);
    mockOrderRepo.findById.mockResolvedValue(testOrder);
    mockOrderRepo.updateStatus.mockResolvedValue({ ...testOrder.toPrimitives(), status: OrderStatus.PAID } as any);

    // Act
    const result = await useCase.execute("order-1", OrderStatus.PAID, "clerk_admin_1");

    // Assert
    expect(result.status).toBe(OrderStatus.PAID);
  });

  it("should validate and fail illegal domain state transitions (e.g. RECEIVED back to PAID)", async () => {
    // Arrange
    const receivedOrder = getFreshOrder(OrderStatus.RECEIVED);

    mockFindByClerkId.mockResolvedValue(studentUser);
    mockOrderRepo.findById.mockResolvedValue(receivedOrder);

    // Act & Assert (RECEIVED -> PAID is invalid)
    await expect(
      useCase.execute("order-1", OrderStatus.PAID, "clerk_student_1")
    ).rejects.toThrow("Cannot transition order from RECEIVED to PAID");
  });
});
