const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const User = require('../models/User');
const Otp = require('../models/Otp');
const JWT_SECRET = process.env.JWT_SECRET || 'check-secret-key-2026';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendWelcomeEmail(name, email) {
  if (!resend) return;
  const firstName = name.split(' ')[0];
  resend.emails.send({
    from: 'Kaf Store <onboarding@resend.dev>',
    to: email,
    subject: `أهلاً بك في Kaf يا ${firstName}! 🎉`,
    html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;padding:24px;background:#f0f2f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1d4ed8,#0369a1);padding:32px 28px;text-align:center;color:#fff;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h1 style="margin:0;font-size:24px;font-weight:700;">أهلاً وسهلاً يا ${firstName}!</h1>
      <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">نورت متجر Kaf</p>
    </div>
    <div style="padding:28px;color:#374151;line-height:1.8;">
      <p style="font-size:15px;margin:0 0 16px;">يسعدنا انضمامك لعائلة <strong style="color:#1d4ed8;">Kaf</strong>! حسابك جاهز دلوقتي وتقدر تبدأ التسوق فوراً.</p>
      <div style="background:#eff6ff;border-right:4px solid #1d4ed8;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#1e40af;">🛍️ اكتشف آلاف المنتجات بأفضل الأسعار</p>
        <p style="margin:8px 0 0;font-size:14px;color:#1e40af;">🚚 توصيل لجميع محافظات مصر</p>
        <p style="margin:8px 0 0;font-size:14px;color:#1e40af;">💳 دفع آمن وسريع</p>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:20px 0 0;">لو عندك أي استفسار، تواصل معنا في أي وقت.</p>
    </div>
    <div style="background:#f9fafb;padding:14px 24px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
      Kaf Store &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; رسالة آلية — لا ترد عليها
    </div>
  </div>
</div>`,
  }).catch(err => console.warn('[welcome-email] failed:', err?.message));
}

function generateId() { return 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function signToken(user) { return jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }
function sanitizeUser(user) { const obj = user.toObject ? user.toObject() : { ...user }; delete obj.password; delete obj._id; delete obj.__v; return obj; }

async function register(req, res) {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    if (!phone?.trim()) return res.status(400).json({ error: 'رقم التليفون مطلوب' });
    if (!email?.trim()) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'كلمة المرور وتأكيدها غير متطابقتين' });
    if (await User.findOne({ phone: phone.trim() })) return res.status(409).json({ error: 'رقم التليفون مسجل بالفعل' });
    if (await User.findOne({ email: email.trim().toLowerCase() })) return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    const newUser = await User.create({ id: generateId(), name: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase(), password: await bcrypt.hash(password, 10), role: 'user', addresses: [], createdAt: new Date().toISOString() });
    res.status(201).json({ user: sanitizeUser(newUser), token: signToken(newUser) });
    sendWelcomeEmail(name.trim(), email.trim().toLowerCase());
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
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'البريد الإلكتروني غير مسجل' });
    const otp = generateOtp();
    await Otp.findOneAndUpdate({ email: email.trim().toLowerCase() }, { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }, { upsert: true });
    console.log('[AUTH] OTP for ' + email + ': ' + otp);
    res.json({ message: 'تم إرسال كود التحقق', otp, userName: user.name });
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    const otpRecord = await Otp.findOne({ email: email.trim().toLowerCase(), otp });
    if (!otpRecord) return res.status(400).json({ error: 'كود التحقق غير صحيح' });
    if (new Date(otpRecord.expiresAt) < new Date()) { await Otp.deleteOne({ email: email.trim().toLowerCase() }); return res.status(400).json({ error: 'كود التحقق منتهي الصلاحية' }); }
    await User.findOneAndUpdate({ email: email.trim().toLowerCase() }, { password: await bcrypt.hash(newPassword, 10) });
    await Otp.deleteOne({ email: email.trim().toLowerCase() });
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function getAllUsers(_req, res) {
  try { const users = await User.find({}, { password: 0, __v: 0 }); res.json(users.map(u => { const o = u.toObject(); delete o._id; return o; })); }
  catch (err) { res.status(500).json({ error: 'حدث خطأ' }); }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params; const { name, phone, email, role } = req.body;
    const update = {};
    if (name) update.name = name.trim(); if (phone) update.phone = phone.trim(); if (email) update.email = email.trim().toLowerCase(); if (role) update.role = role;
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

async function updateEmail(req, res) {
  try {
    const { id } = req.params; const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    if (await User.findOne({ email: email.trim().toLowerCase(), id: { $ne: id } })) return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    const user = await User.findOneAndUpdate({ id }, { email: email.trim().toLowerCase() }, { new: true, projection: { password: 0, __v: 0 } });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const obj = user.toObject(); delete obj._id; res.json(obj);
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

module.exports = { register, login, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, saveAddress, changePassword, updateEmail };
