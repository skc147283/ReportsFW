from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec

from .base_page import BasePage


class DashboardPage(BasePage):
    PATH = "/"

    def open_page(self) -> None:
        self.open(self.PATH)

    def wait_until_loaded(self) -> None:
        self.wait.until(ec.visibility_of_element_located((By.XPATH, "//h1[contains(., 'Monitor company equity plans')]")))
        self.wait.until(ec.visibility_of_element_located((By.XPATH, "//*[contains(., 'Management shortcuts')]")))

    def refresh_dashboard(self) -> None:
        self.click_button_by_text("Refresh dashboard")
