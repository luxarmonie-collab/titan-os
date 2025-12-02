// ═══════════════════════════════════════════════════════════════════════════════
// TITAN AI SERVICE - Google Gemini Integration (ULTRA DEEP ANALYSIS)
// ═══════════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const analyzeWithGemini = async (data) => {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY manquante. Utilisation du mode fallback.');
        return getFallbackQuestion(data);
    }

    const prompt = buildDeepPrompt(data);

    try {
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.95,  // Plus créatif
                    maxOutputTokens: 800,  // Plus long
                    topP: 0.98,
                    topK: 50
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('⚠️ Gemini réponse invalide. Fallback.');
            return getFallbackQuestion(data);
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('❌ Erreur Gemini:', error);
        return getFallbackQuestion(data);
    }
};

const buildDeepPrompt = (data) => {
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
        pastAnswers = [],  // Historique des réponses
        daysSinceLastWorkout = null
    } = data;

    const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks * 100).toFixed(0) : 0;
    const spendingRate = totalSpending > 0 ? (leisureSpending / totalSpending * 100).toFixed(0) : 0;

    return `Tu es TITAN, un coach de vie qui combine l'analyse psychologique profonde de Jung, la méthode socratique, et l'approche directe d'un Navy SEAL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DONNÉES BIOMÉTRIQUES & COMPORTEMENTALES (7 derniers jours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏋️ PERFORMANCE PHYSIQUE:
- Séances effectuées: ${weekWorkouts}/6 attendues (${(weekWorkouts/6*100).toFixed(0)}%)
- Dernière séance: ${daysSinceLastWorkout !== null ? `Il y a ${daysSinceLastWorkout} jour(s)` : 'Inconnue'}
${whoopRecovery !== null ? `- Whoop Recovery: ${whoopRecovery}% ${whoopRecovery >= 67 ? '(🟢 EXCELLENT)' : whoopRecovery >= 34 ? '(🟡 MODÉRÉ)' : '(🔴 FAIBLE)'}` : ''}
${whoopStrain !== null ? `- Whoop Strain: ${whoopStrain}/21 ${whoopStrain >= 14 ? '(Intense)' : whoopStrain >= 10 ? '(Modéré)' : '(Léger)'}` : ''}
${whoopHRV !== null ? `- HRV: ${whoopHRV}ms (indicateur stress/récupération)` : ''}

⚡ ÉTAT MENTAL & ÉNERGIE:
- Énergie moyenne: ${avgEnergy.toFixed(1)}/5 ${avgEnergy >= 4 ? '(🟢 Élevée)' : avgEnergy >= 3 ? '(🟡 Normale)' : '(🔴 Basse)'}
- Sommeil moyen: ${avgSleep.toFixed(1)}h/nuit ${avgSleep >= 7 ? '(✅ Optimal)' : avgSleep >= 6 ? '(⚠️ Limite)' : '(❌ Insuffisant)'}

🎯 PRODUCTIVITÉ & DISCIPLINE:
- Tâches complétées: ${tasksCompleted}/${totalTasks} (${completionRate}%)
- Taux de complétion: ${completionRate >= 70 ? '🟢 Excellent' : completionRate >= 50 ? '🟡 Moyen' : '🔴 Faible'}

💰 COMPORTEMENT FINANCIER:
- Dépenses totales: ${totalSpending.toFixed(0)}€
- Dont loisirs/plaisir: ${leisureSpending.toFixed(0)}€ (${spendingRate}%)
- Ratio loisirs: ${spendingRate >= 50 ? '🔴 Excessif' : spendingRate >= 40 ? '🟡 Élevé' : '🟢 Équilibré'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OBJECTIFS DE RÉFÉRENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Séances muscu: 6/semaine (intensité progressive)
- Énergie stable: >3.5/5 (minimum pour performer)
- Sommeil réparateur: ≥7h (récupération optimale)
- Tâches: >70% de complétion (discipline)
- Finances: Loisirs <40% (équilibre plaisir/responsabilité)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 ANALYSE DES DISSONANCES COGNITIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Identifie LA PLUS GRANDE DISSONANCE parmi:

1. 🏋️ PARADOXE DE LA PROCRASTINATION PHYSIQUE
   Si Recovery élevée + Énergie correcte MAIS peu de séances
   → L'utilisateur PEUT s'entraîner mais ne le fait pas
   → Question: Pointer l'excuse "j'attends le bon moment"

2. ⚡ CERCLE VICIEUX ÉNERGIE-INACTION
   Si Énergie basse + Peu de sport + Sommeil correct
   → Le manque d'action CAUSE le manque d'énergie
   → Question: Faire réaliser que l'inaction aggrave la fatigue

3. 🎯 ÉCART INTENTIONS-ACTIONS
   Si beaucoup de tâches créées MAIS peu complétées
   → Planning vs Exécution déconnectés
   → Question: Confronter à l'écart entre "vouloir" et "faire"

4. 💰 COMPENSATION ÉMOTIONNELLE PAR DÉPENSES
   Si dépenses loisirs élevées + Peu de tâches complétées
   → Achète du plaisir pour compenser manque d'accomplissement
   → Question: Identifier la fuite émotionnelle

5. 🌀 CONTRADICTION RÉCUPÉRATION-ENTRAÎNEMENT
   Si Whoop dit "Go" MAIS l'utilisateur repos
   → Ignorer les signaux du corps quand ils disent "action"
   → Question: Pointer qu'il écoute son corps seulement pour justifier l'inaction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PRINCIPES POUR LA QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STYLE OBLIGATOIRE:
✅ Direct, confrontant, sans détour
✅ Pointer la contradiction avec données chiffrées
✅ Créer un inconfort constructif
✅ Pas de conseil, juste questionner
✅ Forcer l'introspection honnête
❌ Pas de politesse excessive
❌ Pas de "peut-être" ou "il semble"
❌ Pas de solution donnée

STRUCTURE:
1. Commencer par une observation factuelle chiffrée
2. Pointer la contradiction (MAIS)
3. Finir par une question sans échappatoire

EXEMPLES DE BON STYLE:
✅ "Recovery 78%, énergie 4/5, mais 0 séance. C'est ton corps qui refuse ou toi ?"
✅ "450€ en loisirs cette semaine, 2 tâches faites sur 10. Tu achètes du plaisir pour éviter l'effort ?"
✅ "Tu crées 15 tâches par jour mais n'en fais que 2. Tu planifies pour te sentir productif ou pour vraiment agir ?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 FORMAT DE SORTIE (JSON STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "question": "La question principale (max 200 caractères, directe, confrontante)",
  "followUp": "Question de suivi pour creuser (max 120 caractères)",
  "type": "fitness_dissonance" | "energy_paradox" | "spending_dissonance" | "task_avoidance" | "recovery_ignorance",
  "severity": "critical" | "high" | "medium",
  "isSocratic": true,
  "dataPoints": ["Point 1", "Point 2", "Point 3"]
}

GÉNÈRE UNIQUEMENT LE JSON. Pas de texte avant ou après. Pas de backticks markdown.`;
};

