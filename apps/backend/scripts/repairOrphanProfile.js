#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import User from '../src/models/user.js';
import Profile from '../src/models/profile.js';

const MONGO = process.env.MONGODB_URI;
if (!MONGO) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

async function connect() {
  await mongoose.connect(MONGO, { dbName: undefined });
}

function usage() {
  console.log('Usage: node repairOrphanProfile.js <command> [options]\n');
  console.log('Commands:');
  console.log('  report                     List profiles whose user is missing');
  console.log('  recreate --email EMAIL --profile PROFILE_ID   Create a user for EMAIL and attach PROFILE_ID');
  console.log('\nExamples:');
  console.log('  node repairOrphanProfile.js report');
  console.log('  node repairOrphanProfile.js recreate --email user@example.com --profile 64b.....');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { cmd: args[0], opts: {} };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--email') {
      out.opts.email = args[++i];
    } else if (a === '--profile') {
      out.opts.profile = args[++i];
    }
  }
  return out;
}

async function reportOrphans() {
  const profiles = await Profile.find().lean();
  const orphans = [];
  for (const p of profiles) {
    try {
      const user = await User.findById(p.userId).lean();
      if (!user) {
        orphans.push(p);
      }
    } catch (e) {
      orphans.push(p);
    }
  }

  if (orphans.length === 0) {
    console.log('No orphaned profiles found.');
    return;
  }

  console.log(`Found ${orphans.length} orphaned profile(s):`);
  for (const p of orphans) {
    console.log(`- Profile _id: ${p._id}  name: ${p.name}  avatar: ${p.avatar || ''}  userId: ${p.userId}`);
  }
}

async function recreateUser(email, profileId) {
  if (!email) throw new Error('email is required');
  // create random password
  const pw = crypto.randomBytes(8).toString('hex') + 'A1!';
  const hashed = await bcrypt.hash(pw, 8);

  const username = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || `u${Date.now()}`;

  const user = new User({ username, email: email.toLowerCase(), password: hashed });
  await user.save();
  console.log('Created user:', user._id.toString());

  if (profileId) {
    const prof = await Profile.findById(profileId);
    if (!prof) {
      console.warn('Profile not found:', profileId);
    } else {
      prof.userId = user._id;
      await prof.save();
      console.log('Linked profile', profileId, 'to user', user._id.toString());
    }
  }

  console.log('\nTemporary password for the new user (please change immediately):', pw);
}

(async () => {
  const { cmd, opts } = parseArgs();
  if (!cmd) {
    usage();
    process.exit(1);
  }

  try {
    await connect();
    if (cmd === 'report') {
      await reportOrphans();
    } else if (cmd === 'recreate') {
      if (!opts.email) {
        console.error('Missing --email for recreate');
        usage();
        process.exit(1);
      }
      await recreateUser(opts.email, opts.profile);
    } else {
      usage();
    }
  } catch (err) {
    console.error('Error:', err && err.message);
    console.error(err && err.stack);
  } finally {
    mongoose.disconnect();
  }
})();
