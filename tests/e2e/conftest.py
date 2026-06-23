import os
from datetime import datetime

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.getenv("E2E_BASE_URL", "http://localhost:3000")


@pytest.fixture(scope="session")
def timeout_seconds() -> int:
    return int(os.getenv("E2E_TIMEOUT_SECONDS", "15"))


@pytest.fixture(scope="session")
def run_id() -> str:
    return datetime.utcnow().strftime("%Y%m%d%H%M%S")


@pytest.fixture(scope="session")
def driver() -> webdriver.Chrome:
    options = Options()
    headless = os.getenv("E2E_HEADLESS", "true").lower() == "true"

    options.add_argument("--headless=new") if headless else None

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,1200")

    service = Service(ChromeDriverManager().install())
    chrome = webdriver.Chrome(service=service, options=options)
    chrome.implicitly_wait(0)

    yield chrome

    chrome.quit()


@pytest.fixture()
def wait(driver: webdriver.Chrome, timeout_seconds: int) -> WebDriverWait:
    return WebDriverWait(driver, timeout_seconds)
