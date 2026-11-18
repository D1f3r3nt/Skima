# Graph Report - Skima  (2026-11-18)

## Corpus Check
- 422 files · ~333,026 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: .csv 37, .css 9, (none) 3)

## Summary
- 3786 nodes · 8658 edges · 204 communities (144 shown, 60 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 355 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e752914c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Catalog Service
- projectDataStore.test.js
- catalogTasks.js
- skillPublisher.test.js
- repositoryScore.js
- agentsMd.test.js
- createPlatformPaths
- ProviderPathResolver
- .unwrap
- RepositoryImporter
- createIcon
- showToast
- importer.test.js
- skillManifest.js
- providerRegistry.js
- CLI Install Recipes
- envFileService.js
- mcpInstall.test.js
- Bootstrap & Brand Icon
- mySkills.test.js
- appContainer.js
- Git Session Service
- IPC Controllers (AGENTS, AI, Catalog)
- projectController.js
- createNoticeBanner
- agentsMdService.js
- with Group
- package.json Group
- graphifyService.js
- skimaRepositorySource.test.js
- DesignSystemGenerator
- agentsMdOptimizer.js
- safeArchiveExtractor.js
- validate_data.py
- ref_node_assert
- AgentBridge
- executableLocator.js Group
- projectConfigSchema.js
- settingsSchema.js
- catalogMaintenance.js Group
- createContextTab
- DetailController
- skillInstaller.js
- skillFormView.js
- PlatformPaths Group
- promptRegistry.js Group
- CliInstaller Group
- agentFileInstaller.js
- shellView.js Group
- skillWizardView.js Group
- modelSelector.test.js
- graphifyIntegrationService.js
- importedRepositoryAnalyzer.js
- design_system.py
- readTextIfExists
- MySkillsStore Group
- fakeAgentEnvironment.js
- build Group
- mcpDefinitionDetector.js
- _TagCollector
- test_design_system_mode.py
- search_stack
- isPlainObject
- search
- AskAi Group
- repositoryDetailsService.test.js
- skillsSite.test.js
- generate_design_system
- docs/plan-pendiente.md Group
- README.md Group
- mainWindow.js
- graphifyRuntime.js
- markdownRenderer.js
- InstalledScanner
- graphViewerController.js
- scripts Group
- ProjectStore
- providerRegistry.js
- prompts/02_fases_9_10_11.md Group
- Phase 9: skill wizard and Mis skills Group
- AgentDetector Group
- fetchUv.js
- AgentFileInstaller Group
- GraphifyService Group
- ProjectModel Group
- Unverified or low-confidence provider registry rows Group
- fakeAgent.js Group
- prompts/01_adaptacion_ui.md Group
- AGENTS.md Group
- SkillsSiteView
- core.py
- opencodeModelsVerbose.txt fixture (model catalog dump Group
- SkillFormController
- Headless mode Group
- graphify command Group
- sourceOfTruth.js
- GitToolchain
- BM25
- CLAUDE.md Group
- agentsMdTemplate.js
- tarBuilder.js
- promptLaunchSettingsSection.js
- agentFileIpcController.js Group
- installedIpcController.js Group
- publishIpcController.js Group
- SkillUninstaller Group
- Prompt injection attack forms Group
- AgentsMdIpcController Group
- promptRegistry.js
- InstalledScanner
- AGENTS.md format Group
- Eight-section AGENTS.md template Group
- Skill security severity rubric Group
- Skill publishing flow with gh and git Group
- SettingsStore
- mcpInstaller.js
- fakeGraphify.js
- AGENTS.md Group
- Condensing and translating rules Group
- Bridge file import of AGENTS.md Group
- MCP install checklist Group
- Translation and condensing procedure Group
- Skill quality rubric Group
- Skill frontmatter fields Group
- Skima SKILL.md template Group
- AiIpcController Group
- CliInstallIpcController Group
- SkillPublisher
- 03_editor_skills.md
- mcpIpcController.js
- InstallerIpcController Group
- skillsSiteView.js
- ExternalLinkService
- EnvironmentIpcController
- npm package claude-code Group
- OpenCode version package name split Group
- Skill description field Group
- Three boundary tiers Group
- Codex standalone installer Group
- Copilot install script Group
- Gemini CLI replaced for unpaid tier Group
- gh auth login Group
- SSRF risk Group
- Conciseness principle Group
- Degrees of freedom Group
- Skill folder layout Group
- components/package.json Group
- renderer/package.json Group
- AGENTS.override.md Group
- Source of truth index Group
- WinGet package GitHub.cli Group
- Input-output examples pattern Group
- mismatch SKILL.md fixture (name other-name, folder mismatch Group
- no-manifest README.md fixture (no manifest Group
- pdf SKILL.md fixture (valid skill Group
- format_ascii_box
- GraphifyInstaller
- WindowIpcController
- Navegador lateral
- portableNames.js
- graphifyRuntime.js
- AllSkillsController
- graphifyIntegration.test.js
- httpResponseCache.js
- skillsSitePreload.js
- skillPublisher.test.js
- SkimaRepositorySource
- TestThresholdGate
- UI/UX Pro Max - Design Intelligence
- skillsSiteGuard.js
- CatalogRefreshTest
- 05_graphify.md
- publishedSkillsStore.js
- SourceOfTruth
- sourceOfTruthTasks.js
- 04_add_vercel_skills.md
- GraphifyIpcController
- ImportIpcController
- ModelSelector
- modelRestriction.js
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- graphifySettingsSection.js
- repositoryImporter.js
- PromptLaunchSettingsService
- 07_new_ui_2.md
- graphify.test.js
- test_skill_script_paths.py
- repositoryUrl.js
- CatalogSummaryLineEndingsTest
- TokenCliTest
- envRowsDraft.js
- GraphViewerRegistry
- TestStackFlagWithDesignSystem
- RtlCliTest
- modelRestrictionDraft.js
- main.js
- JsonFileStorage
- TestMetricMath
- ProjectIpcController
- TestFixtureValidation

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 135 edges
2. `createAppContainer()` - 95 edges
3. `createButton()` - 92 edges
4. `search()` - 54 edges
5. `createIcon()` - 51 edges
6. `createNoticeBanner()` - 49 edges
7. `showToast()` - 47 edges
8. `executeSafely()` - 47 edges
9. `createPlatformPaths()` - 45 edges
10. `createLoader()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `createHarness()` --calls--> `SkimaRepositorySource`  [EXTRACTED]
  test/skima/skimaRepositorySource.test.js → src/core/main/skima/skimaRepositorySource.js
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `createModel()` --calls--> `ProjectModel`  [EXTRACTED]
  test/projects/projectModel.test.js → src/core/main/models/projectModel.js

## Import Cycles
- 4-file cycle: `src/core/renderer/config/settingsSections.js -> src/core/renderer/settings/graphifySettingsSection.js -> src/core/renderer/controllers/mcpInstallFlow.js -> src/core/renderer/services/settingsModalService.js -> src/core/renderer/config/settingsSections.js`

## Hyperedges (group relationships)
- **Skill security review pipeline** — source_of_truth_skill_security_review_severity_rubric, source_of_truth_skill_security_review_instruction_risk_signals, source_of_truth_skill_security_review_script_risk_signals, source_of_truth_skill_security_review_supply_chain_risks [EXTRACTED 1.00]
- **catalogSample skill fixtures used for skill discovery tests** — test_fixtures_catalogsample_skills_mismatch_skill, test_fixtures_catalogsample_skills_no_manifest_readme, test_fixtures_catalogsample_skills_pdf_skill [INFERRED 0.75]
- **Catalog verification and library display** — catalog_verification_report, docs_plan_pendiente_catalog_scale, readme_biblioteca, readme_item_detail [INFERRED 0.75]
- **Skill install and management flow** — readme_install_flow, readme_installed_scanner, docs_decisiones_shared_skill_folder, docs_decisiones_trash_uninstall, readme_mis_skills [INFERRED 0.75]
- **Untrusted input defences** — source_of_truth_untrusted_content_and_prompt_injection_delimit_untrusted_data, source_of_truth_untrusted_content_and_prompt_injection_delimiter_neutralisation, source_of_truth_untrusted_content_and_prompt_injection_least_privilege_execution, source_of_truth_untrusted_content_and_prompt_injection_output_validation_rule, source_of_truth_untrusted_content_and_prompt_injection_fail_open_fallback [INFERRED 0.75]
- **AI skill optimization pipeline** — readme_skill_optimization, readme_agent_bridge, prompts_02_fases_9_10_11_skill_optimize_en, prompts_02_fases_9_10_11_skill_optimization_validation, docs_decisiones_optimization_integrity, readme_source_of_truth [INFERRED 0.85]

## Communities (204 total, 60 thin omitted)

### Community 0 - "Catalog Service"
Cohesion: 0.06
Nodes (25): catalogQueries, crawlLimits, CatalogService, createEmptySnapshot(), parseGitHubUrl(), toCatalogRepository(), toRepositoryKey(), catalogTypes (+17 more)

### Community 1 - "projectDataStore.test.js"
Cohesion: 0.14
Nodes (10): createDefaultProjectConfig(), sanitizeProjectConfig(), ProjectDataStore, createProject(), assert, createStore(), fs, os (+2 more)

### Community 2 - "catalogTasks.js"
Cohesion: 0.05
Nodes (39): buildReport(), candidatesPath, catalogDirectory, commands, discardsPath, fs, fsPromises, libraryPath (+31 more)

### Community 3 - "skillPublisher.test.js"
Cohesion: 0.16
Nodes (18): allowedExtensions, buildPullRequestBody(), checkFile(), collectFiles(), forbiddenNamePatterns, fs, inspectSkillFolder(), isHiddenSegment() (+10 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.19
Nodes (16): clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks(), scoreIssues() (+8 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.12
Nodes (16): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), importantSectionLabels, secretRules, answers, assert (+8 more)

### Community 6 - "createPlatformPaths"
Cohesion: 0.09
Nodes (22): createPlatformPaths(), providerRegistry, assert, test, MemoryStorage, assert, createModel(), test (+14 more)

### Community 7 - "ProviderPathResolver"
Cohesion: 0.11
Nodes (16): ProviderPathResolver, findProvider(), assert, createFixture(), fs, githubSource, os, path (+8 more)

### Community 11 - "createIcon"
Cohesion: 0.13
Nodes (27): createAvatar(), getInitials(), getToneIndex(), createBadge(), createIcon(), iconPaths, createChoiceCardGroup(), buildTree() (+19 more)

### Community 12 - "showToast"
Cohesion: 0.15
Nodes (21): variantIcons, showToast(), variantIcons, createSettingsModal(), createSteppedModal(), settingsSectionIds, resultLabels, statusLabels (+13 more)

### Community 13 - "importer.test.js"
Cohesion: 0.14
Nodes (16): createExecutable(), createFakeGitSetup(), { execFileSync }, fakeScript, findRealGit(), fs, os, path (+8 more)

### Community 14 - "skillManifest.js"
Cohesion: 0.09
Nodes (23): folderLimits, fs, path, fs, ImportedDetailsService, path, readmeNames, toMcpCandidate() (+15 more)

### Community 15 - "providerRegistry.js"
Cohesion: 0.06
Nodes (37): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, claudeCodeCli (+29 more)

### Community 16 - "CLI Install Recipes"
Cohesion: 0.06
Nodes (31): brewRequirement, claudeCodeInstall, codexInstall, findInstallTarget(), geminiCliInstall, githubCliInstall, githubCliTool, installRecipes (+23 more)

### Community 17 - "envFileService.js"
Cohesion: 0.11
Nodes (26): applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace(), listEntries(), listKeysOnly() (+18 more)

### Community 18 - "mcpInstall.test.js"
Cohesion: 0.08
Nodes (24): nodePath, os, supportedPlatforms, assert, createFixture(), createUvExecutable(), fakeScript, fs (+16 more)

### Community 19 - "Bootstrap & Brand Icon"
Cohesion: 0.06
Nodes (26): Skima app icon (skima.png), Skima brand identity (S-mark logo), createPageHeader(), bootstrapPage(), settingsSections, ShellController, SkillTextEditorController, activePageByOrigin (+18 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.07
Nodes (36): executeWithCode(), MySkillsIpcController, path, crypto, fileLimits, fs, MySkillSource, { zipSync } (+28 more)

### Community 21 - "appContainer.js"
Cohesion: 0.05
Nodes (23): createAppContainer(), fileNames, fs, path, resolveCatalogDirectory(), CatalogIpcController, DialogIpcController, LibraryIpcController (+15 more)

### Community 22 - "Git Session Service"
Cohesion: 0.14
Nodes (9): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, assert, createService() (+1 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.16
Nodes (12): recoverableCodes, crypto, rendererAllowedFields, recoverableCodes, recoverableCodes, recoverableCodes, crypto, scopes (+4 more)

### Community 24 - "projectController.js"
Cohesion: 0.08
Nodes (19): createVerifiedBadge(), createInlineEditableTitle(), missingFolderTabReason, projectTabs, createGraphifyActions(), createHealthBadge(), createTooltipButton(), describeGraph() (+11 more)

### Community 25 - "createNoticeBanner"
Cohesion: 0.10
Nodes (13): createNoticeBanner(), AgentFileInstallFlow, createParagraph(), createEmptyDefinition(), labeled(), McpInstallFlow, paragraph(), createLabeledField() (+5 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.20
Nodes (4): AgentsMdService, createError(), hashText(), validateAgentsMd()

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.08
Nodes (33): author, dependencies, ajv@8.20.0, dotenv@16.6.1, fflate@0.7.5, highlight.js@11.12.0, jsonc-parser@3.3.1, marked@18.1.1 (+25 more)

### Community 29 - "graphifyService.js"
Cohesion: 0.14
Nodes (13): crypto, diffSnapshots(), fs, parseGodNodes(), path, { pathToFileURL }, snapshotTopLevel(), toPublicRuntime() (+5 more)

### Community 30 - "skimaRepositorySource.test.js"
Cohesion: 0.18
Nodes (7): getSkimaRepositoryConfig(), productionRepository, assert, commitA, commitB, createHarness(), test

### Community 31 - "DesignSystemGenerator"
Cohesion: 0.05
Nodes (17): DesignSystemGenerator, _resolve_dial(), apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), TestReasoningMatch, read_rows() (+9 more)

### Community 32 - "agentsMdOptimizer.js"
Cohesion: 0.16
Nodes (15): sanitizeAnswers(), AgentsMdOptimizer, boundaryFields, buildPayload(), dataTags, fallbackReasons, isStringArray(), languageInstructions (+7 more)

### Community 33 - "safeArchiveExtractor.js"
Cohesion: 0.09
Nodes (20): fs, path, ArchiveLimitError, assertNoEscapingLinks(), defaultLimits, extractSafely(), fs, isUnsafeRelativePath() (+12 more)

### Community 34 - "validate_data.py"
Cohesion: 0.07
Nodes (42): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+34 more)

### Community 35 - "ref_node_assert"
Cohesion: 0.08
Nodes (16): assert, simulatedSystems, test, assert, test, assert, fs, listSourceFiles() (+8 more)

### Community 36 - "AgentBridge"
Cohesion: 0.13
Nodes (7): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue

### Community 37 - "executableLocator.js Group"
Cohesion: 0.06
Nodes (29): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+21 more)

### Community 38 - "projectConfigSchema.js"
Cohesion: 0.22
Nodes (17): createDefaultModelRestriction(), asIsoDate(), asShortText(), graphifyDecisions, isPlainObject(), migrateProjectConfig(), projectConfigLimits, projectConfigMigrations (+9 more)

### Community 39 - "settingsSchema.js"
Cohesion: 0.16
Nodes (15): crypto, fs, createDefaultGraphify(), createDefaultPreferences(), createDefaultPromptLaunch(), createDefaultSettings(), effortLevels, installKinds (+7 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.11
Nodes (29): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+21 more)

### Community 41 - "createContextTab"
Cohesion: 0.19
Nodes (16): createField(), createQuestionStep(), agentsMdQuestions, answerKeys, createContextTab(), createEmptyAnswers(), createParagraph(), languageOptions (+8 more)

### Community 42 - "DetailController"
Cohesion: 0.10
Nodes (16): artifactTypes, findArtifactType(), DetailController, describeManifestIssues(), presentCatalogDetail(), requirementLabels, presentInstallations(), presentInstalledDetail() (+8 more)

### Community 43 - "skillInstaller.js"
Cohesion: 0.15
Nodes (10): crypto, defaultHashLimits, fs, hashSkillFolder(), path, crypto, fs, renameWithRetry() (+2 more)

### Community 44 - "skillFormView.js"
Cohesion: 0.08
Nodes (19): createButton(), createTextInput(), createFolderInput(), createFormField(), createPathSettingField(), createSearchField(), createEmptyState(), createInstalledSkillList() (+11 more)

### Community 46 - "promptRegistry.js Group"
Cohesion: 0.16
Nodes (15): Read-only mode for Claude Code, Third-party skill review procedure, Phase 10: AI skill optimization, Optimization response validation rules, skill-optimize-en prompt, Agent bridge (runAgent and askAi), Cheap model selection, Editor skill creation assistant (+7 more)

### Community 47 - "CliInstaller Group"
Cohesion: 0.18
Nodes (8): CliInstaller, createInstallerError(), crypto, describeStep(), fs, interpreterInvocations, parseMajor(), path

### Community 48 - "agentFileInstaller.js"
Cohesion: 0.09
Nodes (30): yaml, readDescription(), verifyFileItem(), adaptAgentFile(), buildMarkdown(), formatAdapters, pick(), YAML (+22 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.16
Nodes (10): createAppLogo(), createNavItem(), createControlButton(), createWindowControls(), createNavGroup(), createSidebar(), createTitleBar(), createAppShell() (+2 more)

### Community 50 - "skillWizardView.js Group"
Cohesion: 0.13
Nodes (21): createLoader(), confirmDialog(), createModal(), typedConfirmDialog(), CliInstallFlow, createCodeBlock(), createParagraph(), unwrap() (+13 more)

### Community 51 - "modelSelector.test.js"
Cohesion: 0.22
Nodes (12): classifyModel(), localProviderIds, normalizeCost(), parseJsonBlock(), parseVerboseModels(), perThousandKeys, selectCheapestOpenCodeModel(), assert (+4 more)

### Community 52 - "graphifyIntegrationService.js"
Cohesion: 0.16
Nodes (12): createIntegrationError(), crypto, fs, GraphifyIntegrationService, hashText(), ignoredHomePrefixes, integrationVariants, path (+4 more)

### Community 53 - "importedRepositoryAnalyzer.js"
Cohesion: 0.18
Nodes (14): scanFiles(), listFolder(), validateSkillFolder(), analyzeAgentFiles(), analyzeMcp(), analyzeRepository(), analyzeSkills(), fs (+6 more)

### Community 54 - "design_system.py"
Cohesion: 0.05
Nodes (27): _button_outline_text_color(), _contrast_ratio(), _derive_dark_palette(), _detect_page_type(), format_master_md(), format_page_override_md(), format_tokens_dtcg(), _generate_intelligent_overrides() (+19 more)

### Community 55 - "readTextIfExists"
Cohesion: 0.12
Nodes (26): fs, path, createTemporarySiblingPath(), crypto, detectLineEnding(), fs, path, readTextIfExists() (+18 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.17
Nodes (5): createStoreError(), MySkillsStore, listFiles(), saveDirectly(), skillMarkdown()

### Community 57 - "fakeAgentEnvironment.js"
Cohesion: 0.08
Nodes (26): escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn }, windowsShimExtensions (+18 more)

### Community 58 - "build Group"
Cohesion: 0.08
Nodes (25): build, appId, asar, directories, extraResources, files, linux, mac (+17 more)

### Community 59 - "mcpDefinitionDetector.js"
Cohesion: 0.27
Nodes (17): dedupeCandidates(), detectMcpDefinitions(), extractCodeBlocks(), fromClaudeAddCommand(), fromConfigObject(), fromPackageJson(), fromPyproject(), fromReadme() (+9 more)

### Community 60 - "_TagCollector"
Cohesion: 0.17
Nodes (3): _parse(), _TagCollector, TestPreviewStructure

### Community 61 - "test_design_system_mode.py"
Cohesion: 0.08
Nodes (12): _filter_anti_patterns_for_mode(), _palette_is_dark(), _query_wants_dark(), _relative_luminance(), _resolve_color_mode(), _select_palette_for_mode(), _style_is_dark_primary(), TestAntiPatternGating (+4 more)

### Community 62 - "search_stack"
Cohesion: 0.08
Nodes (9): _exact_stack_identifier(), _project_row(), search_stack(), _valid_max_results(), TestDiagnosticsContracts, _rows(), TestNativeDesktopStackFreshness, _rows() (+1 more)

### Community 63 - "isPlainObject"
Cohesion: 0.26
Nodes (19): asBoolean(), asEnum(), asHttpsUrl(), asInteger(), asIsoDate(), asText(), asTrimmedString(), isPlainObject() (+11 more)

### Community 64 - "search"
Cohesion: 0.05
Nodes (14): _normalize_rtl_level(), _rtl_row_filter(), search(), _style_search_destination(), TestSearchDomains, TestImeGuidance, read_rows(), RtlDataContractTest (+6 more)

### Community 65 - "AskAi Group"
Cohesion: 0.19
Nodes (7): AskAi, createAskError(), fs, referenceTags, findPrompt(), neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "repositoryDetailsService.test.js"
Cohesion: 0.18
Nodes (10): findReadme(), findSkillManifests(), isMarkdownFile(), path, RepositoryDetailsService, assert, files, repository (+2 more)

### Community 67 - "skillsSite.test.js"
Cohesion: 0.18
Nodes (12): buildCliArguments(), cliAgentIdOverrides, createCodedError(), scopes, SkillsShInstaller, stripAnsi(), toCliAgentId(), validateTarget() (+4 more)

### Community 68 - "generate_design_system"
Cohesion: 0.05
Nodes (17): build_design_tokens(), _css_font_family(), _flatten_tokens(), format_tokens_css(), generate_design_system(), _resolve_token_reference(), _root_block(), _token_color_entries() (+9 more)

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.18
Nodes (11): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Branch protection rule for master, CODEOWNERS review, Pull request template, Valid skill rules (+3 more)

### Community 70 - "README.md Group"
Cohesion: 0.14
Nodes (14): Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, JetBrains-style project selector, Left sidebar navigation menu, AGENTS.md project context tab, contextBridge preload, Global and Project views, Install skills and MCP servers to enabled agents (+6 more)

### Community 71 - "mainWindow.js"
Cohesion: 0.15
Nodes (15): allowedRemotePrefixes, graphViewerRegistry, hardenGraphViewerWebview(), isGraphViewerGuest(), appIconPath, { BrowserWindow, session }, createMainWindow(), isInternalPage() (+7 more)

### Community 73 - "markdownRenderer.js"
Cohesion: 0.11
Nodes (22): allowedLinkSchemes, convertGitHubBlobToRaw(), createMarked(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl() (+14 more)

### Community 75 - "graphViewerController.js"
Cohesion: 0.23
Nodes (6): createTabs(), attachLinkHandling(), createMarkdownBody(), createMarkdownViewer(), GraphViewerController, viewKinds

### Community 76 - "scripts Group"
Cohesion: 0.13
Nodes (15): scripts, catalog:refresh, catalog:validate, catalog:verify, dist, dist:linux, dist:mac, dist:win (+7 more)

### Community 78 - "providerRegistry.js"
Cohesion: 0.22
Nodes (7): cursor, githubCopilot, amp, goose, kiloCode, rooCode, windsurf

### Community 79 - "prompts/02_fases_9_10_11.md Group"
Cohesion: 0.17
Nodes (5): electron-builder 26.18.0 choice, WSL not supported, Phase 11: packaging, CI and documentation, GitHub API without token, Skima desktop app

### Community 80 - "Phase 9: skill wizard and Mis skills Group"
Cohesion: 0.18
Nodes (10): Reusable wizard engine, Native folder picker popup with name and path fields, Initial dark first screen with add-project button, proyectos.json project storage file, mySkill installer source, Phase 9: skill wizard and Mis skills, Mis skills (my skills), proyectos.json legacy format (+2 more)

### Community 82 - "fetchUv.js"
Cohesion: 0.17
Nodes (14): crypto, download(), extractFromTarball(), extractFromZip(), fs, fsPromises, main(), os (+6 more)

### Community 83 - "AgentFileInstaller Group"
Cohesion: 0.27
Nodes (3): AgentFileInstaller, createInstallError(), toCaseInsensitiveKey()

### Community 86 - "Unverified or low-confidence provider registry rows Group"
Cohesion: 0.17
Nodes (11): Codex max effort mapped to xhigh, Unverified or low-confidence provider registry rows, Install CLI from agent settings, Claude Code agent, Codex agent, Cursor agent, Gemini CLI agent, GitHub Copilot agent (+3 more)

### Community 87 - "fakeAgent.js Group"
Cohesion: 0.21
Nodes (6): args, emitClaude(), emitCodex(), emitGemini(), fs, valueAfter()

### Community 88 - "prompts/01_adaptacion_ui.md Group"
Cohesion: 0.22
Nodes (10): Tools tab renamed to MCP, Retire the GitHub tracking module, App icon placement, Artifact card grid, 10 per type, Library tabs Subagentes Skill Tool Comandos, Live search replaces grid with a list, Remove native window header, Search by matches and similarity (+2 more)

### Community 89 - "AGENTS.md Group"
Cohesion: 0.27
Nodes (5): Atomic design components, Electron stack (Node 24, Electron 45), Own file storage with fs, Project directory structure, Renderer process

### Community 90 - "SkillsSiteView"
Cohesion: 0.20
Nodes (8): buildScrollbarCss(), mixColors(), readThemeColors(), buildGraphViewerThemeCss(), alphaScale, buildSkillsSiteThemeCss(), grayScale, SkillsSiteView

### Community 91 - "core.py"
Cohesion: 0.06
Nodes (24): _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _file_signature(), _get_bm25(), _legacy_successor_guidance() (+16 more)

### Community 92 - "opencodeModelsVerbose.txt fixture (model catalog dump Group"
Cohesion: 0.24
Nodes (10): opencodeModelsVerbose.txt fixture (model catalog dump), Priced per 1K tokens (legacyprovider/cheap-per-1k), Claude Haiku 4.5 (anthropic/claude-haiku-4-5), Claude Sonnet 4.5 (anthropic/claude-sonnet-4-5), Free model (openrouter/free-model), Legacy mini (openai/gpt-4o-mini-legacy, deprecated), GPT-5 nano (openai/gpt-5-nano), Llama 3.2 local (ollama/llama3.2) (+2 more)

### Community 93 - "SkillFormController"
Cohesion: 0.30
Nodes (3): createEmptyForm(), mergeDraft(), SkillFormController

### Community 94 - "Headless mode Group"
Cohesion: 0.39
Nodes (7): Claude Code CLI, Codex CLI, Gemini CLI, Headless mode, OpenCode CLI, Permission modes, Agent skill locations

### Community 95 - "graphify command Group"
Cohesion: 0.29
Nodes (7): Code-only mode, graphify command, graphify-out folder, graphifyRuntime, graphifyService, graphifyy PyPI package, Pinned graphify version 0.9.105

### Community 96 - "sourceOfTruth.js"
Cohesion: 0.11
Nodes (25): nodePath, resolveBundledResourceDirectory(), fs, path, audiences, confidences, countSentences(), documentLimits (+17 more)

### Community 98 - "BM25"
Cohesion: 0.15
Nodes (4): BM25, _suggest_identities(), TestBm25CoreBehavior, TestTokenizer

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 100 - "agentsMdTemplate.js"
Cohesion: 0.28
Nodes (12): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, listEnglishHeadings(), missingImportantSections(), normalizeText(), renderAgentsMd() (+4 more)

### Community 101 - "tarBuilder.js"
Cohesion: 0.48
Nodes (5): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib

### Community 102 - "promptLaunchSettingsSection.js"
Cohesion: 0.13
Nodes (30): createSelectInput(), createRadioGroup(), defaultThemeId, themes, themeStorageKey, applyTheme(), getActiveThemeId(), isKnownTheme() (+22 more)

### Community 103 - "agentFileIpcController.js Group"
Cohesion: 0.33
Nodes (4): AgentFileIpcController, scopes, types, validateSource()

### Community 105 - "publishIpcController.js Group"
Cohesion: 0.36
Nodes (4): describeError(), PublishIpcController, text(), isGithubUrl()

### Community 107 - "Prompt injection attack forms Group"
Cohesion: 0.33
Nodes (5): Prompt injection attack forms, Delimit untrusted data, Neutralise delimiters, Least privilege execution, Validate output against schema

### Community 108 - "AgentsMdIpcController Group"
Cohesion: 0.40
Nodes (3): AgentsMdIpcController, describeError(), optimizationFrom()

### Community 109 - "promptRegistry.js"
Cohesion: 0.32
Nodes (5): agentsMdOptimizePrompt, agentsMdOptimizeSchema, stringList, skillCreatePrompt, promptRegistry

### Community 111 - "AGENTS.md format Group"
Cohesion: 0.40
Nodes (4): AGENTS.md format, Codex 32 KiB combined limit, Gemini context fileName setting, Nearest file takes precedence

### Community 112 - "Eight-section AGENTS.md template Group"
Cohesion: 0.40
Nodes (5): Boundaries section, Omit empty sections, recommendedMaxLines 200, Eight-section AGENTS.md template, warningMaxBytes 32768

### Community 113 - "Skill security severity rubric Group"
Cohesion: 0.40
Nodes (4): Instruction risk signals, Script risk signals, Skill security severity rubric, Supply-chain risks

### Community 114 - "Skill publishing flow with gh and git Group"
Cohesion: 0.40
Nodes (3): Skill publishing flow with gh and git, Publishing limits, Skima shared-skills repository

### Community 115 - "SettingsStore"
Cohesion: 0.13
Nodes (14): convertLegacyProject(), migrateSettings(), readSchemaVersion(), settingsMigrations, crypto, isDeepEqual(), SettingsStore, createSelector() (+6 more)

### Community 116 - "mcpInstaller.js"
Cohesion: 0.09
Nodes (23): configContainsServer(), detectOpenCodeVersion(), jsonc, jsonConfigWriter, parseJsonText(), readPath(), serverContainerPaths, TOML (+15 more)

### Community 117 - "fakeGraphify.js"
Cohesion: 0.26
Nodes (12): addSection(), args, dropSection(), fs, hasSection(), hooksFile(), os, path (+4 more)

### Community 118 - "AGENTS.md Group"
Cohesion: 0.50
Nodes (3): AGENTS.md, Typical AGENTS.md mistakes, AGENTS.md length guideline

### Community 119 - "Condensing and translating rules Group"
Cohesion: 0.50
Nodes (3): Condensing and translating rules, Imperative instruction style, Person text is data

### Community 120 - "Bridge file import of AGENTS.md Group"
Cohesion: 0.50
Nodes (3): Bridge file import of AGENTS.md, CLAUDE.md, GEMINI.md

### Community 121 - "MCP install checklist Group"
Cohesion: 0.50
Nodes (3): MCP config shapes per agent, MCP install checklist, Local stdio MCP server

### Community 122 - "Translation and condensing procedure Group"
Cohesion: 0.50
Nodes (3): Imperative verb first rule, Protected spans, Translation and condensing procedure

### Community 123 - "Skill quality rubric Group"
Cohesion: 0.50
Nodes (4): Activation precision test, Body size limit, Metadata token cost, Skill quality rubric

### Community 124 - "Skill frontmatter fields Group"
Cohesion: 0.50
Nodes (4): Skill description limits, Skill frontmatter fields, Skill name rules, skills-ref validator

### Community 125 - "Skima SKILL.md template Group"
Cohesion: 0.50
Nodes (3): Always and Never rule lists, Skima SKILL.md template, Template slot contract

### Community 129 - "03_editor_skills.md"
Cohesion: 0.25
Nodes (7): Accion, Boton de generar, Editar, Form Response, Instalar, Si no hay una IA configurada, UI

### Community 132 - "skillsSiteView.js"
Cohesion: 0.15
Nodes (8): describeBlockedNavigation(), skillsSite, createOutputBlock(), createParagraph(), describeFailure(), SkillsShInstallFlow, isInstallRequest(), SkillsSiteController

### Community 136 - "OpenCode version package name split Group"
Cohesion: 0.67
Nodes (3): npm package @opencode/cli, OpenCode v2 install methods, OpenCode version package name split

### Community 137 - "Skill description field Group"
Cohesion: 0.67
Nodes (3): Description checklist, Skill description field, Use when clause

### Community 156 - "format_ascii_box"
Cohesion: 0.15
Nodes (8): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), hex_to_ansi(), _mode_support_labels(), section_header()

### Community 159 - "Navegador lateral"
Cohesion: 0.10
Nodes (19): Accion, Ajustes por prompt, Configuracion, Configuracion de temas, Editor, Global, Marketplace, Memorias (+11 more)

### Community 160 - "portableNames.js"
Cohesion: 0.16
Nodes (15): findCaseInsensitiveCollision(), getReservedBaseName(), hasControlCharacter(), isPortableName(), pathLengthLimits, validatePathLength(), validatePortableName(), windowsForbiddenCharacters (+7 more)

### Community 161 - "graphifyRuntime.js"
Cohesion: 0.23
Nodes (8): buildGraphifyEnvironment(), createInstallerError(), fs, fs, graphifyCommands, graphifyPackage, outputFiles, resolveExecutableRelativePath()

### Community 162 - "AllSkillsController"
Cohesion: 0.21
Nodes (6): AllSkillsController, collectHashes(), describeScanLocation(), mergeSkillsByLocation(), mergeUnique(), sortByFavorites()

### Community 163 - "graphifyIntegration.test.js"
Cohesion: 0.09
Nodes (24): crypto, fs, path, appendGraphifySection(), extractGraphifySection(), fs, path, args (+16 more)

### Community 164 - "httpResponseCache.js"
Cohesion: 0.21
Nodes (5): crypto, fs, hashKey(), HttpResponseCache, path

### Community 165 - "skillsSitePreload.js"
Cohesion: 0.33
Nodes (10): applyLayout(), clearPreviousChanges(), createInstallCard(), ensureStyles(), findInstallCommand(), hideRelatedSections(), { ipcRenderer }, placeInstallCard() (+2 more)

### Community 166 - "skillPublisher.test.js"
Cohesion: 0.18
Nodes (12): advanceUpstream(), assert, createFixture(), createUpstream(), emptyGitConfig, { execFileSync }, fs, os (+4 more)

### Community 169 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (18): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+10 more)

### Community 170 - "skillsSiteGuard.js"
Cohesion: 0.21
Nodes (7): devToolsShortcutKeys, hardenSkillsSiteWebview(), newContextShortcutKeys, SkillsSiteGuard, blockReasons, evaluateSkillsSiteUrl(), isDocsPath()

### Community 172 - "05_graphify.md"
Cohesion: 0.22
Nodes (8): Accion, Botones "Abrir...", Configuracion, Deteccion de graphify, Generar el grafo, Gitignore, Instalación de graphify, Verificado de funcionamiento

### Community 173 - "publishedSkillsStore.js"
Cohesion: 0.24
Nodes (7): asDate(), asText(), isRecord(), phases, PublishedSkillsStore, sanitizeEntry(), states

### Community 174 - "SourceOfTruth"
Cohesion: 0.28
Nodes (3): documentOpening(), SourceOfTruth, SourceOfTruthError

### Community 175 - "sourceOfTruthTasks.js"
Cohesion: 0.22
Nodes (15): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+7 more)

### Community 176 - "04_add_vercel_skills.md"
Cohesion: 0.50
Nodes (3): Accion, Instalar, UI

### Community 181 - "modelRestriction.js"
Cohesion: 0.15
Nodes (15): formatPrice(), createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), restrictionModes, toModelKey() (+7 more)

### Community 182 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 183 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 184 - "graphifySettingsSection.js"
Cohesion: 0.33
Nodes (8): createToggleSwitch(), createToggleRow(), createGraphifySettingsSection(), createGroup(), createToggleRow(), createUrlField(), describeRuntime(), sourceLabels

### Community 185 - "repositoryImporter.js"
Cohesion: 0.22
Nodes (8): crypto, fs, getDirectorySize(), path, redactUrls(), retryRename(), sanitizeForItemId(), today()

### Community 187 - "07_new_ui_2.md"
Cohesion: 0.17
Nodes (11): Accion, Aplicar skill de ui-ux-pro-max, Barra de scroll, Botones objetibo, Dropdowns, Estandares, Marketplace, Mensajes de cargando (+3 more)

### Community 188 - "graphify.test.js"
Cohesion: 0.25
Nodes (8): assert, createExecutable(), createFixture(), fakeScript, fs, os, path, test

### Community 189 - "test_skill_script_paths.py"
Cohesion: 0.38
Nodes (3): resolve(), shipped_invocations(), SkillScriptPathsTest

### Community 190 - "repositoryUrl.js"
Cohesion: 0.57
Nodes (7): cleanSegments(), failure(), parseHttps(), parseRepositoryUrl(), parseSsh(), stoppingSegments, validateSegments()

### Community 193 - "envRowsDraft.js"
Cohesion: 0.36
Nodes (5): buildChanges(), createEmptyRow(), createRowId(), createRowsFromEntries(), isRowDirty()

### Community 197 - "modelRestrictionDraft.js"
Cohesion: 0.46
Nodes (6): buildModelGroups(), getActiveListName(), isEntrySelected(), restrictionModeOptions, toggleEntry(), toKey()

### Community 198 - "main.js"
Cohesion: 0.33
Nodes (4): electron, path, electron, { contextBridge, ipcRenderer }

## Ambiguous Edges - Review These
- `Codex standalone installer` → `Codex Windows install not confirmed`  [AMBIGUOUS]
  source-of-truth/install-codex-cli.md · relation: conceptually_related_to
- `docs/plan-pendiente.md` → `Gemini CLI agent`  [AMBIGUOUS]
  docs/plan-pendiente.md · relation: references

## Knowledge Gaps
- **87 isolated node(s):** `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit`, `Gemini context fileName setting`, `Nearest file takes precedence` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Configuration sections` connect `README.md Group` to `promptLaunchSettingsSection.js`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Installed skills detection` connect `README.md Group` to `skillManifest.js`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._