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
      phone: user.phone,
      accountId: user.accountId._id,
      accountType: user.accountId.type,
      accountName: user.accountId.name
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "6h" });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,

      accountId: user.accountId._id,
      accountType: user.accountId.type,
      accountName: user.accountId.name,
      accountPhone: user.accountId.phone,
      accountAddress: user.accountId.address,
      accountLogo: user.accountId.logo,
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


exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user's ID
    const { currentPassword, newPassword, confirmNewPassword } = req.body;


    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ status: 'error', message: 'New passwords do not match.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }


    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Current password is incorrect.' });
    }


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.passwordHash = hashedPassword;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ status: 'error', message: 'Server error. Please try again later.' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required.' });
    }

    // Optional: validate email format or uniqueness here if needed
    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res.status(400).json({ status: 'error', message: 'Email is already taken.' });
    }


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ status: 'error', message: 'Server error. Please try again later.' });
  }
};

exports.updateAccountDetails = async (req, res) => {
  try {
    const user = req.user; // Authenticated user
    const { name, email, address, phone, logo } = req.body;

    const account = await Account.findById(user.accountId);
    if (!account) {
      return res.status(404).json({ status: 'error', message: 'Account not found' });
    }

    account.name = name || account.name;
    account.email = email || account.email;
    account.address = address || account.address;
    account.phone = phone || account.phone;

    if (logo && logo.startsWith('data:image')) {
      // Extract base64 string only
      const base64Data = logo.split(',')[1];

      // Decode base64 to check size in bytes
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const imageSizeInBytes = imageBuffer.length;

      if (imageSizeInBytes > 512000) {
        return res.status(400).json({ status: 'error', message: 'Logo must be smaller than 500KB' });
      }

      account.logo = logo;
    }

    await account.save();

    res.status(200).json({ status: 'success', message: 'Account updated successfully', data: account });
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
