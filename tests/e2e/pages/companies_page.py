from .base_page import BasePage


class CompaniesPage(BasePage):
    PATH = "/companies"

    def open_page(self) -> None:
        self.open(self.PATH)
        self.wait_for_text("Create and edit companies")

    def create_company(self, company_name: str, ticker: str, sector: str, headquarters: str) -> None:
        self.fill_input_by_label("Company name", company_name)
        self.fill_input_by_label("Ticker", ticker)
        self.fill_input_by_label("Sector", sector)
        self.fill_input_by_label("Headquarters", headquarters)
        self.click_button_by_text("Create company")
        self.wait_for_text("Company created.")

    def edit_company(self, company_name: str, new_sector: str) -> None:
        self.click_list_item_contains_text(company_name)
        self.fill_input_by_label("Sector", new_sector)
        self.click_button_by_text("Update company")
        self.wait_for_text("Company updated.")
