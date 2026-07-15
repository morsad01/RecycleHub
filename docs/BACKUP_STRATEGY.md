# Enterprise Backup and Disaster Recovery Strategy

This document outlines the backup and recovery procedures for the RecycleHub enterprise platform.

## 1. Database Backups (Supabase)

RecycleHub utilizes Supabase's managed Postgres infrastructure.
- **Automated PITR (Point-in-Time Recovery):** Enabled. Ensures the database can be restored to any exact minute within the last 7 days.
- **Daily Logical Backups:** Automated `pg_dump` backups are taken daily at 02:00 AM UTC and stored securely in an external AWS S3 bucket.

### Manual Backup Command
To trigger a manual logical backup:
```bash
pg_dump -h db.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

## 2. Object Storage Backups

User uploads (product images, avatars) are stored in Supabase Storage.
- **Replication:** Storage buckets are configured for Cross-Region Replication (CRR) ensuring high availability.
- **Cold Storage:** A monthly sync script replicates production buckets to Glacier deep archive for compliance.

## 3. Disaster Recovery Plan

In the event of a critical failure:
1. **Identify the Failure Domain:** Assess if it is a database corruption, storage failure, or hosting failure.
2. **Database Recovery:** 
   - Use the Supabase Dashboard to initiate a PITR restore.
   - If PITR fails, restore from the latest `pg_dump` backup.
3. **Application Recovery:**
   - Redeploy the application to the secondary fallback cluster via GitHub Actions if the primary hosting (e.g., Vercel) is experiencing an outage.

## 4. Testing
- Recovery procedures are tested bi-annually in a staging environment to validate RTO (Recovery Time Objective) and RPO (Recovery Point Objective) metrics.
