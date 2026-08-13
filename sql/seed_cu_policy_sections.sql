-- 赛优制度中心初始分区
-- 目标库：CRM（cu_scrm）
-- 可重复执行：同租户、同分区名称已存在时不会重复插入。

INSERT INTO `cu_policy_section`
  (`tenant_id`, `section_name`, `section_code`, `description`, `sort_order`,
   `creator_id`, `creator_name`, `updater_id`, `updater_name`, `deleted`)
SELECT 1, '人力制度', 'HR', '员工行为、福利与组织管理规范', 10, 0, 'system', 0, 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `cu_policy_section` WHERE `tenant_id` = 1 AND `section_name` = '人力制度' AND `deleted` = 0
);

INSERT INTO `cu_policy_section`
  (`tenant_id`, `section_name`, `section_code`, `description`, `sort_order`,
   `creator_id`, `creator_name`, `updater_id`, `updater_name`, `deleted`)
SELECT 1, '财务制度', 'FN', '付款、报销、合同与印章管理', 20, 0, 'system', 0, 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `cu_policy_section` WHERE `tenant_id` = 1 AND `section_name` = '财务制度' AND `deleted` = 0
);

INSERT INTO `cu_policy_section`
  (`tenant_id`, `section_name`, `section_code`, `description`, `sort_order`,
   `creator_id`, `creator_name`, `updater_id`, `updater_name`, `deleted`)
SELECT 1, '产研制度', 'RD', '资产、账号与研发管理规范', 30, 0, 'system', 0, 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `cu_policy_section` WHERE `tenant_id` = 1 AND `section_name` = '产研制度' AND `deleted` = 0
);

INSERT INTO `cu_policy_section`
  (`tenant_id`, `section_name`, `section_code`, `description`, `sort_order`,
   `creator_id`, `creator_name`, `updater_id`, `updater_name`, `deleted`)
SELECT 1, 'CEO 办公室', 'CO', '公司级治理与合规制度', 40, 0, 'system', 0, 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `cu_policy_section` WHERE `tenant_id` = 1 AND `section_name` = 'CEO 办公室' AND `deleted` = 0
);

INSERT INTO `cu_policy_section`
  (`tenant_id`, `section_name`, `section_code`, `description`, `sort_order`,
   `creator_id`, `creator_name`, `updater_id`, `updater_name`, `deleted`)
SELECT 1, '竞合规则', 'CP', '业务合作与判单规则', 50, 0, 'system', 0, 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `cu_policy_section` WHERE `tenant_id` = 1 AND `section_name` = '竞合规则' AND `deleted` = 0
);

INSERT INTO `cu_policy_section`
  (`tenant_id`, `section_name`, `section_code`, `description`, `sort_order`,
   `creator_id`, `creator_name`, `updater_id`, `updater_name`, `deleted`)
SELECT 1, '部门制度及工作标准', 'DP', '各业务部门工作规则与标准', 60, 0, 'system', 0, 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `cu_policy_section` WHERE `tenant_id` = 1 AND `section_name` = '部门制度及工作标准' AND `deleted` = 0
);

SELECT `id`, `section_name`, `section_code`, `description`, `sort_order`
FROM `cu_policy_section`
WHERE `tenant_id` = 1 AND `deleted` = 0
ORDER BY `sort_order`, `id`;
