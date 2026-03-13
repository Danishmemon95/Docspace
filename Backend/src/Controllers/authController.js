import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../Utils/generateToken.js";

const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Please fill all the fields" });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists." })
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                }
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in sign up", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const login = async (req, res) => {

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }

        const isPassword = await bcrypt.compare(password, user.password)

        if (!isPassword) {
            return res.status(400).json({ success: false, message: "Invalid Password" });
        }

        generateToken(user._id, res);

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
            }
        });

    } catch (error) {
        console.log("Error in login", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const checkAuth = (req, res) => {
    try {
        res.status(200).json({ success: true, message: "Authenticated", user: req.user });
    } catch (error) {
        console.log("Error in check auth", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export { signup, login, logout, checkAuth };
