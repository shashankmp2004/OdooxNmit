# OdooxNmit - Complete Database Implementation Guide

## Quick Start Guide

This guide provides everything you need to implement and enhance the OdooxNmit manufacturing database system.

## 🗂️ Documentation Overview

### 1. 📋 [Database Schema Documentation](./DATABASE_SCHEMA_DOCUMENTATION.md)
**Complete reference for the current database structure**
- All models and relationships explained
- Field descriptions and constraints
- Enum definitions and usage
- Security and performance considerations

### 2. 🔄 [Workflow Documentation](./WORKFLOW_DOCUMENTATION.md)
**Business process flows and user workflows**
- Manufacturing order lifecycle
- Inventory management processes
- Work order execution flows
- User role-based workflows
- Integration points and APIs

### 3. 🚀 [Enhanced Schema Design](./ENHANCED_SCHEMA_DESIGN.md)
**Advanced improvements and future enhancements**
- Batch and serial number tracking
- Advanced quality management
- Warehouse and location management
- Supplier and purchase order systems
- Performance optimizations

## 📊 Entity Relationship Overview

```mermaid
erDiagram
    User ||--o{ ManufacturingOrder : creates
    User ||--o{ WorkOrder : assigned_to
    Product ||--o{ BOM : has
    Product ||--o{ StockEntry : tracks
    BOM ||--o{ BOMComponent : contains
    ManufacturingOrder ||--o{ WorkOrder : generates
    WorkCenter ||--o{ WorkOrder : hosts
    Product ||--o{ ManufacturingOrder : produces

    User {
        string id PK
        string email UK
        UserRole role
        string password
        datetime created_at
    }
    
    Product {
        string id PK
        string sku UK
        string name
        string category
        float stock
        boolean is_finished
    }
    
    ManufacturingOrder {
        string id PK
        string order_no UK
        string product_id FK
        int quantity
        OrderState state
        datetime deadline
        json bom_snapshot
    }
    
    WorkOrder {
        string id PK
        string mo_id FK
        string title
        WorkStatus status
        int progress
        float estimated_time
    }
    
    StockEntry {
        string id PK
        string product_id FK
        StockEntryType type
        float quantity
        float change
        datetime created_at
    }
```

## 🏗️ Implementation Steps

### Step 1: Database Setup
```bash
# Install dependencies
npm install prisma @prisma/client bcryptjs

# Initialize Prisma (if not already done)
npx prisma init

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npm run db:seed
```

### Step 2: Environment Configuration
```env
# .env file
DATABASE_URL="postgresql://username:password@localhost:5432/odooxnmit"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Step 3: Key Database Operations

#### Creating a Manufacturing Order
```typescript
const createManufacturingOrder = async (data: {
  productId: string;
  quantity: number;
  deadline: Date;
  createdById: string;
}) => {
  // Get active BOM
  const bom = await prisma.bOM.findFirst({
    where: { productId: data.productId, isActive: true },
    include: { components: true }
  });

  // Create MO with BOM snapshot
  const mo = await prisma.manufacturingOrder.create({
    data: {
      orderNo: generateOrderNumber(),
      name: `Production Order ${data.quantity}`,
      productId: data.productId,
      quantity: data.quantity,
      deadline: data.deadline,
      createdById: data.createdById,
      bomSnapshot: bom?.components.map(c => ({
        materialId: c.materialId,
        qtyPerUnit: c.qtyPerUnit
      })) || []
    }
  });

  // Generate work orders
  await generateWorkOrders(mo.id);
  
  return mo;
};
```

#### Stock Movement Processing
```typescript
const processStockMovement = async (data: {
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reference?: string;
  sourceType?: string;
}) => {
  const product = await prisma.product.findUnique({
    where: { id: data.productId }
  });

  const change = data.type === 'IN' ? data.quantity : -data.quantity;
  const newBalance = product.stock + change;

  // Create stock entry
  await prisma.stockEntry.create({
    data: {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      change: change,
      reference: data.reference,
      sourceType: data.sourceType,
      balanceAfter: newBalance
    }
  });

  // Update product stock
  await prisma.product.update({
    where: { id: data.productId },
    data: { stock: newBalance }
  });
};
```

### Step 4: Common Queries

#### Dashboard Statistics
```typescript
const getDashboardStats = async () => {
  const [
    totalProducts,
    activeMOs,
    pendingWOs,
    lowStockProducts
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.manufacturingOrder.count({ 
      where: { state: { in: ['PLANNED', 'IN_PROGRESS'] } } 
    }),
    prisma.workOrder.count({ 
      where: { status: { in: ['PENDING', 'STARTED'] } } 
    }),
    prisma.product.count({
      where: {
        stock: { lte: prisma.raw('min_stock_alert') },
        isActive: true
      }
    })
  ]);

  return {
    totalProducts,
    activeMOs,
    pendingWOs,
    lowStockProducts
  };
};
```

#### Work Order Progress
```typescript
const getWorkOrderProgress = async (moId: string) => {
  const workOrders = await prisma.workOrder.findMany({
    where: { moId },
    include: {
      assignedTo: { select: { name: true } },
      workCenter: { select: { name: true } }
    }
  });

  const totalWOs = workOrders.length;
  const completedWOs = workOrders.filter(wo => wo.status === 'COMPLETED').length;
  const progressPercentage = totalWOs > 0 ? (completedWOs / totalWOs) * 100 : 0;

  return {
    workOrders,
    totalWOs,
    completedWOs,
    progressPercentage
  };
};
```

## 🔒 Security Implementation

### Authentication Middleware
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add custom logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Admin routes
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN';
        }
        
        // Manager routes
        if (pathname.startsWith('/manager')) {
          return ['ADMIN', 'MANAGER'].includes(token?.role);
        }
        
        return !!token;
      },
    },
  }
);
```

