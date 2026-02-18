SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('anamnese_templates', 'anamnese_questions');
