# Graph Report - Skima  (2026-11-18)

## Corpus Check
- 444 files · ~341,024 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 53 file(s) not represented in the graph (top: .csv 37, .css 10, (none) 3)

## Summary
- 3990 nodes · 9241 edges · 206 communities (152 shown, 54 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 372 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf93b16a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Catalog Service
- projectDataStore.test.js
- catalogTasks.js
- skillPublisher.test.js
- repositoryScore.js
- agentsMd.test.js
- MemoryStorage
- createPlatformPaths
- .unwrap
- RepositoryImporter
- createIcon
- showToast
- fakeGitEnvironment.js
- skillManifest.js
- providerRegistry.js
- CLI Install Recipes
- envFileService.js
- hooks.test.js
- navigateTo
- mySkills.test.js
- appContainer.js
- Git Session Service
- IPC Controllers (AGENTS, AI, Catalog)
- projectController.js
- createButton
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
- portableNames.js
- skillFormView.js
- PlatformPaths Group
- promptRegistry.js Group
- CliInstaller Group
- agentFileInstaller.js
- shellView.js Group
- agentsSettingsSection.js
- modelSelector.test.js
- graphifyIntegrationService.js
- hookDetailView.js
- design_system.py
- readTextIfExists
- MySkillsStore Group
- fakeAgentEnvironment.js
- build Group
- fakeGitTools.js
- preview.py
- test_design_system_mode.py
- search_stack
- isPlainObject
- search
- AskAi Group
- repositoryDetailsService.test.js
- mainWindow.js
- generate_design_system
- docs/plan-pendiente.md Group
- README.md Group
- ProjectHooksService
- graphifyRuntime.js
- markdownRenderer.js
- InstalledScanner
- createEmptyState
- scripts Group
- HookFormView
- ProjectHooksView
- prompts/02_fases_9_10_11.md Group
- Phase 9: skill wizard and Mis skills Group
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
- sourceOfTruthDocument.js
- GitToolchain
- BM25
- CLAUDE.md Group
- agentsMdTemplate.js
- skillInstaller.test.js
- themeService.js
- agentFileIpcController.js Group
- installedIpcController.js Group
- publishIpcController.js Group
- SkillUninstaller Group
- Prompt injection attack forms Group
- AgentsMdIpcController Group
- sourceOfTruth.test.js
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
- libraryDocumentValidator.js
- 03_editor_skills.md
- mcpIpcController.js
- InstallerIpcController Group
- skillsSiteView.js
- libraryDocument.test.js
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
- ImportedLibraryStore
- GraphifyInstaller
- WindowIpcController
- Navegador lateral
- importedSkillSource.js
- graphifyRuntime.js
- AllSkillsController
- graphifyIntegration.test.js
- httpResponseCache.js
- skillsSitePreload.js
- LibraryService
- Editor
- TestThresholdGate
- UI/UX Pro Max - Design Intelligence
- _select_palette_for_mode
- CatalogRefreshTest
- 05_graphify.md
- publishedSkillsStore.js
- SourceOfTruth
- sourceOfTruthTasks.js
- 04_add_vercel_skills.md
- GraphifyIpcController
- ImportIpcController
- ProviderPathResolver
- LocalCatalogService
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- installedScanner.test.js
- linux
- PromptLaunchSettingsService
- 07_new_ui_2.md
- graphify.test.js
- test_skill_script_paths.py
- importer.test.js
- CatalogSummaryLineEndingsTest
- TokenCliTest
- envRowsDraft.js
- mac
- TestStackFlagWithDesignSystem
- RtlCliTest
- modelRestrictionDraft.js
- electron
- artifacts/artifactTypes.js
- TestMetricMath
- createAppContainer
- TestFixtureValidation
- HooksIpcController
- SkillsSiteIpcController

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 141 edges
2. `createAppContainer()` - 98 edges
3. `createButton()` - 98 edges
4. `createIcon()` - 59 edges
5. `createNoticeBanner()` - 56 edges
6. `search()` - 54 edges
7. `showToast()` - 52 edges
8. `executeSafely()` - 49 edges
9. `createPlatformPaths()` - 47 edges
10. `createLoader()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `createEnvironment()` --calls--> `ProjectHooksService`  [EXTRACTED]
  test/hooks/hooks.test.js → src/core/main/hooks/projectHooksService.js
- `createEnvironment()` --calls--> `createPlatformPaths()`  [EXTRACTED]
  test/hooks/hooks.test.js → src/core/main/platform/platformPaths.js

## Import Cycles
- 4-file cycle: `src/core/renderer/config/settingsSections.js -> src/core/renderer/settings/graphifySettingsSection.js -> src/core/renderer/controllers/mcpInstallFlow.js -> src/core/renderer/services/settingsModalService.js -> src/core/renderer/config/settingsSections.js`

## Hyperedges (group relationships)
- **Skill security review pipeline** — source_of_truth_skill_security_review_severity_rubric, source_of_truth_skill_security_review_instruction_risk_signals, source_of_truth_skill_security_review_script_risk_signals, source_of_truth_skill_security_review_supply_chain_risks [EXTRACTED 1.00]
- **catalogSample skill fixtures used for skill discovery tests** — test_fixtures_catalogsample_skills_mismatch_skill, test_fixtures_catalogsample_skills_no_manifest_readme, test_fixtures_catalogsample_skills_pdf_skill [INFERRED 0.75]
- **Catalog verification and library display** — catalog_verification_report, docs_plan_pendiente_catalog_scale, readme_biblioteca, readme_item_detail [INFERRED 0.75]
- **Skill install and management flow** — readme_install_flow, readme_installed_scanner, docs_decisiones_shared_skill_folder, docs_decisiones_trash_uninstall, readme_mis_skills [INFERRED 0.75]
- **Untrusted input defences** — source_of_truth_untrusted_content_and_prompt_injection_delimit_untrusted_data, source_of_truth_untrusted_content_and_prompt_injection_delimiter_neutralisation, source_of_truth_untrusted_content_and_prompt_injection_least_privilege_execution, source_of_truth_untrusted_content_and_prompt_injection_output_validation_rule, source_of_truth_untrusted_content_and_prompt_injection_fail_open_fallback [INFERRED 0.75]
- **AI skill optimization pipeline** — readme_skill_optimization, readme_agent_bridge, prompts_02_fases_9_10_11_skill_optimize_en, prompts_02_fases_9_10_11_skill_optimization_validation, docs_decisiones_optimization_integrity, readme_source_of_truth [INFERRED 0.85]

## Communities (206 total, 54 thin omitted)

### Community 0 - "Catalog Service"
Cohesion: 0.06
Nodes (25): catalogQueries, crawlLimits, CatalogService, createEmptySnapshot(), parseGitHubUrl(), toCatalogRepository(), toRepositoryKey(), catalogTypes (+17 more)

### Community 1 - "projectDataStore.test.js"
Cohesion: 0.13
Nodes (11): createDefaultProjectConfig(), sanitizeProjectConfig(), ProjectDataStore, createProjectFixture(), createProject(), assert, createStore(), fs (+3 more)

### Community 2 - "catalogTasks.js"
Cohesion: 0.17
Nodes (20): buildReport(), candidatesPath, catalogDirectory, commands, discardsPath, fs, fsPromises, libraryPath (+12 more)

### Community 3 - "skillPublisher.test.js"
Cohesion: 0.07
Nodes (33): allowedExtensions, buildPullRequestBody(), checkFile(), collectFiles(), forbiddenNamePatterns, fs, inspectSkillFolder(), isHiddenSegment() (+25 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.19
Nodes (16): clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks(), scoreIssues() (+8 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.11
Nodes (20): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), crypto, fs, hashText(), path (+12 more)

### Community 6 - "MemoryStorage"
Cohesion: 0.13
Nodes (9): MemoryStorage, assert, createModel(), test, assert, fs, os, path (+1 more)

### Community 7 - "createPlatformPaths"
Cohesion: 0.07
Nodes (32): createPlatformPaths(), nodePath, os, supportedPlatforms, findProvider(), assert, fs, githubSource (+24 more)

### Community 10 - "RepositoryImporter"
Cohesion: 0.13
Nodes (10): createImportError(), crypto, fs, getDirectorySize(), path, redactUrls(), RepositoryImporter, retryRename() (+2 more)

### Community 11 - "createIcon"
Cohesion: 0.08
Nodes (39): createAvatar(), getInitials(), getToneIndex(), createBadge(), createIcon(), iconPaths, createLoader(), createVerifiedBadge() (+31 more)

### Community 12 - "showToast"
Cohesion: 0.10
Nodes (39): createSelectInput(), variantIcons, createRadioGroup(), showToast(), variantIcons, createSteppedModal(), settingsSectionIds, resultLabels (+31 more)

### Community 13 - "fakeGitEnvironment.js"
Cohesion: 0.12
Nodes (16): escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn }, windowsShimExtensions (+8 more)

### Community 14 - "skillManifest.js"
Cohesion: 0.08
Nodes (24): fs, ImportedDetailsService, path, readmeNames, toMcpCandidate(), fs, fsPromises, path (+16 more)

### Community 15 - "providerRegistry.js"
Cohesion: 0.05
Nodes (44): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, claudeCodeCli (+36 more)

### Community 16 - "CLI Install Recipes"
Cohesion: 0.09
Nodes (17): brewRequirement, claudeCodeInstall, codexInstall, geminiCliInstall, githubCliInstall, githubCliTool, installRecipes, npmRequirement (+9 more)

### Community 17 - "envFileService.js"
Cohesion: 0.10
Nodes (26): applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace(), listEntries(), listKeysOnly() (+18 more)

### Community 18 - "hooks.test.js"
Cohesion: 0.10
Nodes (27): buildCommandPath(), buildHookEntry(), buildPromptText(), buildScriptFileName(), hookEvents, hookLimits, hookTypes, implementedHookTypes (+19 more)

### Community 19 - "navigateTo"
Cohesion: 0.05
Nodes (42): Skima app icon (skima.png), Skima brand identity (S-mark logo), createSearchField(), createInstalledSkillList(), bootstrapPage(), settingsSections, backLabels, HookDetailController (+34 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.09
Nodes (29): executeWithCode(), MySkillsIpcController, path, errorMessages, SkillCreator, buildFormResponse(), buildFrontmatter(), createFormError() (+21 more)

### Community 21 - "appContainer.js"
Cohesion: 0.07
Nodes (13): fileNames, fs, path, LibraryIpcController, PreferencesIpcController, artifactTypes, LibraryModel, allowedProtocols (+5 more)

### Community 22 - "Git Session Service"
Cohesion: 0.14
Nodes (9): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, assert, createService() (+1 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.17
Nodes (11): recoverableCodes, crypto, rendererAllowedFields, recoverableCodes, recoverableCodes, recoverableCodes, crypto, scopes (+3 more)

### Community 24 - "projectController.js"
Cohesion: 0.15
Nodes (7): createInlineEditableTitle(), missingFolderTabReason, projectTabs, ProjectController, readLastTab(), writeLastTab(), createInlineEditState()

### Community 25 - "createButton"
Cohesion: 0.08
Nodes (23): createButton(), createNoticeBanner(), confirmDialog(), createModal(), typedConfirmDialog(), AgentFileInstallFlow, createParagraph(), CliInstallFlow (+15 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.23
Nodes (3): AgentsMdService, createError(), detectLineEnding()

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.11
Nodes (24): author, dependencies, ajv@8.20.0, dotenv@16.6.1, fflate@0.7.5, highlight.js@11.12.0, marked@18.1.1, marked-highlight@2.2.4 (+16 more)

### Community 29 - "graphifyService.js"
Cohesion: 0.14
Nodes (13): crypto, diffSnapshots(), fs, parseGodNodes(), path, { pathToFileURL }, snapshotTopLevel(), toPublicRuntime() (+5 more)

### Community 30 - "skimaRepositorySource.test.js"
Cohesion: 0.11
Nodes (11): catalogCategories, getSkimaRepositoryConfig(), productionRepository, isSafeTreeEntry(), path, SkimaRepositorySource, assert, commitA (+3 more)

### Community 31 - "DesignSystemGenerator"
Cohesion: 0.05
Nodes (14): DesignSystemGenerator, _resolve_dial(), apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), TestReasoningMatch, read_rows() (+6 more)

### Community 32 - "agentsMdOptimizer.js"
Cohesion: 0.16
Nodes (15): sanitizeAnswers(), AgentsMdOptimizer, boundaryFields, buildPayload(), dataTags, fallbackReasons, isStringArray(), languageInstructions (+7 more)

### Community 33 - "safeArchiveExtractor.js"
Cohesion: 0.22
Nodes (11): ArchiveLimitError, defaultLimits, extractSafely(), fs, isUnsafeRelativePath(), matchesPrefixes(), normalizeEntryPath(), path (+3 more)

### Community 34 - "validate_data.py"
Cohesion: 0.06
Nodes (44): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, TestGeneratedCatalogContract, _catalog_date(), _check_app_interface_contract() (+36 more)

### Community 35 - "ref_node_assert"
Cohesion: 0.12
Nodes (11): assert, simulatedSystems, test, assert, test, assert, fs, listSourceFiles() (+3 more)

### Community 36 - "AgentBridge"
Cohesion: 0.13
Nodes (7): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue

### Community 37 - "executableLocator.js Group"
Cohesion: 0.11
Nodes (12): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+4 more)

### Community 38 - "projectConfigSchema.js"
Cohesion: 0.12
Nodes (26): createDefaultModelRestriction(), createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), restrictionModes, toModelKey() (+18 more)

### Community 39 - "settingsSchema.js"
Cohesion: 0.16
Nodes (15): crypto, fs, createDefaultGraphify(), createDefaultPreferences(), createDefaultPromptLaunch(), createDefaultSettings(), effortLevels, installKinds (+7 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.07
Nodes (46): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+38 more)

### Community 41 - "createContextTab"
Cohesion: 0.18
Nodes (17): createField(), createQuestionStep(), agentsMdQuestions, answerKeys, createContextTab(), createEmptyAnswers(), createParagraph(), languageOptions (+9 more)

### Community 42 - "DetailController"
Cohesion: 0.10
Nodes (16): artifactTypes, findArtifactType(), DetailController, describeManifestIssues(), presentCatalogDetail(), requirementLabels, presentInstallations(), presentInstalledDetail() (+8 more)

### Community 43 - "portableNames.js"
Cohesion: 0.08
Nodes (21): AgentFileInstaller, createInstallError(), findCaseInsensitiveCollision(), getReservedBaseName(), hasControlCharacter(), isPortableName(), pathLengthLimits, toCaseInsensitiveKey() (+13 more)

### Community 44 - "skillFormView.js"
Cohesion: 0.14
Nodes (11): createTextInput(), createFolderInput(), createFormField(), createProjectFormModal(), getFolderName(), createCounter(), createField(), createTextArea() (+3 more)

### Community 46 - "promptRegistry.js Group"
Cohesion: 0.16
Nodes (15): Read-only mode for Claude Code, Third-party skill review procedure, Phase 10: AI skill optimization, Optimization response validation rules, skill-optimize-en prompt, Agent bridge (runAgent and askAi), Cheap model selection, Editor skill creation assistant (+7 more)

### Community 47 - "CliInstaller Group"
Cohesion: 0.18
Nodes (8): CliInstaller, createInstallerError(), crypto, describeStep(), fs, interpreterInvocations, parseMajor(), path

### Community 48 - "agentFileInstaller.js"
Cohesion: 0.12
Nodes (22): yaml@2.9.1, yaml, readDescription(), verifyFileItem(), adaptAgentFile(), buildMarkdown(), formatAdapters, pick() (+14 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.15
Nodes (13): createAppLogo(), createNavItem(), createNavSubItem(), createControlButton(), createWindowControls(), createExpandedNavItem(), createNavEntry(), createNavGroup() (+5 more)

### Community 50 - "agentsSettingsSection.js"
Cohesion: 0.23
Nodes (11): createToggleSwitch(), createPathSettingField(), createToggleRow(), allowedAgentBadges, describeAgentRow(), describeCliMessage(), createAgentsSettingsSection(), createBlockTitle() (+3 more)

### Community 51 - "modelSelector.test.js"
Cohesion: 0.13
Nodes (14): formatPrice(), ModelSelector, classifyModel(), localProviderIds, normalizeCost(), parseJsonBlock(), parseVerboseModels(), perThousandKeys (+6 more)

### Community 52 - "graphifyIntegrationService.js"
Cohesion: 0.17
Nodes (12): createIntegrationError(), crypto, fs, GraphifyIntegrationService, hashText(), ignoredHomePrefixes, integrationVariants, path (+4 more)

### Community 53 - "hookDetailView.js"
Cohesion: 0.11
Nodes (15): createHookChip(), describeHookEvent(), hookEvents, hookEventSides, describeHookType(), hookFormLimits, hookNamePattern, hookTypeOptions (+7 more)

### Community 54 - "design_system.py"
Cohesion: 0.06
Nodes (14): build_design_tokens(), _css_font_family(), _detect_page_type(), format_page_override_md(), format_tokens_dtcg(), _generate_intelligent_overrides(), persist_design_system(), safe_slug() (+6 more)

### Community 55 - "readTextIfExists"
Cohesion: 0.07
Nodes (37): fs, path, applyLineEnding(), createTemporarySiblingPath(), crypto, fs, path, readTextIfExists() (+29 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.17
Nodes (6): createStoreError(), MySkillsStore, hashSkillFolder(), listFiles(), saveDirectly(), skillMarkdown()

### Community 57 - "fakeAgentEnvironment.js"
Cohesion: 0.09
Nodes (23): assert, test, withSetup(), assert, createAskAi(), path, sourceOfTruth, test (+15 more)

### Community 58 - "build Group"
Cohesion: 0.13
Nodes (15): build, appId, asar, directories, extraResources, files, nsis, productName (+7 more)

### Community 59 - "fakeGitTools.js"
Cohesion: 0.16
Nodes (17): args, copyDirectory(), delegateToRealGit(), fs, handleGh(), handleGhExtended(), handleGit(), mapRemote() (+9 more)

### Community 60 - "preview.py"
Cohesion: 0.05
Nodes (27): _button_outline_text_color(), _contrast_ratio(), _palette_is_dark(), _relative_luminance(), _write_persisted_file(), _attr(), _css_color(), _css_font() (+19 more)

### Community 61 - "test_design_system_mode.py"
Cohesion: 0.07
Nodes (16): ansi_ljust(), _filter_anti_patterns_for_mode(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), format_master_md(), hex_to_ansi() (+8 more)

### Community 62 - "search_stack"
Cohesion: 0.07
Nodes (10): _exact_stack_identifier(), _project_row(), search_stack(), _valid_max_results(), TestDiagnosticsContracts, _rows(), TestNativeDesktopStackFreshness, TestTextLayoutRetrieval (+2 more)

### Community 63 - "isPlainObject"
Cohesion: 0.26
Nodes (19): asBoolean(), asEnum(), asHttpsUrl(), asInteger(), asIsoDate(), asText(), asTrimmedString(), isPlainObject() (+11 more)

### Community 64 - "search"
Cohesion: 0.06
Nodes (10): _normalize_rtl_level(), _rtl_row_filter(), search(), _style_search_destination(), TestSearchDomains, TestImeGuidance, read_rows(), RtlDataContractTest (+2 more)

### Community 65 - "AskAi Group"
Cohesion: 0.19
Nodes (7): AskAi, createAskError(), fs, referenceTags, findPrompt(), neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "repositoryDetailsService.test.js"
Cohesion: 0.18
Nodes (10): findReadme(), findSkillManifests(), isMarkdownFile(), path, RepositoryDetailsService, assert, files, repository (+2 more)

### Community 67 - "mainWindow.js"
Cohesion: 0.05
Nodes (38): electron, path, allowedRemotePrefixes, GraphViewerRegistry, graphViewerRegistry, hardenGraphViewerWebview(), isGraphViewerGuest(), normalizeFileUrl() (+30 more)

### Community 68 - "generate_design_system"
Cohesion: 0.08
Nodes (11): _flatten_tokens(), format_tokens_css(), generate_design_system(), _resolve_token_reference(), _root_block(), TestPersistence, DarkModeTokenTest, GenerateTokensRoundTripTest (+3 more)

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.18
Nodes (11): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Branch protection rule for master, CODEOWNERS review, Pull request template, Valid skill rules (+3 more)

### Community 70 - "README.md Group"
Cohesion: 0.14
Nodes (14): Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, JetBrains-style project selector, Left sidebar navigation menu, AGENTS.md project context tab, contextBridge preload, Global and Project views, Install skills and MCP servers to enabled agents (+6 more)

### Community 71 - "ProjectHooksService"
Cohesion: 0.25
Nodes (3): assertHookEvent(), isPlainObject(), ProjectHooksService

### Community 73 - "markdownRenderer.js"
Cohesion: 0.11
Nodes (22): allowedLinkSchemes, convertGitHubBlobToRaw(), createMarked(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl() (+14 more)

### Community 74 - "InstalledScanner"
Cohesion: 0.23
Nodes (5): AgentSettingsService, createFieldError(), editablePathFields, fs, mcpExtensionsByFormat

### Community 75 - "createEmptyState"
Cohesion: 0.09
Nodes (15): createPageHeader(), createTabs(), createEmptyState(), attachLinkHandling(), createMarkdownBody(), createMarkdownViewer(), globalTabs, GlobalController (+7 more)

### Community 76 - "scripts Group"
Cohesion: 0.13
Nodes (15): scripts, catalog:refresh, catalog:validate, catalog:verify, dist, dist:linux, dist:mac, dist:win (+7 more)

### Community 77 - "HookFormView"
Cohesion: 0.21
Nodes (3): createField(), createHint(), HookFormView

### Community 78 - "ProjectHooksView"
Cohesion: 0.20
Nodes (3): ProjectHooksController, createHooksTab(), ProjectHooksView

### Community 79 - "prompts/02_fases_9_10_11.md Group"
Cohesion: 0.17
Nodes (5): electron-builder 26.18.0 choice, WSL not supported, Phase 11: packaging, CI and documentation, GitHub API without token, Skima desktop app

### Community 80 - "Phase 9: skill wizard and Mis skills Group"
Cohesion: 0.18
Nodes (10): Reusable wizard engine, Native folder picker popup with name and path fields, Initial dark first screen with add-project button, proyectos.json project storage file, mySkill installer source, Phase 9: skill wizard and Mis skills, Mis skills (my skills), proyectos.json legacy format (+2 more)

### Community 82 - "fetchUv.js"
Cohesion: 0.17
Nodes (14): crypto, download(), extractFromTarball(), extractFromZip(), fs, fsPromises, main(), os (+6 more)

### Community 83 - "cliInstaller.test.js"
Cohesion: 0.13
Nodes (14): findInstallTarget(), allSystems, assert, emptyAllowed, fakeScript, firstPackageManagerMethod(), fs, hostMethods() (+6 more)

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
Cohesion: 0.14
Nodes (5): createEmptyForm(), mergeDraft(), SkillFormController, ProjectStore, onSettingsClosed()

### Community 94 - "Headless mode Group"
Cohesion: 0.39
Nodes (7): Claude Code CLI, Codex CLI, Gemini CLI, Headless mode, OpenCode CLI, Permission modes, Agent skill locations

### Community 95 - "graphify command Group"
Cohesion: 0.29
Nodes (7): Code-only mode, graphify command, graphify-out folder, graphifyRuntime, graphifyService, graphifyy PyPI package, Pinned graphify version 0.9.105

### Community 96 - "sourceOfTruthDocument.js"
Cohesion: 0.23
Nodes (12): audiences, confidences, countSentences(), documentLimits, indexFileNames, parseSourceOfTruthDocument(), splitSections(), toDateString() (+4 more)

### Community 98 - "BM25"
Cohesion: 0.15
Nodes (4): BM25, _suggest_identities(), TestBm25CoreBehavior, TestTokenizer

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 100 - "agentsMdTemplate.js"
Cohesion: 0.29
Nodes (11): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, missingImportantSections(), normalizeText(), renderAgentsMd(), renderCodeBlock() (+3 more)

### Community 101 - "skillInstaller.test.js"
Cohesion: 0.17
Nodes (13): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib, assert, createInstallerSetup(), createTemporaryDirectory() (+5 more)

### Community 102 - "themeService.js"
Cohesion: 0.28
Nodes (12): defaultThemeId, themes, themeStorageKey, applyTheme(), getActiveThemeId(), isKnownTheme(), syncThemeFromPreferences(), themeListeners (+4 more)

### Community 103 - "agentFileIpcController.js Group"
Cohesion: 0.33
Nodes (4): AgentFileIpcController, scopes, types, validateSource()

### Community 104 - "installedIpcController.js Group"
Cohesion: 0.38
Nodes (3): InstalledIpcController, readScope(), scopes

### Community 105 - "publishIpcController.js Group"
Cohesion: 0.43
Nodes (4): describeError(), PublishIpcController, text(), isGithubUrl()

### Community 107 - "Prompt injection attack forms Group"
Cohesion: 0.33
Nodes (5): Prompt injection attack forms, Delimit untrusted data, Neutralise delimiters, Least privilege execution, Validate output against schema

### Community 108 - "AgentsMdIpcController Group"
Cohesion: 0.40
Nodes (3): AgentsMdIpcController, describeError(), optimizationFrom()

### Community 109 - "sourceOfTruth.test.js"
Cohesion: 0.14
Nodes (16): agentsMdOptimizePrompt, agentsMdOptimizeSchema, stringList, skillCreatePrompt, promptRegistry, checkPromptRegistry(), findWebInstructions(), splitSentences() (+8 more)

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
Cohesion: 0.06
Nodes (51): jsonc-parser@3.3.1, smol-toml@1.9.1, jsonc-parser, smol-toml, configContainsServer(), detectOpenCodeVersion(), jsonc, jsonConfigWriter (+43 more)

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

### Community 128 - "libraryDocumentValidator.js"
Cohesion: 0.22
Nodes (12): Ajv, countByType(), describeSchemaError(), findSemanticErrors(), fs, getValidator(), listItems(), loadSchema() (+4 more)

### Community 129 - "03_editor_skills.md"
Cohesion: 0.25
Nodes (7): Accion, Boton de generar, Editar, Form Response, Instalar, Si no hay una IA configurada, UI

### Community 132 - "skillsSiteView.js"
Cohesion: 0.15
Nodes (8): describeBlockedNavigation(), skillsSite, createOutputBlock(), createParagraph(), describeFailure(), SkillsShInstallFlow, isInstallRequest(), SkillsSiteController

### Community 133 - "libraryDocument.test.js"
Cohesion: 0.14
Nodes (10): providerRegistry, assert, test, assert, fs, path, rootDirectory, sampleDirectory (+2 more)

### Community 136 - "OpenCode version package name split Group"
Cohesion: 0.67
Nodes (3): npm package @opencode/cli, OpenCode v2 install methods, OpenCode version package name split

### Community 137 - "Skill description field Group"
Cohesion: 0.67
Nodes (3): Description checklist, Skill description field, Use when clause

### Community 159 - "Navegador lateral"
Cohesion: 0.10
Nodes (19): Accion, Ajustes por prompt, Configuracion, Configuracion de temas, Editor, Global, Marketplace, Memorias (+11 more)

### Community 160 - "importedSkillSource.js"
Cohesion: 0.21
Nodes (5): fs, ImportedSkillSource, path, assertNoEscapingLinks(), GitHubSkillSource

### Community 161 - "graphifyRuntime.js"
Cohesion: 0.21
Nodes (8): buildGraphifyEnvironment(), fs, createStatus(), fs, graphifyCommands, graphifyPackage, outputFiles, resolveExecutableRelativePath()

### Community 162 - "AllSkillsController"
Cohesion: 0.12
Nodes (9): AllSkillsController, createEmptyForm(), HookFormController, toModelName(), collectHashes(), describeScanLocation(), mergeSkillsByLocation(), mergeUnique() (+1 more)

### Community 163 - "graphifyIntegration.test.js"
Cohesion: 0.10
Nodes (19): appendGraphifySection(), extractGraphifySection(), args, fs, path, tool, args, fs (+11 more)

### Community 164 - "httpResponseCache.js"
Cohesion: 0.24
Nodes (5): crypto, fs, hashKey(), HttpResponseCache, path

### Community 165 - "skillsSitePreload.js"
Cohesion: 0.33
Nodes (10): applyLayout(), clearPreviousChanges(), createInstallCard(), ensureStyles(), findInstallCommand(), hideRelatedSections(), { ipcRenderer }, placeInstallCard() (+2 more)

### Community 166 - "LibraryService"
Cohesion: 0.23
Nodes (5): LibraryService, toImportedListItem(), toRepositoryUrl(), buildGithubUrl(), toListItem()

### Community 167 - "Editor"
Cohesion: 0.18
Nodes (10): Accion, Agent, Command, Como funcionan, Editor, Global, Internamente, Prompt (+2 more)

### Community 169 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (18): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+10 more)

### Community 170 - "_select_palette_for_mode"
Cohesion: 0.29
Nodes (3): _derive_dark_palette(), _select_palette_for_mode(), TestPaletteSelection

### Community 172 - "05_graphify.md"
Cohesion: 0.22
Nodes (8): Accion, Botones "Abrir...", Configuracion, Deteccion de graphify, Generar el grafo, Gitignore, Instalación de graphify, Verificado de funcionamiento

### Community 173 - "publishedSkillsStore.js"
Cohesion: 0.24
Nodes (7): asDate(), asText(), isRecord(), phases, PublishedSkillsStore, sanitizeEntry(), states

### Community 174 - "SourceOfTruth"
Cohesion: 0.17
Nodes (9): nodePath, resolveBundledResourceDirectory(), documentOpening(), fs, path, resolveSourceOfTruthDirectory(), SourceOfTruth, SourceOfTruthError (+1 more)

### Community 175 - "sourceOfTruthTasks.js"
Cohesion: 0.27
Nodes (12): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+4 more)

### Community 176 - "04_add_vercel_skills.md"
Cohesion: 0.50
Nodes (3): Accion, Instalar, UI

### Community 182 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 183 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 184 - "installedScanner.test.js"
Cohesion: 0.25
Nodes (5): assert, fs, os, path, test

### Community 185 - "linux"
Cohesion: 0.40
Nodes (5): linux, category, icon, maintainer, target

### Community 187 - "07_new_ui_2.md"
Cohesion: 0.17
Nodes (11): Accion, Aplicar skill de ui-ux-pro-max, Barra de scroll, Botones objetibo, Dropdowns, Estandares, Marketplace, Mensajes de cargando (+3 more)

### Community 188 - "graphify.test.js"
Cohesion: 0.25
Nodes (8): assert, createExecutable(), createFixture(), fakeScript, fs, os, path, test

### Community 189 - "test_skill_script_paths.py"
Cohesion: 0.38
Nodes (3): resolve(), shipped_invocations(), SkillScriptPathsTest

### Community 190 - "importer.test.js"
Cohesion: 0.20
Nodes (15): cleanSegments(), failure(), parseHttps(), parseRepositoryUrl(), parseSsh(), stoppingSegments, validateSegments(), assert (+7 more)

### Community 193 - "envRowsDraft.js"
Cohesion: 0.36
Nodes (5): buildChanges(), createEmptyRow(), createRowId(), createRowsFromEntries(), isRowDirty()

### Community 194 - "mac"
Cohesion: 0.40
Nodes (5): mac, category, icon, identity, target

### Community 197 - "modelRestrictionDraft.js"
Cohesion: 0.46
Nodes (6): buildModelGroups(), getActiveListName(), isEntrySelected(), restrictionModeOptions, toggleEntry(), toKey()

### Community 198 - "electron"
Cohesion: 0.29
Nodes (6): devDependencies, electron@^45.0.0, electron-builder@26.18.0, electron, electron-builder, { contextBridge, ipcRenderer }

### Community 199 - "artifacts/artifactTypes.js"
Cohesion: 0.50
Nodes (3): artifactTypeDefinitions, findArtifactTypeDefinition(), listAgentsSupportingType()

### Community 201 - "createAppContainer"
Cohesion: 0.07
Nodes (11): createAppContainer(), resolveCatalogDirectory(), CatalogIpcController, DialogIpcController, LinkIpcController, ProfileIpcController, ProjectIpcController, SettingsIpcController (+3 more)

## Ambiguous Edges - Review These
- `Codex standalone installer` → `Codex Windows install not confirmed`  [AMBIGUOUS]
  source-of-truth/install-codex-cli.md · relation: conceptually_related_to
- `docs/plan-pendiente.md` → `Gemini CLI agent`  [AMBIGUOUS]
  docs/plan-pendiente.md · relation: references

## Knowledge Gaps
- **87 isolated node(s):** `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit`, `Gemini context fileName setting`, `Nearest file takes precedence` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1241 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Configuration sections` connect `README.md Group` to `showToast`?**
  _High betweenness centrality (0.280) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Provider registry (adding an agent)` connect `Unverified or low-confidence provider registry rows Group` to `README.md Group`, `providerRegistry.js`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._