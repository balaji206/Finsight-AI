import fundsDatabase from '../data/fundDatabase.js';

export const calculateRiskProfile = (answers) => {
    let score = 0;
    const values = Object.values(answers).map(Number);
    score = values.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : curr), 0);

    let profile = '';
    if (score < 12) {
        profile = 'Conservative';
    } else if (score < 17) {
        profile = 'Moderate';
    } else {
        profile = 'Aggressive';
    }

    return { score, profile };
};

export const getBaseAllocation = (profile) => {
    if (profile === 'Conservative') {
        return { equity: 15, debt: 50, gold: 15, liquid: 15, esg: 5 };
    } else if (profile === 'Moderate') {
        return { equity: 35, debt: 30, gold: 10, liquid: 5, esg: 20 };
    } else { // Aggressive
        return { equity: 45, debt: 10, gold: 5, liquid: 5, esg: 35 };
    }
};

export const getRecommendations = (profile, allocation) => {
    const availableFunds = [...fundsDatabase];
    
    const getBestFunds = (type, limit = 1) => {
        return availableFunds.filter(f => f.type === type).slice(0, limit);
    };

    const bestDebt = getBestFunds('debt', profile === 'Conservative' ? 2 : 1);
    const bestLiquid = getBestFunds('liquid', 1);
    const bestGold = getBestFunds('gold', 1);
    const bestEquity = getBestFunds('equity', profile === 'Aggressive' ? 2 : 1);
    
    const esgLimit = profile === 'Aggressive' ? 2 : (profile === 'Moderate' ? 1 : 1);
    const bestEsg = availableFunds.filter(f => f.type === 'esg').slice(0, esgLimit);

    return [...bestEquity, ...bestDebt, ...bestLiquid, ...bestGold, ...bestEsg];
};
