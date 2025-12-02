// ═══════════════════════════════════════════════════════════════════════════════
// TITAN AI SERVICE - Google Gemini Integration
// ═══════════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Analyse les données de l'utilisateur avec Gemini et génère une question socratique
 * @param {Object} data - Données utilisateur (workouts, checkins, whoop, etc.)
 * @returns {Promise<Object>} Question socratique générée par l'IA
 */
export const analyzeWithGemini = async (data) => {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY manquante. Utilisation du mode fallback.');
        return getFallbackQuestion(data);
    }

    const prompt = buildPrompt(data);

    try {
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 500,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        
        // Extraire le JSON (Gemini peut ajouter des backticks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('⚠️ Gemini n\'a pas retourné de JSON valide. Fallback.');
            return getFallbackQuestion(data);
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('❌ Erreur Gemini:', error);
        return getFallbackQuestion(data);
    }
};

/**
 * Construit le prompt pour Gemini
 */
const buildPrompt = (data) => {
    const {
        weekWorkouts = 0,
        avgEnergy = 3,
        avgSleep = 7,
        whoopRecovery = null,
        tasksCompleted = 0,
        totalTasks = 0,
        leisureSpending = 0,
        totalSpending = 0
    } = data;

    return `Tu es TITAN, un coach de vie analytique, direct et sans langue de bois.

📊 DONNÉES DE L'UTILISATEUR (7 derniers jours):
- Séances d'entraînement : ${weekWorkouts}/6 attendues
- Énergie moyenne : ${avgEnergy.toFixed(1)}/5
- Sommeil moyen : ${avgSleep.toFixed(1)}h/nuit
- Whoop Recovery : ${whoopRecovery !== null ? whoopRecovery + '%' : 'Non disponible'}
- Tâches complétées : ${tasksCompleted}/${totalTasks}
- Dépenses loisirs : ${leisureSpending.toFixed(0)}€ sur ${totalSpending.toFixed(0)}€ (${totalSpending > 0 ? ((leisureSpending/totalSpending)*100).toFixed(0) : 0}%)

🎯 OBJECTIFS DE L'UTILISATEUR:
- 6 séances muscu/semaine minimum
- Énergie stable >3.5/5
- Sommeil optimal ≥7h
- Équilibre financier (loisirs <40% des dépenses)

🧠 MISSION:
Génère UNE question socratique profonde qui met en lumière les DISSONANCES COGNITIVES de l'utilisateur.

📋 PRIORITÉS (dans l'ordre):
1. Si ${weekWorkouts} < 2 → Interroger la procrastination fitness
2. Si énergie < 2.5 ET peu de sport → Pointer le paradoxe (attendre l'énergie pour bouger)
3. Si loisirs > 40% dépenses → Questionner la satisfaction vs fuite
4. Si Recovery élevée mais peu de sport → Pointer l'opportunité manquée

💡 STYLE:
- Direct, sans langue de bois
- Question unique percutante (pas un interrogatoire)
- Pas de conseils, juste questionner
- Faire réfléchir sur les contradictions

📦 FORMAT (JSON strict, rien d'autre):
{
  "question": "Ta question principale (max 150 caractères)",
  "followUp": "Question de suivi optionnelle (max 100 caractères)",
  "type": "fitness_dissonance" | "energy_paradox" | "spending_dissonance",
  "severity": "high" | "medium",
  "isSocratic": true
}

Génère UNIQUEMENT le JSON, sans backticks ni texte additionnel.`;
};

/**
 * Fallback si Gemini n'est pas disponible ou échoue
 */
const getFallbackQuestion = (data) => {
    const { weekWorkouts = 0, avgEnergy = 3 } = data;

    if (weekWorkouts < 2) {
        return {
            type: 'fitness_dissonance',
            severity: 'medium',
            isSocratic: true,
            question: `Seulement ${weekWorkouts} séance(s) cette semaine. Qu'est-ce qui t'en empêche vraiment ?`,
            followUp: 'Est-ce le temps, l\'énergie, ou autre chose ?'
        };
    }

    if (avgEnergy < 2.5 && weekWorkouts < 3) {
        return {
            type: 'energy_paradox',
            severity: 'high',
            isSocratic: true,
            question: 'Ton énergie est basse depuis plusieurs jours. Attends-tu que ça passe, ou vas-tu agir ?',
            followUp: 'Qu\'est-ce qui te redonnerait de l\'énergie maintenant ?'
        };
    }

    return null;
};

/**
 * Teste la connexion à Gemini
 */
export const testGeminiConnection = async () => {
    if (!GEMINI_API_KEY) {
        return { success: false, error: 'API key manquante' };
    }

    try {
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Test de connexion. Réponds juste "OK".' }]
                }]
            })
        });

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}` };
        }

        return { success: true, message: 'Gemini connecté ✅' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
