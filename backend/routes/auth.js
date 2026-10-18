import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';

const router = Router();

function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// Check username availability
router.get('/check-username/:username', (req, res) => {
  const { username } = req.params;
  const existing = db.getUsers().find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  res.json({ available: !existing });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, username, email, mobile, gender, dob, password } = req.body;

    if (!name || !username || !email || !mobile || !gender || !dob || !password) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    // Check unique username
    if (db.getUsers().some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Username is already taken. Please choose another.' });
    }

    // Check unique email
    if (db.getUsers().some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Email is already registered. Please sign in or use another.' });
    }

    // Check unique mobile
    if (db.getUsers().some((u) => u.mobile === cleanMobile)) {
      return res.status(400).json({ success: false, message: 'Mobile number is already registered.' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = db.createUser({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      mobile: cleanMobile,
      gender,
      dob,
      password_hash,
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to SpendWise.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error during registration.' });
  }
});

// POST /api/auth/login (Support email OR mobile number)
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email/Mobile and password.' });
    }

    const user = db.findUserByEmailOrMobile(identifier);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No user found with this email or mobile number.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { name, email, mobile, gender, dob } = req.body;

    if (!name || !email || !mobile || !gender || !dob) {
      return res.status(400).json({ success: false, message: 'All profile fields are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    // Check email uniqueness if modified
    const otherEmailUser = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail && u.id !== currentUserId);
    if (otherEmailUser) {
      return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
    }

    // Check mobile uniqueness if modified
    const otherMobileUser = db.getUsers().find((u) => u.mobile === cleanMobile && u.id !== currentUserId);
    if (otherMobileUser) {
      return res.status(400).json({ success: false, message: 'This mobile number is already in use by another account.' });
    }

    const updated = db.updateUser(currentUserId, {
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      gender,
      dob,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: sanitizeUser(updated),
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error while updating profile.' });
  }
});

export default router;
