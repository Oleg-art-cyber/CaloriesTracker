-- Check user's current achievements
SELECT 
    ad.id,
    ad.name,
    ad.description,
    ad.category,
    ua.achieved_date
FROM UserAchievement ua
JOIN AchievementDefinition ad ON ua.achievement_definition_id = ad.id
WHERE ua.user_id = 18
ORDER BY ua.achieved_date DESC;

-- Check user's weight logs
SELECT 
    log_date,
    weight
FROM weight_log 
WHERE user_id = 18
ORDER BY log_date DESC;

-- Check which achievements should be available
SELECT 
    ad.id,
    ad.name,
    ad.criteria_type,
    ad.criteria_description
FROM AchievementDefinition ad
LEFT JOIN UserAchievement ua ON ad.id = ua.achievement_definition_id AND ua.user_id = 18
WHERE ua.id IS NULL
ORDER BY ad.category, ad.id; 