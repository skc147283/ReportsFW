from .base_page import BasePage


class StockPlansPage(BasePage):
    PATH = "/stock-plans"

    def open_page(self) -> None:
        self.open(self.PATH)
        self.wait_for_text("Create and edit stock plans")

    def create_stock_plan(
        self,
        company_name: str,
        plan_name: str,
        plan_type: str,
        annual_contribution: str,
        vested_pct: str,
        status: str,
    ) -> None:
        self.select_option_by_label("Company", company_name)
        self.fill_input_by_label("Plan name", plan_name)
        self.fill_input_by_label("Plan type", plan_type)
        self.fill_input_by_label("Annual contribution", annual_contribution)
        self.fill_input_by_label("Vested %", vested_pct)
        self.select_option_by_label("Status", status)
        self.click_button_by_text("Create stock plan")
        self.wait_for_text("Stock plan created.")
