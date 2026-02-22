import jwt from "jsonwebtoken";

const genToken = async (user) => {
    try {
        const { _id: userId, role } = user;
        const isAdmin = role === 'educator'; // Assuming educator is admin
        const token = await jwt.sign({ userId, isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return token;
    } catch (error) {
        console.log("Error in generating token:", error);
        throw error;
    }
};

export default genToken;
