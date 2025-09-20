import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check if users already exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already seeded',
        userCount: existingUsers
      })
    }

    // Hash passwords
    const adminPass = await bcrypt.hash("Admin@123", 10)
    const managerPass = await bcrypt.hash("Manager@123", 10)
    const operatorPass = await bcrypt.hash("Operator@123", 10)
    const inventoryPass = await bcrypt.hash("Inventory@123", 10)

    // Create demo users
    await prisma.user.createMany({
      data: [
        {
          fullName: "Admin User",
          name: "Admin User",
          email: "admin@demo.com",
          role: "admin",
          passwordHash: adminPass
        },
        {
          fullName: "Production Manager",
          name: "Production Manager",
          email: "manager@demo.com",
          role: "manager",
          passwordHash: managerPass
        },
        {
          fullName: "Floor Operator",
          name: "Floor Operator",
          email: "operator@demo.com",
          role: "operator",
          passwordHash: operatorPass
        },
        {
          fullName: "Inventory Manager",
          name: "Inventory Manager",
          email: "inventory@demo.com",
          role: "inventory_manager",
          passwordHash: inventoryPass
        }
      ]
    })

    const userCount = await prisma.user.count()

    return NextResponse.json({
      message: 'Database seeded successfully',
      userCount,
      demoAccounts: [
        { email: 'admin@demo.com', password: 'Admin@123' },
        { email: 'manager@demo.com', password: 'Manager@123' },
        { email: 'operator@demo.com', password: 'Operator@123' },
        { email: 'inventory@demo.com', password: 'Inventory@123' }
      ]
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json({
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: { email: true, role: true, fullName: true }
    })

    return NextResponse.json({
      userCount,
      users,
      demoAccounts: [
        { email: 'admin@demo.com', password: 'Admin@123' },
        { email: 'manager@demo.com', password: 'Manager@123' },
        { email: 'operator@demo.com', password: 'Operator@123' },
        { email: 'inventory@demo.com', password: 'Inventory@123' }
      ]
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
