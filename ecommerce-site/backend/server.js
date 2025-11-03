const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eshop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Order Model
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Completed', 'Declined', 'Cancelled'], 
    default: 'Pending' 
  },
  shippingAddress: {
    name: String,
    email: String,
    phone: String,
    address: String,
    state: String,
    pincode: String,
    landmark: String
  },
  paymentMethod: String,
  paymentDetails: {
    upiId: String,
    cardName: String,
    cardLast4: String,
    cardExpiry: String
  },
  estimatedDelivery: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('Register attempt:', { name, email });

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user already exists (use normalized email)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('Registration blocked — user exists:', normalizedEmail);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role: make first user admin
    const usersCount = await User.countDocuments();
    const role = usersCount === 0 ? 'admin' : 'user';

    // Create new user
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    await user.save();

    // Return created user (safe subset)
    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order Routes
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, shippingAddress, paymentMethod, paymentDetails } = req.body;

    // Sanitize items: remove any _id fields and normalize quantity naming
    const cleanedItems = (items || []).map(i => ({
      name: i.name,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity || i.qty || 1) || 1,
      image: i.image || ''
    }));

    // Basic validation
    if (!cleanedItems.length) {
      return res.status(400).json({ message: 'No items provided' });
    }
    if (!total || isNaN(Number(total))) {
      return res.status(400).json({ message: 'Invalid total' });
    }

    // Sanitize paymentDetails
    let safePaymentDetails = undefined;
    if (paymentMethod === 'upi') {
      const upiId = (paymentDetails && paymentDetails.upiId || '').trim();
      safePaymentDetails = upiId ? { upiId } : undefined;
    } else if (paymentMethod === 'card') {
      const name = (paymentDetails && paymentDetails.cardName || '').trim();
      const number = String(paymentDetails && paymentDetails.cardNumber || '').replace(/\s+/g,'');
      const last4 = number.slice(-4);
      const expiry = (paymentDetails && paymentDetails.cardExpiry || '').trim();
      safePaymentDetails = last4 ? { cardName: name, cardLast4: last4, cardExpiry: expiry } : undefined;
    }

    const order = new Order({
      userId: req.user._id,
      items: cleanedItems,
      total: Number(total),
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || '',
      paymentDetails: safePaymentDetails,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    await order.save();
    return res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// User: cancel own order (allowed when Pending or Processing)
app.put('/api/orders/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order with status '${order.status}'` });
    }

    order.status = 'Cancelled';
    await order.save();
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

// Profile Routes
app.put('/api/profile/update', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DEBUG: Return all users (development only)
app.get('/api/debug/users', async (req, res) => {
  try {
    // Return safe subset (no passwords)
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (err) {
    console.error('Debug users error:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Admin: list all orders
app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ orders });
  } catch (err) {
    console.error('Admin list orders error:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Admin: update order status (Pending, Processing, Completed, Declined)
app.put('/api/admin/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending','Processing','Completed','Declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Admin update order error:', err);
    res.status(500).json({ message: 'Error updating order' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
