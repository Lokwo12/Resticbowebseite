import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Heart, X, MapPin, Clock } from 'lucide-react';
import { Card } from './ui/card';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  timeCommitment: string;
  location: string;
  category: string;
  openPositions: number;
  benefits: string[];
}

interface VolunteerQuizModalProps {
  show: boolean;
  onClose: () => void;
  onApply: (opportunity: Opportunity) => void;
  opportunities: Opportunity[];
  settings: any;
}

export function VolunteerQuizModal({ show, onClose, onApply, opportunities, settings }: VolunteerQuizModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [match, setMatch] = useState<Opportunity | null>(null);

  if (!show) return null;

  const quizSettings = settings?.quiz || {};

  const questions = [
    {
      title: quizSettings.q1Text || 'What type of impact are you looking to make?',
      options: [
        { label: 'Healthcare & Medical', keywords: ['health', 'medical', 'clinic', 'nurs'] },
        { label: 'Education & Mentoring', keywords: ['education', 'teach', 'mentor', 'school'] },
        { label: 'Community Support', keywords: ['community', 'social', 'welfare', 'support'] },
        { label: 'Logistics & Admin', keywords: ['admin', 'organize', 'logistics', 'manage'] },
        { label: 'Anything! I just want to help', keywords: [] }
      ]
    },
    {
      title: quizSettings.q2Text || 'How much time can you commit?',
      options: [
        { label: 'A few hours a week', value: 'hours' },
        { label: 'Weekends only', value: 'weekends' },
        { label: 'Full-time / Intensive', value: 'fulltime' },
        { label: 'One-off events', value: 'events' }
      ]
    },
    {
      title: quizSettings.q3Text || 'What are your primary skills?',
      options: [
        { label: 'Medical / Healthcare Professional', value: 'medical' },
        { label: 'Teaching / Tutoring', value: 'teaching' },
        { label: 'Organization / Management', value: 'admin' },
        { label: 'Manual Labor / Physical Tasks', value: 'physical' },
        { label: 'No specific skills, ready to learn!', value: 'none' }
      ]
    }
  ];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateMatch(newAnswers);
    }
  };

  const calculateMatch = (finalAnswers: string[]) => {
    // Basic fuzzy matching algorithm
    // finalAnswers[0] is impact area keywords
    // We try to find an opportunity that matches the category or title
    
    let bestMatch = null;
    let maxScore = -1;

    // The first answer holds the label from questions[0]
    const impactAnswerLabel = finalAnswers[0];
    const impactOption = questions[0].options.find(o => o.label === impactAnswerLabel);
    const keywords = impactOption?.keywords || [];

    opportunities.forEach(opp => {
      let score = 0;
      
      const searchString = `${opp.category} ${opp.title} ${opp.description}`.toLowerCase();
      
      if (keywords.length === 0) {
        // "Anything" selected, just give everything a baseline score
        score += 1; 
      } else {
        keywords.forEach(kw => {
          if (searchString.includes(kw)) score += 3;
        });
      }

      // If they selected a specific time commitment, we could check opp.timeCommitment
      // For now, simple matching based primarily on Category/Keywords.
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = opp;
      }
    });

    if (!bestMatch && opportunities.length > 0) {
      // Fallback
      bestMatch = opportunities[0];
    }

    setMatch(bestMatch);
    setCurrentStep(currentStep + 1);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setMatch(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 bg-slate-100 p-2 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-heading text-slate-900 mb-2">
              {quizSettings.title || 'Find Your Perfect Role'}
            </h2>
            <p className="text-slate-500 text-sm">
              {quizSettings.subtitle || 'Answer 3 quick questions to see where you can make the biggest impact.'}
            </p>
          </div>

          <div className="relative h-[400px]">
            <AnimatePresence mode="wait">
              {currentStep < questions.length ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar"
                >
                  <div className="mb-6">
                    <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase mb-2 block">
                      Question {currentStep + 1} of {questions.length}
                    </span>
                    <h3 className="text-lg font-medium text-slate-900">
                      {questions[currentStep].title}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {questions[currentStep].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(option.label)}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                      >
                        <span className="text-slate-700 font-medium group-hover:text-emerald-800">{option.label}</span>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center overflow-y-auto pr-2 custom-scrollbar"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <Heart size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">We found a match!</h3>
                  
                  {match ? (
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl w-full mb-6">
                      <div className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 mb-3 shadow-sm">
                        {match.category}
                      </div>
                      <h4 className="text-lg font-bold text-emerald-800 mb-1">{match.title}</h4>
                      <div className="flex items-center justify-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-1"><Clock size={14} /> {match.timeCommitment}</div>
                        <div className="flex items-center gap-1"><MapPin size={14} /> {match.location}</div>
                      </div>
                      
                      <button
                        onClick={() => {
                          onClose();
                          onApply(match);
                        }}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Apply for this role
                      </button>
                    </div>
                  ) : (
                    <div className="text-slate-600 mb-6">
                      We couldn't find an exact match right now, but we always need general volunteers!
                    </div>
                  )}

                  <button
                    onClick={resetQuiz}
                    className="text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    Retake the Quiz
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Progress bar */}
          {currentStep < questions.length && (
            <div className="mt-6">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${((currentStep) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
