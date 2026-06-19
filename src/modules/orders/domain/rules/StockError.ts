export class StockError extends Error {
  constructor(productId: string) {
    super(`Product ${productId} does not have enough stock.`);
    this.name = "StockError";
  }
}
