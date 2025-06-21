-- Check if achievements exist in database
SELECT COUNT(*) as achievement_count FROM AchievementDefinition;

-- Check specific achievement
SELECT * FROM AchievementDefinition WHERE id = 23;

-- Check if user has any achievements
SELECT COUNT(*) as user_achievement_count FROM UserAchievement WHERE user_id = 18;

-- Check user's weight logs
SELECT COUNT(*) as weight_log_count FROM weight_log WHERE user_id = 18; 