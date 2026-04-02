const CATEGORY_TO_SDG = {
  food: [2, 12],
  transport_public: [11, 13],
  transport_fuel: [13],
  education: [4],
  health: [3],
  utilities_green: [7],
  investment_esg: [17],
  shopping_local: [8, 12],
  rent: [11],
  salary: [], // Income does not deduct impact footprints
  subscriptions: [12],
  entertainment: [12],
  donations: [1, 10],
  groceries: [2, 12],
  gym_fitness: [3],
  insurance: [3],
  dining_out: [2]
};

const KEYWORD_RULES = [
  { match: ["solar", "ev charge", "electric vehicle"], sdg: 7 },
  { match: ["ngo", "charity", "donation", "relief fund"], sdg: 1 },
  { match: ["organic", "farmers market", "local farm"], sdg: 12 },
  { match: ["hospital", "pharmacy", "clinic", "therapy"], sdg: 3 },
  { match: ["school fees", "course", "udemy", "tuition"], sdg: 4 },
  { match: ["metro", "subway", "train", "bus pass"], sdg: 11 },
  { match: ["water bill", "aquafina"], sdg: 6 },
  { match: ["esg fund", "green bond", "sustainable fund"], sdg: 17 }
];

/**
 * Assigns SDG tags dynamically based on category and description keywords.
 * @param {string} category 
 * @param {string} description 
 * @returns {number[]} Array of unique SDG numbers (1-17)
 */
export const assignSDGTags = (category, description = "") => {
  const normalizedCategory = (category || "").toLowerCase().replace(/ /g, "_");
  const normalizedDesc = description.toLowerCase();
  
  let tags = new Set(CATEGORY_TO_SDG[normalizedCategory] || []);

  // Keyword rule injection
  for (const rule of KEYWORD_RULES) {
    if (rule.match.some(keyword => normalizedDesc.includes(keyword))) {
      tags.add(rule.sdg);
    }
  }

  return Array.from(tags).sort((a,b) => a - b);
};
