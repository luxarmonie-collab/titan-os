// ═══════════════════════════════════════════════════════════════════════════
// 🧠 TITAN.OS - INTELLIGENT COACH v2.0
// ═══════════════════════════════════════════════════════════════════════════
// Architecture: Observation → Enquête → Prescription
// Avec mémoire long-terme et apprentissage des patterns
// ═══════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Gemini 1.5 Pro = Plus puissant et intelligent pour l'analyse complexe
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAPE 1: OBSERVATION - Analyse automatique des données
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyse toutes les sources de données et détecte les anomalies
 */
export function analyzeCurrentState(data) {
    const { whoopData, checkins, workoutLogs, tasks, transactions, meals, biometrics } = data;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const last7Days = getLast(7);
    const last30Days = getLast(30);
    
    // ═══ DONNÉES WHOOP ═══
    const whoop = {
        recovery: whoopData?.recovery?.score ?? whoopData?.recovery ?? null,
        strain: whoopData?.strain?.score ?? whoopData?.strain ?? null,
        sleepHours: whoopData?.sleep?.duration ?? whoopData?.sleepHours ?? null,
        sleepScore: whoopData?.sleep?.score ?? whoopData?.sleepScore ?? null,
        hrv: whoopData?.recovery?.hrv ?? whoopData?.hrv ?? null,
        rhr: whoopData?.recovery?.rhr ?? whoopData?.rhr ?? null,
        connected: !!whoopData?.recovery
    };
    
    // ═══ CHECK-INS ═══
    const todayCheckin = checkins?.[today] || {};
    const yesterdayCheckin = checkins?.[yesterday] || {};
    const weekCheckins = last7Days.map(d => checkins?.[d]).filter(Boolean);
    
    const avgEnergy = weekCheckins.length > 0 
        ? weekCheckins.reduce((sum, c) => sum + (c.energy || 3), 0) / weekCheckins.length 
        : null;
    const avgMood = weekCheckins.length > 0 
        ? weekCheckins.reduce((sum, c) => sum + (c.mood || 3), 0) / weekCheckins.length 
        : null;
    const avgSleepRating = weekCheckins.length > 0 
        ? weekCheckins.reduce((sum, c) => sum + (c.sleep || 3), 0) / weekCheckins.length 
        : null;
    
    // ═══ WORKOUTS ═══
    const weekWorkouts = workoutLogs?.filter(w => last7Days.includes(w.date)) || [];
    const muscuCount = weekWorkouts.filter(w => w.type === 'Muscu' || w.type === 'Musculation').length;
    const cardioCount = weekWorkouts.filter(w => w.type === 'Cardio').length;
    const lastWorkout = [...(workoutLogs || [])].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const daysSinceLastWorkout = lastWorkout 
        ? Math.floor((Date.now() - new Date(lastWorkout.date)) / 86400000)
        : null;
    
    // ═══ TÂCHES ═══
    const todayTasks = tasks?.filter(t => t.due_date === today) || [];
    const completedToday = todayTasks.filter(t => t.completed).length;
    const weekTasks = tasks?.filter(t => last7Days.includes(t.due_date)) || [];
    const weekCompleted = weekTasks.filter(t => t.completed).length;
    const taskCompletionRate = weekTasks.length > 0 
        ? Math.round((weekCompleted / weekTasks.length) * 100) 
        : null;
    
    // ═══ FINANCES ═══
    const weekTransactions = transactions?.filter(t => last7Days.includes(t.date)) || [];
    const totalSpending = weekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const impulsiveCategories = ['jeux_argent', 'loisirs', 'repas_ext', 'loisir_ambrine'];
    const impulsiveSpending = weekTransactions
        .filter(t => impulsiveCategories.includes(t.category))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // ═══ NUTRITION ═══
    const yesterdayMeals = meals?.filter(m => m.date === yesterday) || [];
    const lastMealTime = yesterdayMeals.length > 0 
        ? yesterdayMeals.sort((a, b) => (b.time || '').localeCompare(a.time || ''))[0]?.time 
        : null;
    const totalCaloriesYesterday = yesterdayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    
    // ═══ BIOMÉTRIE ═══
    const latestWeight = Object.entries(biometrics || {})
        .filter(([k, v]) => v.poids)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];
    
    // ═══ DÉTECTION DES ANOMALIES ═══
    const anomalies = [];
    const flags = {};
    
    // Anomalie Recovery
    if (whoop.recovery !== null && whoop.recovery < 33) {
        anomalies.push({ type: 'recovery_critical', severity: 'high', value: whoop.recovery });
        flags.NEEDS_CONTEXT_RECOVERY = true;
    } else if (whoop.recovery !== null && whoop.recovery < 50) {
        anomalies.push({ type: 'recovery_low', severity: 'medium', value: whoop.recovery });
        flags.NEEDS_CONTEXT_RECOVERY = true;
    }
    
    // Anomalie HRV (chute par rapport à la baseline)
    if (whoop.hrv !== null && whoop.hrv < 30) {
        anomalies.push({ type: 'hrv_low', severity: 'medium', value: whoop.hrv });
        flags.NEEDS_CONTEXT_STRESS = true;
    }
    
    // Anomalie Sommeil
    if (whoop.sleepHours !== null && whoop.sleepHours < 5.5) {
        anomalies.push({ type: 'sleep_critical', severity: 'high', value: whoop.sleepHours });
        flags.NEEDS_CONTEXT_SLEEP = true;
    } else if ((whoop.sleepHours !== null && whoop.sleepHours < 6.5) || 
               (yesterdayCheckin.sleep && yesterdayCheckin.sleep <= 2)) {
        anomalies.push({ type: 'sleep_low', severity: 'medium', value: whoop.sleepHours || yesterdayCheckin.sleep });
        flags.NEEDS_CONTEXT_SLEEP = true;
    }
    
    // Anomalie Énergie
    if (yesterdayCheckin.energy && yesterdayCheckin.energy <= 2) {
        anomalies.push({ type: 'energy_low', severity: 'medium', value: yesterdayCheckin.energy });
        flags.NEEDS_CONTEXT_ENERGY = true;
    }
    
    // Anomalie Productivité
    if (taskCompletionRate !== null && taskCompletionRate < 30 && weekTasks.length >= 5) {
        anomalies.push({ type: 'productivity_low', severity: 'medium', value: taskCompletionRate });
        flags.NEEDS_CONTEXT_PRODUCTIVITY = true;
    }
    
    // Anomalie Dépenses impulsives
    if (impulsiveSpending > 100) {
        anomalies.push({ type: 'impulse_spending', severity: 'low', value: impulsiveSpending });
    }
    
    // Anomalie Inactivité sportive
    if (daysSinceLastWorkout !== null && daysSinceLastWorkout >= 4) {
        anomalies.push({ type: 'no_workout', severity: 'medium', value: daysSinceLastWorkout });
        flags.NEEDS_CONTEXT_ACTIVITY = true;
    }
    
    return {
        timestamp: new Date().toISOString(),
        whoop,
        checkin: {
            today: todayCheckin,
            yesterday: yesterdayCheckin,
            avgEnergy,
            avgMood,
            avgSleepRating
        },
        fitness: {
            weekWorkouts: muscuCount + cardioCount,
            muscuCount,
            cardioCount,
            lastWorkout,
            daysSinceLastWorkout
        },
        tasks: {
            todayTotal: todayTasks.length,
            todayCompleted: completedToday,
            weekCompletionRate: taskCompletionRate
        },
        finance: {
            weekTotal: totalSpending,
            impulsiveSpending,
            impulsiveRate: totalSpending > 0 ? Math.round((impulsiveSpending / totalSpending) * 100) : 0
        },
        nutrition: {
            lastMealTime,
            yesterdayCalories: totalCaloriesYesterday
        },
        biometrics: {
            latestWeight: latestWeight ? { date: latestWeight[0], value: latestWeight[1].poids } : null
        },
        anomalies,
        flags,
        needsEnquiry: Object.keys(flags).length > 0
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAPE 2: ENQUÊTE - Génération de questions dynamiques avec l'IA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère des questions contextuelles basées sur les anomalies détectées
 */
export async function generateEnquiryQuestions(state, memory = []) {
    // Si pas d'anomalies, pas besoin d'enquête approfondie
    if (!state.needsEnquiry || state.anomalies.length === 0) {
        return {
            needsEnquiry: false,
            questions: [],
            greeting: generateGreeting(state, 'neutral')
        };
    }
    
    // Prioriser les anomalies
    const sortedAnomalies = [...state.anomalies].sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    const primaryAnomaly = sortedAnomalies[0];
    
    // Essayer avec l'IA, sinon fallback sur les questions statiques
    try {
        if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here') {
            const aiQuestions = await generateAIQuestions(state, primaryAnomaly, memory);
            if (aiQuestions && aiQuestions.length > 0) {
                return {
                    needsEnquiry: true,
                    questions: aiQuestions,
                    greeting: generateGreeting(state, primaryAnomaly.type),
                    primaryAnomaly
                };
            }
        }
    } catch (e) {
        console.warn('AI question generation failed, using fallback:', e);
    }
    
    // Fallback: Questions statiques contextualisées
    return {
        needsEnquiry: true,
        questions: getFallbackQuestions(primaryAnomaly, state),
        greeting: generateGreeting(state, primaryAnomaly.type),
        primaryAnomaly
    };
}

