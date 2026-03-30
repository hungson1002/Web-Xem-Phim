import jwt from 'jsonwebtoken';
import Auth from '../models/Auth.model.js';

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.authId = decoded.id || decoded._id || decoded.userId || decoded.authID;

        if (!req.authId) {
            return res.status(403).json({ success: false, message: "Token malformed: Missing ID" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}

export const isAdmin = async (req, res, next) => {
    try {
        const user = await Auth.findById(req.authId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
}