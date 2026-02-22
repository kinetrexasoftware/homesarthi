import React from 'react';
import { motion } from 'framer-motion';
import { User, Camera, FileText, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';

const ProfileCompletion = ({ showSteps = true, onAdd }) => {
    const { user, calculateCompletion } = useAuthStore();
    const completion = calculateCompletion(user);

    if (completion === 100 && !showSteps) return null;

    const steps = [
        { label: 'Name', completed: !!user?.name, icon: User, type: 'name' },
        { label: 'Profile Photo', completed: !!user?.avatar?.url, icon: Camera, type: 'photo' },
        { label: 'Bio', completed: !!user?.bio, icon: FileText, type: 'bio' },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Profile Strength</h3>
                    <p className="text-sm text-gray-500">Complete your profile to build trust</p>
                </div>
                <div className="relative flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-gray-100"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={175.9}
                            initial={{ strokeDashoffset: 175.9 }}
                            animate={{ strokeDashoffset: 175.9 - (175.9 * completion) / 100 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="text-blue-600"
                        />
                    </svg>
                    <span className="absolute text-xs font-bold text-blue-600">{completion}%</span>
                </div>
            </div>

            {showSteps && (
                <div className="space-y-4">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                <step.icon size={18} />
                            </div>
                            <div className="flex-grow">
                                <span className={`text-sm font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {step.completed ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                            ) : (
                                onAdd ? (
                                    <button
                                        onClick={() => onAdd(step.type)}
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                        Add
                                    </button>
                                ) : (
                                    <Link to="/profile" className="text-xs font-semibold text-blue-600 hover:underline">
                                        Add
                                    </Link>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )}

            {completion < 100 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        {completion < 50
                            ? "👋 Start by adding a bio or photo to make your profile stand out."
                            : "🚀 You're almost there! Verified profiles get 3x more interest."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfileCompletion;