/**
 * Génère des questions avec l'IA (Gemini)
 */
async function generateAIQuestions(state, anomaly, memory) {
    const memoryContext = memory.length > 0 
        ? `\n\nHISTORIQUE UTILISATEUR (patterns détectés):\n${memory.slice(-5).map(m => `- ${m.date}: ${m.summary}`).join('\n')}`
        : '';
    
    const prompt = `Tu es un coach de vie et ingénieur de la performance humaine. Tu dois générer 3 questions COURTES et PERTINENTES pour comprendre pourquoi l'utilisateur a cette anomalie.

DONNÉES ACTUELLES:
- Anomalie principale: ${anomaly.type} (${anomaly.severity}) - valeur: ${anomaly.value}
- Recovery Whoop: ${state.whoop.recovery ?? 'Non connecté'}%
- Sommeil: ${state.whoop.sleepHours ?? state.checkin.yesterday?.sleep ?? 'N/A'}h
- HRV: ${state.whoop.hrv ?? 'N/A'}ms
- Énergie moyenne 7j: ${state.checkin.avgEnergy?.toFixed(1) ?? 'N/A'}/5
- Dernière séance sport: il y a ${state.fitness.daysSinceLastWorkout ?? 'N/A'} jours
- Taux complétion tâches: ${state.tasks.weekCompletionRate ?? 'N/A'}%
${memoryContext}

RÈGLES:
1. Questions fermées (Oui/Non) ou à choix multiples
2. Maximum 10 mots par question
3. Directes et sans politesse inutile
4. Orientées CAUSE (pas symptôme)

FORMAT DE RÉPONSE (JSON strict):
{
  "questions": [
    {"id": "q1", "text": "Question 1?", "type": "yesno"},
    {"id": "q2", "text": "Question 2?", "options": ["Option A", "Option B", "Option C"]},
    {"id": "q3", "text": "Question 3?", "type": "yesno"}
  ]
}

Génère les questions:`;

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
                topP: 0.9
            }
        })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.questions || [];
    }
    
    return null;
}

