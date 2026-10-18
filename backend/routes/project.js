import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';

const router = Router();

const DEFAULT_TIMETABLE_CSV = `Phase,Task Name,Start Date,End Date,Status,Assigned To,Deliverable,Approved By,Approved At
"Phase 0: Planning & Timetable","Prepare Google Sheets Project Timetable & WBS Schedule",2026-10-10,2026-10-12,"Approved","Project Manager & Lead Dev","Google Sheets Timetable & Task Matrix with Approval Gateway","Project Sponsor / Stakeholder","2026-10-12T10:00:00Z"
"Phase 1: Architecture & Database","Design MySQL Database Schema & Repository Structure",2026-10-12,2026-10-13,"Completed","Backend Developer","schema.mysql.sql with Users, Incomes, Expenses, and Categories tables","Project Sponsor / Stakeholder","2026-10-13T12:00:00Z"
"Phase 1: Backend API","Develop Authentication (Email/Mobile) & Profile Endpoints",2026-10-13,2026-10-14,"Completed","Backend Developer","Express REST API with Bcrypt security & dual identifier login","Project Sponsor / Stakeholder","2026-10-14T15:00:00Z"
"Phase 1: Financial Management","Build Income & Expense CRUD with Default & Custom Categories",2026-10-14,2026-10-15,"Completed","Full Stack Developer","Expense & Income modules with date, time, amount, note, and custom types","Project Sponsor / Stakeholder","2026-10-15T18:00:00Z"
"Phase 1: Financial To-Dos","Implement Financial To-Dos with Deadline & Priority Notifications",2026-10-15,2026-10-16,"Completed","Full Stack Developer","To-Do management, overdue/due-today notification bell & banner, priority sorting","Project Sponsor / Stakeholder","2026-10-16T19:00:00Z"
"Phase 1: Frontend SPA & Dashboard","Implement Responsive Dashboard with Visual Analytics & PWA",2026-10-16,2026-10-17,"Completed","Frontend Engineer","Single Page App, charts, breakdowns, install prompt, and mobile drawer","Project Sponsor / Stakeholder","2026-10-17T09:00:00Z"
"Phase 1: Governance & Version Control","Setup OneDrive Backup Automation & GitHub Version Control Logs",2026-10-17,2026-10-18,"Completed","DevOps / PM","Automated MySQL dump exports, commit tracking, and code snapshot archives","Project Sponsor / Stakeholder","2026-10-17T10:00:00Z"
`;

// GET /api/project/timetable/csv (Google Sheets compatible export)
router.get('/timetable/csv', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="SpendWise_Project_Timetable_GoogleSheets.csv"');
  res.send(DEFAULT_TIMETABLE_CSV);
});

// GET /api/project/backup/mysql
router.get('/backup/mysql', (_req, res) => {
  const dump = db.generateMySQLDump();
  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', `attachment; filename="spendwise_mysql_backup_${new Date().toISOString().slice(0, 10)}.sql"`);
  res.send(dump);
});

// GET /api/project/backup/json
router.get('/backup/json', (_req, res) => {
  const dataPath = path.resolve(process.cwd(), 'backend/data/spendwise_data.json');
  if (fs.existsSync(dataPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="spendwise_data_${new Date().toISOString().slice(0, 10)}.json"`);
    res.sendFile(dataPath);
  } else {
    res.json({ success: true, message: 'Database initialized' });
  }
});

export default router;
