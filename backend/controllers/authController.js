const { response } = require("../utils/response");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Account = require("../models/Account");

exports.register = async (req, res) => {

  const { name, email, address, password, phone, accountName, accountType, accountAddress, accountPhone, token } = req.body;

  try {
    let accountId;
    let role = 'admin';

    if (token) {
      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.email || !decoded.accountId) {
        return res.status(400).json(response(400, 'error', null, 'Invalid or expired invite token'));
      }

      // Match email
      if (decoded.email !== email) {
        return res.status(400).json(response(400, 'error', null, 'Email does not match invite'));
      }

      // Confirm invite exists
      const invite = await Invite.findOne({ email, accountId: decoded.accountId, token, status: 'pending' });
      if (!invite) {
        return res.status(400).json(response(400, 'error', null, 'Invalid or expired invite'));
      }

      accountId = decoded.accountId;
      role = 'staff';

      // Mark invite as accepted
      invite.status = 'accepted';
      await invite.save();
    } else {

      // Normal registration (admin)
      let newAccount;
      if (accountType === 'individual') {
        newAccount = new Account({ name: `${name}'s Company`, type: accountType, address: address, phone, });
      } else if (accountType === 'company') {
        newAccount = new Account({ name: accountName, type: accountType, address: accountAddress, phone: accountPhone });
      }
      await newAccount.save();
      accountId = newAccount._id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      address,
      passwordHash,
      phone,
      accountId,
      role
    });

    await user.save();

    const tokenPayload = {
      id: user._id,
      accountId: user.accountId,
      name: user.name,
      role: user.role,
      email: user.email
    };

    const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '6h' });

    return res.status(201).json(response(201, 'success', { token: jwtToken, user: tokenPayload }, 'User registered successfully'));
  } catch (err) {
    console.error(err);
    return res.status(500).json(response(500, 'error', null, 'Internal server error'));
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json(response(400, "error", null, "All fields are required"));
    }

    const user = await User.findOne({ email }).populate("accountId");
    if (!user) {
      return res.status(400).json(response(400, "error", null, "Invalid email or password"));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json(response(400, "error", null, "Invalid email or password"));
    }

    const tokenPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountId: user.accountId._id,
      accountType: user.accountId.type,
      accountName: user.accountId.name
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "6h" });

    const userResponse = {
      name: user.name,
      email: user.email,
      role: user.role,
      accountId: user.accountId._id,
      accountType: user.accountId.type,
      accountName: user.accountId.name
    };

    return res.status(200).json(response(200, "success", { token, user: userResponse }, "User logged in successfully"));

  } catch (err) {
    console.error(err);
    return res.status(500).json(response(500, "error", null, "Internal server error"));
  }
};


// POST /auth/invite
exports.inviteUser = async (req, res) => {
  const { email } = req.body;
  const accountId = req.user.accountId;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(response(400, 'error', null, 'User already exists'));
    }

    // Generate token
    const token = jwt.sign({ email, accountId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Save invite
    const invite = new Invite({ email, accountId, token });
    await invite.save();

    // Normally you'd email the token URL to the user
    const inviteUrl = `https://yourfrontend.com/register?token=${token}`;

    return res.status(200).json(response(200, 'success', { inviteUrl }, 'Invite sent successfully'));
  } catch (err) {
    console.error(err);
    return res.status(500).json(response(500, 'error', null, 'Internal server error'));
  }
};