/**
 * Questions de fallback si l'IA échoue
 */
function getFallbackQuestions(anomaly, state) {
    const questionSets = {
        recovery_critical: [
            { id: 'alcohol', text: 'Alcool hier soir ?', type: 'yesno' },
            { id: 'late_meal', text: 'Repas après 21h ?', type: 'yesno' },
            { id: 'cause', text: 'Autre cause possible ?', options: ['Stress', 'Maladie', 'Entraînement intense', 'Écrans tard', 'Aucune idée'] }
        ],
        recovery_low: [
            { id: 'sleep_quality', text: 'Comment as-tu dormi ?', options: ['Bien', 'Moyen', 'Mal', 'Réveils nocturnes'] },
            { id: 'stress', text: 'Niveau de stress hier ?', options: ['Faible', 'Modéré', 'Élevé', 'Très élevé'] }
        ],
        sleep_critical: [
            { id: 'bedtime', text: 'Heure de coucher ?', options: ['Avant 22h', '22h-23h', '23h-00h', 'Après minuit'] },
            { id: 'wake_reason', text: 'Réveillé par quoi ?', options: ['Alarme', 'Naturellement', 'Bruit', 'Stress/pensées'] }
        ],
        sleep_low: [
            { id: 'screens', text: 'Écrans après 22h ?', type: 'yesno' },
            { id: 'caffeine', text: 'Café après 14h ?', type: 'yesno' }
        ],
        energy_low: [
            { id: 'sleep', text: 'Bien dormi ?', type: 'yesno' },
            { id: 'nutrition', text: 'Bien mangé hier ?', type: 'yesno' },
            { id: 'cause', text: 'Cause possible ?', options: ['Fatigue physique', 'Fatigue mentale', 'Maladie', 'Moral bas'] }
        ],
        productivity_low: [
            { id: 'overwhelm', text: 'Trop de tâches ?', type: 'yesno' },
            { id: 'focus', text: 'Problème de focus ?', type: 'yesno' },
            { id: 'blocker', text: 'Principal obstacle ?', options: ['Distractions', 'Énergie', 'Priorités floues', 'Procrastination'] }
        ],
        no_workout: [
            { id: 'reason', text: 'Pourquoi pas de sport ?', options: ['Pas le temps', 'Fatigué', 'Blessure', 'Pas motivé', 'Autre priorité'] },
            { id: 'plan', text: 'Prévu quand ?', options: ['Aujourd\'hui', 'Demain', 'Cette semaine', 'Pas prévu'] }
        ],
        hrv_low: [
            { id: 'stress', text: 'Stressé en ce moment ?', type: 'yesno' },
            { id: 'overtraining', text: 'Surentraînement possible ?', type: 'yesno' }
        ],
        impulse_spending: [
            { id: 'emotional', text: 'Achat émotionnel ?', type: 'yesno' },
            { id: 'regret', text: 'Tu regrettes ?', type: 'yesno' }
        ]
    };
    
    return questionSets[anomaly.type] || [
        { id: 'feeling', text: 'Comment tu te sens ?', options: ['Bien', 'Moyen', 'Pas top', 'Mal'] }
    ];
}

/**
 * Génère le message de greeting contextuel
 */
