/**
 * Test script for enhanced mission completion endpoint
 * Tests the new distance, fuel consumed, and notes parameters
 * Validates error handling and audit trail recording
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'Bearer driver-token-test-driver-1';

async function testEnhancedMissionCompletion() {
  console.log('🧪 Testing Enhanced Mission Completion Endpoint');
  console.log('='.repeat(50));

  // Test 1: Valid mission completion with all parameters
  console.log('\n1. Testing valid mission completion with all parameters...');
  try {
    const response = await fetch(`${BASE_URL}/api/driver/me/missions/test-mission-1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEST_TOKEN,
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify({
        distance: 25.5,
        fuelConsumed: 3.2,
        notes: 'Mission completed successfully. Traffic was light.'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Mission completion successful');
      console.log('   Distance:', result.data?.distance);
      console.log('   Fuel consumed:', result.data?.fuelConsumed);
      console.log('   Notes:', result.data?.notes ? 'Present' : 'None');
      console.log('   Audit trail:', result.data?.auditTrail ? 'Present' : 'Missing');
    } else {
      console.log('❌ Mission completion failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 2: Invalid distance parameter
  console.log('\n2. Testing invalid distance parameter...');
  try {
    const response = await fetch(`${BASE_URL}/api/driver/me/missions/test-mission-2/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEST_TOKEN
      },
      body: JSON.stringify({
        distance: -10, // Invalid negative distance
        fuelConsumed: 2.0,
        notes: 'Test with invalid distance'
      })
    });

    const result = await response.json();
    
    if (!response.ok && result.error.includes('distance')) {
      console.log('✅ Correctly rejected negative distance');
    } else {
      console.log('❌ Should have rejected negative distance');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 3: Invalid fuel consumed parameter
  console.log('\n3. Testing invalid fuel consumed parameter...');
  try {
    const response = await fetch(`${BASE_URL}/api/driver/me/missions/test-mission-3/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEST_TOKEN
      },
      body: JSON.stringify({
        distance: 15.0,
        fuelConsumed: 'invalid', // Invalid non-numeric fuel
        notes: 'Test with invalid fuel'
      })
    });

    const result = await response.json();
    
    if (!response.ok && result.error.includes('carburant')) {
      console.log('✅ Correctly rejected invalid fuel consumed');
    } else {
      console.log('❌ Should have rejected invalid fuel consumed');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 4: Notes too long
  console.log('\n4. Testing notes parameter validation...');
  try {
    const longNotes = 'A'.repeat(1001); // Exceeds 1000 character limit
    
    const response = await fetch(`${BASE_URL}/api/driver/me/missions/test-mission-4/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEST_TOKEN
      },
      body: JSON.stringify({
        distance: 20.0,
        fuelConsumed: 2.5,
        notes: longNotes
      })
    });

    const result = await response.json();
    
    if (!response.ok && result.error.includes('1000 caractères')) {
      console.log('✅ Correctly rejected notes that are too long');
    } else {
      console.log('❌ Should have rejected notes that are too long');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 5: Mission completion with minimal parameters
  console.log('\n5. Testing mission completion with minimal parameters...');
  try {
    const response = await fetch(`${BASE_URL}/api/driver/me/missions/test-mission-5/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEST_TOKEN
      },
      body: JSON.stringify({
        // Only notes provided, distance and fuel optional
        notes: 'Minimal completion test'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Mission completion with minimal parameters successful');
      console.log('   Notes:', result.data?.notes);
    } else {
      console.log('❌ Mission completion failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 6: Unauthorized access
  console.log('\n6. Testing unauthorized access...');
  try {
    const response = await fetch(`${BASE_URL}/api/driver/me/missions/test-mission-6/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No authorization header
      },
      body: JSON.stringify({
        distance: 10.0,
        fuelConsumed: 1.5,
        notes: 'Unauthorized test'
      })
    });

    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Should have rejected unauthorized request');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Enhanced Mission Completion Tests Complete');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedMissionCompletion().catch(console.error);
}

export { testEnhancedMissionCompletion };