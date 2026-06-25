import { GetStudentOrdersUseCase } from "../../../src/modules/orders/application/use-cases/GetStudentOrdersUseCase";
import { createMockOrderRepository } from "../../mocks/repositories/mockOrderRepository";
import { OrderStatus } from "@prisma/client";

// Setup mocks for PrismaUserRepository
const mockFindByClerkId = jest.fn();
jest.mock("../../../src/modules/users/infrastructure/persistence/PrismaUserRepository", () => ({
  PrismaUserRepository: jest.fn().mockImplementation(() => ({
    findByClerkId: mockFindByClerkId,
  })),
}));

describe("GetStudentOrdersUseCase", () => {
  let useCase: GetStudentOrdersUseCase;
  let mockOrderRepo: ReturnType<typeof createMockOrderRepository>;

  beforeEach(() => {
    mockOrderRepo = createMockOrderRepository();
    useCase = new GetStudentOrdersUseCase(mockOrderRepo);
    jest.clearAllMocks();
  });

  it("should return orders if user is a student", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue({
      id: "student-1",
      clerkId: "clerk_student_1",
      role: "STUDENT",
      isActive: true,
    });

    const expectedOrders = [
      { id: "order-1", totalAmount: 500, status: OrderStatus.PREPARING, vendorName: "CafCentral" }
    ];
    mockOrderRepo.findByUserId.mockResolvedValue(expectedOrders);

    // Act
    const result = await useCase.execute("clerk_student_1", { status: OrderStatus.PREPARING });

    // Assert
    expect(mockFindByClerkId).toHaveBeenCalledWith("clerk_student_1");
    expect(mockOrderRepo.findByUserId).toHaveBeenCalledWith("student-1", { status: OrderStatus.PREPARING });
    expect(result).toEqual(expectedOrders);
  });

  it("should return empty array if user is not a STUDENT (e.g. VENDOR)", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue({
      id: "vendor-owner-1",
      clerkId: "clerk_vendor_1",
      role: "VENDOR",
      isActive: true,
    });

    // Act
    const result = await useCase.execute("clerk_vendor_1");

    // Assert
    expect(mockFindByClerkId).toHaveBeenCalledWith("clerk_vendor_1");
    expect(mockOrderRepo.findByUserId).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should throw 404 error if user does not exist", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute("unknown_clerk")).rejects.toThrow("User not found in system. Please select a role first.");
    expect(mockOrderRepo.findByUserId).not.toHaveBeenCalled();
  });
});
