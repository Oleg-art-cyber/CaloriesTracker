const { getAdviceForUser } = require('../utils/adviceEngine');

exports.getAdvice = (req, res) => {
    try {
        const { profile, diary } = req.body;
        if (!profile || !diary) {
            return res.status(400).json({ error: 'Missing profile or diary data' });
        }
        const adviceList = getAdviceForUser(profile, diary);
        res.json(adviceList);
    } catch (err) {
        console.error('Advice error:', err);
        res.status(500).json({ error: 'Failed to generate advice' });
    }
}; 