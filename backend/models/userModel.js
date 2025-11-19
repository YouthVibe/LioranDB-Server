import { client } from "../config/db.js";

export const UserModel = {
    getCollection: () => {
        return client.db("liorandb").collection("users");
    }
}