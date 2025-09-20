// Using built-in fetch available in Node.js 18+

async function testProductCreation() {
  try {
    console.log('Testing product creation API...');
    
    const testProduct = {
      name: "Test Product",
      sku: "TEST-001",
      description: "A test product for API validation",
      category: "Electronics",
      unit: "pieces",
      price: 99.99,
      stock: 100,
      minStockAlert: 10,
      isFinished: true
    };

    const response = await fetch('http://localhost:3001/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (response.ok) {
      console.log('✅ Product creation API is working!');
    } else {
      console.log('❌ Product creation API failed');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testProductCreation();