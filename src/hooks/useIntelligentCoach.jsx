// ═══════════════════════════════════════════════════════════════════════════
// 🧠 TITAN.OS - Hook React pour le Coaching Intelligent
// ═══════════════════════════════════════════════════════════════════════════
// Cycle complet: Matin (Prescription) → Soir (Bilan) → Apprentissage
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import IntelligentCoach from '../services/intelligentCoach.js';

// Supabase client (utiliser celui déjà défini dans App.jsx)
const SUPABASE_URL = 'https://nzejiljpfdslouvehvin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZWppbGpwZmRzbG91dmVodmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMzOTEsImV4cCI6MjA3OTU2OTM5MX0.vJV8mDV-5ksA76q5cOFpC6Wc4dJGR_8ssrPLYqgkFl4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Hook principal pour le système de coaching intelligent
 * Gère le cycle complet: Matin → Soir → Apprentissage
 */
export function useIntelligentCoach(userId, allData) {
    const [state, setState] = useState(null);
    const [enquiry, setEnquiry] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [eveningReview, setEveningReview] = useState(null);
    const [nightReminder, setNightReminder] = useState(null);
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [memory, setMemory] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('loading'); 
    // Steps: loading, greeting, enquiry, prescription, evening_review, night_reminder, weekly_summary, done
    const [answers, setAnswers] = useState({});
    const [coachingMode, setCoachingMode] = useState('morning');

    const todayStr = new Date().toISOString().split('T')[0];
    const isSunday = new Date().getDay() === 0;

    // ═══ Charger la mémoire depuis Supabase ═══
    useEffect(() => {
        const loadMemory = async () => {
            try {
                const { data: memoryData, error: memoryError } = await supabase
                    .from('coach_memory')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false })
                    .limit(30);

                if (!memoryError && memoryData) {
                    setMemory(memoryData);
                }

                const { data: patternsData, error: patternsError } = await supabase
                    .from('coach_patterns')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_active', true);

                if (!patternsError && patternsData) {
                    setPatterns(patternsData);
                }
            } catch (e) {
                console.warn('Failed to load coach memory:', e);
            }
        };

        loadMemory();
    }, [userId]);

    // ═══ Déterminer le mode de coaching selon l'heure ═══
    useEffect(() => {
        const mode = IntelligentCoach.getCoachingMode();
        setCoachingMode(mode);
    }, []);

    // ═══ Analyser et décider quoi afficher ═══
    useEffect(() => {
        if (!allData) return;

        const analyze = async () => {
            setLoading(true);
            try {
                // Étape 1: Analyser l'état actuel
                const currentState = IntelligentCoach.analyzeCurrentState(allData);
                setState(currentState);

                // Récupérer la mémoire d'aujourd'hui
                const todayMemory = memory.find(m => m.date === todayStr);
                const mode = IntelligentCoach.getCoachingMode();

                // ═══ LOGIQUE SELON L'HEURE ═══

                // MATIN (5h-12h): Prescription
                if (mode === 'morning') {
                    if (todayMemory && todayMemory.prescription && Object.keys(todayMemory.prescription).length > 0) {
                        // Déjà fait ce matin, afficher la prescription existante
                        setPrescription(todayMemory.prescription);
                        setAnswers(todayMemory.answers || {});
                        setStep('done');
                    } else {
                        // Nouveau jour, générer l'enquête
                        const enquiryResult = await IntelligentCoach.generateEnquiryQuestions(currentState, memory);
                        setEnquiry(enquiryResult);
                        setStep(enquiryResult.needsEnquiry ? 'greeting' : 'prescription');
                        
                        if (!enquiryResult.needsEnquiry) {
                            const prescriptionResult = await IntelligentCoach.generatePrescription(
                                currentState, {}, allData.todaySchedule, memory
                            );
                            setPrescription(prescriptionResult);
                        }
                    }
                }
                
                // APRÈS-MIDI (12h-18h): Rappel discret ou rien
                else if (mode === 'afternoon') {
                    if (todayMemory?.prescription) {
                        setPrescription(todayMemory.prescription);
                    }
                    setStep('done'); // Pas de popup intrusif l'après-midi
                }
                
                // SOIR (18h-23h): Bilan de la journée
                else if (mode === 'evening') {
                    if (todayMemory?.outcomes && Object.keys(todayMemory.outcomes).length > 0) {
                        // Bilan déjà fait
                        setStep('done');
                    } else if (todayMemory?.prescription) {
                        // Prescription du matin existe, proposer le bilan
                        const review = IntelligentCoach.generateEveningReview(todayMemory.prescription, allData);
                        setEveningReview(review);
                        setStep('evening_review');
                    } else {
                        // Pas de prescription ce matin, bilan simplifié
                        const review = IntelligentCoach.generateEveningReview(null, allData);
                        setEveningReview(review);
                        setStep('evening_review');
                    }
                    
                    // Dimanche soir = Synthèse hebdo
                    if (isSunday && memory.length >= 5) {
                        const summary = await IntelligentCoach.generateWeeklySummary(memory, patterns);
                        setWeeklySummary(summary);
                    }
                }
                
                // NUIT (23h-5h): Rappel de coucher
                else if (mode === 'night') {
                    const reminder = IntelligentCoach.generateNightReminder(todayMemory?.prescription || prescription);
                    if (reminder) {
                        setNightReminder(reminder);
                        setStep('night_reminder');
                    } else {
                        setStep('done');
                    }
                }

            } catch (e) {
                console.error('Coach analysis failed:', e);
                setStep('error');
            } finally {
                setLoading(false);
            }
        };

        analyze();
    }, [allData, memory, todayStr, isSunday]);

    // ═══ Actions du matin ═══
    const startEnquiry = useCallback(() => {
        setStep('enquiry');
    }, []);

    const answerQuestion = useCallback((questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    }, []);

    const submitAnswers = useCallback(async () => {
        if (!state) return;

        setLoading(true);
        try {
            const prescriptionResult = await IntelligentCoach.generatePrescription(
                state, answers, allData?.todaySchedule, memory
            );
            setPrescription(prescriptionResult);

            // Sauvegarder dans Supabase
            const dailyLog = IntelligentCoach.createDailyLog(state, answers, prescriptionResult);
            
            await supabase.from('coach_memory').upsert({
                user_id: userId,
                date: todayStr,
                recovery_score: state.whoop.recovery,
                sleep_hours: state.whoop.sleepHours,
                hrv: state.whoop.hrv,
                energy_level: state.checkin.yesterday?.energy,
                mood_level: state.checkin.yesterday?.mood,
                anomalies: state.anomalies,
                answers: answers,
                prescription: prescriptionResult,
                summary: dailyLog.summary
            }, { onConflict: 'user_id,date' });

            // Analyser les patterns
            const newPatterns = IntelligentCoach.analyzeMemoryPatterns([...memory, dailyLog]);
            if (newPatterns.hasEnoughData && newPatterns.patterns.length > 0) {
                for (const pattern of newPatterns.patterns) {
                    await supabase.from('coach_patterns').upsert({
                        user_id: userId,
                        pattern_type: pattern.type,
                        description: pattern.message,
                        recommendation: pattern.recommendation,
                        last_updated: new Date().toISOString()
                    }, { onConflict: 'user_id,pattern_type' });
                }
            }

            setStep('prescription');
        } catch (e) {
            console.error('Failed to generate prescription:', e);
        } finally {
            setLoading(false);
        }
    }, [state, answers, allData, memory, userId, todayStr]);

    const skipEnquiry = useCallback(async () => {
        if (!state) return;

        setLoading(true);
        try {
            const prescriptionResult = await IntelligentCoach.generatePrescription(
                state, {}, allData?.todaySchedule, memory
            );
            setPrescription(prescriptionResult);
            setStep('prescription');
        } catch (e) {
            console.error('Failed to generate prescription:', e);
        } finally {
            setLoading(false);
        }
    }, [state, allData, memory]);

    // ═══ Actions du soir ═══
    const submitEveningReview = useCallback(async () => {
        if (!eveningReview) return;

        setLoading(true);
        try {
            const todayMemory = memory.find(m => m.date === todayStr);
            
            // Essayer de processer avec IntelligentCoach
            let reviewResult = null;
            try {
                reviewResult = await IntelligentCoach.processEveningReview(
                    answers, 
                    todayMemory?.prescription || prescription,
                    state,
                    memory
                );
            } catch (processError) {
                console.warn('IntelligentCoach.processEveningReview failed, using fallback:', processError);
                // Fallback: créer un résultat simple basé sur les réponses
                reviewResult = {
                    date: todayStr,
                    answers: answers,
                    completed: true,
                    timestamp: new Date().toISOString()
                };
            }

            // Essayer de sauvegarder dans Supabase (optionnel - ne bloque pas si ça échoue)
            try {
                await supabase.from('coach_memory').upsert({
                    user_id: userId,
                    date: todayStr,
                    outcomes: reviewResult,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,date' });

                // Sauvegarder l'insight si généré
                if (reviewResult?.insight) {
                    await supabase.from('coach_insights').insert({
                        user_id: userId,
                        date: todayStr,
                        insight_type: 'pattern',
                        content: reviewResult.insight
                    });
                }
            } catch (supabaseError) {
                console.warn('Supabase save failed (non-blocking):', supabaseError);
                // Continue quand même - l'enregistrement local compte
            }

            // Afficher la synthèse hebdo si dimanche, sinon attendre un peu pour le feedback
            if (weeklySummary && weeklySummary.hasEnoughData) {
                // Petit délai pour voir le feedback "Enregistré"
                await new Promise(resolve => setTimeout(resolve, 800));
                setStep('weekly_summary');
            } else {
                // Petit délai pour voir le feedback "Enregistré"
                await new Promise(resolve => setTimeout(resolve, 1200));
                setStep('done');
            }
            
            // Reset answers pour la prochaine fois
            setAnswers({});
            
        } catch (e) {
            console.error('Failed to submit evening review:', e);
            // Même en cas d'erreur, on ferme le formulaire pour ne pas bloquer l'utilisateur
            setStep('done');
        } finally {
            setLoading(false);
        }
    }, [eveningReview, answers, prescription, state, memory, userId, todayStr, weeklySummary]);

    // ═══ Actions générales ═══
    const dismissCoach = useCallback(() => {
        setStep('done');
    }, []);

    const resetCoach = useCallback(() => {
        setAnswers({});
        setPrescription(null);
        setEveningReview(null);
        const mode = IntelligentCoach.getCoachingMode();
        setStep(mode === 'evening' ? 'evening_review' : 'greeting');
    }, []);

    // ═══ Forcer un mode spécifique (pour debug) ═══
    const forceMode = useCallback((mode) => {
        setCoachingMode(mode);
        if (mode === 'evening' && eveningReview) {
            setStep('evening_review');
        } else if (mode === 'morning' && enquiry) {
            setStep('greeting');
        }
    }, [eveningReview, enquiry]);

    return {
        // État
        state,
        enquiry,
        prescription,
        eveningReview,
        nightReminder,
        weeklySummary,
        memory,
        patterns,
        loading,
        step,
        answers,
        coachingMode,

        // Actions matin
        startEnquiry,
        answerQuestion,
        submitAnswers,
        skipEnquiry,

        // Actions soir
        submitEveningReview,

        // Actions générales
        dismissCoach,
        resetCoach,
        forceMode
    };
}

/**
 * Composant pour afficher la prescription
 */
export function PrescriptionCard({ prescription }) {
    if (!prescription) return null;

    const getSeverityColor = (score) => {
        if (score >= 70) return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
        if (score >= 50) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
    };

    const getIntensityIcon = (intensity) => {
        const icons = { none: '🚫', light: '🚶', moderate: '🏃', intense: '🔥' };
        return icons[intensity] || '💪';
    };

    const getModeIcon = (mode) => {
        const icons = { deep_work: '🎯', normal: '💻', light: '📱', minimal: '😴' };
        return icons[mode] || '📋';
    };

    return (
        <div className={`rounded-2xl bg-gradient-to-br ${getSeverityColor(prescription.score_forme)} border p-5`}>
            {/* Header avec score */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-white font-bold text-lg">Plan du Jour</h3>
                    <p className="text-gray-400 text-sm">{prescription.synthese}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-white">{prescription.score_forme}</div>
                    <div className="text-xs text-gray-400">Score Forme</div>
                </div>
            </div>

            {/* Alertes */}
            {prescription.alertes && prescription.alertes.length > 0 && (
                <div className="mb-4 space-y-2">
                    {prescription.alertes.map((alerte, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white">
                            {alerte}
                        </div>
                    ))}
                </div>
            )}

            {/* Grille des recommandations */}
            <div className="grid grid-cols-2 gap-3">
                {/* Sport */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getIntensityIcon(prescription.sport?.intensity)}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">Sport</span>
                    </div>
                    <p className="text-white text-sm font-medium">{prescription.sport?.recommendation}</p>
                    {prescription.sport?.duration && (
                        <p className="text-gray-400 text-xs mt-1">{prescription.sport.duration}</p>
                    )}
                </div>

                {/* Travail */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getModeIcon(prescription.travail?.mode)}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">Travail</span>
                    </div>
                    <p className="text-white text-sm font-medium">Max {prescription.travail?.max_tasks} tâches</p>
                    <p className="text-gray-400 text-xs mt-1">{prescription.travail?.tip}</p>
                </div>

                {/* Nutrition */}
                {prescription.nutrition && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🥗</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Nutrition</span>
                        </div>
                        <p className="text-white text-sm font-medium">{prescription.nutrition.priority}</p>
                        <p className="text-gray-400 text-xs mt-1">{prescription.nutrition.hydration}</p>
                    </div>
                )}

                {/* Sommeil */}
                {prescription.sommeil && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🌙</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Sommeil</span>
                        </div>
                        <p className="text-white text-sm font-medium">Coucher {prescription.sommeil.target_bedtime}</p>
                        <p className="text-gray-400 text-xs mt-1">{prescription.sommeil.avoid_after}</p>
                    </div>
                )}
            </div>

            {/* Suppléments si présents */}
            {prescription.nutrition?.supplements && prescription.nutrition.supplements.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="text-xs text-purple-400 font-bold mb-2">💊 SUPPLÉMENTS RECOMMANDÉS</div>
                    <div className="flex flex-wrap gap-2">
                        {prescription.nutrition.supplements.map((supp, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs">
                                {supp}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Composant pour le bilan du soir
 */
export function EveningReviewCard({ review, answers, onAnswer, onSubmit, loading }) {
    const [submitted, setSubmitted] = useState(false);
    
    if (!review) return null;

    const allQuestionsAnswered = review.questions.every(q => 
        answers[q.id] !== undefined || q.autoAnswer !== undefined
    );
    
    const handleSubmit = async () => {
        console.log('📊 EveningReview - Submitting with answers:', answers);
        console.log('📊 EveningReview - Questions:', review.questions.map(q => q.id));
        setSubmitted(true);
        await onSubmit();
    };

    return (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl">
                    📊
                </div>
                <div>
                    <h3 className="text-white font-bold">Bilan de la journée</h3>
                    <p className="text-gray-400 text-sm">{review.greeting?.subMessage || "Comment s'est passée ta journée ?"}</p>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 mb-4">
                {review.questions.map((q) => (
                    <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white text-sm font-medium mb-2">{q.text}</p>
                        {q.context && (
                            <p className="text-gray-500 text-xs mb-2 italic">{q.context}</p>
                        )}
                        
                        {q.type === 'yesno' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onAnswer(q.id, true)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                        (answers[q.id] === true || q.autoAnswer === true)
                                            ? 'bg-indigo-500 text-white' 
                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                                >
                                    Oui
                                </button>
                                <button
                                    onClick={() => onAnswer(q.id, false)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                        answers[q.id] === false
                                            ? 'bg-indigo-500 text-white' 
                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                                >
                                    Non
                                </button>
                            </div>
                        ) : q.type === 'scale' ? (
                            <div className="flex flex-wrap gap-2">
                                {(q.options || ['1', '2', '3', '4', '5']).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => onAnswer(q.id, opt)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            answers[q.id] === opt 
                                                ? 'bg-indigo-500 text-white' 
                                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {q.options?.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => onAnswer(q.id, opt)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            answers[q.id] === opt 
                                                ? 'bg-indigo-500 text-white' 
                                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {q.impact && (
                            <p className="text-gray-500 text-xs mt-2">ℹ️ {q.impact}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || loading || submitted}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                    submitted
                        ? 'bg-green-500 text-white animate-pulse'
                        : allQuestionsAnswered && !loading
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
                            : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
            >
                {submitted ? '✓ Bilan enregistré ! Fermeture...' : loading ? 'Enregistrement...' : 'Enregistrer mon bilan'}
            </button>
            
            {/* Debug info - à retirer en prod */}
            {!allQuestionsAnswered && (
                <p className="text-xs text-red-400 mt-2 text-center">
                    Réponds à toutes les questions pour continuer
                </p>
            )}
        </div>
    );
}

/**
 * Composant pour la synthèse hebdomadaire
 */
export function WeeklySummaryCard({ summary, onDismiss }) {
    if (!summary || !summary.hasEnoughData) return null;

    return (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl">
                        📅
                    </div>
                    <div>
                        <h3 className="text-white font-bold">{summary.titre}</h3>
                        <p className="text-gray-400 text-sm">Synthèse de ta semaine</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-white">{summary.score_semaine}</div>
                    <div className="text-xs text-gray-400">Score</div>
                </div>
            </div>

            {/* Stats */}
            {summary.stats && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-white/5">
                        <div className="text-lg font-bold text-white">{summary.stats.avgRecovery?.toFixed(0) || '-'}%</div>
                        <div className="text-xs text-gray-400">Recovery</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                        <div className="text-lg font-bold text-white">{summary.stats.avgEnergy?.toFixed(1) || '-'}</div>
                        <div className="text-xs text-gray-400">Énergie</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                        <div className="text-lg font-bold text-white">{summary.stats.workoutDays || 0}</div>
                        <div className="text-xs text-gray-400">Sport</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                        <div className="text-lg font-bold text-white">{summary.stats.alcoholDays || 0}</div>
                        <div className="text-xs text-gray-400">Alcool</div>
                    </div>
                </div>
            )}

            {/* Points forts */}
            {summary.points_forts && summary.points_forts.length > 0 && (
                <div className="mb-3">
                    <div className="text-xs text-green-400 font-bold mb-2">✅ POINTS FORTS</div>
                    <div className="space-y-1">
                        {summary.points_forts.map((point, i) => (
                            <div key={i} className="text-sm text-white pl-3 border-l-2 border-green-500/50">
                                {point}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Points à améliorer */}
            {summary.points_amelioration && summary.points_amelioration.length > 0 && (
                <div className="mb-3">
                    <div className="text-xs text-orange-400 font-bold mb-2">⚠️ À AMÉLIORER</div>
                    <div className="space-y-1">
                        {summary.points_amelioration.map((point, i) => (
                            <div key={i} className="text-sm text-white pl-3 border-l-2 border-orange-500/50">
                                {point}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Objectif semaine prochaine */}
            {summary.objectif_semaine_prochaine && (
                <div className="p-3 rounded-xl bg-white/10 border border-white/20 mb-4">
                    <div className="text-xs text-cyan-400 font-bold mb-1">🎯 OBJECTIF SEMAINE PROCHAINE</div>
                    <div className="text-white font-medium">{summary.objectif_semaine_prochaine}</div>
                </div>
            )}

            {/* Message motivation */}
            {summary.message_motivation && (
                <div className="text-center text-gray-300 italic text-sm mb-4">
                    "{summary.message_motivation}"
                </div>
            )}

            <button
                onClick={onDismiss}
                className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
                Fermer
            </button>
        </div>
    );
}

/**
 * Composant pour le rappel nocturne
 */
export function NightReminderCard({ reminder, onDismiss }) {
    if (!reminder) return null;

    return (
        <div className={`rounded-2xl p-5 ${
            reminder.urgent 
                ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' 
                : 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30'
        }`}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{reminder.urgent ? '⏰' : '🌙'}</span>
                <p className="text-white font-medium">{reminder.message}</p>
            </div>
            
            {reminder.tips && reminder.tips.length > 0 && (
                <div className="space-y-2 mb-4">
                    {reminder.tips.map((tip, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                            <span>•</span>
                            <span>{tip}</span>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={onDismiss}
                className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition-colors"
            >
                Compris, bonne nuit ! 😴
            </button>
        </div>
    );
}

export default useIntelligentCoach;
