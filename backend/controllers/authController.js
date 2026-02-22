import { User } from "../models/User.js";
import { generateToken } from "../middleware/auth.js";
import uploadOnCloudinary, { deleteFromCloudinary } from "../config/cloudinary.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================
   GOOGLE LOGIN
========================= */
export const googleLogin = async (req, res, next) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Verify the Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have a googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar?.url) {
          user.avatar = { url: picture };
        }
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar: { url: picture },
        role: role || "student", // Dynamic role
        verified: true, // Google accounts are verified
      });
    }

    const jwtToken = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      message: "Login successful with Google",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token: jwtToken,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

/* =========================
   REGISTER
========================= */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, college, city, state } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate college field for students
    if (role === 'student' && !college) {
      return res.status(400).json({
        success: false,
        message: "College name is required for students",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || "student",
      college,
      location: {
        city,
        state,
        country: 'India' // Defaulting to India as per previous context
      }
    });

    const token = generateToken(user._id, user.tokenVersion);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verified: user.verified,
        },
        token,
      },
    });
  } catch (error) {
    next(error); // 🔥 DO NOT REMOVE
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.isBlocked || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }



    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verified: user.verified,
          status: user.status,
          avatar: user.avatar,
          hasPassword: !!user.password,
        },
        token,
      },
    });
  } catch (error) {
    next(error); // 🔥 DO NOT REMOVE
  }
};

/* =========================
   GET PROFILE
========================= */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+password') // Need password field to check existence
      .populate('savedRooms', 'title rent images location roomType availability');

    const userObj = user.toObject();
    userObj.hasPassword = !!user.password;
    delete userObj.password; // Don't send password hash

    res.json({
      success: true,
      data: { user: userObj },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, phone, bio, college } = req.body;

    console.log("--- Profile Update Start ---");
    console.log("User ID:", userId);
    console.log("Body Fields:", { name, phone, bio, college });
    console.log("File Received:", req.file ? { path: req.file.path, name: req.file.originalname } : "None");

    // 1. Fetch current user
    const user = await User.findById(userId).select("+password");
    if (!user) {
      console.error("User not found in DB:", userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("Current Avatar in DB:", user.avatar || "None");

    // 2. Explicitly update only provided text fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (college !== undefined) user.college = college;

    // 3. Handle Image Upload safely
    if (req.file) {
      console.log("Uploading new avatar to Cloudinary...");
      const result = await uploadOnCloudinary(req.file.path, "avatars");

      if (!result) {
        console.error("Cloudinary upload returned null");
        return res.status(500).json({ success: false, message: "Image upload failed" });
      }

      console.log("Cloudinary Upload Success. URL:", result.secure_url);

      // Delete old photo if it exists
      if (user.avatar?.publicId) {
        console.log("Cleaning up old Cloudinary photo:", user.avatar.publicId);
        await deleteFromCloudinary(user.avatar.publicId);
      }

      // Update avatar object
      user.avatar = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      if (user.isFirstLogin) {
        user.isFirstLogin = false;
      }
    }

    // 4. Save the user document (triggers validation and sub-doc logic)
    console.log("Final User Data before SAVE:", {
      name: user.name,
      avatar: user.avatar
    });

    await user.save();

    // 5. Build clean response object
    // Re-populate to ensure any virtuals or references are fresh
    const updatedUser = await User.findById(userId)
      .populate("savedRooms", "title rent images location")
      .select("+password");

    console.log("Update Complete. Final Avatar URL:", updatedUser.avatar?.url || "NULL");
    console.log("--- Profile Update End ---");

    const userObj = updatedUser.toObject();
    userObj.hasPassword = !!updatedUser.password;
    delete userObj.password;

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: userObj },
    });
  } catch (error) {
    console.error("CRITICAL ERROR in updateProfile:", error);
    next(error);
  }
};

/* =========================
   FINISH ONBOARDING
========================= */
export const finishOnboarding = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isFirstLogin = false;
    await user.save();
    res.json({ success: true, message: "Onboarding completed" });
  } catch (error) {
    next(error);
  }
};

/* =========================
   CHANGE PASSWORD
========================= */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (user.googleId && !user.password) {
      // First time setting password for Google user
      user.password = newPassword;
      await user.save();
      return res.json({ success: true, message: "Password set successfully" });
    }

    if (!user.password || !(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ success: false, message: "Invalid old password" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

/* =========================
   LOGOUT FROM ALL DEVICES
========================= */
export const logoutAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.tokenVersion += 1;
    await user.save();

    res.json({ success: true, message: "Logged out from all devices successfully" });
  } catch (error) {
    next(error);
  }
};

/* =========================
   UPDATE PUSH TOKEN
========================= */
export const updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { pushToken });

    res.json({ success: true, message: 'Push token updated' });
  } catch (error) {
    next(error);
  }
};

/* =========================
   DELETE ACCOUNT
========================= */
export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.deletionRequested = true;
    user.deletionRequestedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: "Account deletion request submitted. Your data will be permanently erased within 72 hours."
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   UPLOAD VERIFICATION
========================= */
export const uploadVerification = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload verification documents",
      });
    }

    const documents = [];

    for (const file of req.files) {
      const result = await uploadOnCloudinary(file.path, "verification");
      documents.push({
        type: req.body.documentType || "id_proof",
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { verificationDocuments: { $each: documents } },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Documents uploaded successfully. Awaiting admin verification.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Get Reset OTP
    const otp = user.generateResetOtp();

    await user.save({ validateBeforeSave: false });

    try {
      await sendMail(user.email, otp);

      res.status(200).json({
        success: true,
        message: `OTP sent to ${user.email}`,
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent: " + err.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res, next) => {
  try {
    const { otp, password, confirmPassword } = req.body;

    if (!otp || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide OTP and new password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Hash the OTP to compare
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with new password.",
    });
  } catch (error) {
    next(error);
  }
};
