const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');
const { validateCoupon, markCouponUsed } = require('../utils/coupons');

function stripId(doc) { const obj = doc.toObject ? doc.toObject() : { ...doc }; delete obj._id; return obj; }

// Resolves the user id a notification should go to: the order's stored userId,
// falling back to matching the customer's phone for legacy orders.
async function resolveRecipientId(order) {
  if (order.userId) return order.userId;
  const phone = order.customer?.phone;
  if (!phone) return null;
  const user = await User.findOne({ phone: String(phone).trim() });
  return user ? user.id : null;
}

async function getAllOrders(_req, res, next) {
  try { const orders = await Order.find({}, { __v: 0 }).sort({ date: -1 }).lean(); res.json(orders.map(stripId)); }
  catch (err) { next(err); }
}

async function getMyOrders(req, res, next) {
  try { const orders = await Order.find({ userId: req.user.id }, { __v: 0 }).sort({ date: -1 }).lean(); res.json(orders.map(stripId)); }
  catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try { const order = await Order.findOne({ id: req.params.id }, { __v: 0 }).lean(); if (!order) return res.status(404).json({ error: 'Order not found.' }); res.json(stripId(order)); }
  catch (err) { next(err); }
}

async function createOrder(req, res, next) {
  try {
    const body = req.body;
    const userId = req.user?.id || '';
    if (!body.id || !body.items?.length) return res.status(400).json({ error: 'id and items are required.' });

    // A guest order has no account behind it, so the contact details are the only
    // way to reach the buyer. `customer` is a Mixed field, hence the loose reads.
    if (!userId) {
      const firstFilled = (...values) => values.map(v => String(v || '').trim()).find(Boolean) || '';
      const name = firstFilled(body.customer?.name, body.customer?.fullName);
      const phone = firstFilled(body.customer?.phone, body.customer?.mobile);
      if (!name || !phone) return res.status(400).json({ error: 'اسم ورقم تليفون العميل مطلوبين للطلب بدون حساب.' });
    }

    const subtotal = parseFloat(body.subtotal) || 0;
    const shippingCost = parseFloat(body.shippingCost) || 0;
    const discount = parseFloat(body.discount) || 0; // product-level discount
    // The amount a coupon applies to: items total after product discounts.
    const couponBase = parseFloat(body.itemsTotal) || (subtotal - discount) || 0;
    let total = parseFloat(body.total) || (couponBase + shippingCost);

    // Re-validate the coupon server-side and apply the discount authoritatively.
    let couponCode = '';
    let couponDiscount = 0;
    if (body.couponCode) {
      const result = await validateCoupon(body.couponCode, userId, body.browserId);
      if (result.valid) {
        // Consume first (atomic, race-safe) and only apply the discount if THIS
        // request actually consumed it — prevents concurrent double-spend.
        const consumed = await markCouponUsed(body.couponCode, userId, body.browserId);
        if (consumed) {
          couponCode = String(body.couponCode).trim().toUpperCase();
          couponDiscount = Math.round(couponBase * (result.discountPercentage / 100));
          total = couponBase + shippingCost - couponDiscount;
        }
      }
    }

    const order = await Order.create({
      id: body.id,
      userId,
      customer: body.customer || {},
      items: body.items || [],
      shippingAddress: body.shippingAddress || {},
      shippingCost,
      shippingCompany: body.shippingCompany || '',
      subtotal,
      discount,
      couponCode,
      couponDiscount,
      total,
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'unpaid',
      paymentMethod: body.paymentMethod || 'cod',
      notes: body.notes || '',
      date: body.date || new Date().toISOString(),
      storeProfitTotal: parseFloat(body.storeProfitTotal) || 0,
      systemCommission: parseFloat(body.systemCommission) || 5,
    });

    // State 3: notify the customer that their order is on its way.
    if (userId) {
      await createNotification(userId, {
        type: 'order_created',
        title: 'تم استلام طلبك',
        body: 'لقد تم تسليم طلبك لشركة كــاف.. سيصلك تفاصيل طلبك فى خلال 24 ساعة',
        link: '/notifications',
      });
    }

    res.status(201).json({ message: 'Order created successfully.', order: stripId(order) });
  } catch (err) { next(err); }
}

async function updateOrder(req, res, next) {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const body = req.body;
    const prevStatus = order.status;
    if (body.shippingCompany != null) order.shippingCompany = body.shippingCompany;
    if (body.shippingCost != null) order.shippingCost = parseFloat(body.shippingCost);
    if (body.status != null) order.status = body.status;
    if (body.paymentStatus != null) order.paymentStatus = body.paymentStatus;
    if (body.paymentMethod != null) order.paymentMethod = body.paymentMethod;
    if (body.notes != null) order.notes = body.notes;
    if (body.storeProfitTotal != null) order.storeProfitTotal = parseFloat(body.storeProfitTotal);
    if (body.systemCommission != null) order.systemCommission = parseFloat(body.systemCommission);
    if (body.shippingAddress != null) order.shippingAddress = body.shippingAddress;
    await order.save();

    // State 1: when the order transitions to "shipped", notify its owner.
    if (prevStatus !== 'shipped' && order.status === 'shipped') {
      const recipientId = await resolveRecipientId(order);
      if (recipientId) {
        const company = order.shippingCompany || 'J&T';
        await createNotification(recipientId, {
          type: 'order_shipped',
          title: 'تم شحن طلبك',
          body: `تم ارسال طلبك رقم ${order.id} لشركة شحن ${company} سوف يصلك طلبك فى خلال 24 ساعه من الان`,
          link: '/notifications',
        });
      }
    }

    res.json({ message: 'Order updated successfully.', order: stripId(order) });
  } catch (err) { next(err); }
}

async function deleteOrder(req, res, next) {
  try { const result = await Order.findOneAndDelete({ id: req.params.id }); if (!result) return res.status(404).json({ error: 'Order not found.' }); res.json({ message: 'Order deleted successfully.' }); }
  catch (err) { next(err); }
}

module.exports = { getAllOrders, getMyOrders, getOrderById, createOrder, updateOrder, deleteOrder };
