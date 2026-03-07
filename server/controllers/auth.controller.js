const fse = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const OTPS_FILE = path.join(__dirname, '..', 'data', 'otps.json');
const JWT_SECRET = 'check-secret-key-2026';

// ─── helpers ────────────────────────────────────────
async function readUsers() {
  try { return await fse.readJson(USERS_FILE); } catch { return []; }
}
async function writeUsers(users) {
  await fse.writeJson(USERS_FILE, users, { spaces: 2 });
}
async function readOtps() {
  try { return await fse.readJson(OTPS_FILE); } catch { return []; }
}
async function writeOtps(otps) {
  await fse.writeJson(OTPS_FILE, otps, { spaces: 2 });
}

function generateId() {
  return 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(user) {
  return jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

// ─── REGISTER ───────────────────────────────────────
async function register(req, res) {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    // validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'الاسم مطلوب' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'رقم التليفون مطلوب' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'كلمة المرور وتأكيدها غير متطابقتين' });
    }

    const users = await readUsers();

    // check duplicate phone
    if (users.find(u => u.phone === phone.trim())) {
      return res.status(409).json({ error: 'رقم التليفون مسجل بالفعل' });
    }
    // check duplicate email
    if (users.find(u => u.email === email.trim().toLowerCase())) {
      return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'user',
      addresses: [],
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);

    const token = signToken(newUser);
    res.status(201).json({ user: sanitizeUser(newUser), token });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
  }
}

// ─── LOGIN ──────────────────────────────────────────
async function login(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'رقم التليفون وكلمة المرور مطلوبين' });
    }

    const users = await readUsers();
    const user = users.find(u => u.phone === phone.trim());

    if (!user) {
      return res.status(401).json({ error: 'رقم التليفون أو كلمة المرور غير صحيحة' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'رقم التليفون أو كلمة المرور غير صحيحة' });
    }

    const token = signToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
}

// ─── FORGOT PASSWORD ────────────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }

    const users = await readUsers();
    const user = users.find(u => u.email === email.trim().toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'البريد الإلكتروني غير مسجل' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // store OTP
    let otps = await readOtps();
    // remove any existing OTP for this email
    otps = otps.filter(o => o.email !== email.trim().toLowerCase());
    otps.push({ email: email.trim().toLowerCase(), otp, expiresAt });
    await writeOtps(otps);

    console.log(`[AUTH] OTP generated for ${email}: ${otp}`);

    // Return OTP + userName so frontend can send email via EmailJS (browser-only)
    res.json({ message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني', otp, userName: user.name });
  } catch (err) {
    console.error('[AUTH] Forgot password error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── RESET PASSWORD ─────────────────────────────────
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    let otps = await readOtps();
    const otpRecord = otps.find(o => o.email === email.trim().toLowerCase() && o.otp === otp);

    if (!otpRecord) {
      return res.status(400).json({ error: 'كود التحقق غير صحيح' });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      // remove expired OTP
      otps = otps.filter(o => o.email !== email.trim().toLowerCase());
      await writeOtps(otps);
      return res.status(400).json({ error: 'كود التحقق منتهي الصلاحية' });
    }

    // update password
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.email === email.trim().toLowerCase());
    if (userIndex === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    users[userIndex].password = await bcrypt.hash(newPassword, 10);
    await writeUsers(users);

    // remove used OTP
    otps = otps.filter(o => o.email !== email.trim().toLowerCase());
    await writeOtps(otps);

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    console.error('[AUTH] Reset password error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── GET ALL USERS (for dashboard) ──────────────────
async function getAllUsers(_req, res) {
  try {
    const users = await readUsers();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    console.error('[AUTH] Get users error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── UPDATE USER (for dashboard) ─────────────────────
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, email, role } = req.body;

    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (name) users[index].name = name.trim();
    if (phone) users[index].phone = phone.trim();
    if (email) users[index].email = email.trim().toLowerCase();
    if (role) users[index].role = role;

    await writeUsers(users);
    res.json(sanitizeUser(users[index]));
  } catch (err) {
    console.error('[AUTH] Update user error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── DELETE USER (for dashboard) ─────────────────────
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    let users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    users = users.filter(u => u.id !== id);
    await writeUsers(users);
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (err) {
    console.error('[AUTH] Delete user error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── CHANGE PASSWORD ───────────────────────────────
async function changePassword(req, res) {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبتين' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const match = await bcrypt.compare(currentPassword, users[index].password);
    if (!match) {
      return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    users[index].password = await bcrypt.hash(newPassword, 10);
    await writeUsers(users);

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    console.error('[AUTH] Change password error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── UPDATE EMAIL ──────────────────────────────────
async function updateEmail(req, res) {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }

    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // check duplicate email
    const duplicate = users.find(u => u.email === email.trim().toLowerCase() && u.id !== id);
    if (duplicate) {
      return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }

    users[index].email = email.trim().toLowerCase();
    await writeUsers(users);

    res.json(sanitizeUser(users[index]));
  } catch (err) {
    console.error('[AUTH] Update email error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

// ─── SAVE ADDRESS ───────────────────────────────────
async function saveAddress(req, res) {
  try {
    const { id } = req.params;
    const { fullName, phone, governorate, city, address } = req.body;

    if (!fullName || !phone || !governorate || !city || !address) {
      return res.status(400).json({ error: 'جميع حقول العنوان مطلوبة' });
    }

    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (!users[index].addresses) {
      users[index].addresses = [];
    }

    const newAddress = { fullName: fullName.trim(), phone: phone.trim(), governorate, city, address: address.trim() };

    // Replace if same governorate+city exists, otherwise push
    const existingIdx = users[index].addresses.findIndex(a => a.governorate === governorate && a.city === city);
    if (existingIdx !== -1) {
      users[index].addresses[existingIdx] = newAddress;
    } else {
      users[index].addresses.push(newAddress);
    }

    await writeUsers(users);
    res.json(sanitizeUser(users[index]));
  } catch (err) {
    console.error('[AUTH] Save address error:', err.message);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}

module.exports = { register, login, forgotPassword, resetPassword, getAllUsers, updateUser, deleteUser, saveAddress, changePassword, updateEmail };
