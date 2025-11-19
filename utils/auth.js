/**
 * Extracts the authenticated user info from the request (custom OAuth 2.0)
 * @param {Object} req - Express request
 * @returns {Object} - { userId, email, name, picture }
 */
export const getAuth = async (req) => {
  try {
    return {
      userId: req.user.userId,
    };
  } catch (err) {
    console.error("Failed to get auth user:", err);
    return null;
  }
};
