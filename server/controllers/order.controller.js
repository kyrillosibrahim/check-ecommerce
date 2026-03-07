const path = require('path');
const fse = require('fs-extra');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

// ── Helpers ──

async function readOrders() {
  if (!(await fse.pathExists(ORDERS_FILE))) return [];
  return fse.readJson(ORDERS_FILE);
}

async function writeOrders(orders) {
  await fse.writeJson(ORDERS_FILE, orders, { spaces: 2 });
}

/**
 * GET /api/orders
 * List all orders (newest first)
 */
async function getAllOrders(_req, res, next) {
  try {
    const orders = await readOrders();
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
async function getOrderById(req, res, next) {
  try {
    const orders = await readOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
async function createOrder(req, res, next) {
  try {
    const body = req.body;

    if (!body.id || !body.items || !body.items.length) {
      return res.status(400).json({ error: 'id and items are required.' });
    }

    const order = {
      id: body.id,
      customer: body.customer || {},
      items: body.items || [],
      shippingAddress: body.shippingAddress || {},
      shippingCost: parseFloat(body.shippingCost) || 0,
      shippingCompany: body.shippingCompany || '',
      subtotal: parseFloat(body.subtotal) || 0,
      discount: parseFloat(body.discount) || 0,
      total: parseFloat(body.total) || 0,
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'unpaid',
      notes: body.notes || '',
      date: body.date || new Date().toISOString(),
      storeProfitTotal: parseFloat(body.storeProfitTotal) || 0,
      systemCommission: parseFloat(body.systemCommission) || 5,
    };

    const orders = await readOrders();
    orders.push(order);
    await writeOrders(orders);

    res.status(201).json({ message: 'Order created successfully.', order });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/orders/:id
 * Update an existing order (status, notes, shipping, payment, etc.)
 */
async function updateOrder(req, res, next) {
  try {
    const orders = await readOrders();
    const idx = orders.findIndex(o => o.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Merge updates
    const body = req.body;
    const existing = orders[idx];

    orders[idx] = {
      ...existing,
      shippingCompany: body.shippingCompany ?? existing.shippingCompany,
      shippingCost: body.shippingCost != null ? parseFloat(body.shippingCost) : existing.shippingCost,
      status: body.status ?? existing.status,
      paymentStatus: body.paymentStatus ?? existing.paymentStatus,
      notes: body.notes ?? existing.notes,
      storeProfitTotal: body.storeProfitTotal != null ? parseFloat(body.storeProfitTotal) : existing.storeProfitTotal,
      systemCommission: body.systemCommission != null ? parseFloat(body.systemCommission) : existing.systemCommission,
      shippingAddress: body.shippingAddress ?? existing.shippingAddress,
    };

    await writeOrders(orders);
    res.json({ message: 'Order updated successfully.', order: orders[idx] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/orders/:id
 * Delete an order by ID
 */
async function deleteOrder(req, res, next) {
  try {
    const orders = await readOrders();
    const idx = orders.findIndex(o => o.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    orders.splice(idx, 1);
    await writeOrders(orders);

    res.json({ message: 'Order deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder };
