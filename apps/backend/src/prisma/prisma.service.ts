import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {

    constructor() {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
            const host = dbUrl.split('@')[1]?.split(':')[0] || 'unknown';
            console.log(`Prisma initializing connection to host: ${host}`);
        }
        
        const pool = new Pool({ 
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false } // Required for Supabase in many serverless environments
        });
        const adapter = new PrismaPg(pool);
        super({ adapter });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
