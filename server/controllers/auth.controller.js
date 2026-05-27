const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const JWT_SECRET = process.env.JWT_SECRET || 'check-secret-key-2026';

function generateId() { return 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function signToken(user) { return jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }
function sanitizeUser(user) { const obj = user.toObject ? user.toObject() : { ...user }; delete obj.password; delete obj._id; delete obj.__v; return obj; }

async function register(req, res) {
  try {
    const { name, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    if (!phone?.trim()) return res.status(400).json({ error: 'رقم التليفون مطلوب' });
    const password = req.body.password?.trim() || phone.trim();
    const confirmPassword = req.body.confirmPassword?.trim() || password;
    if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'كلمة المرور وتأكيدها غير متطابقتين' });
    if (await User.findOne({ phone: phone.trim() })) return res.status(409).json({ error: 'رقم التليفون مسجل بالفعل' });
    const newUser = await User.create({ id: generateId(), name: name.trim(), phone: phone.trim(), password: await bcrypt.hash(password, 10), role: 'user', addresses: [], createdAt: new Date().toISOString() });
    res.status(201).json({ user: sanitizeUser(newUser), token: signToken(newUser) });
  } catch (err) { console.error('[AUTH] Register error:', err.message); res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' }); }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'رقم التليفون وكلمة المرور مطلوبين' });
    const user = await User.findOne({ phone: phone.trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'رقم التليفون أو كلمة المرور غير صحيحة' });
    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (err) { res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' }); }
}

async function forgotPassword(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'رقم التليفون مطلوب' });
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) return res.status(404).json({ error: 'رقم التليفون غير مسجل' });
    const otp = generateOtp();
    await Otp.findOneAndUpdate({ phone: phone.trim() }, { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }, { upsert: true });
    res.json({ message: 'تم إنشاء كود التحقق', otp, userName: user.name });
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function resetPassword(req, res) {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    const otpRecord = await Otp.findOne({ phone: phone.trim(), otp });
    if (!otpRecord) return res.status(400).json({ error: 'كود التحقق غير صحيح' });
    if (new Date(otpRecord.expiresAt) < new Date()) { await Otp.deleteOne({ phone: phone.trim() }); return res.status(400).json({ error: 'كود التحقق منتهي الصلاحية' }); }
    await User.findOneAndUpdate({ phone: phone.trim() }, { password: await bcrypt.hash(newPassword, 10) });
    await Otp.deleteOne({ phone: phone.trim() });
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function getAllUsers(_req, res) {
  try { const users = await User.find({}, { password: 0, __v: 0 }); res.json(users.map(u => { const o = u.toObject(); delete o._id; return o; })); }
  catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params; const { name, phone, role } = req.body;
    const update = {};
    if (name) update.name = name.trim(); if (phone) update.phone = phone.trim(); if (role) update.role = role;
    const user = await User.findOneAndUpdate({ id }, update, { new: true, projection: { password: 0, __v: 0 } });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const obj = user.toObject(); delete obj._id; res.json(obj);
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function deleteUser(req, res) {
  try { const result = await User.findOneAndDelete({ id: req.params.id }); if (!result) return res.status(404).json({ error: 'المستخدم غير موجود' }); res.json({ message: 'تم حذف المستخدم بنجاح' }); }
  catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function changePassword(req, res) {
  try {
    const { id } = req.params; const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبتين' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    user.password = await bcrypt.hash(newPassword, 10); await user.save();
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function saveAddress(req, res) {
  try {
    const { id } = req.params; const { fullName, phone, governorate, city, address } = req.body;
    if (!fullName || !phone || !governorate || !city || !address) return res.status(400).json({ error: 'جميع حقول العنوان مطلوبة' });
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const newAddr = { fullName: fullName.trim(), phone: phone.trim(), governorate, city, address: address.trim() };
    const idx = user.addresses.findIndex(a => a.governorate === governorate && a.city === city);
    if (idx !== -1) user.addresses[idx] = newAddr; else user.addresses.push(newAddr);
    await user.save(); const obj = user.toObject(); delete obj._id; delete obj.password; delete obj.__v; res.json(obj);
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

module.exports = { register, login, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, saveAddress, changePassword };