const getFallbackQuestion = (data) => {
    const { weekWorkouts = 0, avgEnergy = 3, whoopRecovery = null, tasksCompleted = 0, totalTasks = 0 } = data;

    // Priorisation intelligente
    if (whoopRecovery && whoopRecovery >= 67 && weekWorkouts < 2) {
        return {
            type: 'recovery_ignorance',
            severity: 'critical',
            isSocratic: true,
            question: `Whoop dit Recovery ${whoopRecovery}% (excellent), mais seulement ${weekWorkouts} séances. C'est ton corps qui refuse ou toi ?`,
            followUp: 'Qu\'est-ce qui t\'empêche VRAIMENT de bouger quand ton corps est prêt ?',
            dataPoints: [`Recovery ${whoopRecovery}%`, `${weekWorkouts}/6 séances`, 'Capacité vs Action']
        };
    }

    if (weekWorkouts === 0 && avgEnergy >= 3.5) {
        return {
            type: 'fitness_dissonance',
            severity: 'critical',
            isSocratic: true,
            question: `0 séance cette semaine avec une énergie à ${avgEnergy.toFixed(1)}/5. Tu attends quoi exactement ?`,
            followUp: 'Le "bon moment" n\'existe pas. Qu\'est-ce qui doit se passer pour que tu passes à l\'action ?',
            dataPoints: ['0 séances', `Énergie ${avgEnergy.toFixed(1)}/5`, 'Procrastination active']
        };
    }

    if (avgEnergy < 2.5 && weekWorkouts < 2) {
        return {
            type: 'energy_paradox',
            severity: 'high',
            isSocratic: true,
            question: `Énergie ${avgEnergy.toFixed(1)}/5, ${weekWorkouts} séances. Tu attends d'avoir de l'énergie pour bouger, mais c'est l'inverse qui marche.`,
            followUp: 'Combien de temps encore tu vas attendre que ça change tout seul ?',
            dataPoints: [`Énergie ${avgEnergy.toFixed(1)}/5`, `${weekWorkouts} séances`, 'Cercle vicieux']
        };
    }

    if (totalTasks > 5 && tasksCompleted / totalTasks < 0.3) {
        return {
            type: 'task_avoidance',
            severity: 'high',
            isSocratic: true,
            question: `${totalTasks} tâches créées, ${tasksCompleted} faites (${(tasksCompleted/totalTasks*100).toFixed(0)}%). Tu planifies pour te sentir productif ou pour vraiment agir ?`,
            followUp: 'Créer une liste ça rassure, mais faire c\'est autre chose. Où est le blocage ?',
            dataPoints: [`${tasksCompleted}/${totalTasks}`, `${(tasksCompleted/totalTasks*100).toFixed(0)}% complétion`, 'Intention vs Action']
        };
    }

    return null;
};

export const testGeminiConnection = async () => {
    if (!GEMINI_API_KEY) {
        return { success: false, error: 'API key manquante dans .env' };
    }

    try {
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Test connexion. Réponds "OK".' }] }]
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
