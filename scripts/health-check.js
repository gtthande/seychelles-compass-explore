import http from 'http';

console.log('🔍 Health Check: Testing application status...');
console.log('============================================================');

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const startTime = Date.now();

const req = http.request(options, (res) => {
  const responseTime = Date.now() - startTime;
  
  console.log(`✅ Application Status: ${res.statusCode === 200 ? 'RUNNING' : 'ERROR'}`);
  console.log(`📊 HTTP Status: ${res.statusCode}`);
  console.log(`⏱️  Response Time: ${responseTime}ms`);
  console.log(`🌐 URL: http://localhost:5173/`);
  console.log(`🚀 Performance: ${responseTime < 50 ? 'EXCELLENT' : responseTime < 200 ? 'GOOD' : 'SLOW'} (${responseTime < 50 ? '< 50ms' : responseTime < 200 ? '< 200ms' : '> 200ms'})`);
  console.log('============================================================');
  
  let htmlContent = '';
  let lineCount = 0;
  
  res.on('data', (chunk) => {
    htmlContent += chunk.toString();
    const lines = htmlContent.split('\n');
    lineCount = lines.length;
  });
  
  res.on('end', () => {
    console.log('🎯 DIAGNOSTIC SUMMARY:');
    console.log(`${res.statusCode === 200 ? '✅' : '❌'} Server responding correctly`);
    console.log(`${res.statusCode === 200 ? '✅' : '❌'} HTTP status code: ${res.statusCode}`);
    console.log(`${responseTime < 1000 ? '✅' : '❌'} Response time: ${responseTime < 1000 ? 'Good' : 'Slow'} (${responseTime}ms)`);
    console.log(`${res.statusCode === 200 ? '✅' : '❌'} No connection errors detected`);
    console.log('============================================================');
    
    // Check for React app indicators
    const hasReactRoot = htmlContent.includes('id="root"');
    const hasReactScripts = htmlContent.includes('react') || htmlContent.includes('React');
    const hasViteScripts = htmlContent.includes('vite') || htmlContent.includes('Vite');
    
    console.log('📄 Response Analysis:');
    console.log(`${hasReactRoot ? '✅' : '❌'} React root element found`);
    console.log(`${hasReactScripts ? '✅' : '❌'} React scripts detected`);
    console.log(`${hasViteScripts ? '✅' : '❌'} Vite scripts detected`);
    console.log(`${htmlContent.length > 1000 ? '✅' : '❌'} Sufficient content length (${htmlContent.length} chars)`);
    
    if (res.statusCode === 200 && hasReactRoot && htmlContent.length > 1000) {
      console.log('✅ No application errors detected');
    } else {
      console.log('❌ Potential application issues detected');
    }
    console.log('============================================================');
    
    if (res.statusCode === 200 && hasReactRoot) {
      console.log('🎉 DIAGNOSTIC COMPLETE - Application appears to be working correctly!');
    } else {
      console.log('⚠️  DIAGNOSTIC COMPLETE - Application may have issues!');
    }
    console.log('============================================================');
    
    process.exit(0);
  });
});

req.on('error', (err) => {
  const responseTime = Date.now() - startTime;
  console.log(`❌ Application Status: ERROR`);
  console.log(`📊 HTTP Status: Connection Failed`);
  console.log(`⏱️  Response Time: ${responseTime}ms`);
  console.log(`🌐 URL: http://localhost:5173/`);
  console.log(`🚀 Performance: FAILED`);
  console.log('============================================================');
  console.log('🎯 DIAGNOSTIC SUMMARY:');
  console.log('❌ Server not responding');
  console.log('❌ Connection failed');
  console.log('❌ Application may not be running');
  console.log('============================================================');
  console.log('📄 Error Details:');
  console.log(`❌ ${err.message}`);
  console.log('============================================================');
  console.log('⚠️  DIAGNOSTIC COMPLETE - Application is not accessible!');
  console.log('============================================================');
  
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Application Status: TIMEOUT');
  console.log('📊 HTTP Status: Request Timeout');
  console.log('⏱️  Response Time: >5000ms');
  console.log('🌐 URL: http://localhost:5173/');
  console.log('🚀 Performance: FAILED');
  console.log('============================================================');
  console.log('⚠️  DIAGNOSTIC COMPLETE - Application timeout!');
  console.log('============================================================');
  
  process.exit(1);
});

req.end();