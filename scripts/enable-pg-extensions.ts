/**
 * POSTGRESQL EXTENSIONS UTILITY
 * Check and enable recommended extensions for Neon PostgreSQL
 * 
 * Usage: npx tsx scripts/enable-pg-extensions.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

interface ExtensionConfig {
    description: string;
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    command: string;
    docsUrl: string;
    note?: string;
}

// Recommended extensions for Neon PostgreSQL
const RECOMMENDED_EXTENSIONS: Record<string, ExtensionConfig> = {
    // Performance & Monitoring
    pg_stat_statements: {
        description: 'Track execution statistics of all SQL statements',
        category: 'Performance Monitoring',
        priority: 'HIGH',
        command: 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;',
        docsUrl: 'https://www.postgresql.org/docs/current/pgstatstatements.html'
    },

    // Text Search & Matching
    pg_trgm: {
        description: 'Trigram matching for fuzzy text search',
        category: 'Text Search',
        priority: 'MEDIUM',
        command: 'CREATE EXTENSION IF NOT EXISTS pg_trgm;',
        docsUrl: 'https://www.postgresql.org/docs/current/pgtrgm.html'
    },

    // Security & Crypto
    pgcrypto: {
        description: 'Cryptographic functions for secure hashing and encryption',
        category: 'Security',
        priority: 'MEDIUM',
        command: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
        docsUrl: 'https://www.postgresql.org/docs/current/pgcrypto.html'
    },

    // UUID Generation
    'uuid-ossp': {
        description: 'Generate universally unique identifiers (UUIDs)',
        category: 'Data Types',
        priority: 'MEDIUM',
        command: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        docsUrl: 'https://www.postgresql.org/docs/current/uuid-ossp.html'
    },

    // AI & Vector Search (Optional)
    pgvector: {
        description: 'Vector similarity search for AI/ML embeddings',
        category: 'AI/ML',
        priority: 'LOW',
        command: 'CREATE EXTENSION IF NOT EXISTS vector;',
        docsUrl: 'https://github.com/pgvector/pgvector',
        note: 'Only enable if using vector embeddings for AI use cases'
    }
};

interface Extension {
    name: string;
    default_version: string;
    installed_version: string | null;
    comment: string;
}

async function checkExtensions() {
    console.log('\n🔍 Checking PostgreSQL Extensions...\n');

    try {
        // Get list of available extensions
        const availableExtensions = await sql`
      SELECT 
        name,
        default_version,
        installed_version,
        comment
      FROM pg_available_extensions
      ORDER BY name;
    ` as Extension[];

        // Get currently installed extensions
        const installedExtensions = availableExtensions.filter(ext => ext.installed_version !== null);

        console.log(`✅ Currently Installed Extensions (${installedExtensions.length}):\n`);
        installedExtensions.forEach(ext => {
            console.log(`   • ${ext.name} (v${ext.installed_version})`);
            if (ext.comment) {
                console.log(`     ${ext.comment}`);
            }
        });

        console.log('\n📋 Recommended Extensions:\n');

        // Check each recommended extension
        for (const [extName, config] of Object.entries(RECOMMENDED_EXTENSIONS)) {
            const isInstalled = installedExtensions.some(ext => ext.name === extName);
            const isAvailable = availableExtensions.some(ext => ext.name === extName);

            const priorityEmoji = config.priority === 'HIGH' ? '🔴' : config.priority === 'MEDIUM' ? '🟡' : '🔵';
            const statusEmoji = isInstalled ? '✅' : (isAvailable ? '⚠️ ' : '❌');

            console.log(`${priorityEmoji} ${statusEmoji} ${extName}`);
            console.log(`   Category: ${config.category}`);
            console.log(`   Description: ${config.description}`);
            console.log(`   Status: ${isInstalled ? 'INSTALLED' : (isAvailable ? 'AVAILABLE (not installed)' : 'NOT AVAILABLE')}`);

            if (config.note) {
                console.log(`   Note: ${config.note}`);
            }

            if (!isInstalled && isAvailable) {
                console.log(`   To enable: ${config.command}`);
            }

            console.log(`   Docs: ${config.docsUrl}\n`);
        }

        // Generate SQL script for missing recommended extensions
        const missingHighPriority: string[] = [];
        const missingMediumPriority: string[] = [];

        for (const [extName, config] of Object.entries(RECOMMENDED_EXTENSIONS)) {
            const isInstalled = installedExtensions.some(ext => ext.name === extName);
            const isAvailable = availableExtensions.some(ext => ext.name === extName);

            if (!isInstalled && isAvailable) {
                if (config.priority === 'HIGH') {
                    missingHighPriority.push(config.command);
                } else if (config.priority === 'MEDIUM') {
                    missingMediumPriority.push(config.command);
                }
            }
        }

        if (missingHighPriority.length > 0 || missingMediumPriority.length > 0) {
            console.log('\n📝 SQL Commands to Enable Missing Extensions:\n');
            console.log('-- High Priority Extensions');
            if (missingHighPriority.length > 0) {
                missingHighPriority.forEach(cmd => console.log(cmd));
            } else {
                console.log('-- All high priority extensions are installed ✅');
            }

            console.log('\n-- Medium Priority Extensions (Optional)');
            if (missingMediumPriority.length > 0) {
                missingMediumPriority.forEach(cmd => console.log(cmd));
            } else {
                console.log('-- All medium priority extensions are installed ✅');
            }

            console.log('\n💡 To enable extensions, run these commands in your PostgreSQL client or add them to a migration.\n');
        } else {
            console.log('\n✨ All recommended high and medium priority extensions are already installed!\n');
        }

    } catch (error) {
        console.error('❌ Error checking extensions:', error);
        process.exit(1);
    }
}

// Run the check
checkExtensions()
    .then(() => {
        console.log('✅ Extension check complete\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
