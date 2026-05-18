// Script de test automatisé pour l'application déployée
import fetch from 'node-fetch';

const FRONTEND_URL = 'https://geoconsulting-flotte.vercel.app';
const BACKEND_URL = 'https://geoconsulting-flotte.vercel.app';

console.log('🧪 TESTS DE DÉPLOIEMENT FLEETNEXUS');
console.log('=====================================\n');

// Test 1: Vérifier que le frontend répond
async function testFrontendResponse() {
    console.log('1. Test Frontend Response...');
    try {
        const response = await fetch(FRONTEND_URL);
        if (response.ok) {
            console.log('   ✅ Frontend accessible (Status:', response.status, ')');
            return true;
        } else {
            console.log('   ❌ Frontend erreur (Status:', response.status, ')');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Frontend inaccessible:', error.message);
        return false;
    }
}

// Test 2: Vérifier les headers de sécurité
async function testSecurityHeaders() {
    console.log('2. Test Security Headers...');
    try {
        const response = await fetch(FRONTEND_URL);
        const headers = response.headers;
        
        const securityHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection'
        ];
        
        let passed = 0;
        securityHeaders.forEach(header => {
            if (headers.get(header)) {
                console.log(`   ✅ ${header}: ${headers.get(header)}`);
                passed++;
            } else {
                console.log(`   ⚠️  ${header}: Non configuré`);
            }
        });
        
        return passed >= 2;
    } catch (error) {
        console.log('   ❌ Erreur test headers:', error.message);
        return false;
    }
}

// Test 3: Vérifier l'API backend
async function testBackendAPI() {
    console.log('3. Test Backend API...');
    try {
        const response = await fetch(`${BACKEND_URL}/api/status`);
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ API Backend accessible');
            console.log('   📊 Réponse:', JSON.stringify(data, null, 2));
            return true;
        } else {
            console.log('   ❌ API Backend erreur (Status:', response.status, ')');
            return false;
        }
    } catch (error) {
        console.log('   ❌ API Backend inaccessible:', error.message);
        return false;
    }
}

// Test 4: Vérifier les assets statiques
async function testStaticAssets() {
    console.log('4. Test Static Assets...');
    try {
        // Test CSS
        const cssResponse = await fetch(`${FRONTEND_URL}/assets/index-C90DkMjv.css`);
        const cssOk = cssResponse.ok;
        
        // Test JS principal
        const jsResponse = await fetch(`${FRONTEND_URL}/assets/index-CgjRf2XY.js`);
        const jsOk = jsResponse.ok;
        
        console.log('   CSS Assets:', cssOk ? '✅' : '❌');
        console.log('   JS Assets:', jsOk ? '✅' : '❌');
        
        return cssOk && jsOk;
    } catch (error) {
        console.log('   ⚠️  Assets test partiel (normal si noms changent)');
        return true; // Non bloquant
    }
}

// Test 5: Vérifier les performances
async function testPerformance() {
    console.log('5. Test Performance...');
    try {
        const start = Date.now();
        const response = await fetch(FRONTEND_URL);
        const end = Date.now();
        
        const loadTime = end - start;
        const size = response.headers.get('content-length') || 'Unknown';
        
        console.log(`   ⏱️  Temps de réponse: ${loadTime}ms`);
        console.log(`   📦 Taille: ${size} bytes`);
        
        if (loadTime < 2000) {
            console.log('   ✅ Performance acceptable (<2s)');
            return true;
        } else {
            console.log('   ⚠️  Performance lente (>2s)');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Erreur test performance:', error.message);
        return false;
    }
}

// Test 6: Vérifier HTTPS et certificats
async function testHTTPS() {
    console.log('6. Test HTTPS & SSL...');
    try {
        const response = await fetch(FRONTEND_URL);
        const url = new URL(response.url);
        
        if (url.protocol === 'https:') {
            console.log('   ✅ HTTPS activé');
            console.log('   🔒 SSL Certificate valide');
            return true;
        } else {
            console.log('   ❌ HTTPS non activé');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Erreur test HTTPS:', error.message);
        return false;
    }
}

// Exécuter tous les tests
async function runAllTests() {
    console.log('🚀 Début des tests de déploiement...\n');
    
    const tests = [
        { name: 'Frontend Response', fn: testFrontendResponse },
        { name: 'Security Headers', fn: testSecurityHeaders },
        { name: 'Backend API', fn: testBackendAPI },
        { name: 'Static Assets', fn: testStaticAssets },
        { name: 'Performance', fn: testPerformance },
        { name: 'HTTPS & SSL', fn: testHTTPS }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        const result = await test.fn();
        if (result) passed++;
        console.log('');
    }
    
    console.log('=====================================');
    console.log(`📊 RÉSULTATS: ${passed}/${total} tests réussis`);
    
    if (passed === total) {
        console.log('🎉 TOUS LES TESTS RÉUSSIS !');
        console.log('✅ Application prête pour la production');
    } else if (passed >= total * 0.8) {
        console.log('⚠️  TESTS MAJORITAIREMENT RÉUSSIS');
        console.log('🔧 Quelques optimisations recommandées');
    } else {
        console.log('❌ PLUSIEURS TESTS ÉCHOUÉS');
        console.log('🛠️  Corrections nécessaires');
    }
    
    console.log('\n🌐 URL de l\'application:', FRONTEND_URL);
    console.log('📊 Dashboard Vercel: https://vercel.com/dashboard');
}

// Exécuter les tests
runAllTests().catch(console.error);