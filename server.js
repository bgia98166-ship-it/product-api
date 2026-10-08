require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Product = require("./models/Product");

const app = express();

app.use(cors());
app.use(express.json());

function productData(body = {}) {
  const data = {};

  for (const field of ["pid", "pname", "price", "quantity"]) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  return data;
}

// Kiểm tra API và MongoDB.
app.get("/health", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB disconnected");
    }

    await mongoose.connection.db.admin().ping();

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch {
    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

// Thêm sản phẩm.
app.post("/api/products", async (req, res) => {
  const product = await Product.create(productData(req.body));
  res.status(201).json(product);
});

// Xem danh sách sản phẩm.
app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ pid: 1 });
  res.json(products);
});

// Xem một sản phẩm theo pid.
app.get("/api/products/:pid", async (req, res) => {
  const product = await Product.findOne({ pid: req.params.pid });

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.json(product);
});

// Cập nhật sản phẩm.
app.put("/api/products/:pid", async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { pid: req.params.pid },
    { $set: productData(req.body) },
    {
      new: true,
      runValidators: true
    }
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.json(product);
});

// Xóa sản phẩm.
app.delete("/api/products/:pid", async (req, res) => {
  const product = await Product.findOneAndDelete({
    pid: req.params.pid
  });

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.json({
    message: "Product deleted",
    pid: product.pid
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Xử lý lỗi.
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      message: "pid already exists"
    });
  }

  if (
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err.status === 400
  ) {
    return res.status(400).json({
      message: err.message
    });
  }

  console.error(err);

  res.status(500).json({
    message: "Internal server error"
  });
});

// Kết nối MongoDB rồi khởi động API.
async function start() {
  const port = Number(process.env.PORT || 3000);

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });

  await Product.init();

  console.log("MongoDB connected successfully");

  app.listen(port, "0.0.0.0", () => {
    console.log(`Product API running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});