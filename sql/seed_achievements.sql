-- Inserir templates de conquistas se não existirem

-- 1. Primeira Refeição
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'first_meal', 'Primeiro Passo', 'Registre sua primeira refeição no aplicativo', 50
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'first_meal');

-- 2. Dia Completo
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'day_complete', 'Dia Perfeito', 'Complete 100% das calorias do dia', 100
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'day_complete');

-- 3. Semana Completa
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'week_complete', 'Semana de Foco', 'Complete 100% das metas por 7 dias seguidos', 500
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'week_complete');

-- 4. Sequência de 3 Dias
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'streak_3', 'Aquecendo os Motores', 'Mantenha o foco por 3 dias seguidos', 150
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'streak_3');

-- 5. Sequência de 7 Dias
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'streak_7', 'Imparável', 'Uma semana inteira sem sair da linha!', 400
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'streak_7');

-- 6. Sequência de 30 Dias
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'streak_30', 'Lenda da Disciplina', '30 dias seguidos de dedicação total', 2000
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'streak_30');

-- 7. Dia Perfeito (Macros)
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned)
SELECT 'perfect_day', 'Nutrição de Precisão', 'Atingiu 100% das calorias e macros (proteína, carbo, gordura) no dia', 200
WHERE NOT EXISTS (SELECT 1 FROM achievement_templates WHERE achievement_type = 'perfect_day');
