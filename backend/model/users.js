//users.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    dept: String,
    emp_id: {
      type: String,
      unique: true
    },
    name: String,
    username: {
      type: String,
      unique: true
    },
    password: {
      type: String,
      unique: true,
      required: true
    },
    role: {
      type: String,
      enum: ['Employee', 'Admin', 'Superadmin'],
      default: 'Employee'
    }
  },
  {
    timestamps: false,
    collection: "users",
    versionKey: false
  }
);

// ✅ FIXED pre-save hook
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ✅ compare method
UserSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("users", UserSchema);
