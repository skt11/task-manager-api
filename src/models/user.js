const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number!')
            }
        }
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) throw new Error('Not a valid email!');
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value) {
            if (value.includes('password')) {
                throw new Error('Password can not contain the string "password"');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.methods.getAuthenticationToken = async function () {
    const user = await User.findOne({ email: this.email });
    if (user) throw new Error('Email already registered!');
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
    this.tokens.push({ token });
    this.save();
    return token;
}

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.tokens;
    return user;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error('Invalid credentials');
    }

    return user;
}

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//Hash the password with 'pre' middleware
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
});

userSchema.pre('remove', async function (next) {
    await Task.deleteMany({ owner: this._id });
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;