#!/bin/bash
# Setup script for applying database migrations and seeding data

echo "🚀 Setting up your manufacturing database..."

# Step 1: Apply migrations to create the new schema
echo "📊 Applying database migrations..."
npx prisma migrate deploy

# Step 2: Generate the Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Step 3: Seed the database with demo data
echo "🌱 Seeding database with demo accounts and sample data..."
npx prisma db seed

echo "✅ Database setup complete!"
echo ""
echo "📋 Demo Accounts Created:"
echo "👨‍💼 Admin: admin@demo.com / Admin@123"
echo "👨‍🔧 Manager: manager@demo.com / Manager@123"
echo "👨‍🏭 Operator: operator@demo.com / Operator@123"
echo "📦 Inventory: inventory@demo.com / Inventory@123"
echo ""
echo "🌐 Next: Update your Vercel environment variables with the same DATABASE_URL"
