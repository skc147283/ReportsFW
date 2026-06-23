# Selenium test for Next.js dashboard UI
# Requires: selenium, webdriver-manager
# Install: pip install selenium webdriver-manager

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

# Setup Chrome options for headless mode (optional)
options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Start Chrome WebDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

try:
    # Open the dashboard app
    driver.get('http://localhost:3000')
    time.sleep(2)  # Wait for page to load

    # Check for dashboard title or main element
    assert "Dashboard" in driver.page_source or "dashboard" in driver.title.lower(), "Dashboard UI did not load!"

    # Optionally, check for a chart or table element
    # Example: check for a chart canvas or table
    found = False
    for selector in ['canvas', 'table', '[data-testid="dashboard-chart"]', '[data-testid="dashboard-table"]']:
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        if elements:
            found = True
            break
    assert found, "Dashboard chart or table not found!"

    print("✅ Dashboard UI loaded successfully and main elements are present.")
finally:
    driver.quit()
