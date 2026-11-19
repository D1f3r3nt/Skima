# Graph Report - Skima  (2026-11-19)

## Corpus Check
- 477 files · ~355,202 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 54 file(s) not represented in the graph (top: .csv 37, .css 11, (none) 3)

## Summary
- 4295 nodes · 10084 edges · 208 communities (152 shown, 56 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 390 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a1fb30e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Catalog Service
- projectDataStore.test.js
- catalogTasks.js
- skillPublisher.test.js
- repositoryScore.js
- agentsMd.test.js
- ref_node_assert
- ProviderPathResolver
- SkimaApiClient
- showToast
- ProjectController
- AnalyticsService
- graphify.test.js
- ref_node_fs
- geminiCliAdapter.js
- agentFileInstaller.test.js
- installedScanner.test.js
- hooksStore.js
- fakeGitTools.js
- mySkills.test.js
- memoryProjectInstaller.js
- importer.test.js
- IPC Controllers (AGENTS, AI, Catalog)
- navigateTo
- createButton
- agentsMdService.js
- with Group
- package.json Group
- graphifyService.js
- SkimaRepositorySource
- DesignSystemGenerator
- agentsMdOptimizer.js
- safeArchiveExtractor.js
- validate_data.py
- memoryProjectInstaller.js
- settingsSchema.js
- executableLocator.js Group
- projectConfigSchema.js
- providerRegistry.js
- catalogMaintenance.js Group
- contextTab.js
- DetailController
- mySkillsStore.js
- SkillFormView
- PlatformPaths Group
- promptRegistry.js Group
- CliInstaller Group
- libraryDocument.test.js
- shellView.js Group
- EnvFileService
- modelSelector.test.js
- graphifyIntegrationService.js
- _run_search
- MemoriesService
- readTextIfExists
- MySkillsStore Group
- fakeAgentEnvironment.js
- build Group
- HooksStore
- _TagCollector
- test_design_system_mode.py
- search_stack
- envFileService.js
- search
- AskAi Group
- globalHooksController.js
- mainWindow.js
- design_system.py
- docs/plan-pendiente.md Group
- prompts/00_creacion_inicial.md
- memories.test.js
- GraphifyRuntime
- markdownRenderer.js
- platformPaths.js
- createIcon
- scripts Group
- HookFormView
- ProjectHooksView
- README.md
- projectDataStore.test.js
- AgentDetector Group
- fetchUv.js
- cliInstaller.test.js
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
- ProjectHooksService
- PublishFlow
- BM25
- CLAUDE.md Group
- MemoriesStore
- skillInstaller.test.js
- themeService.js
- agentFileIpcController.js Group
- format_ascii_box
- publishIpcController.js Group
- SkillUninstaller
- Prompt injection attack forms Group
- AgentsMdIpcController Group
- promptRegistry.js
- InstalledScanner
- AGENTS.md format Group
- Eight-section AGENTS.md template Group
- Skill security severity rubric Group
- Skill publishing flow with gh and git Group
- SettingsStore
- mcpInstall.test.js
- fakeGraphify.js
- AGENTS.md Group
- Condensing and translating rules Group
- Bridge file import of AGENTS.md Group
- MCP install checklist Group
- Translation and condensing procedure Group
- Skill quality rubric Group
- Skill frontmatter fields Group
- Skima SKILL.md template Group
- skillOptimizationValidator.js
- test_skill_script_paths.py
- ProjectStore
- 03_editor_skills.md
- mcpIpcController.js
- InstallerIpcController Group
- createNoticeBanner
- mcpDefinitionDetector.js
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
- memoriesService.js
- GraphifyInstaller
- WindowIpcController
- Navegador lateral
- modelRestriction.js
- graphifyIntegration.test.js
- AllSkillsController
- 09_memories.md
- httpResponseCache.js
- skillsSitePreload.js
- repositoryDetailsService.test.js
- Editor
- TestThresholdGate
- UI/UX Pro Max - Design Intelligence
- aiIpcController.js
- CatalogRefreshTest
- 05_graphify.md
- publishedSkillsStore.js
- sourceOfTruth.test.js
- hooks.test.js
- 04_add_vercel_skills.md
- MemoryDetailController
- PreferencesService
- AgentSettingsService
- ImportIpcController
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- installedIpcController.js
- ref_node_crypto
- getMemory.sh
- 07_new_ui_2.md
- 10_analytics.md
- pathlib
- GraphifyIpcController
- UsageSnapshotCollector
- TokenCliTest
- envRowsDraft.js
- agentsMdTemplate.js
- TestStackFlagWithDesignSystem
- InstalledSkillsController
- modelRestrictionDraft.js
- MemoriesView
- TestMetricMath
- TestFixtureValidation
- appContainer.js
- skillsSiteView.js
- HooksIpcController
- SkillsSiteIpcController
- LinkIpcController
- RtlCliTest

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 158 edges
2. `createButton()` - 111 edges
3. `createAppContainer()` - 109 edges
4. `createIcon()` - 70 edges
5. `showToast()` - 62 edges
6. `createNoticeBanner()` - 60 edges
7. `createLoader()` - 54 edges
8. `search()` - 54 edges
9. `executeSafely()` - 51 edges
10. `createPlatformPaths()` - 50 edges

## Surprising Connections (you probably didn't know these)
- `createHarness()` --calls--> `SkimaRepositorySource`  [EXTRACTED]
  test/skima/skimaRepositorySource.test.js → src/core/main/skima/skimaRepositorySource.js
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `createInstallerSetup()` --calls--> `SkillInstaller`  [EXTRACTED]
  test/skills/skillInstaller.test.js → src/core/main/skills/skillInstaller.js

## Import Cycles
- 4-file cycle: `src/core/renderer/config/settingsSections.js -> src/core/renderer/settings/graphifySettingsSection.js -> src/core/renderer/controllers/mcpInstallFlow.js -> src/core/renderer/services/settingsModalService.js -> src/core/renderer/config/settingsSections.js`

## Hyperedges (group relationships)
- **Skill security review pipeline** — source_of_truth_skill_security_review_severity_rubric, source_of_truth_skill_security_review_instruction_risk_signals, source_of_truth_skill_security_review_script_risk_signals, source_of_truth_skill_security_review_supply_chain_risks [EXTRACTED 1.00]
- **catalogSample skill fixtures used for skill discovery tests** — test_fixtures_catalogsample_skills_mismatch_skill, test_fixtures_catalogsample_skills_no_manifest_readme, test_fixtures_catalogsample_skills_pdf_skill [INFERRED 0.75]
- **Catalog verification and library display** — catalog_verification_report, docs_plan_pendiente_catalog_scale, readme_biblioteca, readme_item_detail [INFERRED 0.75]
- **Skill install and management flow** — readme_install_flow, readme_installed_scanner, docs_decisiones_shared_skill_folder, docs_decisiones_trash_uninstall, readme_mis_skills [INFERRED 0.75]
- **Untrusted input defences** — source_of_truth_untrusted_content_and_prompt_injection_delimit_untrusted_data, source_of_truth_untrusted_content_and_prompt_injection_delimiter_neutralisation, source_of_truth_untrusted_content_and_prompt_injection_least_privilege_execution, source_of_truth_untrusted_content_and_prompt_injection_output_validation_rule, source_of_truth_untrusted_content_and_prompt_injection_fail_open_fallback [INFERRED 0.75]
- **AI skill optimization pipeline** — readme_skill_optimization, readme_agent_bridge, prompts_02_fases_9_10_11_skill_optimize_en, prompts_02_fases_9_10_11_skill_optimization_validation, docs_decisiones_optimization_integrity, readme_source_of_truth [INFERRED 0.85]

## Communities (208 total, 56 thin omitted)

### Community 0 - "Catalog Service"
Cohesion: 0.06
Nodes (25): catalogQueries, crawlLimits, CatalogService, createEmptySnapshot(), parseGitHubUrl(), toCatalogRepository(), toRepositoryKey(), catalogTypes (+17 more)

### Community 1 - "projectDataStore.test.js"
Cohesion: 0.28
Nodes (4): createDefaultProjectConfig(), sanitizeProjectConfig(), ProjectDataStore, createProject()

### Community 2 - "catalogTasks.js"
Cohesion: 0.05
Nodes (39): buildReport(), candidatesPath, catalogDirectory, commands, discardsPath, fs, fsPromises, libraryPath (+31 more)

### Community 3 - "skillPublisher.test.js"
Cohesion: 0.06
Nodes (34): allowedExtensions, buildPullRequestBody(), checkFile(), collectFiles(), forbiddenNamePatterns, fs, inspectSkillFolder(), isHiddenSegment() (+26 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.18
Nodes (17): Repository scoring formula, clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks() (+9 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.09
Nodes (23): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), crypto, fs, hashText(), path (+15 more)

### Community 6 - "ref_node_assert"
Cohesion: 0.08
Nodes (19): assert, definition, fs, jsonc, os, path, test, TOML (+11 more)

### Community 7 - "ProviderPathResolver"
Cohesion: 0.11
Nodes (16): ProviderPathResolver, findProvider(), assert, createFixture(), fs, githubSource, os, path (+8 more)

### Community 10 - "showToast"
Cohesion: 0.09
Nodes (9): createPageHeader(), showToast(), createEmptyState(), createItemDetailSkeleton(), params, DetailView, PlaceholderView, ProjectsView (+1 more)

### Community 11 - "ProjectController"
Cohesion: 0.11
Nodes (14): createVerifiedBadge(), createInlineEditableTitle(), missingFolderTabReason, projectTabs, createGraphifyActions(), createHealthBadge(), createTooltipButton(), describeGraph() (+6 more)

### Community 12 - "AnalyticsService"
Cohesion: 0.16
Nodes (6): AnalyticsService, sanitizeParams(), MeasurementProtocolClient, assert, createFixture(), { describe, it }

### Community 13 - "graphify.test.js"
Cohesion: 0.22
Nodes (9): graphifyCommands, assert, createExecutable(), createFixture(), fakeScript, fs, os, path (+1 more)

### Community 14 - "ref_node_fs"
Cohesion: 0.05
Nodes (35): artifactTypeDefinitions, findArtifactTypeDefinition(), listAgentsSupportingType(), folderLimits, fs, listFolder(), path, validateSkillFolder() (+27 more)

### Community 15 - "geminiCliAdapter.js"
Cohesion: 0.10
Nodes (22): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, outputFormats (+14 more)

### Community 16 - "agentFileInstaller.test.js"
Cohesion: 0.27
Nodes (3): AgentFileInstaller, createInstallError(), toCaseInsensitiveKey()

### Community 17 - "installedScanner.test.js"
Cohesion: 0.07
Nodes (21): providerRegistry, productionRepository, assert, test, MemoryStorage, assert, createService(), fs (+13 more)

### Community 18 - "hooksStore.js"
Cohesion: 0.17
Nodes (18): buildCommandPath(), buildHookEntry(), buildScriptFileName(), buildSkillCommand(), hookEvents, hookLimits, hookTypes, implementedHookTypes (+10 more)

### Community 19 - "fakeGitTools.js"
Cohesion: 0.16
Nodes (17): args, copyDirectory(), delegateToRealGit(), fs, handleGh(), handleGhExtended(), handleGit(), mapRemote() (+9 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.05
Nodes (52): path, executeWithCode(), MySkillsIpcController, path, fs, ImportedDetailsService, path, readmeNames (+44 more)

### Community 21 - "memoryProjectInstaller.js"
Cohesion: 0.14
Nodes (12): defaultMaintainMemoryHook, isReservedHookName(), protectedHookNames, protectedSkillNames, reservedHookNames, fs, hasLoaderEntry(), isLoaderEntry() (+4 more)

### Community 22 - "importer.test.js"
Cohesion: 0.05
Nodes (30): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, GitToolchain, toGitPathForHelper() (+22 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.17
Nodes (14): analyticsEvents, downloadSources, crypto, disabledAnalytics, recoverableCodes, recoverableCodes, recoverableCodes, recoverableCodes (+6 more)

### Community 24 - "navigateTo"
Cohesion: 0.05
Nodes (48): Skima app icon (skima.png), Skima brand identity (S-mark logo), variantIcons, confirmDialog(), createSettingsModal(), bootstrapPage(), settingsSections, viewKinds (+40 more)

### Community 25 - "createButton"
Cohesion: 0.09
Nodes (26): createButton(), createPathSettingField(), createModal(), typedConfirmDialog(), AgentFileInstallFlow, createParagraph(), CliInstallFlow, createCodeBlock() (+18 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.21
Nodes (3): AgentsMdService, createError(), validateAgentsMd()

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.07
Nodes (34): author, dependencies, ajv@8.20.0, dotenv@16.6.1, fflate@0.7.5, highlight.js@11.12.0, jsonc-parser@3.3.1, marked@18.1.1 (+26 more)

### Community 29 - "graphifyService.js"
Cohesion: 0.13
Nodes (14): outputFiles, crypto, diffSnapshots(), fs, parseGodNodes(), path, { pathToFileURL }, snapshotTopLevel() (+6 more)

### Community 31 - "DesignSystemGenerator"
Cohesion: 0.05
Nodes (16): DesignSystemGenerator, _resolve_dial(), apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), TestReasoningMatch, read_rows() (+8 more)

### Community 32 - "agentsMdOptimizer.js"
Cohesion: 0.16
Nodes (15): sanitizeAnswers(), AgentsMdOptimizer, boundaryFields, buildPayload(), dataTags, fallbackReasons, isStringArray(), languageInstructions (+7 more)

### Community 33 - "safeArchiveExtractor.js"
Cohesion: 0.10
Nodes (18): ArchiveLimitError, assertNoEscapingLinks(), defaultLimits, extractSafely(), fs, isUnsafeRelativePath(), matchesPrefixes(), normalizeEntryPath() (+10 more)

### Community 34 - "validate_data.py"
Cohesion: 0.07
Nodes (42): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+34 more)

### Community 36 - "settingsSchema.js"
Cohesion: 0.06
Nodes (41): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue, fs (+33 more)

### Community 37 - "executableLocator.js Group"
Cohesion: 0.11
Nodes (12): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+4 more)

### Community 38 - "projectConfigSchema.js"
Cohesion: 0.20
Nodes (18): createDefaultModelRestriction(), restrictionModes, asIsoDate(), asShortText(), graphifyDecisions, isPlainObject(), migrateProjectConfig(), projectConfigLimits (+10 more)

### Community 39 - "providerRegistry.js"
Cohesion: 0.11
Nodes (15): claudeCodeCli, codexCli, geminiCliAdapter, openCodeCli, claudeCode, codex, cursor, geminiCli (+7 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.10
Nodes (31): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+23 more)

### Community 41 - "contextTab.js"
Cohesion: 0.19
Nodes (16): createField(), createQuestionStep(), agentsMdQuestions, answerKeys, createContextTab(), createEmptyAnswers(), createParagraph(), languageOptions (+8 more)

### Community 42 - "DetailController"
Cohesion: 0.08
Nodes (20): artifactTypes, findArtifactType(), isProtectedSkillName(), protectedHookNames, protectedSkillNames, protectedSkillNotice, DetailController, describeManifestIssues() (+12 more)

### Community 43 - "mySkillsStore.js"
Cohesion: 0.06
Nodes (36): fflate, crypto, fs, path, retryRename(), sanitizeForItemId(), today(), isProtectedSkill() (+28 more)

### Community 44 - "SkillFormView"
Cohesion: 0.19
Nodes (4): createCounter(), createField(), createTextArea(), SkillFormView

### Community 46 - "promptRegistry.js Group"
Cohesion: 0.18
Nodes (14): Read-only mode for Claude Code, Third-party skill review procedure, Phase 10: AI skill optimization, Optimization response validation rules, skill-optimize-en prompt, Agent bridge (runAgent and askAi), Cheap model selection, Project model restriction (+6 more)

### Community 47 - "CliInstaller Group"
Cohesion: 0.18
Nodes (8): CliInstaller, createInstallerError(), crypto, describeStep(), fs, interpreterInvocations, parseMajor(), path

### Community 48 - "libraryDocument.test.js"
Cohesion: 0.11
Nodes (29): yaml, adaptAgentFile(), buildMarkdown(), formatAdapters, pick(), YAML, crypto, fs (+21 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.15
Nodes (13): createAppLogo(), createNavItem(), createNavSubItem(), createControlButton(), createWindowControls(), createExpandedNavItem(), createNavEntry(), createNavGroup() (+5 more)

### Community 50 - "EnvFileService"
Cohesion: 0.32
Nodes (3): createEnvError(), EnvFileService, hashText()

### Community 51 - "modelSelector.test.js"
Cohesion: 0.13
Nodes (14): formatPrice(), ModelSelector, classifyModel(), localProviderIds, normalizeCost(), parseJsonBlock(), parseVerboseModels(), perThousandKeys (+6 more)

### Community 52 - "graphifyIntegrationService.js"
Cohesion: 0.16
Nodes (12): createIntegrationError(), crypto, fs, GraphifyIntegrationService, hashText(), ignoredHomePrefixes, integrationVariants, path (+4 more)

### Community 53 - "_run_search"
Cohesion: 0.24
Nodes (3): _run_search(), TestPreviewCli, TestPreviewEscaping

### Community 55 - "readTextIfExists"
Cohesion: 0.24
Nodes (15): detectLineEnding(), readTextIfExists(), appendPattern(), assertRegularFileOrMissing(), containsPattern(), ensureGitignoreEntry(), findGitRoot(), fs (+7 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.22
Nodes (3): writeFileAtomic(), createStoreError(), MySkillsStore

### Community 57 - "fakeAgentEnvironment.js"
Cohesion: 0.09
Nodes (23): assert, test, withSetup(), assert, createAskAi(), path, sourceOfTruth, test (+15 more)

### Community 58 - "build Group"
Cohesion: 0.08
Nodes (25): build, appId, asar, directories, extraResources, files, linux, mac (+17 more)

### Community 59 - "HooksStore"
Cohesion: 0.20
Nodes (3): HooksStore, isProtectedHook(), JsonFileStorage

### Community 60 - "_TagCollector"
Cohesion: 0.17
Nodes (3): _parse(), _TagCollector, TestPreviewStructure

### Community 61 - "test_design_system_mode.py"
Cohesion: 0.08
Nodes (11): _filter_anti_patterns_for_mode(), _palette_is_dark(), _query_wants_dark(), _relative_luminance(), _resolve_color_mode(), _select_palette_for_mode(), _style_is_dark_primary(), TestAntiPatternGating (+3 more)

### Community 62 - "search_stack"
Cohesion: 0.07
Nodes (10): _exact_stack_identifier(), _project_row(), search_stack(), _valid_max_results(), TestDiagnosticsContracts, _rows(), TestNativeDesktopStackFreshness, TestTextLayoutRetrieval (+2 more)

### Community 63 - "envFileService.js"
Cohesion: 0.11
Nodes (27): applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace(), listEntries(), listKeysOnly() (+19 more)

### Community 64 - "search"
Cohesion: 0.06
Nodes (10): _normalize_rtl_level(), _rtl_row_filter(), search(), _style_search_destination(), TestSearchDomains, TestImeGuidance, read_rows(), RtlDataContractTest (+2 more)

### Community 65 - "AskAi Group"
Cohesion: 0.20
Nodes (6): AskAi, createAskError(), fs, referenceTags, neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "globalHooksController.js"
Cohesion: 0.09
Nodes (15): globalTabs, describeHookEvent(), hookEvents, hookEventSides, describeHookType(), protectedHookNotice, GlobalController, readLastTab() (+7 more)

### Community 67 - "mainWindow.js"
Cohesion: 0.05
Nodes (38): electron, path, allowedRemotePrefixes, GraphViewerRegistry, graphViewerRegistry, hardenGraphViewerWebview(), isGraphViewerGuest(), normalizeFileUrl() (+30 more)

### Community 68 - "design_system.py"
Cohesion: 0.04
Nodes (41): build_design_tokens(), _button_outline_text_color(), _contrast_ratio(), _css_font_family(), _derive_dark_palette(), _detect_page_type(), _flatten_tokens(), format_master_md() (+33 more)

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.18
Nodes (11): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Branch protection rule for master, CODEOWNERS review, Pull request template, Valid skill rules (+3 more)

### Community 70 - "prompts/00_creacion_inicial.md"
Cohesion: 0.20
Nodes (10): Native folder picker popup with name and path fields, Initial dark first screen with add-project button, JetBrains-style project selector, proyectos.json project storage file, Left sidebar navigation menu, AGENTS.md project context tab, Global and Project views, proyectos.json legacy format (+2 more)

### Community 71 - "memories.test.js"
Cohesion: 0.09
Nodes (18): fs, ignoredEntryNames, previewableExtensions, summarize(), buildMemoryFileContent(), parseMemoryFileContent(), toMemorySlug(), validateMemoryName() (+10 more)

### Community 72 - "GraphifyRuntime"
Cohesion: 0.20
Nodes (7): buildGraphifyEnvironment(), fs, createStatus(), fs, graphifyPackage, GraphifyRuntime, resolveExecutableRelativePath()

### Community 73 - "markdownRenderer.js"
Cohesion: 0.12
Nodes (21): allowedLinkSchemes, convertGitHubBlobToRaw(), createMarked(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl() (+13 more)

### Community 74 - "platformPaths.js"
Cohesion: 0.10
Nodes (20): createPlatformPaths(), nodePath, os, supportedPlatforms, createExecutable(), createFakeGitSetup(), { execFileSync }, fakeScript (+12 more)

### Community 75 - "createIcon"
Cohesion: 0.07
Nodes (41): createAvatar(), getInitials(), getToneIndex(), createBadge(), createIcon(), iconPaths, createChoiceCardGroup(), buildTree() (+33 more)

### Community 76 - "scripts Group"
Cohesion: 0.13
Nodes (15): scripts, catalog:refresh, catalog:validate, catalog:verify, dist, dist:linux, dist:mac, dist:win (+7 more)

### Community 77 - "HookFormView"
Cohesion: 0.21
Nodes (3): createField(), createHint(), HookFormView

### Community 78 - "ProjectHooksView"
Cohesion: 0.20
Nodes (3): ProjectHooksController, createHooksTab(), ProjectHooksView

### Community 79 - "README.md"
Cohesion: 0.09
Nodes (17): electron-builder 26.18.0 choice, WSL not supported, Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, Reusable wizard engine, mySkill installer source, Phase 11: packaging, CI and documentation, Phase 9: skill wizard and Mis skills (+9 more)

### Community 80 - "projectDataStore.test.js"
Cohesion: 0.20
Nodes (6): assert, createStore(), fs, os, path, test

### Community 82 - "fetchUv.js"
Cohesion: 0.17
Nodes (14): crypto, download(), extractFromTarball(), extractFromZip(), fs, fsPromises, main(), os (+6 more)

### Community 83 - "cliInstaller.test.js"
Cohesion: 0.06
Nodes (31): brewRequirement, claudeCodeInstall, codexInstall, findInstallTarget(), geminiCliInstall, githubCliInstall, githubCliTool, installRecipes (+23 more)

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
Cohesion: 0.21
Nodes (7): Atomic design components, Electron stack (Node 24, Electron 45), Own file storage with fs, Project directory structure, contextBridge preload, Main process, Renderer process

### Community 90 - "SkillsSiteView"
Cohesion: 0.18
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

### Community 96 - "ProjectHooksService"
Cohesion: 0.24
Nodes (3): assertHookEvent(), isPlainObject(), ProjectHooksService

### Community 97 - "PublishFlow"
Cohesion: 0.38
Nodes (3): createLabeledField(), createParagraph(), PublishFlow

### Community 98 - "BM25"
Cohesion: 0.15
Nodes (4): BM25, _suggest_identities(), TestBm25CoreBehavior, TestTokenizer

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 101 - "skillInstaller.test.js"
Cohesion: 0.17
Nodes (13): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib, assert, createInstallerSetup(), createTemporaryDirectory() (+5 more)

### Community 102 - "themeService.js"
Cohesion: 0.28
Nodes (12): defaultThemeId, themes, themeStorageKey, applyTheme(), getActiveThemeId(), isKnownTheme(), syncThemeFromPreferences(), themeListeners (+4 more)

### Community 103 - "agentFileIpcController.js Group"
Cohesion: 0.33
Nodes (4): AgentFileIpcController, scopes, types, validateSource()

### Community 104 - "format_ascii_box"
Cohesion: 0.13
Nodes (9): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), hex_to_ansi(), _mode_support_labels(), section_header() (+1 more)

### Community 105 - "publishIpcController.js Group"
Cohesion: 0.47
Nodes (3): describeError(), PublishIpcController, text()

### Community 107 - "Prompt injection attack forms Group"
Cohesion: 0.33
Nodes (5): Prompt injection attack forms, Delimit untrusted data, Neutralise delimiters, Least privilege execution, Validate output against schema

### Community 108 - "AgentsMdIpcController Group"
Cohesion: 0.40
Nodes (3): AgentsMdIpcController, describeError(), optimizationFrom()

### Community 109 - "promptRegistry.js"
Cohesion: 0.32
Nodes (5): agentsMdOptimizePrompt, agentsMdOptimizeSchema, stringList, skillCreatePrompt, findPrompt()

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

### Community 116 - "mcpInstall.test.js"
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

### Community 126 - "skillOptimizationValidator.js"
Cohesion: 0.43
Nodes (7): extractProtectedSpans(), isStringArray(), missingSpans(), protectedSpanPatterns, stripRulePrefix(), validateOptimization(), validateShape()

### Community 127 - "test_skill_script_paths.py"
Cohesion: 0.38
Nodes (3): resolve(), shipped_invocations(), SkillScriptPathsTest

### Community 129 - "03_editor_skills.md"
Cohesion: 0.25
Nodes (7): Accion, Boton de generar, Editar, Form Response, Instalar, Si no hay una IA configurada, UI

### Community 132 - "createNoticeBanner"
Cohesion: 0.08
Nodes (53): createLoader(), createSelectInput(), createTextInput(), createToggleSwitch(), createFolderInput(), createFormField(), createNoticeBanner(), variantIcons (+45 more)

### Community 133 - "mcpDefinitionDetector.js"
Cohesion: 0.27
Nodes (17): dedupeCandidates(), detectMcpDefinitions(), extractCodeBlocks(), fromClaudeAddCommand(), fromConfigObject(), fromPackageJson(), fromPyproject(), fromReadme() (+9 more)

### Community 136 - "OpenCode version package name split Group"
Cohesion: 0.67
Nodes (3): npm package @opencode/cli, OpenCode v2 install methods, OpenCode version package name split

### Community 137 - "Skill description field Group"
Cohesion: 0.67
Nodes (3): Description checklist, Skill description field, Use when clause

### Community 156 - "memoriesService.js"
Cohesion: 0.48
Nodes (6): buildContextFile(), buildInstructions(), buildMemoryTemplate(), buildReadme(), buildTechSolutionsIndex(), memoryDirectories

### Community 159 - "Navegador lateral"
Cohesion: 0.10
Nodes (19): Accion, Ajustes por prompt, Configuracion, Configuracion de temas, Editor, Global, Marketplace, Memorias (+11 more)

### Community 160 - "modelRestriction.js"
Cohesion: 0.27
Nodes (8): createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), toModelKey(), ProjectModelPolicy, toModelName()

### Community 161 - "graphifyIntegration.test.js"
Cohesion: 0.07
Nodes (26): escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn }, windowsShimExtensions (+18 more)

### Community 162 - "AllSkillsController"
Cohesion: 0.10
Nodes (13): hookFormLimits, hookNamePattern, hookTypeOptions, AllSkillsController, createEmptyForm(), fallbackModels, HookFormController, toModelName() (+5 more)

### Community 163 - "09_memories.md"
Cohesion: 0.18
Nodes (10): Accion, Actualizar, Cargar memory, Comprobacion, Estructura, Estructura MEMORY.md, La idea, MEMORY.md (+2 more)

### Community 164 - "httpResponseCache.js"
Cohesion: 0.24
Nodes (5): crypto, fs, hashKey(), HttpResponseCache, path

### Community 165 - "skillsSitePreload.js"
Cohesion: 0.33
Nodes (10): applyLayout(), clearPreviousChanges(), createInstallCard(), ensureStyles(), findInstallCommand(), hideRelatedSections(), { ipcRenderer }, placeInstallCard() (+2 more)

### Community 166 - "repositoryDetailsService.test.js"
Cohesion: 0.17
Nodes (10): findReadme(), findSkillManifests(), isMarkdownFile(), RepositoryDetailsService, assert, createService(), files, repository (+2 more)

### Community 167 - "Editor"
Cohesion: 0.18
Nodes (10): Accion, Agent, Command, Como funcionan, Editor, Global, Internamente, Prompt (+2 more)

### Community 169 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (18): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+10 more)

### Community 170 - "aiIpcController.js"
Cohesion: 0.33
Nodes (3): AiIpcController, crypto, rendererAllowedFields

### Community 172 - "05_graphify.md"
Cohesion: 0.22
Nodes (8): Accion, Botones "Abrir...", Configuracion, Deteccion de graphify, Generar el grafo, Gitignore, Instalación de graphify, Verificado de funcionamiento

### Community 173 - "publishedSkillsStore.js"
Cohesion: 0.24
Nodes (7): asDate(), asText(), isRecord(), phases, PublishedSkillsStore, sanitizeEntry(), states

### Community 174 - "sourceOfTruth.test.js"
Cohesion: 0.06
Nodes (44): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+36 more)

### Community 175 - "hooks.test.js"
Cohesion: 0.28
Nodes (8): assert, createEnvironment(), createScript(), createTemporaryDirectory(), fs, os, path, test

### Community 176 - "04_add_vercel_skills.md"
Cohesion: 0.50
Nodes (3): Accion, Instalar, UI

### Community 177 - "MemoryDetailController"
Cohesion: 0.27
Nodes (3): MemoryDetailController, readLastTab(), writeLastTab()

### Community 179 - "AgentSettingsService"
Cohesion: 0.23
Nodes (5): AgentSettingsService, createFieldError(), editablePathFields, fs, mcpExtensionsByFormat

### Community 182 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 183 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 184 - "installedIpcController.js"
Cohesion: 0.38
Nodes (3): InstalledIpcController, readScope(), scopes

### Community 185 - "ref_node_crypto"
Cohesion: 0.21
Nodes (5): createMemorizeError(), crypto, MemoryMemorizer, memoriesUpdatePrompt, createMemorizer()

### Community 187 - "07_new_ui_2.md"
Cohesion: 0.17
Nodes (11): Accion, Aplicar skill de ui-ux-pro-max, Barra de scroll, Botones objetibo, Dropdowns, Estandares, Marketplace, Mensajes de cargando (+3 more)

### Community 188 - "10_analytics.md"
Cohesion: 0.33
Nodes (5): Accion, Configuracion, Convencion, Eventos, Plan

### Community 189 - "pathlib"
Cohesion: 0.09
Nodes (6): CatalogSummaryLineEndingsTest, _load_generator(), _node_available(), read_rows(), read_rows(), TestTextLayoutDataContracts

### Community 193 - "envRowsDraft.js"
Cohesion: 0.36
Nodes (5): buildChanges(), createEmptyRow(), createRowId(), createRowsFromEntries(), isRowDirty()

### Community 194 - "agentsMdTemplate.js"
Cohesion: 0.32
Nodes (11): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, missingImportantSections(), normalizeText(), renderAgentsMd(), renderCodeBlock() (+3 more)

### Community 197 - "modelRestrictionDraft.js"
Cohesion: 0.46
Nodes (6): buildModelGroups(), getActiveListName(), isEntrySelected(), restrictionModeOptions, toggleEntry(), toKey()

### Community 201 - "appContainer.js"
Cohesion: 0.04
Nodes (31): analyticsConfig, describeAnalyticsEnvironment(), operatingSystemNames, createAppContainer(), fileNames, fs, os, path (+23 more)

### Community 203 - "skillsSiteView.js"
Cohesion: 0.11
Nodes (10): describeBlockedNavigation(), skillsSite, GraphViewerController, createOutputBlock(), createParagraph(), describeFailure(), SkillsShInstallFlow, isInstallRequest() (+2 more)

## Ambiguous Edges - Review These
- `Codex standalone installer` → `Codex Windows install not confirmed`  [AMBIGUOUS]
  source-of-truth/install-codex-cli.md · relation: conceptually_related_to
- `docs/plan-pendiente.md` → `Gemini CLI agent`  [AMBIGUOUS]
  docs/plan-pendiente.md · relation: references

## Knowledge Gaps
- **87 isolated node(s):** `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit`, `Gemini context fileName setting`, `Nearest file takes precedence` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1314 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Settings modal` connect `prompts/00_creacion_inicial.md` to `README.md`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Configuration sections` connect `prompts/00_creacion_inicial.md` to `createNoticeBanner`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._