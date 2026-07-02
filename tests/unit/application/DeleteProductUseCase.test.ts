import { DeleteProductUseCase } from "../../../src/modules/catalog/application/use-cases/DeleteProductUseCase";
import { createMockProductRepository } from "../../mocks/repositories/mockProductRepository";
import { Product } from "../../../src/modules/catalog/domain/entities/Product";
import { AppError } from "../../../src/shared/errors/AppError";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { IVendorRepository } from "../../../src/modules/vendors/domain/repositories/IVendorRepository";
import { publishEvent } from "../../../src/config/mqtt";

// Setup mocks for PrismaUserRepository, PrismaVendorRepository and MQTT helper
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

jest.mock("../../../src/config/mqtt", () => ({
  publishEvent: jest.fn(),
}));

describe("DeleteProductUseCase", () => {
  let useCase: DeleteProductUseCase;
  let mockProductRepo: ReturnType<typeof createMockProductRepository>;
  let mockVendorRepo: DeepMockProxy<IVendorRepository>;

  const getFreshProduct = () => {
    return Product.reconstitute(
      "prod-1",
      "Empanada",
      "Empanada de queso",
      150, // cents
      10, // stock
      "/uploads/old_image.jpg",
      true, // isAvailable
      true, // isActive
      "vendor-1",
      "cat-1",
      new Date(),
      new Date()
    );
  };

  const vendorUser = {
    id: "user-1",
    clerkId: "clerk_vendor_1",
    email: "vendor@uce.edu.ec",
    role: "VENDOR",
    isActive: true,
  };

  const activeVendorProfile = {
    id: "vendor-1",
    name: "Puesto 1",
    location: "Facultad de Ingeniería",
    phone: "0999999999",
    openingTime: "08:00",
    closingTime: "17:00",
    isActive: true,
    ownerId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockProductRepo = createMockProductRepository();
    mockVendorRepo = mockDeep<IVendorRepository>();
    
    useCase = new DeleteProductUseCase(mockProductRepo, mockVendorRepo);
    jest.clearAllMocks();
  });

  it("should successfully logically delete product and publish DELETED event", async () => {
    // Arrange
    const testProduct = getFreshProduct();
    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(activeVendorProfile);
    mockProductRepo.findById.mockResolvedValue(testProduct);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
    };

    // Act
    await useCase.execute(dto);

    // Assert
    expect(mockFindByClerkId).toHaveBeenCalledWith("clerk_vendor_1");
    expect(mockVendorRepo.findByOwnerId).toHaveBeenCalledWith("user-1");
    expect(mockProductRepo.findById).toHaveBeenCalledWith("prod-1");
    expect(mockProductRepo.update).toHaveBeenCalledWith("prod-1", {
      isActive: false,
      isAvailable: false,
    });
    expect(publishEvent).toHaveBeenCalledWith("centraleats/dishes/updates", {
      action: "DELETED",
      dishId: "prod-1",
      restaurantId: "vendor-1",
    });
  });

  it("should throw error if user is not found", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue(null);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow("User not found. Please complete onboarding first.");
  });

  it("should throw error if vendor profile is not found", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(null);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow(
      "No vendor profile found for this account. Register a vendor first."
    );
  });

  it("should throw error if product to delete is not found", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(activeVendorProfile);
    mockProductRepo.findById.mockResolvedValue(null);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow("Product not found");
  });

  it("should prevent deleting another vendor's product (BOLA prevention)", async () => {
    // Arrange
    const testProduct = getFreshProduct(); // vendorId is "vendor-1"
    const anotherVendorProfile = {
      ...activeVendorProfile,
      id: "vendor-2", // Different vendor
    };

    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(anotherVendorProfile);
    mockProductRepo.findById.mockResolvedValue(testProduct);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow("You do not have permission to delete this product");
    expect(mockProductRepo.update).not.toHaveBeenCalled();
    expect(publishEvent).not.toHaveBeenCalled();
  });
});
