# Sports Interactive - GMR Web Migration Test Automation Framework

This repository contains the test automation suite and CSS computed style comparison tools for validating the UI and styling migration of the **India Capitals (GMR Sports)** website.

---

## Folder Structure

```
SI_GMR_Migration/
├── .github/
│   └── workflows/                # CI/CD workflows (GitHub Actions test execution)
├── archive/                      # Historical scratch exploration scripts & initial example specs
├── blueprint/                    # Gap blueprint visual artifacts (annotated screenshots & reports)
├── docs/                         # Architecture documentation, migration reports & skills
│   ├── skills/                   # Automation skill guides (e.g. flat-test-skill.md)
│   ├── gap-blueprint.md          # Visual section gap analysis documentation
│   └── MIGRATION_COMPARISON_REPORT.md # Comprehensive migration comparison report
├── manual-testcases/             # Master test case sheets & parsed test case dataset
│   ├── News_CSS_Test_Cases_With_Steps.xlsx # Source manual test case definitions
│   ├── News_CSS_Test_Cases_Results.xlsx    # Updated test run results workbook
│   └── parsed_test_cases.json              # Structured JSON extracted from Excel
├── reports/                      # All generated run reports & test execution artifacts
│   ├── diff-report.csv/.html/.json/.md     # Computed style comparison outputs
│   ├── playwright-report/                  # Playwright HTML execution report
│   ├── test-results/                       # Playwright failure traces and screenshots
│   └── results/                            # JSON test report (report.json) & summary.md
├── src/                          # Scaffolding for upcoming Keyword-Driven Framework
│   ├── pages/                    # Page Object classes encapsulating page structure & interactions
│   ├── keywords/                 # Reusable business action keywords (e.g. verifyStyle, compareLayout)
│   ├── locators/                 # Centralized selector repositories per section/component
│   ├── test-data/                # Parameterized datasets, environments, and fixtures
│   ├── helpers/                  # Utilities for CSS parsing, math tolerances, and diffing
│   └── fixtures/                 # Playwright test fixture extensions
├── tests/
│   ├── flat/
│   │   └── news/                 # Standalone, flat Playwright test specs (TC01 - TC36)
│   └── keyword/                  # Future keyword-driven test suite
├── tools/                        # Diagnostic, report building, and comparison tools
│   ├── compare.ts                # Cross-site computed CSS style comparison runner
│   ├── build_reports.ts          # Aggregate summary.md & Excel results generator
│   ├── generate_all_specs.ts     # Spec code generator from parsed test cases
│   ├── generate_blueprint.ts     # Visual gap measurement & blueprint overlay engine
│   └── read_workbook.ts          # Excel workbook inspection utility
├── playwright.config.ts          # Playwright test runner configuration
├── tsconfig.json                 # TypeScript compiler options with path aliases
├── package.json                  # Dependencies and npm command scripts
├── .gitignore                    # Ignored artifacts, logs, and node_modules
└── README.md                     # Project documentation
```

---

## Setup & Installation

### Prerequisites
- **Node.js**: v18 or later (LTS recommended)
- **npm**: v9 or later

### Installation
```bash
npm install
npm run test:install # or: npx playwright install chromium
```

---

## Running Flat Tests

The flat test suite (`tests/flat/news/`) contains 36 independent test cases (`TC01` to `TC36`) verifying layout, typography, dimensions, spacing, hover effects, and responsive breakpoints.

```bash
# Run all flat test cases (headless)
npm test

# Run flat news tests specifically
npm run test:flat

# Run tests in headed browser mode
npm run test:headed

# Run tests with Playwright Interactive UI Mode
npm run test:ui

# View the Playwright HTML test report
npm run report

# Validate TypeScript typing
npm run typecheck
```

---

## Running Automation Tools

The `tools/` directory provides standalone diagnostic and reporting utilities:

```bash
# Run computed CSS property comparison between Site 1 and Site 2
npm run tool:compare

# Generate aggregated summary.md and update the Excel results sheet
npm run tool:build-reports

# Regenerate flat spec files from manual-testcases/parsed_test_cases.json
npm run tool:generate-specs

# Measure section gaps and generate annotated visual blueprint report
npm run tool:blueprint
```

---

## Next Step: Keyword-Driven Migration

The `src/` directory is prepared with architectural scaffolding for transitioning from flat, self-contained test cases into a maintainable, enterprise keyword-driven framework:

- **`src/locators/`**: Centralize CSS and role locators by component (e.g., `news.locators.ts`, `header.locators.ts`) to eliminate duplication across tests.
- **`src/pages/`**: Encapsulate DOM actions and queries within Page Objects (e.g., `NewsSectionPage.ts`).
- **`src/keywords/`**: High-level semantic verification keywords (e.g., `verifyComputedStyles()`, `assertGutterAlignment()`, `validateResponsiveStack()`).
- **`src/fixtures/`**: Custom Playwright fixtures providing pre-navigated, synchronized page instances for both sites.
- **`src/helpers/`**: Shared style normalization and color-space conversion functions.
- **`tests/keyword/`**: High-level declarative test cases utilizing keywords and page objects.
