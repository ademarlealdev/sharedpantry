import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Categorizes any grocery item regardless of the language and provides a relevant emoji icon using Gemini AI.
 * Uses the client-side compatible @google/generative-ai SDK.
 */
export const categorizeItem = async (itemName: string): Promise<{ category: string, icon: string }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return fallbackCategorize(itemName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Reverting to 1.0 pro for stability

    const prompt = `Categorize the grocery item "${itemName}" (language: auto-detect) into one of these: Produce, Dairy, Bakery, Meat & Seafood, Frozen, Pantry, Household, Beverages, Snacks, Other. 
      
      CRITICAL: You MUST provide a specific emoji for the item.
      - Milk -> 🥛
      - Butter -> 🧈
      - Cheese -> 🧀
      - Yogurt -> 🥣
      - Apply this specificity to ALL items. Do NOT use generic category icons if a specific item icon exists.
      
      Return ONLY a raw JSON object with keys "category" and "icon". Do not wrap in markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) return fallbackCategorize(itemName);

    // Clean up markdown fences just in case
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

    const json = JSON.parse(cleanedText);
    return {
      category: json.category || 'Other',
      icon: json.icon || '🛒'
    };
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return fallbackCategorize(itemName);
  }
};

const fallbackCategorize = (itemName: string): { category: string, icon: string } => {
  const name = itemName.toLowerCase();

  // Specific mappings for common items (English & Portuguese)
  if (name.includes('manteiga') || name.includes('butter')) return { category: 'Dairy', icon: '🧈' };
  if (name.includes('queijo') || name.includes('cheese')) return { category: 'Dairy', icon: '🧀' };
  if (name.includes('iogurte') || name.includes('yogurt')) return { category: 'Dairy', icon: '🥣' };
  if (name.includes('leite') || name.includes('milk')) return { category: 'Dairy', icon: '🥛' };
  if (name.includes('natas') || name.includes('cream')) return { category: 'Dairy', icon: '🥛' };
  if (name.includes('ovos') || name.includes('eggs')) return { category: 'Dairy', icon: '🥚' };

  if (name.includes('banana')) return { category: 'Produce', icon: '🍌' };
  if (name.includes('maçã') || name.includes('apple')) return { category: 'Produce', icon: '🍎' };
  if (name.includes('uva') || name.includes('grape')) return { category: 'Produce', icon: '🍇' };
  if (name.includes('cenoura') || name.includes('carrot')) return { category: 'Produce', icon: '🥕' };
  if (name.includes('batata') || name.includes('potato')) return { category: 'Produce', icon: '🥔' };
  if (name.includes('tomate') || name.includes('tomato')) return { category: 'Produce', icon: '🍅' };
  if (name.includes('alface') || name.includes('lettuce')) return { category: 'Produce', icon: '🥬' };
  if (name.includes('cebola') || name.includes('onion')) return { category: 'Produce', icon: '🧅' };
  if (name.includes('alho') || name.includes('garlic')) return { category: 'Produce', icon: '🧄' };

  if (name.includes('pão') || name.includes('bread')) return { category: 'Bakery', icon: '🍞' };
  if (name.includes('croissant')) return { category: 'Bakery', icon: '🥐' };
  if (name.includes('baguette') || name.includes('baguete')) return { category: 'Bakery', icon: '🥖' };

  if (name.includes('frango') || name.includes('chicken')) return { category: 'Meat & Seafood', icon: '🍗' };
  if (name.includes('bife') || name.includes('steak') || name.includes('vaca') || name.includes('beef')) return { category: 'Meat & Seafood', icon: '🥩' };
  if (name.includes('peixe') || name.includes('fish')) return { category: 'Meat & Seafood', icon: '🐟' };
  if (name.includes('camarão') || name.includes('shrimp')) return { category: 'Meat & Seafood', icon: '🦐' };

  if (name.includes('arroz') || name.includes('rice')) return { category: 'Pantry', icon: '🍚' };
  if (name.includes('massa') || name.includes('pasta') || name.includes('spaghetti')) return { category: 'Pantry', icon: '🍝' };
  if (name.includes('azeite') || name.includes('oil') || name.includes('óleo')) return { category: 'Pantry', icon: '🫗' };
  if (name.includes('sal') || name.includes('salt')) return { category: 'Pantry', icon: '🧂' };

  if (name.includes('água') || name.includes('water')) return { category: 'Beverages', icon: '💧' };
  if (name.includes('café') || name.includes('coffee')) return { category: 'Beverages', icon: '☕' };
  if (name.includes('cerveja') || name.includes('beer')) return { category: 'Beverages', icon: '🍺' };
  if (name.includes('vinho') || name.includes('wine')) return { category: 'Beverages', icon: '🍷' };

  if (name.includes('papel') || name.includes('paper')) return { category: 'Household', icon: '🧻' };
  if (name.includes('detergente') || name.includes('detergent') || name.includes('sabão') || name.includes('soap')) return { category: 'Household', icon: '🧼' };

  // Category-based fallback if specific item not found
  if (/leite|milk|queijo|cheese|iogurte|yogurt|manteiga|butter|creme|cream|ovos|eggs/.test(name)) return { category: 'Dairy', icon: '🥛' };
  if (/fruta|fruit|vegetais|veg|legumes/.test(name)) return { category: 'Produce', icon: '🥦' };
  if (/padaria|bakery|bolo|cake/.test(name)) return { category: 'Bakery', icon: '🥐' };
  if (/carne|meat|peixe|fish/.test(name)) return { category: 'Meat & Seafood', icon: '🥩' };
  if (/beepidas|drinks|sumo|juice/.test(name)) return { category: 'Beverages', icon: '🧃' };
  if (/limpeza|cleaning|casa|home/.test(name)) return { category: 'Household', icon: '🧹' };

  return { category: 'Other', icon: '🛒' };
};
