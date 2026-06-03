.PHONY: help install start build test lint format format-check e2e clean

# Doppler integration (consistent with root Makefile)
DOPPLER := $(shell command -v doppler 2>/dev/null)
ifdef DOPPLER
  RUN := doppler run --
else
  RUN :=
endif

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	$(RUN) npm install

start: ## Start dev server
	$(RUN) ng serve

build: ## Build for production
	$(RUN) ng build

test: ## Run unit tests
	$(RUN) ng test

lint: ## Run linter
	$(RUN) ng lint

format: ## Format code
	$(RUN) npm run format

format-check: ## Check formatting
	$(RUN) npm run format:check

e2e: ## Run end-to-end tests
	$(RUN) npx playwright test

clean: ## Remove build artifacts
	$(RUN) rm -rf dist .angular
	$(RUN) npm cache clean --force
