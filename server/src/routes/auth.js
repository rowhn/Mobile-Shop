import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { loginSchema, passwordChangeSchema, profileSchema, registerSchema } from '../validators/schemas.js';

const router = Router();
const BCRYPT_COST = 12;
// Compared against when the email is unknown so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('nova-dummy-password', BCRYPT_COST);

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');
    const user = await User.create({
      name,
      email,
      phone: phone || '',
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      role: 'customer', // role is never taken from the request
    });
    res.status(201).json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !ok || !user.isActive) throw new HttpError(401, 'Incorrect email or password.');
    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: signToken(user), user });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.patch(
  '/me',
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { name, phone, addresses } = req.body;
    const user = req.user;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (addresses) {
      let list = addresses.map(({ id, ...a }) => (id && /^[a-f\d]{24}$/i.test(id) ? { _id: id, ...a } : a));
      // exactly one default address
      const firstDefault = list.findIndex((a) => a.isDefault);
      list = list.map((a, i) => ({ ...a, isDefault: list.length > 0 && i === (firstDefault === -1 ? 0 : firstDefault) }));
      user.addresses = list;
    }
    await user.save();
    res.json({ user });
  })
);

router.post(
  '/change-password',
  requireAuth,
  validate(passwordChangeSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash)))
      throw new HttpError(400, 'Your current password is incorrect.');
    user.passwordHash = await bcrypt.hash(req.body.newPassword, BCRYPT_COST);
    user.passwordChangedAt = new Date();
    await user.save();
    // old tokens are now invalid; hand back a fresh one so this session continues
    res.json({ token: signToken(user), user });
  })
);

export default router;
