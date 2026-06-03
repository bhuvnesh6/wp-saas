module.exports = function authMiddleware(req, res, next) {
 
    const key = req.headers["x-api-key"];
 
    if (!key || key !== process.env.MASTER_KEY) {
 
        return res.status(401).json({
            error: "Unauthorized: Invalid API key"
        });
    }
 
    next();
};