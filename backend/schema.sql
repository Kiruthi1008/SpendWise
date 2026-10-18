-- ==============================================================
-- SpendWise Personal Expense & Income Manager - MySQL Schema
-- Database: spendwise_db
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `spendwise_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `spendwise_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other', 'Prefer not to say') NOT NULL,
  `dob` DATE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Expense Categories Table (Default & User Custom)
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'Tag',
  `color` VARCHAR(30) DEFAULT '#ef4444',
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_exp_cat_user` (`user_id`),
  CONSTRAINT `fk_exp_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Income Sources Table (Default & User Custom)
CREATE TABLE IF NOT EXISTS `income_sources` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'Coins',
  `color` VARCHAR(30) DEFAULT '#10b981',
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inc_src_user` (`user_id`),
  CONSTRAINT `fk_inc_src_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  `category_name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_user_date` (`user_id`, `date`),
  CONSTRAINT `fk_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Incomes Table
CREATE TABLE IF NOT EXISTS `incomes` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `source_id` VARCHAR(36) NOT NULL,
  `source_name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_incomes_user_date` (`user_id`, `date`),
  CONSTRAINT `fk_incomes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Financial To-Dos & Deadline Tasks Table
CREATE TABLE IF NOT EXISTS `financial_todos` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `due_date` DATE NOT NULL,
  `due_time` TIME NOT NULL DEFAULT '23:59:00',
  `priority` ENUM('Urgent', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  `category` VARCHAR(100) NOT NULL DEFAULT 'Bill Payment',
  `amount` DECIMAL(12, 2) NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` TIMESTAMP NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_todos_user_due` (`user_id`, `due_date`, `priority`),
  CONSTRAINT `fk_todos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE spendwise_db;

CREATE TABLE IF NOT EXISTS monthly_budgets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    UNIQUE KEY unique_user_month_budget (user_id, month, year)
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    target_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings_transactions (
    id VARCHAR(36) PRIMARY KEY,
    goal_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id)
        ON DELETE CASCADE
);
