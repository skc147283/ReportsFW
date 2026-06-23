from .base_page import BasePage


class EmployeesPage(BasePage):
    PATH = "/employees"

    def open_page(self) -> None:
        self.open(self.PATH)
        self.wait_for_text("Create and edit employees")

    def create_employee(
        self,
        company_name: str,
        full_name: str,
        role_title: str,
        email: str,
        start_date: str,
        salary: str,
    ) -> None:
        self.select_option_by_label("Company", company_name)
        self.fill_input_by_label("Full name", full_name)
        self.fill_input_by_label("Role title", role_title)
        self.fill_input_by_label("Email", email)
        self.fill_input_by_label("Start date", start_date)
        self.fill_input_by_label("Salary", salary)
        self.click_button_by_text("Create employee")
        self.wait_for_text("Employee created.")
