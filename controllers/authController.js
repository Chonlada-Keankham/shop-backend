const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// -------------------------------------------------------------------
// REGISTER
// -------------------------------------------------------------------
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    const checkUserQuery = "SELECT * FROM users WHERE email = ?";

    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserQuery = `
        INSERT INTO users (name, email, password, phone, address, role)
        VALUES (?, ?, ?, ?, ?, 'customer')
      `;

      db.query(
        insertUserQuery,
        [name, email, hashedPassword, phone || null, address || null],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Registered as customer successfully",
            userId: result.insertId,
          });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// -------------------------------------------------------------------
// LOGIN
// -------------------------------------------------------------------
const login = (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const findUserQuery = "SELECT * FROM users WHERE email = ?";

    db.query(findUserQuery, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};