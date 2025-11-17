-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 14, 2025 at 12:00 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `creditrepair_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `type` enum('client_added','dispute_filed','score_updated','payment_received','note_added') NOT NULL,
  `description` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `user_id`, `client_id`, `type`, `description`, `metadata`, `created_at`) VALUES
(26, 88, 48, 'client_added', 'New client added: ALI BADI (via myfreescorenow)', NULL, '2025-11-14 14:00:47');

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','error','success','system') NOT NULL DEFAULT 'info',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `action_text` varchar(100) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `access_level` enum('super_admin','admin','manager','support') NOT NULL DEFAULT 'admin',
  `department` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_activity_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_profiles`
--

INSERT INTO `admin_profiles` (`id`, `user_id`, `permissions`, `access_level`, `department`, `title`, `phone`, `emergency_contact`, `notes`, `is_active`, `last_activity_at`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, '[\"users.create\",\"users.read\",\"users.update\",\"users.delete\",\"plans.create\",\"plans.read\",\"plans.update\",\"plans.delete\",\"subscriptions.create\",\"subscriptions.read\",\"subscriptions.update\",\"subscriptions.delete\",\"admins.create\",\"admins.read\",\"admins.update\",\"admins.delete\",\"system.settings\",\"system.logs\",\"system.backup\",\"system.maintenance\",\"analytics.view\",\"analytics.export\",\"notifications.send\",\"notifications.manage\"]', 'super_admin', 'Administration', 'Super Administrator', NULL, NULL, NULL, 1, NULL, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1, 1),
(5, 34, '[\"clients.create\",\"clients.read\",\"clients.update\",\"clients.delete\",\"disputes.create\",\"disputes.read\",\"disputes.update\",\"disputes.delete\",\"reports.view\",\"reports.export\",\"analytics.view\",\"affiliate.access\"]', 'admin', NULL, NULL, NULL, NULL, NULL, 1, NULL, '2025-11-13 13:32:25', '2025-11-13 13:32:25', 34, 34);

-- --------------------------------------------------------

--
-- Table structure for table `admin_subscriptions`
--

CREATE TABLE `admin_subscriptions` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_cycle` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
  `status` enum('active','inactive','cancelled','expired','pending') NOT NULL DEFAULT 'pending',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT 1,
  `payment_method` varchar(50) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `next_payment_date` date DEFAULT NULL,
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `trial_end_date` date DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliates`
--

CREATE TABLE `affiliates` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `parent_affiliate_id` int(11) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `plan_type` enum('free','paid_partner') NOT NULL DEFAULT 'free',
  `paid_referrals_count` int(11) NOT NULL DEFAULT 0,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 10.00,
  `parent_commission_rate` decimal(5,2) NOT NULL DEFAULT 5.00,
  `affiliate_level` int(11) NOT NULL DEFAULT 1,
  `total_earnings` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_referrals` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive','pending','suspended') NOT NULL DEFAULT 'pending',
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `last_login_user_agent` text DEFAULT NULL,
  `password_changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `routing_number` varchar(20) DEFAULT NULL,
  `account_type` enum('checking','savings') DEFAULT 'checking',
  `swift_code` varchar(20) DEFAULT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `bank_address` text DEFAULT NULL,
  `payment_method` enum('bank_transfer','paypal','stripe','check') DEFAULT 'bank_transfer',
  `paypal_email` varchar(255) DEFAULT NULL,
  `stripe_account_id` varchar(255) DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_clicks`
--

CREATE TABLE `affiliate_clicks` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `tracking_code` varchar(100) DEFAULT NULL,
  `campaign` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `referrer_url` text DEFAULT NULL,
  `landing_page` varchar(500) DEFAULT NULL,
  `converted` tinyint(1) DEFAULT 0,
  `conversion_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_commissions`
--

CREATE TABLE `affiliate_commissions` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `referral_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `order_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `commission_rate` decimal(5,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
  `tier` varchar(50) NOT NULL DEFAULT 'Bronze',
  `product` varchar(255) NOT NULL,
  `order_date` datetime NOT NULL DEFAULT current_timestamp(),
  `approval_date` datetime DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `tracking_code` varchar(100) DEFAULT NULL,
  `commission_type` enum('signup','monthly','upgrade','bonus') NOT NULL DEFAULT 'signup',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_notification_settings`
--

CREATE TABLE `affiliate_notification_settings` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `email_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `sms_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `push_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `commission_alerts` tinyint(1) NOT NULL DEFAULT 1,
  `referral_updates` tinyint(1) NOT NULL DEFAULT 1,
  `weekly_reports` tinyint(1) NOT NULL DEFAULT 1,
  `monthly_reports` tinyint(1) NOT NULL DEFAULT 1,
  `marketing_emails` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_password_reset_codes`
--

CREATE TABLE `affiliate_password_reset_codes` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_payment_history`
--

CREATE TABLE `affiliate_payment_history` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `plan_type` varchar(50) NOT NULL,
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `payment_date` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `affiliate_payment_history`
--

INSERT INTO `affiliate_payment_history` (`id`, `affiliate_id`, `transaction_id`, `amount`, `plan_name`, `plan_type`, `payment_status`, `payment_date`, `created_at`, `updated_at`) VALUES
(24, 45, 'pi_3STIRUJehHGbCsaC1jWu2yjV', 297.99, 'Business Max', 'monthly', 'completed', '2025-11-14 13:33:17', '2025-11-14 13:33:17', '2025-11-14 13:33:17');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_payment_settings`
--

CREATE TABLE `affiliate_payment_settings` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `payment_method` enum('bank_transfer','paypal','stripe') NOT NULL DEFAULT 'paypal',
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `routing_number` varchar(255) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `paypal_email` varchar(255) DEFAULT NULL,
  `stripe_account_id` varchar(255) DEFAULT NULL,
  `minimum_payout` decimal(10,2) NOT NULL DEFAULT 50.00,
  `payout_frequency` enum('weekly','monthly','quarterly') NOT NULL DEFAULT 'monthly',
  `tax_id` varchar(50) DEFAULT NULL,
  `w9_submitted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `affiliate_payment_settings`
--

INSERT INTO `affiliate_payment_settings` (`id`, `affiliate_id`, `payment_method`, `bank_name`, `account_number`, `routing_number`, `account_holder_name`, `paypal_email`, `stripe_account_id`, `minimum_payout`, `payout_frequency`, `tax_id`, `w9_submitted`, `created_at`, `updated_at`) VALUES
(30, 45, 'bank_transfer', NULL, NULL, NULL, NULL, 'hammadisaqib@gmail.com', NULL, 50.00, 'monthly', NULL, 0, '2025-11-14 13:33:17', '2025-11-14 13:33:17');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_referrals`
--

CREATE TABLE `affiliate_referrals` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `referred_user_id` int(11) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `commission_rate` decimal(5,2) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
  `referral_date` datetime NOT NULL DEFAULT current_timestamp(),
  `conversion_date` datetime DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_performance`
--

CREATE TABLE `agent_performance` (
  `id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `performance_date` date NOT NULL,
  `tickets_assigned` int(11) NOT NULL DEFAULT 0,
  `tickets_resolved` int(11) NOT NULL DEFAULT 0,
  `avg_response_time_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `avg_resolution_time_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `customer_satisfaction_avg` decimal(3,2) NOT NULL DEFAULT 0.00,
  `efficiency_score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `analytics`
--

CREATE TABLE `analytics` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `metric_type` enum('revenue','clients','disputes','success_rate') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `period` enum('daily','weekly','monthly') NOT NULL,
  `date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article_interactions`
--

CREATE TABLE `article_interactions` (
  `id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `interaction_type` enum('view','like','dislike','rating') NOT NULL,
  `rating_value` tinyint(4) DEFAULT NULL CHECK (`rating_value` between 1 and 5),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `record_id` int(11) NOT NULL,
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `banks`
--

