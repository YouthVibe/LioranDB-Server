import express from "express";
import { UserModel } from "../models/userModel.js";
import { getAuth } from "../utils/auth.js";
import { io } from '../server.js'
import createUser from "../utils/createUser.js";
import { oauth2Auth } from '../middleware/oauth2Auth.js';

const router = express.Router();
const userCollection = UserModel.getCollection();

/* ============================================================
   NEW ROUTE: GET USER DETAILS
   → Called by LioranDB after Google OAuth
   Returns: { userId, accessKey }
============================================================ */
router.get('/getUser', oauth2Auth, async (req, res) => {
    try {
        const { userId } = await getAuth(req);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await createUser(userId);

        // const collection = UserModel.getCollection();
        const user = await userCollection.findOne({ userID: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // IF accessKey not present, generate one
        if (!user.accessKey) {
            const newKey = crypto.randomBytes(20).toString("hex");
            await userCollection.updateOne(
                { userID: userId },
                { $set: { accessKey: newKey } }
            );
            user.accessKey = newKey;
        }

        return res.status(200).json({
            userId: user.userID,
            accessKey: user.accessKey
        });
    }
    catch (error) {
        console.error("Error in /getUser:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/* ============================================================
   NEW ROUTE: VERIFY ACCESS KEY
   → Called by LioranDB on startup
============================================================ */
router.get('/verifyKey/:key', async (req, res) => {
    try {
        const accessKey = req.params.key;

        // const collection = UserModel.getCollection();
        const user = await userCollection.findOne({ accessKey });

        if (!user) {
            return res.status(200).json({ valid: false });
        }

        return res.status(200).json({
            valid: true,
            userId: user.userID
        });
    }
    catch (error) {
        console.error("Error in verifyKey:", error);
        res.status(500).json({ valid: false });
    }
});

router.put('/socketId', async (req, res) => {
    try {
        const { socketId, accessKey } = req.body;

        // const userCollection = UserModel.getCollection();
        const user = await userCollection.findOne({ accessKey });
        const userId = user.userID;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await createUser(userId); // Create user if they don't exist no

        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }

        await userCollection.updateOne(
            { userID: userId },
            { $set: { socketId: socketId, status: "online" } }
        );
        res.status(200).json({ message: "SocketId updated successfully" });
    }
    catch (error) {
        console.error("Error getting socketId:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;