from tests.e2e.pages.companies_page import CompaniesPage
from tests.e2e.pages.dashboard_page import DashboardPage
from tests.e2e.pages.employees_page import EmployeesPage
from tests.e2e.pages.stock_plans_page import StockPlansPage


def test_end_to_end_business_flow(driver, wait, base_url, run_id):
    company_name = f"E2E Capital {run_id}"
    ticker = f"E{run_id[-5:]}"
    employee_name = f"E2E Analyst {run_id}"
    employee_email = f"e2e.{run_id}@example.test"
    plan_name = f"E2E Growth Plan {run_id}"

    companies_page = CompaniesPage(driver, wait, base_url)
    employees_page = EmployeesPage(driver, wait, base_url)
    plans_page = StockPlansPage(driver, wait, base_url)
    dashboard_page = DashboardPage(driver, wait, base_url)

    companies_page.open_page()
    companies_page.create_company(
        company_name=company_name,
        ticker=ticker,
        sector="Asset Management",
        headquarters="New York, NY",
    )

    employees_page.open_page()
    employees_page.create_employee(
        company_name=company_name,
        full_name=employee_name,
        role_title="Senior Financial Analyst",
        email=employee_email,
        start_date="2026-01-15",
        salary="140000",
    )

    plans_page.open_page()
    plans_page.create_stock_plan(
        company_name=company_name,
        plan_name=plan_name,
        plan_type="ESPP",
        annual_contribution="60000",
        vested_pct="45",
        status="Active",
    )

    dashboard_page.open_page()
    dashboard_page.wait_until_loaded()
    dashboard_page.wait_for_text(company_name)
    dashboard_page.wait_for_text(plan_name)