function generateGreeting(state, anomalyType) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Hey' : 'Bonsoir';
    
    const messages = {
        recovery_critical: {
            main: `ta récupération est dans le rouge (${state.whoop.recovery}%).`,
            sub: 'J\'ai besoin de comprendre ce qui s\'est passé.'
        },
        recovery_low: {
            main: `ta récupération est en dessous de la moyenne (${state.whoop.recovery}%).`,
            sub: 'Quelques questions rapides pour adapter ta journée.'
        },
        sleep_critical: {
            main: `tu n'as dormi que ${state.whoop.sleepHours?.toFixed(1) || 'peu d\''}h.`,
            sub: 'C\'est critique, on va adapter la journée.'
        },
        sleep_low: {
            main: 'ton sommeil n\'était pas optimal.',
            sub: 'On regarde ce qui peut être amélioré ce soir.'
        },
        energy_low: {
            main: 'tu sembles fatigué ces derniers temps.',
            sub: 'On identifie les causes ensemble ?'
        },
        productivity_low: {
            main: `seulement ${state.tasks.weekCompletionRate}% de tes tâches complétées cette semaine.`,
            sub: 'On analyse ce qui bloque ?'
        },
        no_workout: {
            main: `ça fait ${state.fitness.daysSinceLastWorkout} jours sans sport.`,
            sub: 'On en parle ?'
        },
        neutral: {
            main: 'tout semble en ordre.',
            sub: 'On fait le point rapidement ?'
        }
    };
    
    const msg = messages[anomalyType] || messages.neutral;
    
    return {
        greeting: `${timeGreeting} Théo`,
        mainMessage: msg.main,
        subMessage: msg.sub,
        severity: state.anomalies[0]?.severity || 'low'
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉTAPE 3: PRESCRIPTION - Génération du plan d'action avec l'IA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère une prescription personnalisée basée sur l'état et les réponses
 */
export async function generatePrescription(state, answers, todaySchedule = null, memory = []) {
    // Compiler toutes les données pour l'IA
    const context = {
        whoop: state.whoop,
        checkin: state.checkin,
        fitness: state.fitness,
        tasks: state.tasks,
        nutrition: state.nutrition,
        anomalies: state.anomalies,
        userAnswers: answers,
        todaySchedule,
        memory: memory.slice(-10) // Les 10 derniers logs
    };
    
    try {
        if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here') {
            const aiPrescription = await generateAIPrescription(context);
            if (aiPrescription) {
                return aiPrescription;
            }
        }
    } catch (e) {
        console.warn('AI prescription generation failed, using fallback:', e);
    }
    
    // Fallback: Prescription basée sur des règles
    return generateRuleBasedPrescription(context);
}

/**
 * Génère la prescription avec l'IA
 */
async function generateAIPrescription(context) {
    const prompt = `Tu es un Ingénieur de la Performance Humaine et Biohacker expert. Génère un plan d'action optimisé pour la journée.

DONNÉES COMPLÈTES:
${JSON.stringify(context, null, 2)}

RÈGLES DE DÉCISION:
- Recovery < 33% + Alcool → Hydratation massive, pas de jeûne, cardio annulé
- Recovery < 33% + Maladie → Repos total, protocole vitamine C/Zinc
- Recovery < 50% → Séance légère max, max 3 tâches prioritaires
- Recovery > 66% → Push intensité sport et travail
- Sommeil < 6h → Sieste 20min recommandée, pas de décisions importantes après 15h
- Énergie basse + pas de sport → Proposer marche légère pour relancer

FORMAT DE RÉPONSE (JSON strict):
{
  "synthese": "Une phrase percutante sur l'état général et le plan",
  "score_forme": 75,
  "sport": {
    "recommendation": "Ce que faire ou NE PAS faire",
    "intensity": "none|light|moderate|intense",
    "duration": "durée recommandée",
    "alternative": "alternative si applicable"
  },
  "nutrition": {
    "priority": "Conseil nutrition principal",
    "meals": ["Petit-déj recommandé", "Déjeuner", "Dîner"],
    "hydration": "Objectif hydratation",
    "supplements": ["supplément 1", "supplément 2"]
  },
  "travail": {
    "mode": "deep_work|normal|light|minimal",
    "max_tasks": 3,
    "peak_hours": "9h-12h",
    "avoid": "Ce qu'il faut éviter",
    "tip": "Conseil productivité"
  },
  "sommeil": {
    "target_bedtime": "22:30",
    "pre_sleep_routine": ["Action 1", "Action 2"],
    "avoid_after": "21h: liste des choses à éviter"
  },
  "alertes": ["Alerte importante 1", "Alerte 2 si applicable"]
}`;

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.9
            }
        })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    
    return null;
}

/**
 * Prescription basée sur des règles (fallback)
 */
