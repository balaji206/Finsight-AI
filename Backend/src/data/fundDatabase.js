// Static curated list of popular Indian funds with SDG rationales
const funds = [
    // Equity Funds
    {
        id: 'eq1',
        name: 'HDFC Mid-Cap Opportunities Fund',
        category: 'Mid Cap Fund',
        type: 'equity',
        expectedReturnLow: 12,
        expectedReturnHigh: 15,
        riskLevel: 'High',
        sdgTags: [9],
        rationale: 'Invests significantly in domestic manufacturing, infrastructure, and technology mid-caps, fostering innovation and sustainable industrialization (SDG 9: Industry, Innovation, and Infrastructure).'
    },
    {
        id: 'eq2',
        name: 'Parag Parikh Flexi Cap Fund',
        category: 'Flexi Cap Fund',
        type: 'equity',
        expectedReturnLow: 10,
        expectedReturnHigh: 14,
        riskLevel: 'High',
        sdgTags: [8, 9],
        rationale: 'Follows a value investing approach across market caps geographically. Indirectly supports decent work and economic growth (SDG 8) and innovation (SDG 9) through its diverse portfolio.'
    },
    {
        id: 'eq3',
        name: 'Mirae Asset Large Cap Fund',
        category: 'Large Cap Fund',
        type: 'equity',
        expectedReturnLow: 9,
        expectedReturnHigh: 12,
        riskLevel: 'Medium-High',
        sdgTags: [8, 9],
        rationale: 'Focuses on established blue-chip companies with robust governance frameworks and sustainable economic growth prospects.'
    },
    
    // Debt Funds
    {
        id: 'dt1',
        name: 'ICICI Pru Corporate Bond Fund',
        category: 'Corporate Bond',
        type: 'debt',
        expectedReturnLow: 6,
        expectedReturnHigh: 8,
        riskLevel: 'Low-Medium',
        sdgTags: [8, 9],
        rationale: 'Provides capital to high-rated corporate entities, enabling infrastructure and operational expansion, directly tying into economic growth (SDG 8) and industry resilience (SDG 9).'
    },
    {
        id: 'dt2',
        name: 'SBI Magnum Ultra Short Duration Fund',
        category: 'Ultra Short Duration',
        type: 'debt',
        expectedReturnLow: 5,
        expectedReturnHigh: 6.5,
        riskLevel: 'Low',
        sdgTags: [8],
        rationale: 'A highly liquid stability-focused fund offering capital preservation to safeguard basic wealth accumulation.'
    },
    {
        id: 'dt3',
        name: 'HDFC Liquid Fund',
        category: 'Liquid Fund',
        type: 'liquid',
        expectedReturnLow: 4,
        expectedReturnHigh: 6,
        riskLevel: 'Low',
        sdgTags: [8],
        rationale: 'Offers extremely low risk, preserving emergency capital securely.'
    },

    // Gold Funds
    {
        id: 'gld1',
        name: 'Nippon India ETF Gold BeES',
        category: 'Gold ETF',
        type: 'gold',
        expectedReturnLow: 7,
        expectedReturnHigh: 9,
        riskLevel: 'Medium',
        sdgTags: [],
        rationale: 'Physical gold-backed ETF, providing an inflation hedge and stabilizing overall portfolio volatility.'
    },
    {
        id: 'gld2',
        name: 'Axis Gold Fund',
        category: 'Gold Fund of Funds',
        type: 'gold',
        expectedReturnLow: 7,
        expectedReturnHigh: 9,
        riskLevel: 'Medium',
        sdgTags: [],
        rationale: 'Invests in Axis Gold ETF, offering convenient exposure to the historical preserving power of gold.'
    },

    // ESG / SDG Funds
    {
        id: 'esg1',
        name: 'ICICI Prudential ESG Exclusionary Strategy Fund',
        category: 'ESG Thematic',
        type: 'esg',
        expectedReturnLow: 11,
        expectedReturnHigh: 14,
        riskLevel: 'High',
        sdgTags: [13],
        rationale: 'Excludes companies engaged in controversial sectors and supports businesses actively reducing their carbon footprint, directly aligning with Climate Action (SDG 13).'
    },
    {
        id: 'esg2',
        name: 'SBI Magnum Equity ESG Fund',
        category: 'ESG Thematic',
        type: 'esg',
        expectedReturnLow: 10,
        expectedReturnHigh: 13,
        riskLevel: 'High',
        sdgTags: [7, 13],
        rationale: 'Heavily invests in companies transitioning towards renewable energy usage and possessing strong ESG stewardship. Aligns closely with Clean Energy (SDG 7) and Climate Action (SDG 13).'
    },
    {
        id: 'esg3',
        name: 'Quant ESG Equity Fund',
        category: 'ESG Thematic',
        type: 'esg',
        expectedReturnLow: 12,
        expectedReturnHigh: 16,
        riskLevel: 'High',
        sdgTags: [3, 9],
        rationale: 'Targets dynamic, future-looking growth companies that improve societal wellbeing and drive healthcare development and sustainable innovation (SDG 3: Good Health, SDG 9: Innovation).'
    },
    {
        id: 'esg4',
        name: 'Aditya Birla Sun Life ESG Integration Strategy Fund',
        category: 'ESG Thematic',
        type: 'esg',
        expectedReturnLow: 10,
        expectedReturnHigh: 14,
        riskLevel: 'High',
        sdgTags: [7, 9, 13],
        rationale: 'Employs a rigorous ESG integration framework to select stocks that actively minimize energy intensity, promote clean efficiency (SDG 7), and innovate in green technology (SDG 9, 13).'
    },
    {
        id: 'esg5',
        name: 'Kotak ESG Opportunities Fund',
        category: 'ESG Thematic',
        type: 'esg',
        expectedReturnLow: 10,
        expectedReturnHigh: 13.5,
        riskLevel: 'High',
        sdgTags: [3, 8],
        rationale: 'Focuses on companies showing strong community impact, ethical labor practices, and investments in employee health and safety (SDG 3, SDG 8).'
    },
    {
        id: 'esg6',
        name: 'Axis ESG Equity Fund',
        category: 'ESG Thematic',
        type: 'esg',
        expectedReturnLow: 11,
        expectedReturnHigh: 14,
        riskLevel: 'High',
        sdgTags: [7, 13],
        rationale: 'Invests predominantly in sustainable domestic companies aiming for carbon neutrality, positively contributing to Clean Energy (SDG 7) and Climate resilience (SDG 13).'
    }
];

export default funds;
