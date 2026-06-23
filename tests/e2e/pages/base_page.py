from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait


class BasePage:
    def __init__(self, driver: WebDriver, wait: WebDriverWait, base_url: str):
        self.driver = driver
        self.wait = wait
        self.base_url = base_url.rstrip("/")

    def open(self, path: str) -> None:
        self.driver.get(f"{self.base_url}{path}")

    def click_link_by_text(self, text: str) -> None:
        locator = (By.XPATH, f"//a[normalize-space()='{text}']")
        self.wait.until(ec.element_to_be_clickable(locator)).click()

    def click_button_by_text(self, text: str) -> None:
        locator = (By.XPATH, f"//button[normalize-space()='{text}']")
        self.wait.until(ec.element_to_be_clickable(locator)).click()

    def fill_input_by_label(self, label: str, value: str) -> None:
        locator = (
            By.XPATH,
            f"//label[.//span[normalize-space()='{label}']]//*[self::input or self::textarea]",
        )
        element = self.wait.until(ec.visibility_of_element_located(locator))
        element.clear()
        element.send_keys(value)

    def select_option_by_label(self, label: str, option_text: str) -> None:
        select_locator = (By.XPATH, f"//label[.//span[normalize-space()='{label}']]//select")
        select = self.wait.until(ec.visibility_of_element_located(select_locator))
        option_locator = (
            By.XPATH,
            f"//label[.//span[normalize-space()='{label}']]//option[normalize-space()='{option_text}']",
        )
        self.wait.until(ec.presence_of_element_located(option_locator))
        select.click()
        self.wait.until(ec.element_to_be_clickable(option_locator)).click()

    def wait_for_text(self, text: str) -> None:
        locator = (By.XPATH, f"//*[contains(normalize-space(), '{text}')]")
        self.wait.until(ec.visibility_of_element_located(locator))

    def click_list_item_contains_text(self, text: str) -> None:
        locator = (By.XPATH, f"//button[contains(normalize-space(), '{text}')]")
        self.wait.until(ec.element_to_be_clickable(locator)).click()
