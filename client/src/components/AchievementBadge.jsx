// client/src/components/AchievementBadge.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrophy,
    faShoePrints,
    faCalendarAlt,
    faDrumstickBite,
    faBookOpen,
    faUserCheck,
    faTint,
    faSun,
    faFire,
    faQuestionCircle // Default fallback icon
} from '@fortawesome/free-solid-svg-icons';

/**
 * Maps icon class names (stored in the database) to FontAwesome icons.
 */
const iconMap = {
    'fas fa-trophy': faTrophy,
    'fas fa-shoe-prints': faShoePrints,
    'fas fa-calendar-alt': faCalendarAlt,
    'fas fa-drumstick-bite': faDrumstickBite,
    'fas fa-book-open': faBookOpen,
    'fas fa-user-check': faUserCheck,
    'fas fa-tint': faTint,
    'fas fa-sun': faSun,
    'fas fa-fire': faFire,
    'default': faQuestionCircle
};

/**
 * Returns a style object and icon based on the achievement's category and earned status.
 */
const getAdviceStyle = (type, isEarned) => {
    let baseBg = 'bg-gray-100 dark:bg-gray-700';
    let baseBorder = 'border-gray-300 dark:border-gray-600';
    let baseTextColor = 'text-gray-500 dark:text-gray-400';
    let baseIconColor = 'text-gray-400 dark:text-gray-500';
    let basePointsColor = 'text-gray-400';

    if (isEarned) {
        baseBg = 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400';
        baseBorder = 'border-yellow-500';
        baseTextColor = 'text-gray-800';
        baseIconColor = 'text-yellow-600';
        basePointsColor = 'text-yellow-700';

        switch (type?.toLowerCase()) {
            case 'nutrition':
                return {
                    emojiIcon: iconMap['fas fa-drumstick-bite'] || iconMap.default,
                    color: 'text-green-700',
                    bg: 'bg-gradient-to-br from-green-300 via-green-400 to-teal-400',
                    border: 'border-green-500',
                    iconColor: 'text-green-600',
                    pointsColor: 'text-green-700'
                };
            case 'activity':
                return {
                    emojiIcon: iconMap['fas fa-fire'] || iconMap.default,
                    color: 'text-blue-700',
                    bg: 'bg-gradient-to-br from-blue-300 via-blue-400 to-indigo-400',
                    border: 'border-blue-500',
                    iconColor: 'text-blue-600',
                    pointsColor: 'text-blue-700'
                };
            case 'consistency':
                return {
                    emojiIcon: iconMap['fas fa-calendar-alt'] || iconMap.default,
                    color: 'text-purple-700',
                    bg: 'bg-gradient-to-br from-purple-300 via-purple-400 to-pink-400',
                    border: 'border-purple-500',
                    iconColor: 'text-purple-600',
                    pointsColor: 'text-purple-700'
                };
            case 'getting started':
                return {
                    emojiIcon: iconMap['fas fa-shoe-prints'] || iconMap.default,
                    color: 'text-sky-700',
                    bg: 'bg-gradient-to-br from-sky-300 via-sky-400 to-cyan-400',
                    border: 'border-sky-500',
                    iconColor: 'text-sky-600',
                    pointsColor: 'text-sky-700'
                };
            case 'foodie':
                return {
                    emojiIcon: iconMap['fas fa-book-open'] || iconMap.default,
                    color: 'text-orange-700',
                    bg: 'bg-gradient-to-br from-orange-300 via-orange-400 to-red-400',
                    border: 'border-orange-500',
                    iconColor: 'text-orange-600',
                    pointsColor: 'text-orange-700'
                };
            default:
                return {
                    emojiIcon: iconMap['fas fa-trophy'] || iconMap.default,
                    color: baseTextColor,
                    bg: baseBg,
                    border: baseBorder,
                    iconColor: baseIconColor,
                    pointsColor: basePointsColor
                };
        }
    }

    return {
        emojiIcon: iconMap['fas fa-trophy'] || iconMap.default,
        color: baseTextColor,
        bg: baseBg,
        border: baseBorder,
        iconColor: baseIconColor,
        pointsColor: basePointsColor
    };
};

/**
 * Renders a single achievement badge with appropriate styles based on category and status.
 */
const AchievementBadge = React.memo(function AchievementBadge({ achievement }) {
    const isEarned = achievement.is_earned;
    const faIcon = iconMap[achievement.icon_class] || iconMap.default;
    const style = getAdviceStyle(achievement.category, isEarned);

    return (
        <div
            className={`
                border rounded-xl p-4 flex flex-col items-center text-center
                transition-all duration-300 ease-in-out
                ${isEarned ? `shadow-xl transform hover:scale-105 cursor-default ${style.bg} ${style.border}`
                : `opacity-60 hover:opacity-100 ${style.bg} ${style.border}`
            }
            `}
            title={isEarned && achievement.achieved_date
                ? `Achieved on: ${new Date(achievement.achieved_date).toLocaleDateString()}`
                : (achievement.criteria_description || achievement.description)
            }
        >
            <div className={`text-4xl mb-3 ${style.iconColor}`}>
                <FontAwesomeIcon icon={faIcon} />
            </div>
            <h3 className={`text-md font-semibold mb-1 ${style.color}`}>
                {achievement.name}
            </h3>
            <p className={`text-xs ${isEarned ? style.color.replace('700','800').replace('600','700') : 'text-gray-500 dark:text-gray-400'} mb-1 min-h-[3em] flex items-center justify-center`}>
                {isEarned ? achievement.description : (achievement.criteria_description || "Keep working towards this goal!")}
            </p>
            {isEarned && achievement.achieved_date && (
                <p className="text-xs italic text-gray-700 dark:text-gray-300">
                    Unlocked: {new Date(achievement.achieved_date).toLocaleDateString()}
                </p>
            )}
            {typeof achievement.points === 'number' && achievement.points > 0 && (
                <p className={`text-xs mt-2 font-bold ${style.pointsColor}`}>
                    + {achievement.points} pts
                </p>
            )}
        </div>
    );
});

export default AchievementBadge;
