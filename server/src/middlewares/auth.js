//server/src/middlewares/auth.js
// JWT / Role authorization middleware
// Usage: router.post('/route', auth(['admin']), handler);

const jwt = require('jsonwebtoken');
const SECRET = 'supersecret'; // TODO: move to .env

module.exports = (roles = []) => (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token)
        return res.status(401).json({ error: 'No token provided' });

    try {
        const payload = jwt.verify(token, SECRET); // { id, role, iat, exp }

        // If a roles array is supplied, check that the user’s role is allowed
        if (roles.length && !roles.includes(payload.role))
            return res.status(403).json({ error: 'Forbidden' });

        req.user = payload; // attach user payload to the request object
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
