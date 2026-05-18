// Test spécifique de l'API
import fetch from 'node-fetch';

async function testAPI() {
    console.log('🔍 Test détaillé de l\'API...\n');
    
    const endpoints = [
        '/api/status',
        '/api/gps/positions',
        '/'  // Frontend
    ];
    
    for (const endpoint of endpoints) {
        const url = `https://geoconsulting-flotte.vercel.app${endpoint}`;
        console.log(`Testing: ${url}`);
        
        try {
            const response = await fetch(url);
            console.log(`Status: ${response.status}`);
            console.log(`Content-Type: ${response.headers.get('content-type')}`);
            
            if (endpoint === '/') {
                console.log('✅ Frontend HTML reçu');
            } else {
                const text = await response.text();
                console.log(`Response: ${text.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`❌ Erreur: ${error.message}`);
        }
        console.log('---');
    }
}

testAPI();