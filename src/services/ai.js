// ═══════════════════════════════════════════════════════════════════════════
// 🧠 TITAN.OS - SERVICE IA ULTRA-PROFOND (Google Gemini)
// ═══════════════════════════════════════════════════════════════════════════
// Version: 1.0
// Date: 2025-12-03
// Description: Analyse comportementale avancée avec détection de dissonances
// ═══════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * 🎯 Fonction principale : Analyse avec Gemini
 * @param {Object} userData - Données utilisateur complètes
 * @returns {Promise<string>} Question socratique ultra-profonde
 */
export async function analyzeWithGemini(userData) {
    // Vérification clé API
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        console.warn('⚠️ Clé Gemini manquante, utilisation du fallback');
        return getFallbackQuestion(userData);
    }

    try {
        // Construction du prompt ultra-profond
        const prompt = buildUltraDeepPrompt(userData);
        
        // Appel API Gemini
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.95,
                    maxOutputTokens: 150,
                    topP: 0.95
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const question = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!question) {
            throw new Error('Réponse Gemini vide');
        }

        console.log('✅ Question Gemini générée:', question);
        return question;

    } catch (error) {
        console.error('❌ Erreur Gemini:', error);
        return getFallbackQuestion(userData);
    }
}

/**
 * 🏗️ Construction du prompt ultra-profond
 */
function buildUltraDeepPrompt(data) {
    const {
        weekWorkouts = 0,
        avgEnergy = 3,
        avgSleep = 7,
        whoopRecovery = null,
        whoopStrain = null,
        whoopHRV = null,
        tasksCompleted = 0,
        totalTasks = 0,
        leisureSpending = 0,
        totalSpending = 0,
        daysSinceLastWorkout = null
    } = data;

    return `Tu es un coach de vie ultra-direct qui détecte les dissonances comportementales.

📊 DONNÉES ANALYSÉES:
- Séances fitness: ${weekWorkouts}/7 jours
- Énergie moyenne: ${avgEnergy.toFixed(1)}/5
- Sommeil moyen: ${avgSleep.toFixed(1)}h/nuit
${whoopRecovery ? `- Whoop Recovery: ${whoopRecovery}%` : ''}
${whoopStrain ? `- Whoop Strain: ${whoopStrain}/21` : ''}
${whoopHRV ? `- HRV: ${whoopHRV}ms` : ''}
- Tâches: ${tasksCompleted}/${totalTasks} complétées (${totalTasks > 0 ? Math.round(tasksCompleted/totalTasks*100) : 0}%)
- Dépenses loisirs: ${leisureSpending.toFixed(0)}€ / ${totalSpending.toFixed(0)}€ total (${totalSpending > 0 ? Math.round(leisureSpending/totalSpending*100) : 0}%)
${daysSinceLastWorkout !== null ? `- Dernière séance: il y a ${daysSinceLastWorkout} jours` : ''}

🧠 5 TYPES DE DISSONANCES À DÉTECTER:
1. **Paradoxe procrastination physique**: Recovery élevée + 0 séances
2. **Cercle vicieux énergie-inaction**: Énergie basse + pas de sport
3. **Écart intentions-actions**: Tâches créées vs complétées
4. **Compensation émotionnelle**: Achats vs accomplissement
5. **Contradiction récupération-entraînement**: Corps dit "Go" mais repos

💡 STYLE OBLIGATOIRE:
- Direct et confrontant (pas de politesse inutile)
- Inclure des CHIFFRES précis dans la question
- Créer un inconfort constructif
- Pas de conseil, juste questionner
- Maximum 25 mots

🎯 GÉNÈRE UNE SEULE QUESTION qui expose la dissonance la plus flagrante.

Exemples:
- "Recovery 78%, énergie 4/5, mais 0 séance. C'est ton corps qui refuse ou toi ?"
- "450€ en loisirs, 2 tâches faites sur 10. Tu achètes du plaisir pour éviter l'effort ?"
- "Tu crées 15 tâches/jour mais n'en fais que 2. Tu planifies pour te sentir productif ou pour agir ?"

Question:`;
}

/**
 * 🆘 Fallback intelligent si Gemini échoue
 */
function getFallbackQuestion(data) {
    const dissonances = detectDissonances(data);
    
    // Prioriser par sévérité
    const critical = dissonances.filter(d => d.severity === 'critical')[0];
    const high = dissonances.filter(d => d.severity === 'high')[0];
    const medium = dissonances.filter(d => d.severity === 'medium')[0];
    
    const selected = critical || high || medium;
    
    if (selected) {
        console.log('🔄 Fallback utilisé:', selected.question);
        return selected.question;
    }
    
    return "Qu'est-ce qui t'empêche VRAIMENT de passer à l'action aujourd'hui ?";
}

/**
 * 🔍 Détection des dissonances comportementales
 */
function detectDissonances(data) {
    const {
        weekWorkouts = 0,
        avgEnergy = 3,
        whoopRecovery = null,
        tasksCompleted = 0,
        totalTasks = 0,
        leisureSpending = 0,
        totalSpending = 0,
        daysSinceLastWorkout = null
    } = data;

    const dissonances = [];
    const taskCompletionRate = totalTasks > 0 ? tasksCompleted / totalTasks : 0;
    const leisureRate = totalSpending > 0 ? leisureSpending / totalSpending : 0;

    // 1. Paradoxe récupération-inaction
    if (whoopRecovery && whoopRecovery >= 70 && weekWorkouts === 0) {
        dissonances.push({
            severity: 'critical',
            question: `Recovery ${whoopRecovery}%, énergie ${avgEnergy.toFixed(1)}/5, mais 0 séance. C'est ton corps qui refuse ou toi ?`
        });
    }

    // 2. Procrastination prolongée
    if (daysSinceLastWorkout && daysSinceLastWorkout >= 4 && avgEnergy >= 3) {
        dissonances.push({
            severity: 'high',
            question: `${daysSinceLastWorkout} jours sans séance, énergie correcte. Qu'est-ce qui te bloque VRAIMENT ?`
        });
    }

    // 3. Écart intentions-actions
    if (totalTasks >= 5 && taskCompletionRate < 0.3) {
        dissonances.push({
            severity: 'high',
            question: `${tasksCompleted} tâches faites sur ${totalTasks}. Tu planifies pour agir ou pour te sentir productif ?`
        });
    }

    // 4. Compensation financière
    if (leisureRate > 0.4 && taskCompletionRate < 0.3) {
        dissonances.push({
            severity: 'medium',
            question: `${leisureSpending.toFixed(0)}€ en loisirs, ${Math.round(taskCompletionRate*100)}% de tâches faites. Tu achètes du plaisir pour éviter l'effort ?`
        });
    }

    // 5. Énergie basse + inaction
    if (avgEnergy < 3 && weekWorkouts === 0) {
        dissonances.push({
            severity: 'medium',
            question: `Énergie ${avgEnergy.toFixed(1)}/5, 0 séance. Comment tu comptes casser ce cercle vicieux ?`
        });
    }

    return dissonances;
}

/**
 * 🧪 Test de connexion Gemini
 */
export async function testGeminiConnection() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        return { 
            success: false, 
            message: '❌ Clé API manquante (vérifier .env.local ou Railway)' 
        };
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
            return { 
                success: false, 
                message: `❌ Erreur API: ${response.status}` 
            };
        }

        return { 
            success: true, 
            message: '✅ Gemini connecté avec succès !' 
        };

    } catch (error) {
        return { 
            success: false, 
            message: `❌ Erreur réseau: ${error.message}` 
        };
    }
}

export default { analyzeWithGemini, testGeminiConnection };