CREATE TABLE `banks` (
  `id` int(11) NOT NULL,
  `funding_manager_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `routing_number` varchar(9) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_transactions`
--

CREATE TABLE `billing_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `status` enum('pending','succeeded','failed','canceled','refunded') NOT NULL DEFAULT 'pending',
  `payment_method` enum('stripe','manual') NOT NULL DEFAULT 'stripe',
  `plan_name` varchar(100) DEFAULT NULL,
  `plan_type` enum('monthly','yearly','lifetime','course') NOT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `billing_transactions`
--

INSERT INTO `billing_transactions` (`id`, `user_id`, `stripe_payment_intent_id`, `stripe_customer_id`, `amount`, `currency`, `status`, `payment_method`, `plan_name`, `plan_type`, `description`, `metadata`, `created_at`, `updated_at`) VALUES
(106, 88, 'pi_3STIRUJehHGbCsaC1jWu2yjV', 'cus_TQ8iUAbFXP8Wmj', 297.99, 'usd', 'succeeded', 'stripe', 'Business Max', 'monthly', 'Payment for Business Max plan', '{\"type\":\"subscription\",\"referralSource\":\"main\"}', '2025-11-14 13:33:04', '2025-11-14 13:33:15');

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `time` time DEFAULT NULL,
  `duration` varchar(100) NOT NULL,
  `type` enum('webinar','workshop','office_hours','exam','meetup','deadline','meeting','physical_event','report_pull','other') NOT NULL,
  `instructor` varchar(255) DEFAULT NULL,
  `location` varchar(500) DEFAULT NULL,
  `is_virtual` tinyint(1) NOT NULL DEFAULT 1,
  `is_physical` tinyint(1) DEFAULT 0,
  `attendees` int(11) NOT NULL DEFAULT 0,
  `max_attendees` int(11) DEFAULT NULL,
  `meeting_link` varchar(500) DEFAULT NULL,
  `visible_to_admins` tinyint(1) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cards`
--

CREATE TABLE `cards` (
  `id` int(11) NOT NULL,
  `card_image` varchar(500) DEFAULT NULL,
  `bank_id` int(11) NOT NULL,
  `card_name` varchar(255) NOT NULL,
  `card_link` varchar(500) NOT NULL,
  `card_type` enum('business','personal') NOT NULL,
  `funding_type` varchar(100) NOT NULL,
  `credit_bureaus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`credit_bureaus`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `amount_approved` decimal(15,2) DEFAULT NULL COMMENT 'Amount approved for this card',
  `no_of_usage` int(11) DEFAULT 0 COMMENT 'Number of times this card has been used',
  `average_amount` decimal(15,2) DEFAULT NULL COMMENT 'Average amount per usage'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `ticket_reference_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `ssn` varchar(11) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `credit_score` int(11) DEFAULT NULL,
  `goal_score` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `previous_credit_score` int(11) DEFAULT NULL CHECK (`previous_credit_score` >= 300 and `previous_credit_score` <= 850),
  `ssn_last4` varchar(4) DEFAULT NULL,
  `ssn_last_four` varchar(4) DEFAULT NULL,
  `employment_status` varchar(100) DEFAULT NULL,
  `annual_income` decimal(15,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `platform` enum('myfreescorenow','identityiq','smartcredit','myscoreiq') DEFAULT NULL,
  `platform_email` varchar(255) DEFAULT NULL,
  `platform_password` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT 1,
  `updated_by` int(11) DEFAULT 1,
  `experian_score` int(11) DEFAULT NULL CHECK (`experian_score` >= 300 and `experian_score` <= 850),
  `equifax_score` int(11) DEFAULT NULL CHECK (`equifax_score` >= 300 and `equifax_score` <= 850),
  `transunion_score` int(11) DEFAULT NULL CHECK (`transunion_score` >= 300 and `transunion_score` <= 850)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_funding_submissions`
--

CREATE TABLE `client_funding_submissions` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `status` enum('approved','not_approved') NOT NULL DEFAULT 'not_approved',
  `amount_approved` decimal(10,2) NOT NULL DEFAULT 0.00,
  `admin_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `credit_bureaus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`credit_bureaus`)),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comment_likes`
--

CREATE TABLE `comment_likes` (
  `id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commission_payments`
--

CREATE TABLE `commission_payments` (
  `id` int(11) NOT NULL,
  `affiliate_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `payment_method` enum('bank_transfer','paypal','stripe','check','other') NOT NULL DEFAULT 'bank_transfer',
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
  `payment_date` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `proof_of_payment_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commission_tiers`
--

CREATE TABLE `commission_tiers` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `min_referrals` int(11) NOT NULL DEFAULT 0,
  `commission_rate` decimal(5,2) NOT NULL,
  `bonuses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bonuses`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commission_tiers`
--

INSERT INTO `commission_tiers` (`id`, `name`, `min_referrals`, `commission_rate`, `bonuses`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Bronze', 0, 15.00, '[\"Basic support\",\"Monthly reports\"]', 1, '2025-08-31 02:42:33', '2025-11-14 11:10:32'),
(2, 'Silver', 10, 20.00, '[\"Priority support\",\"Weekly reports\",\"Marketing materials\"]', 1, '2025-08-31 02:42:33', '2025-08-31 02:42:33'),
(3, 'Gold', 25, 25.00, '[\"Dedicated support\",\"Daily reports\",\"Custom materials\",\"Performance bonuses\"]', 1, '2025-08-31 02:42:33', '2025-08-31 02:42:33'),
(4, 'Platinum', 50, 30.00, '[\"VIP support\",\"Real-time analytics\",\"Custom landing pages\",\"Quarterly bonuses\",\"Exclusive events\"]', 1, '2025-08-31 02:42:33', '2025-08-31 02:42:33');

-- --------------------------------------------------------

--
-- Table structure for table `community_posts`
--

CREATE TABLE `community_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `media_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`media_urls`)),
  `media_type` enum('image','video','document') DEFAULT NULL,
  `likes_count` int(11) NOT NULL DEFAULT 0,
  `comments_count` int(11) NOT NULL DEFAULT 0,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

CREATE TABLE `contracts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `template_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `status` enum('draft','sent','signed','cancelled') NOT NULL DEFAULT 'draft',
  `effective_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `signed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `user_id`, `client_id`, `template_id`, `title`, `body`, `status`, `effective_date`, `expiration_date`, `sent_at`, `signed_at`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(18, 88, NULL, 1, 'Admin Onboarding Agreement', '\n  <h1>Service Agreement</h1>\n\n  <p>This Service Agreement (\"Agreement\") is made and entered into on <strong>DATE</strong> by and between <strong>Client Name</strong> (\"Client\") and <strong>Service Provider Name</strong> (\"Provider\").</p>\n\n  <p><strong>1. Services.</strong> Provider agrees to perform the services described in the attached scope or as otherwise agreed in writing (\"Services\"). Provider will perform the Services in a professional and timely manner.</p>\n\n  <p><strong>2. Term.</strong> This Agreement begins on the date above and will continue until the Services are completed or until terminated in accordance with this Agreement.</p>\n\n  <p><strong>3. Payment.</strong> Client agrees to pay Provider the fees set forth in the scope. Unless otherwise stated, payments are due within thirty (30) days of invoice. Late payments may incur interest at the rate permitted by law.</p>\n\n  <p><strong>4. Confidentiality.</strong> Each party agrees to keep confidential any non-public information exchanged in connection with this Agreement and not to disclose it to third parties except as required by law.</p>\n\n  <p><strong>5. Intellectual Property.</strong> Unless otherwise agreed in writing, Provider retains ownership of materials and intellectual property created prior to this Agreement. Work product created specifically for Client as part of the Services will be assigned to Client upon full payment.</p>\n\n  <p><strong>6. Warranties and Disclaimer.</strong> Provider warrants that Services will be performed with reasonable skill and care. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, PROVIDER MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED.</p>\n\n  <p><strong>7. Limitation of Liability.</strong> In no event will either party be liable for consequential, special, or indirect damages. Provider\'s total liability for claims arising out of this Agreement will not exceed the total fees paid by Client under this Agreement.</p>\n\n  <p><strong>8. Termination.</strong> Either party may terminate this Agreement for material breach if the breach is not cured within fourteen (14) days after written notice. Upon termination, Client will pay for Services performed through the termination date.</p>\n\n  <p><strong>9. Governing Law.</strong> This Agreement will be governed by and construed in accordance with the laws of <strong>State/Country</strong>, without regard to conflict of laws principles.</p>\n\n  <p><strong>10. Entire Agreement.</strong> This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions, agreements, and understandings.</p>\n\n  <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>\n\n  <p>Provider: ________________________________</p>\n  <p>Name: _________________________________</p>\n  <p>Date: _________________________________</p>\n\n  <p>Client: _________________________________</p>\n  <p>Name: _________________________________</p>\n  <p>Date: _________________________________</p>', 'signed', NULL, NULL, '2025-11-14 13:33:15', '2025-11-14 13:33:38', '2025-11-14 13:33:15', '2025-11-14 13:33:38', 1, 1),
(19, 90, NULL, 1, 'Admin Onboarding Agreement', '\n  <h1>Service Agreement</h1>\n\n  <p>This Service Agreement (\"Agreement\") is made and entered into on <strong>DATE</strong> by and between <strong>Client Name</strong> (\"Client\") and <strong>Service Provider Name</strong> (\"Provider\").</p>\n\n  <p><strong>1. Services.</strong> Provider agrees to perform the services described in the attached scope or as otherwise agreed in writing (\"Services\"). Provider will perform the Services in a professional and timely manner.</p>\n\n  <p><strong>2. Term.</strong> This Agreement begins on the date above and will continue until the Services are completed or until terminated in accordance with this Agreement.</p>\n\n  <p><strong>3. Payment.</strong> Client agrees to pay Provider the fees set forth in the scope. Unless otherwise stated, payments are due within thirty (30) days of invoice. Late payments may incur interest at the rate permitted by law.</p>\n\n  <p><strong>4. Confidentiality.</strong> Each party agrees to keep confidential any non-public information exchanged in connection with this Agreement and not to disclose it to third parties except as required by law.</p>\n\n  <p><strong>5. Intellectual Property.</strong> Unless otherwise agreed in writing, Provider retains ownership of materials and intellectual property created prior to this Agreement. Work product created specifically for Client as part of the Services will be assigned to Client upon full payment.</p>\n\n  <p><strong>6. Warranties and Disclaimer.</strong> Provider warrants that Services will be performed with reasonable skill and care. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, PROVIDER MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED.</p>\n\n  <p><strong>7. Limitation of Liability.</strong> In no event will either party be liable for consequential, special, or indirect damages. Provider\'s total liability for claims arising out of this Agreement will not exceed the total fees paid by Client under this Agreement.</p>\n\n  <p><strong>8. Termination.</strong> Either party may terminate this Agreement for material breach if the breach is not cured within fourteen (14) days after written notice. Upon termination, Client will pay for Services performed through the termination date.</p>\n\n  <p><strong>9. Governing Law.</strong> This Agreement will be governed by and construed in accordance with the laws of <strong>State/Country</strong>, without regard to conflict of laws principles.</p>\n\n  <p><strong>10. Entire Agreement.</strong> This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions, agreements, and understandings.</p>\n\n  <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>\n\n  <p>Provider: ________________________________</p>\n  <p>Name: _________________________________</p>\n  <p>Date: _________________________________</p>\n\n  <p>Client: _________________________________</p>\n  <p>Name: _________________________________</p>\n  <p>Date: _________________________________</p>', 'sent', NULL, NULL, '2025-11-14 15:36:52', NULL, '2025-11-14 15:36:52', '2025-11-14 15:36:52', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `contract_signatures`
--

CREATE TABLE `contract_signatures` (
  `id` int(11) NOT NULL,
  `contract_id` int(11) NOT NULL,
  `signer_type` enum('client','user') NOT NULL,
  `signer_user_id` int(11) DEFAULT NULL,
  `signer_client_id` int(11) DEFAULT NULL,
  `signer_name` varchar(255) DEFAULT NULL,
  `signer_email` varchar(255) DEFAULT NULL,
  `signature_data` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `signed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contract_signatures`
--

INSERT INTO `contract_signatures` (`id`, `contract_id`, `signer_type`, `signer_user_id`, `signer_client_id`, `signer_name`, `signer_email`, `signature_data`, `ip_address`, `signed_at`) VALUES
(20, 18, 'user', 88, NULL, NULL, NULL, '{\"signature_text\":null,\"signature_image_url\":\"data:image/png;base64,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\"}', '127.0.0.1', '2025-11-14 13:33:38');

-- --------------------------------------------------------

--
-- Table structure for table `contract_templates`
--

CREATE TABLE `contract_templates` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contract_templates`
--

INSERT INTO `contract_templates` (`id`, `user_id`, `name`, `description`, `content`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, 'test', 'test', '\n  <h1>Service Agreement</h1>\n\n  <p>This Service Agreement (\"Agreement\") is made and entered into on <strong>DATE</strong> by and between <strong>Client Name</strong> (\"Client\") and <strong>Service Provider Name</strong> (\"Provider\").</p>\n\n  <p><strong>1. Services.</strong> Provider agrees to perform the services described in the attached scope or as otherwise agreed in writing (\"Services\"). Provider will perform the Services in a professional and timely manner.</p>\n\n  <p><strong>2. Term.</strong> This Agreement begins on the date above and will continue until the Services are completed or until terminated in accordance with this Agreement.</p>\n\n  <p><strong>3. Payment.</strong> Client agrees to pay Provider the fees set forth in the scope. Unless otherwise stated, payments are due within thirty (30) days of invoice. Late payments may incur interest at the rate permitted by law.</p>\n\n  <p><strong>4. Confidentiality.</strong> Each party agrees to keep confidential any non-public information exchanged in connection with this Agreement and not to disclose it to third parties except as required by law.</p>\n\n  <p><strong>5. Intellectual Property.</strong> Unless otherwise agreed in writing, Provider retains ownership of materials and intellectual property created prior to this Agreement. Work product created specifically for Client as part of the Services will be assigned to Client upon full payment.</p>\n\n  <p><strong>6. Warranties and Disclaimer.</strong> Provider warrants that Services will be performed with reasonable skill and care. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, PROVIDER MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED.</p>\n\n  <p><strong>7. Limitation of Liability.</strong> In no event will either party be liable for consequential, special, or indirect damages. Provider\'s total liability for claims arising out of this Agreement will not exceed the total fees paid by Client under this Agreement.</p>\n\n  <p><strong>8. Termination.</strong> Either party may terminate this Agreement for material breach if the breach is not cured within fourteen (14) days after written notice. Upon termination, Client will pay for Services performed through the termination date.</p>\n\n  <p><strong>9. Governing Law.</strong> This Agreement will be governed by and construed in accordance with the laws of <strong>State/Country</strong>, without regard to conflict of laws principles.</p>\n\n  <p><strong>10. Entire Agreement.</strong> This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions, agreements, and understandings.</p>\n\n  <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>\n\n  <p>Provider: ________________________________</p>\n  <p>Name: _________________________________</p>\n  <p>Date: _________________________________</p>\n\n  <p>Client: _________________________________</p>\n  <p>Name: _________________________________</p>\n  <p>Date: _________________________________</p>', 1, '2025-11-09 06:12:32', '2025-11-09 06:15:18', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` text DEFAULT NULL,
  `instructor` varchar(255) NOT NULL,
  `duration` varchar(100) NOT NULL,
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `category_id` int(11) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `enrollment_count` int(11) NOT NULL DEFAULT 0,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `preview_video_url` varchar(500) DEFAULT NULL,
  `duration_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `duration_minutes` int(11) DEFAULT 0,
  `difficulty_level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `prerequisites` text DEFAULT NULL,
  `learning_objectives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`learning_objectives`)),
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `language` varchar(50) DEFAULT 'English',
  `certificate_enabled` tinyint(1) DEFAULT 0,
  `max_enrollments` int(11) DEFAULT NULL,
  `enrollment_start_date` datetime DEFAULT NULL,
  `enrollment_end_date` datetime DEFAULT NULL,
  `course_start_date` datetime DEFAULT NULL,
  `course_end_date` datetime DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'USD',
  `updated_by` int(11) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_categories`
--

CREATE TABLE `course_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_category_id` int(11) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `course_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_chapters`
--

CREATE TABLE `course_chapters` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `duration` varchar(100) NOT NULL,
  `order_index` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_enrollments`
--

CREATE TABLE `course_enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `progress` int(11) NOT NULL DEFAULT 0 CHECK (`progress` >= 0 and `progress` <= 100),
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `enrolled_at` datetime NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_materials`
--

CREATE TABLE `course_materials` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `video_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` enum('pdf','image','document','audio','archive','other') NOT NULL,
  `file_size` bigint(20) NOT NULL DEFAULT 0,
  `mime_type` varchar(100) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `is_downloadable` tinyint(1) NOT NULL DEFAULT 1,
  `download_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_modules`
--

CREATE TABLE `course_modules` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `duration_minutes` int(11) NOT NULL DEFAULT 0,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `unlock_after_module_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_quizzes`
--

CREATE TABLE `course_quizzes` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `video_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `quiz_type` enum('assessment','practice','final_exam') NOT NULL DEFAULT 'practice',
  `time_limit_minutes` int(11) DEFAULT NULL,
  `attempts_allowed` int(11) NOT NULL DEFAULT 3,
  `passing_score` decimal(5,2) NOT NULL DEFAULT 70.00,
  `randomize_questions` tinyint(1) NOT NULL DEFAULT 0,
  `show_correct_answers` tinyint(1) NOT NULL DEFAULT 1,
  `show_results_immediately` tinyint(1) NOT NULL DEFAULT 1,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_videos`
--

CREATE TABLE `course_videos` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `video_url` varchar(500) NOT NULL,
  `video_type` enum('upload','youtube','vimeo','external') NOT NULL DEFAULT 'upload',
  `video_id` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `duration_seconds` int(11) NOT NULL DEFAULT 0,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `is_preview` tinyint(1) NOT NULL DEFAULT 0,
  `transcript` text DEFAULT NULL,
  `captions_url` varchar(500) DEFAULT NULL,
  `quality_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`quality_options`)),
  `view_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_reports`
--

CREATE TABLE `credit_reports` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `bureau` enum('experian','equifax','transunion') NOT NULL,
  `report_date` date NOT NULL,
  `credit_score` int(11) DEFAULT NULL CHECK (`credit_score` >= 300 and `credit_score` <= 850),
  `report_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`report_data`)),
  `status` enum('pending','completed','error') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_report_history`
--

CREATE TABLE `credit_report_history` (
  `id` int(11) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `platform` varchar(255) NOT NULL,
  `report_path` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'completed',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `credit_score` int(11) DEFAULT NULL CHECK (`credit_score` >= 300 and `credit_score` <= 850),
  `experian_score` int(11) DEFAULT NULL CHECK (`experian_score` >= 300 and `experian_score` <= 850),
  `equifax_score` int(11) DEFAULT NULL CHECK (`equifax_score` >= 300 and `equifax_score` <= 850),
  `transunion_score` int(11) DEFAULT NULL CHECK (`transunion_score` >= 300 and `transunion_score` <= 850),
  `report_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `disputes`
--

CREATE TABLE `disputes` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `bureau` varchar(50) NOT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `dispute_reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `date_submitted` date DEFAULT NULL,
  `date_resolved` date DEFAULT NULL,
  `result` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_verification_codes`
--

CREATE TABLE `email_verification_codes` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('affiliate_registration','password_reset','email_change','admin_registration') NOT NULL DEFAULT 'affiliate_registration',
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_verification_codes`
--

INSERT INTO `email_verification_codes` (`id`, `email`, `code`, `type`, `expires_at`, `used`, `used_at`, `created_at`) VALUES
(55, 'hammadisaqib@gmail.com', '483881', 'admin_registration', '2025-11-15 08:33:20', 1, '2025-11-14 13:33:42', '2025-11-14 13:33:20'),
(56, 'trackdivofficial@gmail.com', '848908', 'admin_registration', '2025-11-15 10:37:26', 1, '2025-11-14 15:38:01', '2025-11-14 15:37:26');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('active','inactive','locked','pending') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `admin_id`, `user_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 88, 89, 'active', '2025-11-14 13:57:23', '2025-11-14 13:57:23');

-- --------------------------------------------------------

--
-- Table structure for table `event_registrations`
--

CREATE TABLE `event_registrations` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `registered_at` datetime NOT NULL DEFAULT current_timestamp(),
  `attended` tinyint(1) DEFAULT NULL,
  `attended_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` int(11) NOT NULL,
  `question` varchar(1000) NOT NULL,
  `answer` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `views` int(11) NOT NULL DEFAULT 0,
  `helpful` int(11) NOT NULL DEFAULT 0,
  `not_helpful` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `category`, `order_index`, `views`, `helpful`, `not_helpful`, `status`, `created_at`, `updated_at`) VALUES
(1, 'How long does it take to see improvements in my credit score?', 'Credit score improvements can be seen as quickly as 30-45 days after positive changes are reported to credit bureaus. However, significant improvements may take 3-6 months.', 'General', 1, 0, 0, 0, 'active', '2025-08-29 22:24:09', '2025-08-29 22:24:09'),
(2, 'What is the difference between a credit report and credit score?', 'A credit report is a detailed record of your credit history, while a credit score is a numerical representation (300-850) of your creditworthiness based on that report.', 'Credit Basics', 2, 0, 0, 0, 'active', '2025-08-29 22:24:09', '2025-08-29 22:24:09'),
(3, 'Can I remove accurate negative information from my credit report?', 'Generally, accurate negative information cannot be removed and will remain on your credit report for 7-10 years. However, you can dispute inaccurate information.', 'Credit Repair', 3, 0, 0, 0, 'active', '2025-08-29 22:24:09', '2025-08-29 22:24:09'),
(4, 'test', 'tes', 'Credit Basics', 0, 0, 0, 0, 'active', '2025-09-23 02:12:17', '2025-09-23 02:12:17'),
(5, 'rar', 'arar', 'Credit Basics', 0, 1, 1, 2, 'active', '2025-09-23 02:24:06', '2025-09-23 02:24:40');

-- --------------------------------------------------------

--
-- Table structure for table `faq_interactions`
--

CREATE TABLE `faq_interactions` (
  `id` int(11) NOT NULL,
  `faq_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `interaction_type` enum('view','helpful','not_helpful') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `funding_diy_submissions`
--

CREATE TABLE `funding_diy_submissions` (
  `id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `card_type` enum('personal','business') NOT NULL,
  `status` enum('approved','not_approved') NOT NULL DEFAULT 'not_approved',
  `amount_approved` decimal(10,2) NOT NULL DEFAULT 0.00,
  `admin_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `credit_bureaus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`credit_bureaus`)),
  `submitted_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `funding_requests`
--

CREATE TABLE `funding_requests` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `purpose` enum('equipment','marketing','expansion','inventory','technology','training','other') NOT NULL,
  `funding_type` enum('done-for-you','diy') DEFAULT NULL,
  `title_position` varchar(255) DEFAULT NULL,
  `intended_use` text DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `business_phone` varchar(20) DEFAULT NULL,
  `business_email` varchar(255) DEFAULT NULL,
  `business_address` text DEFAULT NULL,
  `business_city` varchar(100) DEFAULT NULL,
  `business_state` varchar(50) DEFAULT NULL,
  `business_zip` varchar(10) DEFAULT NULL,
  `date_commenced` date DEFAULT NULL,
  `business_website` varchar(255) DEFAULT NULL,
  `business_industry` varchar(100) DEFAULT NULL,
  `entity_type` enum('LLC','Corporation','Partnership','Sole Proprietorship') DEFAULT NULL,
  `incorporation_state` varchar(50) DEFAULT NULL,
  `number_of_employees` int(11) DEFAULT NULL,
  `ein` varchar(20) DEFAULT NULL,
  `monthly_gross_sales` decimal(12,2) DEFAULT NULL,
  `projected_annual_revenue` decimal(12,2) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `birth_city` varchar(100) DEFAULT NULL,
  `ssn` varchar(20) DEFAULT NULL,
  `mothers_maiden_name` varchar(100) DEFAULT NULL,
  `home_address` text DEFAULT NULL,
  `personal_city` varchar(100) DEFAULT NULL,
  `personal_state` varchar(50) DEFAULT NULL,
  `personal_zip` varchar(10) DEFAULT NULL,
  `home_phone` varchar(20) DEFAULT NULL,
  `mobile_phone` varchar(20) DEFAULT NULL,
  `housing_status` enum('rent','own','other') DEFAULT NULL,
  `monthly_housing_payment` decimal(10,2) DEFAULT NULL,
  `years_at_address` decimal(4,2) DEFAULT NULL,
  `drivers_license` varchar(50) DEFAULT NULL,
  `issuing_state` varchar(50) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `current_employer` varchar(255) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `years_at_employer` decimal(4,2) DEFAULT NULL,
  `employer_phone` varchar(20) DEFAULT NULL,
  `employer_address` text DEFAULT NULL,
  `personal_bank_name` varchar(100) DEFAULT NULL,
  `personal_bank_balance` decimal(12,2) DEFAULT NULL,
  `business_bank_name` varchar(100) DEFAULT NULL,
  `business_bank_balance` decimal(12,2) DEFAULT NULL,
  `us_citizen` enum('yes','no') DEFAULT NULL,
  `savings_account` enum('yes','no') DEFAULT NULL,
  `investment_accounts` enum('yes','no') DEFAULT NULL,
  `military_affiliation` enum('yes','no') DEFAULT NULL,
  `other_income` enum('yes','no') DEFAULT NULL,
  `other_assets` enum('yes','no') DEFAULT NULL,
  `banks_to_ignore` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`banks_to_ignore`)),
  `status` enum('pending','approved','rejected','under_review') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `requested_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_date` timestamp NULL DEFAULT NULL,
  `reviewer_notes` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `reviewer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `driver_license_file_path` varchar(500) DEFAULT NULL COMMENT 'Path to uploaded driver license PDF file',
  `ein_confirmation_file_path` varchar(500) DEFAULT NULL COMMENT 'Path to uploaded EIN confirmation letter PDF file',
  `articles_from_state_file_path` varchar(500) DEFAULT NULL COMMENT 'Path to uploaded articles from state PDF file'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `privacy` enum('public','private','secret') NOT NULL DEFAULT 'public',
  `created_by` int(11) NOT NULL,
  `member_count` int(11) NOT NULL DEFAULT 1,
  `post_count` int(11) NOT NULL DEFAULT 0,
  `avatar_url` varchar(500) DEFAULT NULL,
  `cover_url` varchar(500) DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','moderator','member') NOT NULL DEFAULT 'member',
  `joined_at` datetime NOT NULL DEFAULT current_timestamp(),
  `invited_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_posts`
--

CREATE TABLE `group_posts` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `media_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`media_urls`)),
  `media_type` enum('image','video','document') DEFAULT NULL,
  `likes_count` int(11) NOT NULL DEFAULT 0,
  `comments_count` int(11) NOT NULL DEFAULT 0,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invitations`
--

CREATE TABLE `invitations` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `type` enum('admin','client','affiliate') NOT NULL,
  `token` text NOT NULL,
  `meeting_link` text DEFAULT NULL,
  `status` enum('sent','pending','accepted','declined','expired') NOT NULL DEFAULT 'sent',
  `sent_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `recipient_email` varchar(255) DEFAULT NULL,
  `status` enum('draft','sent','paid','partial','overdue','cancelled') NOT NULL DEFAULT 'sent',
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `line_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`line_items`)),
  `notes` text DEFAULT NULL,
  `issued_date` datetime NOT NULL DEFAULT current_timestamp(),
  `due_date` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `payment_provider` enum('nmi','stripe','manual') DEFAULT NULL,
  `payment_transaction_id` varchar(255) DEFAULT NULL,
  `public_token` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_articles`
--

CREATE TABLE `knowledge_articles` (
  `id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `author_id` int(11) NOT NULL,
  `status` enum('published','draft','archived') NOT NULL DEFAULT 'draft',
  `views` int(11) NOT NULL DEFAULT 0,
  `likes` int(11) NOT NULL DEFAULT 0,
  `dislikes` int(11) NOT NULL DEFAULT 0,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knowledge_articles`
--

INSERT INTO `knowledge_articles` (`id`, `title`, `content`, `category`, `tags`, `author_id`, `status`, `views`, `likes`, `dislikes`, `rating`, `featured`, `created_at`, `updated_at`) VALUES
(1, 'Understanding Your Credit Score', 'Your credit score is a three-digit number that represents your creditworthiness. It typically ranges from 300 to 850, with higher scores indicating better credit health.', 'Credit Basics', '[\"credit score\",\"credit report\",\"FICO\"]', 2, 'published', 0, 0, 0, 0.00, 1, '2025-08-29 22:24:09', '2025-08-29 22:24:09'),
(2, 'How to Dispute Credit Report Errors', 'Credit report errors are more common than you might think. Here\'s how to dispute them effectively and improve your credit score.', 'Credit Repair', '[\"dispute\",\"credit report\",\"errors\"]', 2, 'published', 0, 0, 0, 0.00, 0, '2025-08-29 22:24:09', '2025-08-29 22:24:09'),
(3, 'Building Credit from Scratch', 'If you\'re new to credit or rebuilding after financial difficulties, here are the best strategies to establish a positive credit history.', 'Credit Building', '[\"credit building\",\"new credit\",\"secured cards\"]', 2, 'published', 0, 0, 0, 0.00, 1, '2025-08-29 22:24:09', '2025-08-29 22:24:09'),
(4, 'test', 'test', 'Credit Basics', '[\"test\"]', 6, 'draft', 0, 0, 0, 0.00, 0, '2025-09-23 02:11:43', '2025-09-23 02:11:43'),
(5, 'test', 'test', 'Credit Basics', '[\"test\"]', 6, 'draft', 0, 0, 0, 0.00, 0, '2025-09-23 02:11:58', '2025-09-23 02:11:58'),
(6, 'rwar', 'rwar', 'Credit Basics', '[\"rwar\"]', 6, 'draft', 0, 0, 0, 0.00, 0, '2025-09-23 02:12:05', '2025-09-23 02:12:05'),
(7, 'test', 'test', 'Credit Basics', '[\"test\"]', 6, 'draft', 0, 0, 0, 0.00, 0, '2025-09-23 02:23:49', '2025-09-23 02:23:49'),
(8, 'test', 'test', 'Credit Basics', '[\"test\"]', 6, 'draft', 0, 0, 0, 0.00, 0, '2025-09-23 02:25:43', '2025-09-23 02:25:43'),
(9, 'test', 'setes', 'Credit Basics', '[\"test\"]', 6, 'draft', 0, 0, 0, 0.00, 0, '2025-09-23 02:29:35', '2025-09-23 02:29:35');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_codes`
--

CREATE TABLE `password_reset_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pending_registrations`
--

CREATE TABLE `pending_registrations` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `role` enum('user','admin','support','super_admin','funding_manager') NOT NULL DEFAULT 'admin',
  `plan_id` int(11) DEFAULT NULL,
  `billing_cycle` enum('monthly','yearly') DEFAULT NULL,
  `referral_affiliate_id` varchar(255) DEFAULT NULL,
  `referral_affiliate_name` varchar(255) DEFAULT NULL,
  `referral_commission_rate` decimal(5,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plan_course_associations`
--

CREATE TABLE `plan_course_associations` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_comments`
--

CREATE TABLE `post_comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `parent_comment_id` int(11) DEFAULT NULL,
  `likes_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_comments`
--

INSERT INTO `post_comments` (`id`, `post_id`, `user_id`, `content`, `parent_comment_id`, `likes_count`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '123', NULL, 0, '2025-08-25 21:30:16', '2025-08-25 21:30:16'),
(2, 3, 1, 'test', NULL, 1, '2025-08-25 21:35:30', '2025-08-25 21:41:26'),
(3, 3, 1, 'testccc', NULL, 1, '2025-08-25 21:38:58', '2025-08-25 22:00:00'),
(4, 4, 1, 'test', NULL, 0, '2025-08-25 21:48:31', '2025-08-25 21:48:31'),
(5, 4, 1, 'dfds', NULL, 0, '2025-08-25 21:54:37', '2025-08-25 21:54:37'),
(6, 5, 1, 'test', NULL, 0, '2025-08-26 15:58:43', '2025-08-26 15:58:43'),
(7, 8, 46, 'trdfgdfg', NULL, 0, '2025-09-04 01:19:14', '2025-09-04 01:19:14'),
(8, 6, 46, 'sdfdsf', NULL, 0, '2025-09-04 01:19:20', '2025-09-04 01:19:20');

-- --------------------------------------------------------

--
-- Table structure for table `post_likes`
--

CREATE TABLE `post_likes` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_reactions`
--

CREATE TABLE `post_reactions` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reaction_type` enum('like','love','laugh','wow','sad','angry') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_shares`
--

CREATE TABLE `post_shares` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `platform` enum('facebook','twitter','linkedin','email','copy') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `enrollment_id` int(11) DEFAULT NULL,
  `attempt_number` int(11) NOT NULL DEFAULT 1,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `total_points` decimal(5,2) NOT NULL DEFAULT 0.00,
  `earned_points` decimal(5,2) NOT NULL DEFAULT 0.00,
  `time_taken_minutes` int(11) DEFAULT NULL,
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answers`)),
  `status` enum('in_progress','completed','abandoned','timed_out') NOT NULL DEFAULT 'in_progress',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','true_false','short_answer','essay','fill_blank') NOT NULL DEFAULT 'multiple_choice',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `correct_answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`correct_answers`)),
  `explanation` text DEFAULT NULL,
  `points` decimal(5,2) NOT NULL DEFAULT 1.00,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stripe_config`
--

CREATE TABLE `stripe_config` (
  `id` int(11) NOT NULL,
  `stripe_publishable_key` varchar(500) NOT NULL,
  `stripe_secret_key` varchar(500) NOT NULL,
  `webhook_endpoint_secret` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stripe_config`
--

INSERT INTO `stripe_config` (`id`, `stripe_publishable_key`, `stripe_secret_key`, `webhook_endpoint_secret`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(5, 'pk_test_51JIdZVJehHGbCsaCYiCquX3mKuZDrym2d3EU31L8fDxs8886NBrqsg3rYrp8bHIdl7wvARE7vxLuNfhsrY5SFbCw00tHX5coQC', 'sk_test_51JIdZVJehHGbCsaCtO53jxO0sNp5ENohIDu08KlDU7Xh5AroEdegLfy0bnjOd3rtfsAhJA19TiE2mEspXsFwGjdr00lF3TxhRG', NULL, 1, '2025-08-27 23:24:13', '2025-08-28 19:06:15', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `plan_name` varchar(100) NOT NULL,
  `plan_type` enum('monthly','yearly','lifetime') NOT NULL,
  `status` enum('active','canceled','past_due','unpaid','incomplete') NOT NULL DEFAULT 'active',
  `current_period_start` datetime DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `cancel_at_period_end` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `user_id`, `stripe_subscription_id`, `stripe_customer_id`, `plan_name`, `plan_type`, `status`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `created_at`, `updated_at`) VALUES
(47, 88, NULL, NULL, 'Business Max', 'monthly', 'active', '2025-11-14 08:33:15', '2025-12-14 08:33:15', 0, '2025-11-14 13:33:15', '2025-11-14 13:33:15');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `billing_cycle` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `max_users` int(11) DEFAULT NULL,
  `max_clients` int(11) DEFAULT NULL,
  `max_disputes` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `page_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`page_permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `description`, `price`, `billing_cycle`, `features`, `max_users`, `max_clients`, `max_disputes`, `is_active`, `sort_order`, `created_at`, `updated_at`, `created_by`, `updated_by`, `page_permissions`) VALUES
(3, 'Individual', 'Perfect for small funding businesses', 24.99, 'monthly', '[\"Up to 50 clients\",\"Basic dispute management\",\"Email support\",\"Standard reporting\"]', 1, 1, 1, 1, 1, '2025-08-26 21:34:09', '2025-11-14 02:04:39', 1, 1, '[\"dashboard\",\"clients\",\"credit-report\",\"reports\",\"support\",\"settings\"]'),
(5, 'Business Starter', 'For growing funding businesses', 99.99, 'monthly', '[\"Up to 200 clients\",\"Advanced dispute management\",\"Priority support\",\"Advanced reporting\",\"API access\",\"White-label options\"]', 1, 5, 1, 1, 2, '2025-08-26 21:34:09', '2025-11-14 01:58:27', 1, 1, '[\"dashboard\",\"clients\",\"reports\",\"credit-report\",\"disputes\",\"ai-coach\",\"school\",\"settings\",\"support\"]'),
(6, 'Business Max', 'For large funding organizations', 297.99, 'monthly', '[\"24/7 phone support\",\"Custom reporting\",\"Full API access\",\"Custom integrations\",\"Dedicated account manager\",\"Test\"]', 1, 100, 1, 1, 3, '2025-08-26 21:34:09', '2025-11-14 02:00:08', 1, 1, '[\"dashboard\",\"clients\",\"reports\",\"credit-report\",\"disputes\",\"ai-coach\",\"school\",\"analytics\",\"compliance\",\"automations\",\"settings\",\"support\"]'),
(14, 'Business Ultimate', NULL, 1497.97, 'monthly', '[\"Unlimied Clients\",\"1 Employee\"]', 1, 0, NULL, 1, 4, '2025-11-14 02:01:56', '2025-11-14 15:47:10', 1, 1, '[\"dashboard\",\"clients\",\"reports\",\"credit-report\",\"settings\",\"support\",\"ai-coach\",\"school\"]'),
(15, 'Business Pro', NULL, 147.97, 'monthly', '[\"20 Clients\",\"1 Employee\",\"Dedicated Dashbord\",\"Ai Coach\"]', 1, 20, NULL, 1, 0, '2025-11-14 02:03:36', '2025-11-14 15:45:13', 1, 1, '[\"dashboard\",\"clients\",\"reports\",\"credit-report\",\"support\",\"ai-coach\",\"affiliate\",\"settings\"]'),
(17, 'Individual Pro', 'Individual Pro ', 49.99, 'monthly', '[\"1 client\",\"1 employee\",\"Score Machine School\",\"Dedicated Dashbord\"]', 1, 1, NULL, 1, 0, '2025-11-14 02:13:20', '2025-11-14 15:02:38', 1, 1, '[\"dashboard\",\"clients\",\"credit-report\",\"reports\",\"school\",\"settings\",\"support\"]'),
(18, 'Individual Pro', NULL, 499.99, 'yearly', '[\"1 Client\",\"1 Employee\"]', 1, 1, NULL, 1, 0, '2025-11-14 15:48:26', '2025-11-14 15:48:26', 1, 1, '[\"dashboard\",\"clients\",\"reports\",\"credit-report\",\"support\",\"settings\"]');

-- --------------------------------------------------------

--
-- Table structure for table `support_general_settings`
--

CREATE TABLE `support_general_settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `support_email` varchar(255) NOT NULL,
  `timezone` varchar(100) NOT NULL DEFAULT 'UTC',
  `language` varchar(10) NOT NULL DEFAULT 'en',
  `auto_assignment` tinyint(1) NOT NULL DEFAULT 1,
  `ticket_auto_close_days` int(11) NOT NULL DEFAULT 30,
  `max_tickets_per_agent` int(11) NOT NULL DEFAULT 50,
  `response_time_target` int(11) NOT NULL DEFAULT 24,
  `resolution_time_target` int(11) NOT NULL DEFAULT 72,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_metrics`
--

CREATE TABLE `support_metrics` (
  `id` int(11) NOT NULL,
  `metric_date` date NOT NULL,
  `total_tickets` int(11) NOT NULL DEFAULT 0,
  `resolved_tickets` int(11) NOT NULL DEFAULT 0,
  `avg_response_time_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `avg_resolution_time_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `customer_satisfaction_avg` decimal(3,2) NOT NULL DEFAULT 0.00,
  `first_response_sla_met` int(11) NOT NULL DEFAULT 0,
  `resolution_sla_met` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_notification_settings`
--

CREATE TABLE `support_notification_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `push_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `sms_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `new_ticket_alerts` tinyint(1) NOT NULL DEFAULT 1,
  `ticket_updates` tinyint(1) NOT NULL DEFAULT 1,
  `escalation_alerts` tinyint(1) NOT NULL DEFAULT 1,
  `daily_reports` tinyint(1) NOT NULL DEFAULT 0,
  `weekly_reports` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_team_members`
--

CREATE TABLE `support_team_members` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `avatar` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `last_active` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_working_hours`
--

CREATE TABLE `support_working_hours` (
  `id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_working_day` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_type` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
  `category` enum('general','security','billing','notifications','features') NOT NULL DEFAULT 'general',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_public`, `created_at`, `updated_at`, `updated_by`) VALUES
(1, 'app.name', 'CreditRepair Pro', 'string', 'general', 'Application name', 1, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(2, 'app.version', '1.0.0', 'string', 'general', 'Application version', 1, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(3, 'security.session_timeout', '3600', 'number', 'security', 'Session timeout in seconds', 0, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(4, 'security.max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout', 0, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(5, 'billing.currency', 'USD', 'string', 'billing', 'Default currency', 1, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(6, 'notifications.email_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications', 0, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(7, 'features.community_enabled', 'true', 'boolean', 'features', 'Enable community features', 1, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1),
(8, 'features.calendar_enabled', 'true', 'boolean', 'features', 'Enable calendar features', 1, '2025-08-26 21:34:09', '2025-08-26 21:34:09', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `customer_id` int(11) NOT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','pending','resolved','closed') NOT NULL DEFAULT 'open',
  `category` varchar(100) NOT NULL,
  `assignee_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_analytics`
--

CREATE TABLE `ticket_analytics` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `first_response_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `response_time_hours` decimal(5,2) DEFAULT NULL,
  `resolution_time_hours` decimal(5,2) DEFAULT NULL,
  `customer_satisfaction_rating` tinyint(4) DEFAULT NULL CHECK (`customer_satisfaction_rating` between 1 and 5),
  `escalated` tinyint(1) NOT NULL DEFAULT 0,
  `escalated_at` datetime DEFAULT NULL,
  `sla_response_met` tinyint(1) NOT NULL DEFAULT 0,
  `sla_resolution_met` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `author_type` enum('customer','support') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `role` enum('user','admin','support','super_admin','funding_manager') NOT NULL DEFAULT 'user',
  `email_verified` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive','locked','pending') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `nmi_merchant_id` varchar(255) DEFAULT NULL,
  `nmi_public_key` varchar(500) DEFAULT NULL,
  `nmi_api_key` varchar(500) DEFAULT NULL,
  `nmi_username` varchar(255) DEFAULT NULL,
  `nmi_password` varchar(255) DEFAULT NULL,
  `nmi_test_mode` tinyint(1) NOT NULL DEFAULT 0,
  `nmi_gateway_logo` varchar(500) DEFAULT NULL,
  `credit_repair_url` varchar(500) DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `company_name`, `avatar`, `role`, `email_verified`, `status`, `created_at`, `updated_at`, `is_active`, `last_login`, `stripe_customer_id`, `nmi_merchant_id`, `nmi_public_key`, `nmi_api_key`, `nmi_username`, `nmi_password`, `nmi_test_mode`, `nmi_gateway_logo`, `credit_repair_url`, `must_change_password`) VALUES
(1, 'superadmin@scoremachine.com', '$2a$10$7hKImSh5JACyhDrhZt1KYupQksnUyAS0B1D18AIw4yflrrCs8p7Iq', 'ADR', 'Wealth', NULL, 'http://localhost:3001/uploads/profiles/profile-1762229344310-95893658.png', 'super_admin', 0, 'active', '2025-08-08 12:59:48', '2025-11-14 10:55:00', 1, '2025-11-14 15:55:00', 'cus_SwwldFmGlhVCWh', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0),
(2, 'support@scoremachine.com', '$2a$12$NrOF09FzeT3TsLoRevfIj.eD3gTratUS5P9Ptn0f3iwOfCwBJENpa', 'Support', 'Team', 'Credit Repair Support', NULL, 'support', 0, 'active', '2025-08-29 14:01:15', '2025-11-13 22:26:06', 1, '2025-11-10 21:22:14', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0),
(3, 'funding@scoremachine.com', '$2a$10$eef5tVoxX0W/gFXPWOvpKeoAkc9.nbuLWGYE7Z6UTm.q6apSZzp/2', 'Funding', 'Managers', NULL, '/uploads/profiles/profile-1758540489623-705678040.PNG', 'funding_manager', 0, 'active', '2025-09-21 17:03:24', '2025-11-13 22:26:14', 1, '2025-11-11 12:33:52', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_activities`
--

CREATE TABLE `user_activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('login','logout','create','update','delete','view','export','import') NOT NULL,
  `resource_type` varchar(50) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recipient_id` (`recipient_id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_access_level` (`access_level`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_last_activity_at` (`last_activity_at`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `admin_subscriptions`
--
ALTER TABLE `admin_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_plan_id` (`plan_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_end_date` (`end_date`),
  ADD KEY `idx_next_payment_date` (`next_payment_date`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `affiliates`
--
ALTER TABLE `affiliates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_parent_affiliate_id` (`parent_affiliate_id`),
  ADD KEY `idx_affiliate_stripe_customer_id` (`stripe_customer_id`);

--
-- Indexes for table `affiliate_clicks`
--
ALTER TABLE `affiliate_clicks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`),
  ADD KEY `idx_tracking_code` (`tracking_code`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_converted` (`converted`);

--
-- Indexes for table `affiliate_commissions`
--
ALTER TABLE `affiliate_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_referral_id` (`referral_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_tier` (`tier`),
  ADD KEY `idx_order_date` (`order_date`),
  ADD KEY `idx_tracking_code` (`tracking_code`);

--
-- Indexes for table `affiliate_notification_settings`
--
ALTER TABLE `affiliate_notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `affiliate_id` (`affiliate_id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`);

--
-- Indexes for table `affiliate_password_reset_codes`
--
ALTER TABLE `affiliate_password_reset_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_affiliate_active_code` (`affiliate_id`,`used`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `affiliate_payment_history`
--
ALTER TABLE `affiliate_payment_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`),
  ADD KEY `idx_transaction_id` (`transaction_id`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `affiliate_payment_settings`
--
ALTER TABLE `affiliate_payment_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `affiliate_id` (`affiliate_id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`);

--
-- Indexes for table `affiliate_referrals`
--
ALTER TABLE `affiliate_referrals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`),
  ADD KEY `idx_referred_user_id` (`referred_user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_referral_date` (`referral_date`);

--
-- Indexes for table `agent_performance`
--
ALTER TABLE `agent_performance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_agent_date` (`agent_id`,`performance_date`),
  ADD KEY `idx_agent_id` (`agent_id`),
  ADD KEY `idx_performance_date` (`performance_date`);

--
-- Indexes for table `analytics`
--
ALTER TABLE `analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_metric_period_date` (`user_id`,`metric_type`,`period`,`date`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_metric_type` (`metric_type`),
  ADD KEY `idx_period` (`period`),
  ADD KEY `idx_date` (`date`);

--
-- Indexes for table `article_interactions`
--
ALTER TABLE `article_interactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_article_interaction` (`article_id`,`user_id`,`interaction_type`),
  ADD KEY `idx_article` (`article_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_type` (`interaction_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_table_name` (`table_name`),
  ADD KEY `idx_record_id` (`record_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_changed_by` (`changed_by`),
  ADD KEY `idx_changed_at` (`changed_at`);

--
-- Indexes for table `banks`
--
ALTER TABLE `banks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bank_name` (`name`),
  ADD KEY `idx_banks_funding_manager_id` (`funding_manager_id`),
  ADD KEY `idx_banks_status` (`status`),
  ADD KEY `idx_banks_active` (`is_active`);

--
-- Indexes for table `billing_transactions`
--
ALTER TABLE `billing_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_stripe_payment_intent` (`stripe_payment_intent_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_virtual` (`is_virtual`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_card_per_bank` (`bank_id`,`card_name`),
  ADD KEY `idx_cards_bank_id` (`bank_id`),
  ADD KEY `idx_cards_type` (`card_type`),
  ADD KEY `idx_cards_active` (`is_active`),
  ADD KEY `idx_cards_amount_approved` (`amount_approved`),
  ADD KEY `idx_cards_no_of_usage` (`no_of_usage`),
  ADD KEY `idx_cards_average_amount` (`average_amount`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_receiver_id` (`receiver_id`),
  ADD KEY `idx_ticket_reference_id` (`ticket_reference_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_clients_created_by` (`created_by`),
  ADD KEY `fk_clients_updated_by` (`updated_by`);

--
-- Indexes for table `client_funding_submissions`
--
ALTER TABLE `client_funding_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_client_card` (`client_id`,`card_id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_card_id` (`card_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_comment_user_like` (`comment_id`,`user_id`),
  ADD KEY `idx_comment_id` (`comment_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `commission_payments`
--
ALTER TABLE `commission_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_affiliate_id` (`affiliate_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `commission_tiers`
--
ALTER TABLE `commission_tiers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_min_referrals` (`min_referrals`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_pinned` (`is_pinned`);

--
-- Indexes for table `contracts`
--
ALTER TABLE `contracts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_template_id` (`template_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `contract_signatures`
--
ALTER TABLE `contract_signatures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contract_id` (`contract_id`),
  ADD KEY `idx_signed_at` (`signed_at`),
  ADD KEY `signer_user_id` (`signer_user_id`),
  ADD KEY `signer_client_id` (`signer_client_id`);

--
-- Indexes for table `contract_templates`
--
ALTER TABLE `contract_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_difficulty` (`difficulty`),
  ADD KEY `idx_featured` (`featured`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_courses_status` (`status`),
  ADD KEY `idx_courses_featured` (`featured`),
  ADD KEY `idx_courses_is_free` (`is_free`),
  ADD KEY `idx_courses_category_id` (`category_id`),
  ADD KEY `idx_courses_instructor_id` (`instructor_id`),
  ADD KEY `idx_courses_rating` (`rating`),
  ADD KEY `idx_courses_difficulty` (`difficulty_level`);

--
-- Indexes for table `course_categories`
--
ALTER TABLE `course_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_parent_category` (`parent_category_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `course_chapters`
--
ALTER TABLE `course_chapters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_order_index` (`order_index`);

--
-- Indexes for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_course` (`user_id`,`course_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_completed` (`completed`);

--
-- Indexes for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_module_id` (`module_id`),
  ADD KEY `idx_video_id` (`video_id`),
  ADD KEY `idx_file_type` (`file_type`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `course_modules`
--
ALTER TABLE `course_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_order` (`order_index`),
  ADD KEY `unlock_after_module_id` (`unlock_after_module_id`);

--
-- Indexes for table `course_quizzes`
--
ALTER TABLE `course_quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_module_id` (`module_id`),
  ADD KEY `idx_video_id` (`video_id`),
  ADD KEY `idx_quiz_type` (`quiz_type`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `course_videos`
--
ALTER TABLE `course_videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_module_id` (`module_id`),
  ADD KEY `idx_order` (`order_index`),
  ADD KEY `idx_is_preview` (`is_preview`);

--
-- Indexes for table `credit_reports`
--
ALTER TABLE `credit_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_client_bureau_date` (`client_id`,`bureau`,`report_date`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_bureau` (`bureau`),
  ADD KEY `idx_report_date` (`report_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `credit_report_history`
--
ALTER TABLE `credit_report_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `disputes`
--
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_used` (`used`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_employee_user` (`user_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event_user` (`event_id`,`user_id`),
  ADD KEY `idx_event_id` (`event_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_registered_at` (`registered_at`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_order` (`order_index`);
ALTER TABLE `faqs` ADD FULLTEXT KEY `idx_search` (`question`,`answer`);

--
-- Indexes for table `faq_interactions`
--
ALTER TABLE `faq_interactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_faq_interaction` (`faq_id`,`user_id`,`interaction_type`),
  ADD KEY `idx_faq` (`faq_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_type` (`interaction_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `funding_diy_submissions`
--
ALTER TABLE `funding_diy_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_card_submission` (`submitted_by`,`card_id`),
  ADD KEY `idx_card_id` (`card_id`),
  ADD KEY `idx_submitted_by` (`submitted_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_card_type` (`card_type`);

--
-- Indexes for table `funding_requests`
--
ALTER TABLE `funding_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviewer_id` (`reviewer_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_requested_date` (`requested_date`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_privacy` (`privacy`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_user` (`group_id`,`user_id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `invited_by` (`invited_by`);

--
-- Indexes for table `group_posts`
--
ALTER TABLE `group_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_pinned` (`is_pinned`);

--
-- Indexes for table `invitations`
--
ALTER TABLE `invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invitations_email` (`email`),
  ADD KEY `idx_invitations_status` (`status`),
  ADD KEY `idx_invitations_type` (`type`),
  ADD KEY `sent_by` (`sent_by`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD UNIQUE KEY `public_token` (`public_token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- Indexes for table `knowledge_articles`
--
ALTER TABLE `knowledge_articles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_featured` (`featured`),
  ADD KEY `idx_author` (`author_id`),
  ADD KEY `idx_created_at` (`created_at`);
ALTER TABLE `knowledge_articles` ADD FULLTEXT KEY `idx_search` (`title`,`content`);

--
-- Indexes for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_active_code` (`user_id`,`used`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `pending_registrations`
--
ALTER TABLE `pending_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `plan_course_associations`
--
ALTER TABLE `plan_course_associations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_plan_course` (`plan_id`,`course_id`),
  ADD KEY `idx_plan_id` (`plan_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `post_comments`
--
ALTER TABLE `post_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_post_id` (`post_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_parent_comment_id` (`parent_comment_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `post_likes`
--
ALTER TABLE `post_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_post_user_like` (`post_id`,`user_id`),
  ADD KEY `idx_post_id` (`post_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `post_reactions`
--
ALTER TABLE `post_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_post_user_reaction` (`post_id`,`user_id`),
  ADD KEY `idx_post_id` (`post_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_reaction_type` (`reaction_type`);

--
-- Indexes for table `post_shares`
--
ALTER TABLE `post_shares`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_post_id` (`post_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_platform` (`platform`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quiz_id` (`quiz_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_enrollment_id` (`enrollment_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_started_at` (`started_at`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quiz_id` (`quiz_id`),
  ADD KEY `idx_question_type` (`question_type`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `stripe_config`
--
ALTER TABLE `stripe_config`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_stripe_subscription` (`stripe_subscription_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_billing_cycle` (`billing_cycle`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `support_general_settings`
--
ALTER TABLE `support_general_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `support_metrics`
--
ALTER TABLE `support_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_metric_date` (`metric_date`),
  ADD KEY `idx_metric_date` (`metric_date`);

--
-- Indexes for table `support_notification_settings`
--
ALTER TABLE `support_notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `support_team_members`
--
ALTER TABLE `support_team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `support_working_hours`
--
ALTER TABLE `support_working_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_day` (`day_of_week`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_key` (`setting_key`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_is_public` (`is_public`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_assignee_id` (`assignee_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `ticket_analytics`
--
ALTER TABLE `ticket_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_ticket_analytics` (`ticket_id`),
  ADD KEY `idx_ticket_id` (`ticket_id`),
  ADD KEY `idx_first_response` (`first_response_at`),
  ADD KEY `idx_resolved_at` (`resolved_at`),
  ADD KEY `idx_satisfaction` (`customer_satisfaction_rating`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ticket_id` (`ticket_id`),
  ADD KEY `idx_author_id` (`author_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_stripe_customer_id` (`stripe_customer_id`);

--
-- Indexes for table `user_activities`
--
ALTER TABLE `user_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_resource_type` (`resource_type`),
  ADD KEY `idx_resource_id` (`resource_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_ip_address` (`ip_address`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `admin_subscriptions`
--
ALTER TABLE `admin_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `affiliates`
--
ALTER TABLE `affiliates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `affiliate_clicks`
--
ALTER TABLE `affiliate_clicks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `affiliate_commissions`
--
ALTER TABLE `affiliate_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `affiliate_notification_settings`
--
ALTER TABLE `affiliate_notification_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `affiliate_password_reset_codes`
--
ALTER TABLE `affiliate_password_reset_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `affiliate_payment_history`
--
ALTER TABLE `affiliate_payment_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `affiliate_payment_settings`
--
ALTER TABLE `affiliate_payment_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `affiliate_referrals`
--
ALTER TABLE `affiliate_referrals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `agent_performance`
--
ALTER TABLE `agent_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `analytics`
--
ALTER TABLE `analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `article_interactions`
--
ALTER TABLE `article_interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `banks`
--
ALTER TABLE `banks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `billing_transactions`
--
ALTER TABLE `billing_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `cards`
--
ALTER TABLE `cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=413;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `client_funding_submissions`
--
ALTER TABLE `client_funding_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `comment_likes`
--
ALTER TABLE `comment_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `commission_payments`
--
ALTER TABLE `commission_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `commission_tiers`
--
ALTER TABLE `commission_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `community_posts`
--
ALTER TABLE `community_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `contracts`
--
ALTER TABLE `contracts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `contract_signatures`
--
ALTER TABLE `contract_signatures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `contract_templates`
--
ALTER TABLE `contract_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `course_categories`
--
ALTER TABLE `course_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `course_chapters`
--
ALTER TABLE `course_chapters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `course_materials`
--
ALTER TABLE `course_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `course_modules`
--
ALTER TABLE `course_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_quizzes`
--
ALTER TABLE `course_quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `course_videos`
--
ALTER TABLE `course_videos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `credit_reports`
--
ALTER TABLE `credit_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `credit_report_history`
--
ALTER TABLE `credit_report_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `disputes`
--
ALTER TABLE `disputes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `event_registrations`
--
ALTER TABLE `event_registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `faq_interactions`
--
ALTER TABLE `faq_interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `funding_diy_submissions`
--
ALTER TABLE `funding_diy_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `funding_requests`
--
ALTER TABLE `funding_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `group_posts`
--
ALTER TABLE `group_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `knowledge_articles`
--
ALTER TABLE `knowledge_articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pending_registrations`
--
ALTER TABLE `pending_registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `plan_course_associations`
--
ALTER TABLE `plan_course_associations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `post_comments`
--
ALTER TABLE `post_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `post_likes`
--
ALTER TABLE `post_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `post_reactions`
--
ALTER TABLE `post_reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `post_shares`
--
ALTER TABLE `post_shares`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stripe_config`
--
ALTER TABLE `stripe_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `support_general_settings`
--
ALTER TABLE `support_general_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `support_metrics`
--
ALTER TABLE `support_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `support_notification_settings`
--
ALTER TABLE `support_notification_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `support_team_members`
--
ALTER TABLE `support_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `support_working_hours`
--
ALTER TABLE `support_working_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `ticket_analytics`
--
ALTER TABLE `ticket_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `user_activities`
--
ALTER TABLE `user_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD CONSTRAINT `admin_notifications_ibfk_1` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `affiliate_password_reset_codes`
--
ALTER TABLE `affiliate_password_reset_codes`
  ADD CONSTRAINT `affiliate_password_reset_codes_ibfk_1` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_clients_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_clients_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `client_funding_submissions`
--
ALTER TABLE `client_funding_submissions`
  ADD CONSTRAINT `client_funding_submissions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_funding_submissions_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_funding_submissions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_funding_submissions_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_ibfk_3` FOREIGN KEY (`template_id`) REFERENCES `contract_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `contracts_ibfk_5` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `contract_signatures`
--
ALTER TABLE `contract_signatures`
  ADD CONSTRAINT `contract_signatures_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_signatures_ibfk_2` FOREIGN KEY (`signer_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contract_signatures_ibfk_3` FOREIGN KEY (`signer_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `contract_templates`
--
ALTER TABLE `contract_templates`
  ADD CONSTRAINT `contract_templates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_templates_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `contract_templates_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `funding_diy_submissions`
--
ALTER TABLE `funding_diy_submissions`
  ADD CONSTRAINT `funding_diy_submissions_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `funding_diy_submissions_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `plan_course_associations`
--
ALTER TABLE `plan_course_associations`
  ADD CONSTRAINT `plan_course_associations_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plan_course_associations_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plan_course_associations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `course_quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `course_quizzes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
