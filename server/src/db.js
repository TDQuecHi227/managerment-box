const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://longcuqn123_db_user:227985@vigo-db.cwdpj8e.mongodb.net/managerment-box';

// =========================================================================
// MONGOOSE SCHEMAS & MODELS
// =========================================================================

// Counter schema for atomic integer IDs (100% compatible with frontend)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequence(name) {
  const ret = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return ret.seq;
}

// User schema
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  username: { type: String, trim: true, default: null },
  password_hash: { type: String, default: null },
  display_name: { type: String, required: true, trim: true },
  game_name: { type: String, trim: true, default: null },
  system_role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'LEFT'], default: 'ACTIVE' },
  contribution_type: { type: String, enum: ['CLONE', 'DONATE', null], default: 'CLONE' },
  joined_date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// KPI Period schema (Week KPI: 3 clone/ngày, 21 clone/tuần)
const kpiPeriodSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  code: { type: String, required: true, unique: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  target_value: { type: Number, default: 21 },
  daily_target: { type: Number, default: 3 },
  is_closed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});
const KpiPeriod = mongoose.model('KpiPeriod', kpiPeriodSchema);

// Clone List schema (Quản lý các List Clone của từng thành viên)
const cloneListSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, index: true },
  account_name: { type: String, required: true, trim: true },
  total_count: { type: Number, default: 0 },
  raw_note: { type: String, default: '' },
  arena_status: { type: String, enum: ['NOT_CLIMBED', 'CLIMBED'], default: 'NOT_CLIMBED' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const CloneList = mongoose.model('CloneList', cloneListSchema);

// Clone Submission schema (Từng lượt nộp clone theo ngày, tính vào KPI ngày & tuần)
const cloneSubmissionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, index: true },
  list_id: { type: Number, index: true, default: null },
  period_id: { type: Number, required: true, index: true },
  declared_count: { type: Number, required: true },
  approved_count: { type: Number, default: 0 },
  raw_note: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'], default: 'APPROVED' },
  reject_reason: { type: String, default: null },
  reviewed_by: { type: Number, default: null },
  reviewed_at: { type: Date, default: null },
  arena_status: { type: String, enum: ['NOT_CLIMBED', 'CLIMBED'], default: 'NOT_CLIMBED' },
  account_prefix: { type: String, default: null },
  account_from_num: { type: Number, default: null },
  account_to_num: { type: Number, default: null },
  account_password: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});
const CloneSubmission = mongoose.model('CloneSubmission', cloneSubmissionSchema);

// Donation Submission schema
const donationSubmissionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, index: true },
  amount: { type: Number, required: true },
  proof_image_path: { type: String, default: null },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
  reject_reason: { type: String, default: null },
  reviewed_by: { type: Number, default: null },
  reviewed_at: { type: Date, default: null },
  note: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});
const DonationSubmission = mongoose.model('DonationSubmission', donationSubmissionSchema);

// Donation Recipient schema
const donationRecipientSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, index: true },
  month: { type: String, required: true, index: true },
  is_active: { type: Boolean, default: true },
  assigned_by: { type: Number, default: null },
  created_at: { type: Date, default: Date.now }
});
const DonationRecipient = mongoose.model('DonationRecipient', donationRecipientSchema);

// Violation Action schema
const violationActionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, index: true },
  period_id: { type: Number, required: true, index: true },
  action_type: { type: String, enum: ['REMINDER', 'WARNING', 'INACTIVE_PENALTY', 'NOTE'], default: 'REMINDER' },
  note: { type: String, default: '' },
  decided_by: { type: Number, default: null },
  created_at: { type: Date, default: Date.now }
});
const ViolationAction = mongoose.model('ViolationAction', violationActionSchema);

// Arena Distribution schema (Phát lì xì clone theo ngày)
const arenaDistributionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  distribution_date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
  list_id: { type: Number, default: null, index: true },
  account_name: { type: String, default: '' },
  count: { type: Number, required: true, default: 1 }, // Số lượng acc phát lì xì
  note: { type: String, required: true }, // Ghi chú danh sách acc / pass phát lì xì
  created_by: { type: Number, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const ArenaDistribution = mongoose.model('ArenaDistribution', arenaDistributionSchema);

// System Settings schema
const systemSettingsSchema = new mongoose.Schema({
  id: { type: Number, default: 1, unique: true },
  bank_name: { type: String, default: 'MB Bank (Quân Đội)' },
  bank_account_number: { type: String, default: '999988887777' },
  bank_account_holder: { type: String, default: 'NGUYEN VAN ADMIN' },
  qr_code_note: { type: String, default: 'DONATE BOX CHAT' }
});
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

// Audit Log schema
const auditLogSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  actor_id: { type: Number },
  action: { type: String, required: true },
  target_type: { type: String },
  target_id: { type: mongoose.Schema.Types.Mixed },
  details_json: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

function getCurrentMonthString() {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getTodayString() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0];
}

