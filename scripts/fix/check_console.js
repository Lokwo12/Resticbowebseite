const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[PAGE LOG] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('Page loaded successfully without fatal crashes.');
  } catch (err) {
    console.error('Error loading page:', err);
  }
  
  await browser.close();
})();
