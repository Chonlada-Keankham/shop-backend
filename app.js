const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const productRoutes = require('./routes/productRoutes');

// ยังไม่เปิดใช้ชั่วคราว เพราะยังไม่ได้แปลงจาก MySQL -> PostgreSQL ให้ครบ
// const authRoutes = require('./routes/authRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const cartItemRoutes = require('./routes/cartItemRoutes');
// const orderRoutes = require("./routes/orderRouter");
// const orderItemRoutes = require("./routes/orderItemRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running...');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 + 1 AS result');
    res.json({
      message: 'Database connected successfully',
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เปิดใช้เฉพาะ route ที่แปลงเป็น PostgreSQL แล้ว
app.use('/api/products', productRoutes);

// ยังไม่เปิดใช้ชั่วคราว
// app.use('/api/auth', authRoutes);
// app.use('/api/carts', cartRoutes);
// app.use('/api/cart-items', cartItemRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/order-items", orderItemRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});