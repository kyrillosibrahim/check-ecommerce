const Order = require('../models/Order');

async function getAllOrders(_req, res, next) {
  try { const orders = await Order.find({}, { __v: 0 }).sort({ date: -1 }); res.json(orders.map(o => { const obj = o.toObject(); delete obj._id; return obj; })); }
  catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try { const order = await Order.findOne({ id: req.params.id }, { __v: 0 }); if (!order) return res.status(404).json({ error: 'Order not found.' }); const obj = order.toObject(); delete obj._id; res.json(obj); }
  catch (err) { next(err); }
}

async function createOrder(req, res, next) {
  try {
    const body = req.body;
    if (!body.id || !body.items?.length) return res.status(400).json({ error: 'id and items are required.' });
    const order = await Order.create({ id: body.id, customer: body.customer || {}, items: body.items || [], shippingAddress: body.shippingAddress || {}, shippingCost: parseFloat(body.shippingCost) || 0, shippingCompany: body.shippingCompany || '', subtotal: parseFloat(body.subtotal) || 0, discount: parseFloat(body.discount) || 0, total: parseFloat(body.total) || 0, status: body.status || 'pending', paymentStatus: body.paymentStatus || 'unpaid', notes: body.notes || '', date: body.date || new Date().toISOString(), storeProfitTotal: parseFloat(body.storeProfitTotal) || 0, systemCommission: parseFloat(body.systemCommission) || 5 });
    const obj = order.toObject(); delete obj._id; res.status(201).json({ message: 'Order created successfully.', order: obj });
  } catch (err) { next(err); }
}

async function updateOrder(req, res, next) {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const body = req.body;
    if (body.shippingCompany != null) order.shippingCompany = body.shippingCompany;
    if (body.shippingCost != null) order.shippingCost = parseFloat(body.shippingCost);
    if (body.status != null) order.status = body.status;
    if (body.paymentStatus != null) order.paymentStatus = body.paymentStatus;
    if (body.notes != null) order.notes = body.notes;
    if (body.storeProfitTotal != null) order.storeProfitTotal = parseFloat(body.storeProfitTotal);
    if (body.systemCommission != null) order.systemCommission = parseFloat(body.systemCommission);
    if (body.shippingAddress != null) order.shippingAddress = body.shippingAddress;
    await order.save(); const obj = order.toObject(); delete obj._id; res.json({ message: 'Order updated successfully.', order: obj });
  } catch (err) { next(err); }
}

async function deleteOrder(req, res, next) {
  try { const result = await Order.findOneAndDelete({ id: req.params.id }); if (!result) return res.status(404).json({ error: 'Order not found.' }); res.json({ message: 'Order deleted successfully.' }); }
  catch (err) { next(err); }
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder };
