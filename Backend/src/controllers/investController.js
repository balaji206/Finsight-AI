import * as investService from '../services/investService.js';
import fundsDatabase from '../data/fundDatabase.js';

export const submitRiskAssessment = (req, res) => {
    try {
        const answers = req.body;
        
        if (!answers) {
            return res.status(400).json({ error: 'Answers are required.' });
        }

        const { score, profile } = investService.calculateRiskProfile(answers);
        const suggestedAllocation = investService.getBaseAllocation(profile);
        const recommendedFunds = investService.getRecommendations(profile, suggestedAllocation);

        return res.status(200).json({
            score,
            riskProfile: profile,
            suggestedAllocation,
            recommendedFunds
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while calculating risk assessment.' });
    }
};

export const getFunds = (req, res) => {
    try {
        res.status(200).json(fundsDatabase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while fetching funds database.' });
    }
};