function generateRuleBasedPrescription(context) {
    const { whoop, checkin, fitness, tasks, userAnswers, anomalies } = context;
    
    const recovery = whoop.recovery;
    const hasAlcohol = userAnswers?.alcohol === true || userAnswers?.alcohol === 'yes';
    const isSick = userAnswers?.sick === true || userAnswers?.cause === 'Maladie';
    const sleepHours = whoop.sleepHours || checkin.yesterday?.sleep * 1.5 || 7;
    
    let prescription = {
        synthese: '',
        score_forme: 70,
        sport: { recommendation: '', intensity: 'moderate', duration: '45-60min' },
        nutrition: { priority: '', meals: [], hydration: '2L minimum', supplements: [] },
        travail: { mode: 'normal', max_tasks: 5, peak_hours: '9h-12h', tip: '' },
        sommeil: { target_bedtime: '22:30', pre_sleep_routine: [], avoid_after: '' },
        alertes: []
    };
    
    // === RÈGLES RECOVERY ===
    if (recovery !== null && recovery < 33) {
        prescription.score_forme = Math.min(40, recovery + 10);
        prescription.synthese = `Recovery critique (${recovery}%). Journée en mode récupération.`;
        prescription.sport = {
            recommendation: '🚫 Pas d\'entraînement intense aujourd\'hui',
            intensity: hasAlcohol ? 'none' : 'light',
            duration: hasAlcohol ? '0' : '20-30min marche',
            alternative: 'Marche légère ou étirements seulement'
        };
        prescription.travail = {
            mode: 'minimal',
            max_tasks: 2,
            peak_hours: '10h-12h uniquement',
            avoid: 'Réunions importantes, décisions complexes',
            tip: 'Fais le strict minimum, ton corps a besoin de repos'
        };
        prescription.alertes.push('⚠️ Journée récupération obligatoire');
        
        if (hasAlcohol) {
            prescription.nutrition = {
                priority: '🥤 Hydratation massive - électrolytes',
                meals: ['Oeufs + toast (choline pour le foie)', 'Repas léger protéiné', 'Souper tôt et léger'],
                hydration: '3L minimum + électrolytes',
                supplements: ['NAC', 'Vitamine B', 'Magnésium']
            };
            prescription.alertes.push('🍷 Alcool détecté - protocole détox activé');
        }
        
        if (isSick) {
            prescription.sport = { recommendation: '🛌 Repos total', intensity: 'none', duration: '0' };
            prescription.nutrition.supplements = ['Vitamine C 1000mg', 'Zinc', 'Vitamine D'];
            prescription.alertes.push('🤒 Maladie - repos total recommandé');
        }
    }
    else if (recovery !== null && recovery < 66) {
        prescription.score_forme = Math.min(65, recovery);
        prescription.synthese = `Recovery modérée (${recovery}%). Journée équilibrée sans forcer.`;
        prescription.sport = {
            recommendation: 'Séance légère à modérée OK',
            intensity: 'moderate',
            duration: '45-60min',
            alternative: 'Si fatigue, remplace par cardio léger'
        };
        prescription.travail = {
            mode: 'normal',
            max_tasks: 4,
            peak_hours: '9h-13h',
            tip: 'Alterne focus et pauses'
        };
    }
    else if (recovery !== null && recovery >= 66) {
        prescription.score_forme = Math.min(95, recovery + 10);
        prescription.synthese = `Recovery excellente (${recovery}%) ! Capitalise sur cette énergie.`;
        prescription.sport = {
            recommendation: '🔥 Entraînement intense recommandé',
            intensity: 'intense',
            duration: '60-90min',
            alternative: null
        };
        prescription.travail = {
            mode: 'deep_work',
            max_tasks: 7,
            peak_hours: '8h-12h puis 14h-17h',
            tip: 'Attaque tes tâches les plus difficiles ce matin'
        };
        prescription.alertes.push('🚀 Journée haute performance - profites-en !');
    }
    else {
        // Pas de données Whoop, utiliser les check-ins
        const energy = checkin.yesterday?.energy || checkin.avgEnergy || 3;
        prescription.score_forme = energy * 18;
        prescription.synthese = `Énergie ${energy}/5. Journée standard avec adaptation.`;
    }
    
    // === RÈGLES SOMMEIL ===
    if (sleepHours < 6) {
        prescription.sommeil = {
            target_bedtime: '21:30',
            pre_sleep_routine: ['Pas d\'écran après 20h', 'Tisane relaxante', 'Lecture 20min'],
            avoid_after: '20h: café, écrans, sport intense'
        };
        prescription.travail.tip += ' Évite les décisions importantes après 15h.';
        prescription.alertes.push('😴 Déficit de sommeil - coucher tôt ce soir');
    }
    
    // === RÈGLES ACTIVITÉ ===
    if (fitness.daysSinceLastWorkout >= 4 && prescription.sport.intensity !== 'none') {
        prescription.alertes.push(`🏃 ${fitness.daysSinceLastWorkout} jours sans sport - reprends doucement`);
        if (prescription.sport.intensity === 'intense') {
            prescription.sport.intensity = 'moderate';
            prescription.sport.recommendation = 'Reprise progressive après pause';
        }
    }
    
    return prescription;
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉMOIRE - Sauvegarde et apprentissage des patterns
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crée un log de la journée pour la mémoire
 */
export function createDailyLog(state, answers, prescription, outcomes = {}) {
    return {
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        state: {
            recovery: state.whoop.recovery,
            sleepHours: state.whoop.sleepHours,
            energy: state.checkin.yesterday?.energy,
            hrv: state.whoop.hrv
        },
        anomalies: state.anomalies.map(a => a.type),
        answers,
        prescription: {
            sport: prescription.sport?.intensity,
            workMode: prescription.travail?.mode,
            score: prescription.score_forme
        },
        outcomes, // À remplir en fin de journée
        summary: generateDaySummary(state, answers, prescription)
    };
}

/**
 * Génère un résumé textuel de la journée
 */
function generateDaySummary(state, answers, prescription) {
    const parts = [];
    
    if (state.whoop.recovery) {
        parts.push(`Recovery ${state.whoop.recovery}%`);
    }
    
    if (answers?.alcohol) parts.push('Alcool');
    if (answers?.sick || answers?.cause === 'Maladie') parts.push('Maladie');
    if (answers?.stress === 'Élevé' || answers?.stress === 'Très élevé') parts.push('Stress élevé');
    
    if (prescription.sport?.intensity === 'none') parts.push('Repos sport');
    if (prescription.travail?.mode === 'minimal') parts.push('Travail minimal');
    
    return parts.join(' + ') || 'Journée normale';
}

/**
 * Analyse la mémoire pour détecter des patterns
 */
export function analyzeMemoryPatterns(memory) {
    if (memory.length < 7) {
        return { hasEnoughData: false, patterns: [] };
    }
    
    const patterns = [];
    
    // Pattern: Alcool → Recovery basse le lendemain
    const alcoholDays = memory.filter(m => m.answers?.alcohol);
    if (alcoholDays.length >= 2) {
        const avgRecoveryAfterAlcohol = alcoholDays
            .map(m => m.state.recovery)
            .filter(r => r !== null)
            .reduce((a, b, _, arr) => a + b / arr.length, 0);
        
        if (avgRecoveryAfterAlcohol < 50) {
            patterns.push({
                type: 'alcohol_impact',
                message: `L'alcool fait chuter ta recovery à ${Math.round(avgRecoveryAfterAlcohol)}% en moyenne`,
                recommendation: 'Limite l\'alcool si tu veux performer le lendemain'
            });
        }
    }
    
    // Pattern: Jours de la semaine
    const dayStats = {};
    memory.forEach(m => {
        const day = new Date(m.date).getDay();
        if (!dayStats[day]) dayStats[day] = [];
        if (m.state.recovery) dayStats[day].push(m.state.recovery);
    });
    
    // Trouver les meilleurs/pires jours
    const dayAvgs = Object.entries(dayStats)
        .filter(([_, recoveries]) => recoveries.length >= 2)
        .map(([day, recoveries]) => ({
            day: parseInt(day),
            avg: recoveries.reduce((a, b) => a + b, 0) / recoveries.length
        }))
        .sort((a, b) => b.avg - a.avg);
    
    if (dayAvgs.length >= 2) {
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const best = dayAvgs[0];
        const worst = dayAvgs[dayAvgs.length - 1];
        
        if (best.avg - worst.avg > 15) {
            patterns.push({
                type: 'weekly_pattern',
                message: `Tu récupères mieux le ${dayNames[best.day]} (${Math.round(best.avg)}%) que le ${dayNames[worst.day]} (${Math.round(worst.avg)}%)`,
                recommendation: `Planifie tes efforts importants autour du ${dayNames[best.day]}`
            });
        }
    }
    
    return { hasEnoughData: true, patterns };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getLast(n) {
    const days = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTÈME DE BILAN DU SOIR - Ferme la boucle d'apprentissage
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Détermine quel type de coaching afficher selon l'heure
 */
export function getCoachingMode() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return 'morning'; // Coaching matin: Prescription
    } else if (hour >= 12 && hour < 18) {
        return 'afternoon'; // Check-in rapide optionnel
    } else if (hour >= 18 && hour < 23) {
        return 'evening'; // Bilan du soir: Retour d'expérience
    } else {
        return 'night'; // Rappel de se coucher
    }
}

/**
 * Génère les questions du bilan du soir
 */
export function generateEveningReview(morningPrescription, todayData) {
    const { workoutLogs, tasks, checkins, meals } = todayData;
    const today = new Date().toISOString().split('T')[0];
    
    const todayWorkouts = workoutLogs?.filter(w => w.date === today) || [];
    const todayTasks = tasks?.filter(t => t.due_date === today) || [];
    const completedTasks = todayTasks.filter(t => t.completed).length;
    const todayCheckin = checkins?.[today];
    
    const questions = [];
    const outcomes = {
        sport_done: todayWorkouts.length > 0,
        tasks_completed: completedTasks,
        tasks_total: todayTasks.length
    };
    
    // Question 1: Suivi de la prescription sport
    if (morningPrescription?.sport) {
        const recommendedIntensity = morningPrescription.sport.intensity;
        
        if (recommendedIntensity === 'none' || recommendedIntensity === 'light') {
            questions.push({
                id: 'sport_compliance',
                text: 'As-tu respecté le repos recommandé ?',
                type: 'yesno',
                context: `Ce matin je t'avais conseillé: ${morningPrescription.sport.recommendation}`
            });
        } else {
            questions.push({
                id: 'sport_done',
                text: 'As-tu fait ta séance sport ?',
                type: 'yesno',
                autoAnswer: todayWorkouts.length > 0 ? true : undefined
            });
            
            if (todayWorkouts.length > 0) {
                questions.push({
                    id: 'sport_feeling',
                    text: 'Comment tu t\'es senti pendant la séance ?',
                    options: ['🔥 En feu', '👍 Bien', '😐 Moyen', '😓 Difficile', '💀 Horrible']
                });
            }
        }
    }
    
    // Question 2: Énergie de la journée
    questions.push({
        id: 'day_energy',
        text: 'Comment était ton énergie globale aujourd\'hui ?',
        options: ['5 - Excellent', '4 - Bien', '3 - Moyen', '2 - Fatigué', '1 - Épuisé'],
        autoAnswer: todayCheckin?.energy ? `${todayCheckin.energy}` : undefined
    });
    
    // Question 3: Productivité
    if (todayTasks.length > 0) {
        const completionRate = Math.round((completedTasks / todayTasks.length) * 100);
        questions.push({
            id: 'productivity_feeling',
            text: `Tu as fait ${completedTasks}/${todayTasks.length} tâches (${completionRate}%). Content de ta productivité ?`,
            options: ['Très satisfait', 'Satisfait', 'Mitigé', 'Déçu']
        });
    }
    
    // Question 4: Prescription suivie ?
    if (morningPrescription?.travail?.max_tasks) {
        questions.push({
            id: 'overworked',
            text: 'Tu t\'es senti débordé aujourd\'hui ?',
            type: 'yesno'
        });
    }
    
    // Question 5: Plan pour ce soir
    questions.push({
        id: 'evening_plan',
        text: 'Comment tu comptes passer la soirée ?',
        options: ['🛋️ Repos tranquille', '👥 Sortie/Soirée', '💻 Encore du travail', '🏃 Sport', '📺 Écrans/Netflix']
    });
    
    // Question optionnelle: Alcool prévu
    questions.push({
        id: 'alcohol_planned',
        text: 'Alcool prévu ce soir ?',
        type: 'yesno',
        impact: 'Utile pour anticiper ta recovery de demain'
    });
    
    return {
        type: 'evening_review',
        greeting: {
            greeting: 'Bonsoir Théo',
            mainMessage: 'C\'est l\'heure du bilan ! 📊',
            subMessage: 'Quelques questions pour améliorer mes conseils de demain.'
        },
        questions,
        outcomes,
        morningPrescription
    };
}

/**
 * Analyse les réponses du soir et met à jour la mémoire
 */
export async function processEveningReview(answers, morningPrescription, state, memory) {
    // Calculer le score de compliance (a-t-il suivi les recommandations?)
    let complianceScore = 50; // Base
    
    if (answers.sport_compliance === true || answers.sport_done === true) {
        complianceScore += 20;
    }
    if (answers.day_energy && parseInt(answers.day_energy) >= 3) {
        complianceScore += 15;
    }
    if (answers.productivity_feeling === 'Très satisfait' || answers.productivity_feeling === 'Satisfait') {
        complianceScore += 15;
    }
    
    // Prédiction pour demain basée sur les réponses du soir
    const tomorrowPrediction = {
        expected_recovery: 'medium',
        risks: [],
        recommendations: []
    };
    
    if (answers.alcohol_planned === true) {
        tomorrowPrediction.expected_recovery = 'low';
        tomorrowPrediction.risks.push('Alcool prévu → Recovery basse probable demain');
        tomorrowPrediction.recommendations.push('Limite-toi à 2-3 verres max');
        tomorrowPrediction.recommendations.push('Arrête l\'alcool 3h avant de dormir');
    }
    
    if (answers.evening_plan === '💻 Encore du travail') {
        tomorrowPrediction.risks.push('Travail tardif → Risque de sommeil perturbé');
        tomorrowPrediction.recommendations.push('Fixe-toi une heure limite (ex: 21h)');
    }
    
    if (answers.evening_plan === '📺 Écrans/Netflix') {
        tomorrowPrediction.risks.push('Écrans tardifs → Mélatonine retardée');
        tomorrowPrediction.recommendations.push('Mode nuit + arrêt 1h avant coucher');
    }
    
    if (answers.overworked === true) {
        tomorrowPrediction.recommendations.push('Demain: max 3 tâches prioritaires');
    }
    
    // Générer un insight si on a assez de données
    let insight = null;
    if (memory.length >= 7) {
        // Chercher des corrélations
        const daysWithAlcohol = memory.filter(m => m.answers?.alcohol === true || m.answers?.alcohol_planned === true);
        const daysWithoutAlcohol = memory.filter(m => m.answers?.alcohol !== true && m.answers?.alcohol_planned !== true);
        
        if (daysWithAlcohol.length >= 3 && daysWithoutAlcohol.length >= 3) {
            const avgRecoveryWithAlcohol = daysWithAlcohol
                .map(m => m.state?.recovery)
                .filter(r => r !== null && r !== undefined)
                .reduce((a, b, _, arr) => a + b / arr.length, 0);
            
            const avgRecoveryWithoutAlcohol = daysWithoutAlcohol
                .map(m => m.state?.recovery)
                .filter(r => r !== null && r !== undefined)
                .reduce((a, b, _, arr) => a + b / arr.length, 0);
            
            if (avgRecoveryWithoutAlcohol - avgRecoveryWithAlcohol > 10) {
                insight = {
                    type: 'alcohol_correlation',
                    message: `📊 Insight: Quand tu bois, ta recovery moyenne chute de ${Math.round(avgRecoveryWithoutAlcohol)}% à ${Math.round(avgRecoveryWithAlcohol)}% (-${Math.round(avgRecoveryWithoutAlcohol - avgRecoveryWithAlcohol)} points)`,
                    confidence: Math.min(0.9, daysWithAlcohol.length / 10)
                };
            }
        }
    }
    
    return {
        complianceScore,
        tomorrowPrediction,
        insight,
        answers,
        processedAt: new Date().toISOString()
    };
}

/**
 * Message de rappel nocturne
 */
export function generateNightReminder(prescription) {
    const hour = new Date().getHours();
    const targetBedtime = prescription?.sommeil?.target_bedtime || '22:30';
    const [targetHour] = targetBedtime.split(':').map(Number);
    
    if (hour >= targetHour) {
        return {
            type: 'night_reminder',
            urgent: true,
            message: `⏰ Il est ${hour}h et ton coucher recommandé était ${targetBedtime}. File au lit !`,
            tips: prescription?.sommeil?.pre_sleep_routine || ['Pas d\'écran', 'Chambre fraîche']
        };
    }
    
    const minutesUntilBed = (targetHour - hour) * 60;
    if (minutesUntilBed <= 60) {
        return {
            type: 'night_reminder',
            urgent: false,
            message: `🌙 Plus que ~${minutesUntilBed}min avant ton coucher optimal (${targetBedtime})`,
            tips: prescription?.sommeil?.pre_sleep_routine || []
        };
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNTHÈSE HEBDOMADAIRE - Chaque dimanche soir
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère un rapport hebdomadaire avec les patterns et apprentissages
 */
export async function generateWeeklySummary(memory, patterns) {
    const last7Days = getLast(7);
    const weekMemory = memory.filter(m => last7Days.includes(m.date));
    
    if (weekMemory.length < 3) {
        return {
            hasEnoughData: false,
            message: 'Pas assez de données cette semaine pour un rapport complet.'
        };
    }
    
    // Stats de la semaine
    const avgRecovery = weekMemory
        .map(m => m.recovery_score || m.state?.recovery)
        .filter(r => r !== null && r !== undefined)
        .reduce((a, b, _, arr) => a + b / arr.length, 0);
    
    const avgEnergy = weekMemory
        .map(m => m.energy_level || m.state?.energy)
        .filter(e => e !== null && e !== undefined)
        .reduce((a, b, _, arr) => a + b / arr.length, 0);
    
    const workoutDays = weekMemory.filter(m => 
        m.answers?.sport_done === true || 
        m.outcomes?.sport_done === true
    ).length;
    
    const alcoholDays = weekMemory.filter(m => 
        m.answers?.alcohol === true || 
        m.answers?.alcohol_planned === true
    ).length;
    
    // Générer le résumé avec l'IA si disponible
    try {
        if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here') {
            const prompt = `Tu es un coach de performance. Génère un résumé hebdomadaire personnalisé.

DONNÉES DE LA SEMAINE:
- Recovery moyenne: ${avgRecovery.toFixed(0)}%
- Énergie moyenne: ${avgEnergy.toFixed(1)}/5
- Jours avec sport: ${workoutDays}/7
- Jours avec alcool: ${alcoholDays}/7
- Patterns détectés: ${patterns.map(p => p.description).join(', ') || 'Aucun'}

Logs détaillés:
${weekMemory.map(m => `${m.date}: Recovery ${m.recovery_score || '?'}%, ${m.summary || 'N/A'}`).join('\n')}

FORMAT (JSON):
{
  "titre": "Titre accrocheur de la semaine",
  "score_semaine": 75,
  "points_forts": ["Point fort 1", "Point fort 2"],
  "points_amelioration": ["À améliorer 1", "À améliorer 2"],
  "objectif_semaine_prochaine": "Un objectif SMART",
  "message_motivation": "Message personnalisé"
}`;

            const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 600 }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const summary = JSON.parse(jsonMatch[0]);
                    return {
                        hasEnoughData: true,
                        ...summary,
                        stats: { avgRecovery, avgEnergy, workoutDays, alcoholDays }
                    };
                }
            }
        }
    } catch (e) {
        console.warn('Weekly summary AI failed:', e);
    }
    
    // Fallback sans IA
    return {
        hasEnoughData: true,
        titre: avgRecovery >= 60 ? '✅ Bonne semaine !' : '⚠️ Semaine difficile',
        score_semaine: Math.round(avgRecovery * 0.5 + avgEnergy * 10 + workoutDays * 5),
        points_forts: [
            workoutDays >= 4 ? `${workoutDays} jours de sport 💪` : null,
            avgRecovery >= 60 ? `Recovery moyenne solide (${avgRecovery.toFixed(0)}%)` : null,
            alcoholDays <= 1 ? 'Peu d\'alcool cette semaine' : null
        ].filter(Boolean),
        points_amelioration: [
            workoutDays < 4 ? 'Plus de régularité au sport' : null,
            avgRecovery < 50 ? 'Améliorer la qualité du sommeil' : null,
            alcoholDays >= 3 ? 'Réduire la consommation d\'alcool' : null
        ].filter(Boolean),
        objectif_semaine_prochaine: workoutDays < 4 
            ? `Objectif: ${Math.min(6, workoutDays + 2)} séances sport` 
            : 'Maintenir le rythme actuel',
        stats: { avgRecovery, avgEnergy, workoutDays, alcoholDays }
    };
}

export default {
    analyzeCurrentState,
    generateEnquiryQuestions,
    generatePrescription,
    createDailyLog,
    analyzeMemoryPatterns,
    // Nouveaux exports pour le cycle complet
    getCoachingMode,
    generateEveningReview,
    processEveningReview,
    generateNightReminder,
    generateWeeklySummary
};