### Role-Based Data Access
```typescript
const getPolicyFilteredData = async (userId: string, userRole: string) => {
  const baseQuery = {
    include: {
      createdBy: { select: { name: true } },
      workOrders: { select: { id: true, status: true } }
    }
  };

  switch (userRole) {
    case 'ADMIN':
    case 'MANAGER':
      return prisma.manufacturingOrder.findMany(baseQuery);
    
    case 'OPERATOR':
      return prisma.manufacturingOrder.findMany({
        ...baseQuery,
        where: {
          workOrders: {
            some: { assignedToId: userId }
          }
        }
      });
    
    default:
      return [];
  }
};
```

## 📈 Performance Optimization

### Database Indexing
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_mo_state_deadline ON manufacturing_orders(state, deadline);
CREATE INDEX CONCURRENTLY idx_wo_status_assigned ON work_orders(status, assigned_to_id);
CREATE INDEX CONCURRENTLY idx_stock_product_date ON stock_entries(product_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_products_low_stock ON products(stock, min_stock_alert) WHERE stock <= min_stock_alert;
```

### Query Optimization
```typescript
// Use select to limit returned fields
const getProductsSummary = async () => {
  return prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      minStockAlert: true
    },
    where: { isActive: true }
  });
};

// Use pagination for large datasets
const getManufacturingOrdersPaginated = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  
  const [orders, total] = await Promise.all([
    prisma.manufacturingOrder.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } }
      }
    }),
    prisma.manufacturingOrder.count()
  ]);
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

## 🧪 Testing Strategy

### Unit Tests Example
```typescript
// __tests__/manufacturing-order.test.ts
import { createManufacturingOrder } from '../lib/manufacturing';
import { prisma } from '../lib/prisma';

describe('Manufacturing Order', () => {
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.workOrder.deleteMany(),
      prisma.manufacturingOrder.deleteMany(),
      prisma.bOMComponent.deleteMany(),
      prisma.bOM.deleteMany(),
      prisma.product.deleteMany(),
      prisma.user.deleteMany()
    ]);
  });

  it('should create MO with BOM snapshot', async () => {
    // Setup test data
    const user = await prisma.user.create({
      data: { name: 'Test User', email: 'test@test.com', role: 'MANAGER' }
    });
    
    const product = await prisma.product.create({
      data: { name: 'Test Product', sku: 'TEST-001', isFinished: true }
    });

    // Create and test MO
    const mo = await createManufacturingOrder({
      productId: product.id,
      quantity: 10,
      deadline: new Date(),
      createdById: user.id
    });

    expect(mo.quantity).toBe(10);
    expect(mo.state).toBe('PLANNED');
  });
});
```

## 🚀 Deployment Guide

### Production Database Setup
```bash
# Production environment variables
DATABASE_URL="postgresql://user:pass@prod-db:5432/odooxnmit_prod"
NEXTAUTH_SECRET="production-secret-key"
NODE_ENV="production"

# Run migrations in production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Monitoring and Alerts
```typescript
// lib/monitoring.ts
export const logDatabasePerformance = async (query: string, duration: number) => {
  if (duration > 1000) { // Log slow queries
    console.warn(`Slow query detected: ${query} took ${duration}ms`);
  }
};

export const checkSystemHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { database: 'healthy' };
  } catch (error) {
    return { database: 'unhealthy', error: error.message };
  }
};
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check system health and performance metrics
2. **Weekly**: Review slow query logs and optimize
3. **Monthly**: Update database statistics and reindex if needed
4. **Quarterly**: Review and update security settings

### Troubleshooting Common Issues
- **Slow queries**: Check indexes and query patterns
- **Lock timeouts**: Review concurrent transaction patterns
- **Memory issues**: Optimize query result sizes and pagination
- **Connection pool**: Monitor and adjust connection limits

This implementation guide provides a comprehensive foundation for building and maintaining a robust manufacturing management system with the OdooxNmit database schema.