function getTodayRangeUTC7(dateStr = null) {
  const targetDateStr = dateStr || getTodayString();
  const start = new Date(`${targetDateStr}T00:00:00+07:00`);
  const end = new Date(`${targetDateStr}T23:59:59.999+07:00`);
  return { targetDateStr, start, end };
}

function getMonthRangeUTC7(monthStr = null) {
  const targetMonth = monthStr || getCurrentMonthString();
  const [yearStr, mStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(mStr, 10);

  const start = new Date(`${targetMonth}-01T00:00:00+07:00`);
  const nextMonthYear = m === 12 ? year + 1 : year;
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextMonthStr = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}`;
  const end = new Date(new Date(`${nextMonthStr}-01T00:00:00+07:00`).getTime() - 1);

  return { targetMonth, start, end };
}

// Lấy hoặc tạo tự động kỳ tuần KPI (mỗi tuần 21 acc, 3 acc/ngày)
async function getOrCreateCurrentPeriod(dateOrStr = null) {
  let now;
  if (dateOrStr) {
    if (typeof dateOrStr === 'string' && !dateOrStr.includes('T')) {
      now = new Date(`${dateOrStr}T12:00:00+07:00`);
    } else {
      now = new Date(dateOrStr);
    }
  } else {
    now = new Date(Date.now() + 7 * 3600 * 1000);
  }
  const dayOfWeek = now.getUTCDay(); // 0: CN, 1: T2, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const startStr = monday.toISOString().split('T')[0];
  const endStr = sunday.toISOString().split('T')[0];

  // Tính số tuần ISO
  const jan4 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 4));
  const weekNum = Math.ceil(((monday - jan4) / 86400000 + jan4.getUTCDay() + 1) / 7);
  const weekCode = `${monday.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  let period = await KpiPeriod.findOne({ code: weekCode });
  if (!period) {
    const nextId = await getNextSequence('kpi_periods');
    period = await KpiPeriod.create({
      id: nextId,
      code: weekCode,
      start_date: startStr,
      end_date: endStr,
      target_value: 21,
      daily_target: 3,
      is_closed: false
    });
  }

  return period;
}

// Log audit helper
async function logAudit(actorId, action, targetType, targetId, details = {}) {
  try {
    const nextId = await getNextSequence('audit_logs');
    await AuditLog.create({
      id: nextId,
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: String(targetId),
      details_json: details
    });
  } catch (err) {
    console.error('Failed to log audit in MongoDB:', err.message);
  }
}

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const uri = process.env.MONGODB_URI || MONGODB_URI;
  await mongoose.connect(uri);
  const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
  console.log('MongoDB Atlas connected successfully at:', maskedUri);

  // Initialize System Settings if not exists
  const settingsCount = await SystemSettings.countDocuments();
  if (settingsCount === 0) {
    await SystemSettings.create({
      id: 1,
      bank_name: 'MB Bank (Quân Đội)',
      bank_account_number: '999988887777',
      bank_account_holder: 'NGUYEN VAN ADMIN',
      qr_code_note: 'DONATE BOX CHAT'
    });
  }

  // Ensure username index is partial so members without username (null) do not collide
  try {
    await mongoose.connection.db.collection('users').dropIndex('username_1');
  } catch (err) {
    // Index may not exist yet or already dropped
  }
  try {
    await mongoose.connection.db.collection('users').createIndex(
      { username: 1 },
      { unique: true, partialFilterExpression: { username: { $type: 'string' } } }
    );
  } catch (err) {
    // Ignore if already matching
  }

  // Ensure default Admin user exists if database has 0 users (so Admin can log in)
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Initializing Admin account on MongoDB Atlas (admin / admin123)...');
    const salt = bcrypt.genSaltSync(10);
    const adminId = await getNextSequence('users');
    await User.create({
      id: adminId,
      username: 'admin',
      password_hash: bcrypt.hashSync('admin123', salt),
      display_name: 'Admin Trưởng Box',
      game_name: 'AdminLord',
      system_role: 'ADMIN',
      status: 'ACTIVE',
      contribution_type: null
    });
    console.log('Default Admin account ready.');
  }
}

module.exports = {
  mongoose,
  connectDB,
  User,
  KpiPeriod,
  CloneList,
  CloneSubmission,
  DonationSubmission,
  DonationRecipient,
  ViolationAction,
  ArenaDistribution,
  SystemSettings,
  AuditLog,
  Counter,
  getNextSequence,
  getCurrentMonthString,
  getTodayString,
  getTodayRangeUTC7,
  getMonthRangeUTC7,
  getOrCreateCurrentPeriod,
  logAudit
};
