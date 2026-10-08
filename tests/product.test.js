const test = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");

test("Product hop le", () => {
  const product = new Product({
    pid: "P001",
    pname: "Laptop",
    price: 15000000,
    quantity: 10
  });

  assert.equal(product.validateSync(), undefined);
});

test("Tu choi price am", () => {
  const product = new Product({
    pid: "P002",
    pname: "Mouse",
    price: -1,
    quantity: 5
  });

  assert.ok(product.validateSync().errors.price);
});

test("Tu choi quantity khong nguyen", () => {
  const product = new Product({
    pid: "P003",
    pname: "Keyboard",
    price: 100000,
    quantity: 1.5
  });

  assert.ok(product.validateSync().errors.quantity);
});

test("Tu choi thieu pid", () => {
  const product = new Product({
    pname: "Monitor",
    price: 2000000,
    quantity: 2
  });

  assert.ok(product.validateSync().errors.pid);
});