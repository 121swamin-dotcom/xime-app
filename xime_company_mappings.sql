-- =============================================================================
-- XIME — Populate company_role_categories
-- Maps each placement company+role to the relevant role category
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- First clear existing mappings
DELETE FROM company_role_categories;

-- Map companies to role categories based on the role they offered
-- Strategy: use company role name to determine best-fit category

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'BC_ANALYTICS'
FROM companies co
WHERE co.role_name IN (
  'Associate Consultant - ESAP',
  'Associate Consultant - IQE',
  'Associate Consultant - ORC',
  'Process Consultant',
  'Associate Consultant - GCC',
  'Associate Consultant - TSG',
  'Associate Consultant - AI COE - DTS',
  'Associate Trainee (Apprentice)',
  'Generalist',
  'Management Trainee - Office of Business Head',
  'Management Trainee',
  'Functional Consultant - SAP',
  'Associate Consultant - SAP SuccessFactors'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'RISK_CYBER_GOV'
FROM companies co
WHERE co.role_name IN (
  'Associate Consultant - Digital Risk',
  'Associate Consultant - Tech Assurance'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'TECH_STRAT_CONS'
FROM companies co
WHERE co.role_name IN (
  'Project Consultant - Strategy and Transaction',
  'Senior Associate Consultant - CIS ServiceNow',
  'Management Executive'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'HR_ANALYTICS'
FROM companies co
WHERE co.role_name IN (
  'Associate Consultant - People Advisory',
  'HR Analyst (HRBP)',
  'HR Analyst (Talent Acquisition)'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'FIN_ANALYTICS'
FROM companies co
WHERE co.role_name IN (
  'Junior Financial Analyst',
  'Senior Financial Data Analyst'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'SC_OPS_ANALYTICS'
FROM companies co
WHERE co.role_name IN (
  'Operations Analyst'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'MKTG_ANALYTICS'
FROM companies co
WHERE co.role_name IN (
  'Marketing Solutions Advisor',
  'Marketing Analyst'
);

INSERT INTO company_role_categories (company_id, category_code)
SELECT co.id, 'EM_AI_CONSULTANT'
FROM companies co
WHERE co.role_name IN (
  'Associate Consultant - AI COE - DTS'
);

-- Verify
SELECT rc.description, COUNT(*) AS company_count
FROM company_role_categories crc
JOIN role_categories rc ON rc.category_code = crc.category_code
GROUP BY rc.description
ORDER BY rc.description;
