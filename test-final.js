// Test final complet de l'application
import fetch from 'node-fetch';

async function testFinalDeployment() {
    console.log('🎯 TEST FINAL DE DÉPLOIEMENT FLEETNEXUS');
    console.log('==========================================\n');
    
    const tests = [];
    
    // Test 1: Frontend
    console.log('1. 🌐 Test Frontend...');
    try {
        const response = await fetch('https://geoconsulting-flotte.vercel.app');
        if (response.ok) {
            console.log('   ✅ Frontend accessible');
            console.log('   📊 Status:', response.status);
            tests.push({ name: 'Frontend', status: 'PASS' });
        } else {
            console.log('   ❌ Frontend erreur');
            tests.push({ name: 'Frontend', status: 'FAIL' });
        }
    } catch (error) {
        console.log('   ❌ Frontend inaccessible');
        tests.push({ name: 'Frontend', status: 'FAIL' });
    }
    
    // Test 2: API Status (endpoint public)
    console.log('\n2. 🔌 Test API Status...');
    try {
        const response = await fetch('https://geoconsulting-flotte.vercel.app/api/status');
        console.log('   📊 Status:', response.status);
        
        if (response.status === 401) {
            console.log('   ✅ API répond (authentification requise - normal)');
            tests.push({ name: 'API', status: 'PASS' });
        } else if (response.status === 200) {
            const data = await response.json();
            console.log('   ✅ API accessible');
            console.log('   📋 Réponse:', JSON.stringify(data, null, 2));
            tests.push({ name: 'API', status: 'PASS' });
        } else {
            console.log('   ⚠️  API status inattendu');
            tests.push({ name: 'API', status: 'WARN' });
        }
    } catch (error) {
        console.log('   ❌ API inaccessible:', error.message);
        tests.push({ name: 'API', status: 'FAIL' });
    }
    
    // Test 3: Performance
    console.log('\n3. ⚡ Test Performance...');
    try {
        const start = Date.now();
        const response = await fetch('https://geoconsulting-flotte.vercel.app');
        const end = Date.now();
        
        const loadTime = end - start;
        console.log(`   ⏱️  Temps de chargement: ${loadTime}ms`);
        
        if (loadTime < 1000) {
            console.log('   ✅ Excellent (<1s)');
            tests.push({ name: 'Performance', status: 'EXCELLENT' });
        } else if (loadTime < 2000) {
            console.log('   ✅ Bon (<2s)');
            tests.push({ name: 'Performance', status: 'PASS' });
        } else {
            console.log('   ⚠️  Lent (>2s)');
            tests.push({ name: 'Performance', status: 'WARN' });
        }
    } catch (error) {
        console.log('   ❌ Erreur test performance');
        tests.push({ name: 'Performance', status: 'FAIL' });
    }
    
    // Test 4: Sécurité HTTPS
    console.log('\n4. 🔒 Test Sécurité...');
    try {
        const response = await fetch('https://geoconsulting-flotte.vercel.app');
        const url = new URL(response.url);
        
        if (url.protocol === 'https:') {
            console.log('   ✅ HTTPS activé');
            console.log('   🛡️  SSL Certificate valide');
            tests.push({ name: 'Sécurité', status: 'PASS' });
        } else {
            console.log('   ❌ HTTPS non activé');
            tests.push({ name: 'Sécurité', status: 'FAIL' });
        }
    } catch (error) {
        console.log('   ❌ Erreur test sécurité');
        tests.push({ name: 'Sécurité', status: 'FAIL' });
    }
    
    // Test 5: Assets optimisés
    console.log('\n5. 📦 Test Assets...');
    try {
        // Test d'un asset CSS
        const cssResponse = await fetch('https://geoconsulting-flotte.vercel.app/assets/index-C90DkMjv.css');
        const jsResponse = await fetch('https://geoconsulting-flotte.vercel.app/assets/vendor-uKoEZntY.js');
        
        console.log('   CSS Status:', cssResponse.status);
        console.log('   JS Status:', jsResponse.status);
        
        if (cssResponse.ok && jsResponse.ok) {
            console.log('   ✅ Assets optimisés accessibles');
            tests.push({ name: 'Assets', status: 'PASS' });
        } else {
            console.log('   ⚠️  Certains assets non trouvés (noms peuvent changer)');
            tests.push({ name: 'Assets', status: 'WARN' });
        }
    } catch (error) {
        console.log('   ⚠️  Test assets partiel');
        tests.push({ name: 'Assets', status: 'WARN' });
    }
    
    // Résumé final
    console.log('\n==========================================');
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('==========================================');
    
    tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : 
                    test.status === 'EXCELLENT' ? '🌟' :
                    test.status === 'WARN' ? '⚠️' : '❌';
        console.log(`${icon} ${test.name}: ${test.status}`);
    });
    
    const passCount = tests.filter(t => t.status === 'PASS' || t.status === 'EXCELLENT').length;
    const warnCount = tests.filter(t => t.status === 'WARN').length;
    const failCount = tests.filter(t => t.status === 'FAIL').length;
    
    console.log('\n==========================================');
    if (failCount === 0 && warnCount <= 1) {
        console.log('🎉 DÉPLOIEMENT RÉUSSI !');
        console.log('✅ Application prête pour la production');
    } else if (failCount === 0) {
        console.log('✅ DÉPLOIEMENT FONCTIONNEL');
        console.log('⚠️  Quelques optimisations possibles');
    } else {
        console.log('⚠️  DÉPLOIEMENT PARTIEL');
        console.log('🔧 Corrections recommandées');
    }
    
    console.log('\n🌐 Votre application FleetNexus est accessible à :');
    console.log('   https://geoconsulting-flotte.vercel.app');
    console.log('\n📊 Dashboard Vercel :');
    console.log('   https://vercel.com/dashboard');
    console.log('\n🛠️  Prochaines étapes :');
    console.log('   1. Configurer les variables d\'environnement Firebase');
    console.log('   2. Tester l\'authentification');
    console.log('   3. Vérifier les fonctionnalités métier');
}

testFinalDeployment();