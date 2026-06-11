import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Asset,
  Application,
  ApprovalRecord,
  Valuation,
} from '../../src/types/index.js';
import {
  mockUsers,
  mockAssets,
  mockApplications,
  mockApprovalRecords,
  mockValuations,
} from '../../src/mock/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname);
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  users: User[];
  assets: Asset[];
  applications: Application[];
  approvalRecords: ApprovalRecord[];
  valuations: Valuation[];
}

function getDefaultData(): Database {
  return {
    users: JSON.parse(JSON.stringify(mockUsers)),
    assets: JSON.parse(JSON.stringify(mockAssets)),
    applications: JSON.parse(JSON.stringify(mockApplications)),
    approvalRecords: JSON.parse(JSON.stringify(mockApprovalRecords)),
    valuations: JSON.parse(JSON.stringify(mockValuations)),
  };
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromFile(): Database {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = getDefaultData();
    saveToFile(defaultData);
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw) as Database;
    return {
      users: data.users || mockUsers,
      assets: data.assets || mockAssets,
      applications: data.applications || mockApplications,
      approvalRecords: data.approvalRecords || mockApprovalRecords,
      valuations: data.valuations || mockValuations,
    };
  } catch {
    const defaultData = getDefaultData();
    saveToFile(defaultData);
    return defaultData;
  }
}

function saveToFile(data: Database): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    db = loadFromFile();
  }
  return db;
}

export function persist(): void {
  if (db) {
    saveToFile(db);
  }
}

export function resetDatabase(): void {
  db = getDefaultData();
  saveToFile(db);
}

export const users: User[] = getDb().users;
export const assets: Asset[] = getDb().assets;
export const applications: Application[] = getDb().applications;
export const approvalRecords: ApprovalRecord[] = getDb().approvalRecords;
export const valuations: Valuation[] = getDb().valuations;
