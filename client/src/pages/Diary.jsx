// client/src/pages/Diary.jsx
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import MealCard from '../components/MealCard';
import SummaryBox from '../components/SummaryBox';
import AddActivityModal from '../components/AddActivityModal';
import LoggedActivityItem from '../components/LoggedActivityItem';
import AdviceBox from '../components/AdviceBox';

const DEFAULT_MEALS_STATE = {
    breakfast: { meal_id: null, items: [] },
    lunch: { meal_id: null, items: [] },
    dinner: { meal_id: null, items: [] },
    snack: { meal_id: null, items: [] }
};
const DEFAULT_SUMMARY_STATE = { kcal_consumed: 0, protein: 0, fat: 0, carbs: 0, kcal_burned_exercise: 0, net_kcal: 0 };
const DEFAULT_PROFILE_STATE = { name: '', weight: 0, height: 0, age: 0, gender: '', activity_level: 'sedentary', goal: 'maintain' };

export default function Diary() {
    const { token } = useContext(AuthContext);
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [diaryData, setDiaryData] = useState({
        meals: DEFAULT_MEALS_STATE,
        summary: DEFAULT_SUMMARY_STATE,
        loggedActivities: []
    });
    const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE_STATE);

    const [isLoadingDiary, setIsLoadingDiary] = useState(true);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [errorDiary, setErrorDiary] = useState(null);
    const [errorProfile, setErrorProfile] = useState(null);

    const [showAddActivityModal, setShowAddActivityModal] = useState(false);

    const scrollPositionRef = useRef(0);
    // isMountedRef can help prevent initial double load in some StrictMode scenarios,
    // but with proper useCallback dependencies, it might not be strictly needed.
    // Let's keep it for now as it was in your working version.
    const isMountedRef = useRef(false);

    // Function to get auth headers, created once per token change via useMemo if needed, or just inline
    // For simplicity, we'll create it inline where needed or rely on axios defaults if set by AuthContext

    const loadProfileData = useCallback(async () => {
        if (!token) {
            setUserProfile(DEFAULT_PROFILE_STATE);
            setIsLoadingProfile(false);
            return;
        }
        // console.log("[Diary] Attempting to load profile data...");
        setIsLoadingProfile(true);
        setErrorProfile(null);
        try {
            const localAuthHeader = { Authorization: `Bearer ${token}` };
            const { data } = await axios.get('/api/profile', { headers: localAuthHeader });
            setUserProfile(data || DEFAULT_PROFILE_STATE);
            // console.log("[Diary] Profile data loaded:", data);
        } catch (e) {
            console.error("Diary: Failed to load profile data:", e);
            setErrorProfile(e.response?.data?.error || "Could not load profile data for advice.");
            setUserProfile(DEFAULT_PROFILE_STATE);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [token]); // Depends only on token

    const loadDiaryData = useCallback(async (preserveScroll = false) => {
        if (!token) {
            setDiaryData({ meals: DEFAULT_MEALS_STATE, summary: DEFAULT_SUMMARY_STATE, loggedActivities: [] });
            setIsLoadingDiary(false);
            return;
        }

        if (preserveScroll) {
            scrollPositionRef.current = window.scrollY;
            // console.log(`[Diary] Preserving scroll. Saved Y: ${scrollPositionRef.current}`);
        }

        setIsLoadingDiary(true);
        setErrorDiary(null);
        try {
            // console.log(`[Diary] Attempting to load diary data for date: ${date}`);
            const localAuthHeader = { Authorization: `Bearer ${token}` };
            const { data } = await axios.get('/api/diary', {
                params: { date },
                headers: localAuthHeader
            });

            const fetchedMeals = data.meals || {};
            const newMealsData = { ...DEFAULT_MEALS_STATE };
            for (const type in newMealsData) {
                if (fetchedMeals[type]) {
                    newMealsData[type] = {
                        meal_id: fetchedMeals[type].meal_id,
                        items: [...(fetchedMeals[type].items || [])]
                    };
                }
            }

            setDiaryData({
                meals: newMealsData,
                summary: data.summary || DEFAULT_SUMMARY_STATE,
                loggedActivities: Array.isArray(data.activities) ? [...data.activities] : []
            });

            if (preserveScroll) {
                requestAnimationFrame(() => {
                    // console.log(`[Diary] Restoring scroll to ${scrollPositionRef.current}`);
                    window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
                });
            }
        } catch (e) {
            console.error("Diary: Failed to load diary data:", e);
            setErrorDiary(e.response?.data?.error || "Could not load diary data.");
            setDiaryData({ meals: DEFAULT_MEALS_STATE, summary: DEFAULT_SUMMARY_STATE, loggedActivities: [] });
        } finally {
            setIsLoadingDiary(false);
        }
    }, [token, date]); // Depends on token and date

    useEffect(() => {
        if (isMountedRef.current) {
            // console.log("[Diary] useEffect [date, token] triggered (subsequent). Loading all data.");
            loadDiaryData(false);
            loadProfileData();
        } else {
            // console.log("[Diary] useEffect [date, token] triggered (initial mount). Loading all data.");
            isMountedRef.current = true;
            loadDiaryData(false);
            loadProfileData();
        }
    }, [date, token, loadDiaryData, loadProfileData]); // Dependencies now include the memoized load functions

    const handleDataChangeAndReload = useCallback(() => {
        // console.log("[Diary] handleDataChangeAndReload called to reload diary with scroll preservation.");
        // Scroll position is now saved within loadDiaryData when preserveScroll is true.
        loadDiaryData(true);
    }, [loadDiaryData]);

    const isLoading = isLoadingDiary || isLoadingProfile;

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <div className="flex justify-center my-4">
                <input
                    type="date"
                    className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
            </div>

            {/* Loading and Error States */}
            {isLoading && <p className="text-center text-gray-500 py-10">Loading data...</p>}
            {!isLoading && errorDiary && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">Diary Error: {errorDiary}</p>}
            {!isLoading && errorProfile && <p className="text-center text-orange-500 bg-orange-100 p-3 rounded-md">Profile Error: {errorProfile}</p>}

            {/* Main Content - Render only if not loading and no diary error (profile error is handled inside AdviceBox) */}
            {!isLoadingDiary && !errorDiary && (
                <>
                    {/* Advice Box - Render if profile data is available and no profile error */}
                    {!isLoadingProfile && !errorProfile && userProfile && userProfile.name && (
                        <div className="my-4">
                            <AdviceBox userProfile={userProfile} diaryData={diaryData} />
                        </div>
                    )}

                    {/* Meal Cards */}
                    {['breakfast', 'lunch', 'dinner', 'snack'].map(mealTypeKey => (
                        <MealCard
                            key={mealTypeKey}
                            type={mealTypeKey}
                            items={diaryData.meals[mealTypeKey]?.items || []} // Defensive access
                            date={date}
                            reload={handleDataChangeAndReload}
                        />
                    ))}

                    {/* Physical Activity Section */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm bg-white">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-700">Physical Activity</h2>
                            <button
                                onClick={() => setShowAddActivityModal(true)}
                                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm transition"
                            >
                                + Log Activity
                            </button>
                        </div>
                        {diaryData.loggedActivities.length > 0 ? (
                            <ul className="space-y-2">
                                {diaryData.loggedActivities.map(activity => (
                                    <LoggedActivityItem
                                        key={activity.id}
                                        activity={activity}
                                        reloadDiary={handleDataChangeAndReload}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 py-3 text-center">No activities logged for this day.</p>
                        )}
                    </div>

                    {/* Summary Box */}
                    {diaryData.summary && <SummaryBox summary={diaryData.summary} />}
                </>
            )}

            {showAddActivityModal && (
                <AddActivityModal
                    date={date}
                    onClose={() => setShowAddActivityModal(false)}
                    reloadDiary={handleDataChangeAndReload}
                />
            )}
        </div>
    );
}