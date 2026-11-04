const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, logAudit } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    const user = await User.findOne({ username: username.trim() }).lean();

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa hoặc không hoạt động.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (user.system_role !== 'ADMIN') {
      return res.status(403).json({ error: 'Trang web này chỉ dành riêng cho Quản trị viên (Admin) quản lý box.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.system_role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(user.id, 'LOGIN', 'USER', user.id, { username: user.username });

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        game_name: user.game_name,
        system_role: user.system_role,
        status: user.status,
        contribution_type: user.contribution_type,
        joined_date: user.joined_date
      }
    });
  } catch (err) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ nội bộ.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { display_name, game_name, current_password, new_password } = req.body;
    const userId = req.user.id;

    const updateFields = {};
    if (display_name) updateFields.display_name = display_name.trim();
    if (game_name !== undefined) updateFields.game_name = game_name.trim();

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' });
      }
      const cur = await User.findOne({ id: userId });
      if (!bcrypt.compareSync(current_password, cur.password_hash)) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
      }
      const salt = bcrypt.genSaltSync(10);
      updateFields.password_hash = bcrypt.hashSync(new_password, salt);
    }

    updateFields.updated_at = new Date();
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    ).lean();

    res.json({ message: 'Cập nhật hồ sơ thành công', user: updatedUser });
  } catch (err) {
    console.error('Error in /api/auth/profile:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ nội bộ.' });
  }
});

module.exports = router;
