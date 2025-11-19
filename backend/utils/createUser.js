import { UserModel } from "../models/userModel.js";
import { v4 as uuidv4 } from 'uuid';

export default async function createUser(userId) {
    const userCollection = UserModel.getCollection();

    // Check if the user already exists
    const existingUser = await userCollection.findOne({ userID: userId });
    if (existingUser) {
        // Check if the user has already been indexed
        return true;
    } else {
        // Generate a single API key
        const accessKey = uuidv4();
        const adminAccessKey = uuidv4();

        // Create a new index entry for the user
        userCollection.insertOne({
            userID: userId,
            status: "offline",
            cors: [],
            accessKey: accessKey,
            socketId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return false;
    }
}