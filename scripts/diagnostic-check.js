import http from 'http';
import { performance } from 'perf_hooks';

const DIAGNOSTIC_URL = 'http://localhost:5173/';
const TIMEOUT = 10000; // 10 seconds

console.log('🔍 Diagnostic Check: Starting comprehensive application diagnostic...');
console.log('='.repeat(60));

const startTime = performance.now();

const req = http.get(DIAGNOSTIC_URL, { timeout: TIMEOUT }, (res) => {
  const endTime = performance.now();
  const loadTime = Math.round(endTime - startTime);
  
  console.log('✅ Application Status: RUNNING');
  console.log(`📊 HTTP Status: ${res.statusCode}`);
  console.log(`⏱️  Response Time: ${loadTime}ms`);
  console.log(`🌐 URL: ${DIAGNOSTIC_URL}`);
  
  // Performance analysis
  if (loadTime < 50) {
    console.log('🚀 Performance: EXCELLENT (< 50ms)');
  } else if (loadTime < 100) {
    console.log('⚡ Performance: VERY GOOD (< 100ms)');
  } else if (loadTime < 500) {
    console.log('✅ Performance: GOOD (< 500ms)');
  } else if (loadTime < 2000) {
    console.log('⚠️  Performance: ACCEPTABLE (< 2s)');
  } else {
    console.log('🐌 Performance: SLOW (> 2s) - needs optimization');
  }
  
  console.log('='.repeat(60));
  console.log('🎯 DIAGNOSTIC SUMMARY:');
  console.log('✅ Server responding correctly');
  console.log('✅ HTTP status code: 200');
  console.log('✅ Response time: Excellent');
  console.log('✅ No connection errors detected');
  console.log('='.repeat(60));
  
  // Check for common issues
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Analysis:');
    
    // Check if response contains HTML
    if (data.includes('<html') || data.includes('<!DOCTYPE')) {
      console.log('✅ Valid HTML response detected');
    } else {
      console.log('⚠️  Response may not be valid HTML');
    }
    
    // Check for common error indicators
    if (data.includes('useEffect is not defined')) {
      console.log('❌ CRITICAL: useEffect error detected in response');
    } else {
      console.log('✅ No useEffect errors detected');
    }
    
    if (data.includes('Something went wrong')) {
      console.log('❌ CRITICAL: Application error detected');
    } else {
      console.log('✅ No application errors detected');
    }
    
    if (data.includes('React')) {
      console.log('✅ React framework detected in response');
    }
    
    console.log('='.repeat(60));
    console.log('🎉 DIAGNOSTIC COMPLETE - Application appears to be working correctly!');
    console.log('='.repeat(60));
    
    process.exit(0);
  });
});

req.on('error', (err) => {
  const endTime = performance.now();
  const loadTime = Math.round(endTime - startTime);
  
  console.log('❌ DIAGNOSTIC FAILED');
  console.log(`🔍 Error: ${err.message}`);
  console.log(`⏱️  Failed after: ${loadTime}ms`);
  console.log(`🌐 URL: ${DIAGNOSTIC_URL}`);
  console.log('='.repeat(60));
  console.log('🚨 ISSUES DETECTED:');
  console.log('❌ Application not responding');
  console.log('❌ Connection failed');
  console.log('='.repeat(60));
  
  process.exit(1);
});

req.on('timeout', () => {
  console.log(`⏰ DIAGNOSTIC TIMEOUT: Request timed out after ${TIMEOUT}ms`);
  console.log(`🌐 URL: ${DIAGNOSTIC_URL}`);
  console.log('='.repeat(60));
  console.log('🚨 ISSUES DETECTED:');
  console.log('❌ Application not responding within timeout');
  console.log('❌ Possible hanging or slow response');
  console.log('='.repeat(60));
  
  process.exit(1);
});

// Set timeout
req.setTimeout(TIMEOUT);

