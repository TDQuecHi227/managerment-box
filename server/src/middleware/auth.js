const jwt = require('jsonwebtoken');
const { User } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'boxchat_super_secure_jwt_secret_key_2026';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc thiếu token xác thực.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.id }).lean();

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.system_role !== 'ADMIN') {
    return res.status(403).json({ error: 'Truy cập bị từ chối. Chỉ Admin mới có quyền thực hiện thao tác này.' });
  }
  next();
}

function requireCloneMember(req, res, next) {
  next();
}

function requireDonateMember(req, res, next) {
  next();
}

module.exports = {
  authMiddleware,
  requireAdmin,
  requireCloneMember,
  requireDonateMember,
  JWT_SECRET
};

