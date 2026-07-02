import { UpdateProductUseCase } from "../../../src/modules/catalog/application/use-cases/UpdateProductUseCase";
import { createMockProductRepository } from "../../mocks/repositories/mockProductRepository";
import { Product } from "../../../src/modules/catalog/domain/entities/Product";
import { AppError } from "../../../src/shared/errors/AppError";
import { Money } from "../../../src/shared/domain/value-objects/Money";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { IVendorRepository } from "../../../src/modules/vendors/domain/repositories/IVendorRepository";
import { IStorageRepository } from "../../../src/shared/domain/ports/storage.repository";

// Setup mocks for PrismaUserRepository, PrismaVendorRepository, PrismaCategoryRepository and MQTT helper
const mockFindByClerkId = jest.fn();
const mockFindByOwnerId = jest.fn();
const mockCategoryFindById = jest.fn();

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

jest.mock("../../../src/modules/catalog/infrastructure/persistence/PrismaCategoryRepository", () => ({
  PrismaCategoryRepository: jest.fn().mockImplementation(() => ({
    findById: mockCategoryFindById,
  })),
}));

jest.mock("../../../src/config/mqtt", () => ({
  publishEvent: jest.fn(),
}));

describe("UpdateProductUseCase", () => {
  let useCase: UpdateProductUseCase;
  let mockProductRepo: ReturnType<typeof createMockProductRepository>;
  let mockVendorRepo: DeepMockProxy<IVendorRepository>;
  let mockStorageRepo: DeepMockProxy<IStorageRepository>;

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
    mockStorageRepo = mockDeep<IStorageRepository>();
    
    // Inject mocks and instantiate the use case
    useCase = new UpdateProductUseCase(mockProductRepo, mockVendorRepo, mockStorageRepo);
    jest.clearAllMocks();
    mockCategoryFindById.mockResolvedValue({ id: "cat-1", name: "Comida Rápida" });
  });

  it("should successfully update product without a new image", async () => {
    // Arrange
    const testProduct = getFreshProduct();
    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(activeVendorProfile);
    mockProductRepo.findById.mockResolvedValue(testProduct);

    const updatedEntity = Product.reconstitute(
      "prod-1",
      "Empanada de carne",
      "Empanada de carne mechada",
      200, // new price (cents)
      5, // new stock
      "/uploads/old_image.jpg", // same image
      true,
      true,
      "vendor-1",
      "cat-2", // new category
      new Date(),
      new Date()
    );
    mockProductRepo.update.mockResolvedValue(updatedEntity);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
      categoryId: "cat-2",
      name: "Empanada de carne",
      description: "Empanada de carne mechada",
      price: 200,
      stock: 5,
      isAvailable: true,
      isActive: true,
    };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(mockFindByClerkId).toHaveBeenCalledWith("clerk_vendor_1");
    expect(mockVendorRepo.findByOwnerId).toHaveBeenCalledWith("user-1");
    expect(mockProductRepo.findById).toHaveBeenCalledWith("prod-1");
    expect(mockStorageRepo.uploadImage).not.toHaveBeenCalled();
    expect(mockProductRepo.update).toHaveBeenCalledWith("prod-1", {
      name: "Empanada de carne",
      description: "Empanada de carne mechada",
      price: Money.fromCents(200),
      stock: 5,
      imageUrl: "/uploads/old_image.jpg",
      isAvailable: true,
      isActive: true,
      vendorId: "vendor-1",
      categoryId: "cat-2",
    });
    expect(result).toEqual(updatedEntity);
  });

  it("should successfully update product and upload a new image", async () => {
    // Arrange
    const testProduct = getFreshProduct();
    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(activeVendorProfile);
    mockProductRepo.findById.mockResolvedValue(testProduct);
    mockStorageRepo.uploadImage.mockResolvedValue("/uploads/new_image.jpg");

    const updatedEntity = Product.reconstitute(
      "prod-1",
      "Empanada",
      "Empanada de queso",
      150,
      10,
      "/uploads/new_image.jpg", // new image
      true,
      true,
      "vendor-1",
      "cat-1",
      new Date(),
      new Date()
    );
    mockProductRepo.update.mockResolvedValue(updatedEntity);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
      categoryId: "cat-1",
      name: "Empanada",
      description: "Empanada de queso",
      price: 150,
      stock: 10,
      isAvailable: true,
      isActive: true,
      image: {
        buffer: Buffer.from("test"),
        originalname: "new.jpg",
        mimetype: "image/jpeg",
      },
    };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(mockStorageRepo.uploadImage).toHaveBeenCalledWith(
      dto.image.buffer,
      dto.image.originalname,
      dto.image.mimetype,
      "vendor-logos",
      "vendors/vendor-1/products"
    );
    expect(mockProductRepo.update).toHaveBeenCalledWith("prod-1", {
      name: "Empanada",
      description: "Empanada de queso",
      price: Money.fromCents(150),
      stock: 10,
      imageUrl: "/uploads/new_image.jpg",
      isAvailable: true,
      isActive: true,
      vendorId: "vendor-1",
      categoryId: "cat-1",
    });
    expect(result.imageUrl).toBe("/uploads/new_image.jpg");
  });

  it("should throw error if user is not found", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue(null);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
      categoryId: "cat-1",
      name: "Empanada",
      price: 150,
      stock: 10,
      isAvailable: true,
      isActive: true,
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
      categoryId: "cat-1",
      name: "Empanada",
      price: 150,
      stock: 10,
      isAvailable: true,
      isActive: true,
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow(
      "No vendor profile found for this account. Register a vendor first."
    );
  });

  it("should throw error if product to update is not found", async () => {
    // Arrange
    mockFindByClerkId.mockResolvedValue(vendorUser);
    mockVendorRepo.findByOwnerId.mockResolvedValue(activeVendorProfile);
    mockProductRepo.findById.mockResolvedValue(null);

    const dto = {
      id: "prod-1",
      clerkId: "clerk_vendor_1",
      categoryId: "cat-1",
      name: "Empanada",
      price: 150,
      stock: 10,
      isAvailable: true,
      isActive: true,
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow("Product not found");
  });

  it("should prevent updating another vendor's product (BOLA prevention)", async () => {
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
      categoryId: "cat-1",
      name: "Empanada",
      price: 150,
      stock: 10,
      isAvailable: true,
      isActive: true,
    };

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow("You do not have permission to edit this product");
    expect(mockProductRepo.update).not.toHaveBeenCalled();
  });
});
