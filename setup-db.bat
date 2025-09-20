@echo off
echo 🚀 Setting up your manufacturing database...

echo.
echo 📊 Applying database migrations...
npx prisma migrate deploy

echo.
echo 🔄 Generating Prisma client...
npx prisma generate

echo.
echo 🌱 Seeding database with demo accounts and sample data...
npx prisma db seed

echo.
echo ✅ Database setup complete!
echo.
echo 📋 Demo Accounts Created:
echo 👨‍💼 Admin: admin@demo.com / Admin@123
echo 👨‍🔧 Manager: manager@demo.com / Manager@123
echo 👨‍🏭 Operator: operator@demo.com / Operator@123
echo 📦 Inventory: inventory@demo.com / Inventory@123
echo.
echo 🌐 Next: Update your Vercel environment variables with the same DATABASE_URL
pause
