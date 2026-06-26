import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('focusloop_is_authenticated', 'true');
    localStorage.setItem('focusloop_current_role', 'student');
    localStorage.setItem('focusloop_student_profile', JSON.stringify({
      uid: 'test_uid',
      email: 'test@example.com',
      role: 'student',
      username: 'test_student',
      points: 100,
      streak: 5,
      dailyGoalMinutes: 45
    }));
  });
  
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
  page.on('pageerror', error => console.log(`BROWSER ERROR: ${error.message}`));

  try {
    console.log("Navigating to http://localhost:3001...");
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    
    console.log("Current body text:", await page.locator('body').innerText());

    const button = await page.locator('button', { hasText: /Next: Setup Timer/i }).first();
    console.log("Clicking button...");
    await button.click({ force: true });
    
    await page.waitForTimeout(2000);
    
    console.log("After click body text:", await page.locator('body').innerText());
  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await browser.close();
  }
})();
