const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const base = process.env.API_URL || "http://127.0.0.1:3000";
const pid = `CI-${randomUUID()}`;

async function request(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });

  return {
    status: response.status,
    data: await response.json()
  };
}

async function main() {
  let result = await request("GET", "/health");
  assert.equal(result.status, 200);
  assert.equal(result.data.database, "connected");

  const product = {
    pid,
    pname: "CI Product",
    price: 100000,
    quantity: 5
  };

  // CREATE
  result = await request("POST", "/api/products", product);
  assert.equal(result.status, 201);
  assert.equal(result.data.pid, pid);

  // READ ONE
  result = await request("GET", `/api/products/${pid}`);
  assert.equal(result.status, 200);
  assert.equal(result.data.pname, "CI Product");

  // READ ALL
  result = await request("GET", "/api/products");
  assert.equal(result.status, 200);
  assert.ok(result.data.some((item) => item.pid === pid));

  // UPDATE
  result = await request("PUT", `/api/products/${pid}`, {
    pname: "Updated CI Product",
    price: 200000,
    quantity: 8
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.quantity, 8);

  // Đọc lại để kiểm tra dữ liệu đã lưu.
  result = await request("GET", `/api/products/${pid}`);
  assert.equal(result.status, 200);
  assert.equal(result.data.pname, "Updated CI Product");
  assert.equal(result.data.price, 200000);

  // Không cho trùng pid.
  result = await request("POST", "/api/products", product);
  assert.equal(result.status, 409);

  // Không cho giá âm.
  result = await request("PUT", `/api/products/${pid}`, {
    price: -1
  });
  assert.equal(result.status, 400);

  // Giá phải giữ nguyên sau cập nhật không hợp lệ.
  result = await request("GET", `/api/products/${pid}`);
  assert.equal(result.data.price, 200000);

  // DELETE
  result = await request("DELETE", `/api/products/${pid}`);
  assert.equal(result.status, 200);

  result = await request("GET", `/api/products/${pid}`);
  assert.equal(result.status, 404);

  console.log("PASS: health, CRUD, duplicate pid and validation");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});