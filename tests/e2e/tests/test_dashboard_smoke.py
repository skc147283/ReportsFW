from tests.e2e.pages.dashboard_page import DashboardPage


def test_dashboard_renders_key_sections(driver, wait, base_url):
    page = DashboardPage(driver, wait, base_url)

    page.open_page()
    page.wait_until_loaded()
    page.refresh_dashboard()

    page.wait_for_text("Portfolio chart")
    page.wait_for_text("Coverage summary")
    page.wait_for_text("Company snapshot")
