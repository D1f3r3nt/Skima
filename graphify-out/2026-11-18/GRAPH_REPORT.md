# Graph Report - Skima  (2026-11-18)

## Corpus Check
- 420 files · ~334,202 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 51 file(s) not represented in the graph (top: .csv 37, .css 8, (none) 3)

## Summary
- 3796 nodes · 8672 edges · 203 communities (144 shown, 59 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 360 edges (avg confidence: 0.85)
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
- MemoryStorage
- platformPaths.js
- .unwrap
- RepositoryImporter
- createIcon
- Form Controls (Select, Radio)
- importer.test.js
- importedDetailsService.js
- providerRegistry.js
- CLI Install Recipes
- envFileService.js
- createButton
- Bootstrap & Brand Icon
- mySkills.test.js
- appContainer.js
- Git Session Service
- IPC Controllers (AGENTS, AI, Catalog)
- Installed Skills Controller
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
- settingsSections.test.js
- settingsSchema.js
- executableLocator.js Group
- projectConfigSchema.js
- fakeGitEnvironment.js
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
- ref_node_fs
- design_system.py
- readTextIfExists
- MySkillsStore Group
- fakeAgentEnvironment.js Group
- build Group
- mcpDefinitionDetector.js
- preview.py
- test_design_system_mode.py
- search_stack
- ProviderPathResolver
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
- InstalledSkillsController Group
- scripts Group
- SkillInstallFlow
- cliInstaller.test.js
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
- themeService.js
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
- skillInstaller.test.js
- promptLaunchSettingsSection.js
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
- graphify.test.js
- AllSkillsController
- graphifyIntegration.test.js
- httpResponseCache.js
- skillsSitePreload.js
- .showVariants
- fakeGitTools.js
- test_relevance_evaluator.py
- UI/UX Pro Max - Design Intelligence
- skillsSiteGuard.js
- CatalogRefreshTest
- 05_graphify.md
- publishedSkillsStore.js
- detect_domain
- sourceOfTruthTasks.js
- 04_add_vercel_skills.md
- GraphifyIpcController
- ImportIpcController
- SkillsSiteIpcController
- modelRestriction.js
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- McpInstaller
- mcpConfigWriters.js
- _normalize
- 07_new_ui_2.md
- AgentFileInstallFlow
- test_skill_script_paths.py
- _row_identities
- CatalogSummaryLineEndingsTest
- TokenCliTest
- read_rows
- GraphViewerRegistry
- TestStackFlagWithDesignSystem
- RtlCliTest
- TestTextLayoutDataContracts
- LibraryModel
- _flatten_tokens
- TestImeGuidance
- ProjectIpcController

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 135 edges
2. `createButton()` - 98 edges
3. `createAppContainer()` - 95 edges
4. `createNoticeBanner()` - 61 edges
5. `search()` - 54 edges
6. `showToast()` - 53 edges
7. `createIcon()` - 49 edges
8. `executeSafely()` - 47 edges
9. `createPlatformPaths()` - 45 edges
10. `DesignSystemGenerator` - 38 edges

## Surprising Connections (you probably didn't know these)
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `createInstaller()` --calls--> `SkillsShInstaller`  [EXTRACTED]
  test/skillsSite/skillsSite.test.js → src/core/main/skillsSite/skillsShInstaller.js
- `createFixture()` --calls--> `RepositoryImporter`  [EXTRACTED]
  test/imports/importer.test.js → src/core/main/imports/repositoryImporter.js

## Import Cycles
- 4-file cycle: `src/core/renderer/config/settingsSections.js -> src/core/renderer/settings/graphifySettingsSection.js -> src/core/renderer/controllers/mcpInstallFlow.js -> src/core/renderer/services/settingsModalService.js -> src/core/renderer/config/settingsSections.js`

## Hyperedges (group relationships)
- **Skill security review pipeline** — source_of_truth_skill_security_review_severity_rubric, source_of_truth_skill_security_review_instruction_risk_signals, source_of_truth_skill_security_review_script_risk_signals, source_of_truth_skill_security_review_supply_chain_risks [EXTRACTED 1.00]
- **catalogSample skill fixtures used for skill discovery tests** — test_fixtures_catalogsample_skills_mismatch_skill, test_fixtures_catalogsample_skills_no_manifest_readme, test_fixtures_catalogsample_skills_pdf_skill [INFERRED 0.75]
- **Catalog verification and library display** — catalog_verification_report, docs_plan_pendiente_catalog_scale, readme_biblioteca, readme_item_detail [INFERRED 0.75]
- **Skill install and management flow** — readme_install_flow, readme_installed_scanner, docs_decisiones_shared_skill_folder, docs_decisiones_trash_uninstall, readme_mis_skills [INFERRED 0.75]
- **Untrusted input defences** — source_of_truth_untrusted_content_and_prompt_injection_delimit_untrusted_data, source_of_truth_untrusted_content_and_prompt_injection_delimiter_neutralisation, source_of_truth_untrusted_content_and_prompt_injection_least_privilege_execution, source_of_truth_untrusted_content_and_prompt_injection_output_validation_rule, source_of_truth_untrusted_content_and_prompt_injection_fail_open_fallback [INFERRED 0.75]
- **AI skill optimization pipeline** — readme_skill_optimization, readme_agent_bridge, prompts_02_fases_9_10_11_skill_optimize_en, prompts_02_fases_9_10_11_skill_optimization_validation, docs_decisiones_optimization_integrity, readme_source_of_truth [INFERRED 0.85]

## Communities (203 total, 59 thin omitted)

### Community 0 - "Catalog Service"
Cohesion: 0.06
Nodes (25): catalogQueries, crawlLimits, CatalogService, createEmptySnapshot(), parseGitHubUrl(), toCatalogRepository(), toRepositoryKey(), catalogTypes (+17 more)

### Community 1 - "projectDataStore.test.js"
Cohesion: 0.13
Nodes (11): createDefaultProjectConfig(), sanitizeProjectConfig(), fs, ProjectDataStore, createProject(), assert, createStore(), fs (+3 more)

### Community 2 - "catalogTasks.js"
Cohesion: 0.05
Nodes (42): buildReport(), candidatesPath, catalogDirectory, commands, discardsPath, fs, fsPromises, libraryPath (+34 more)

### Community 3 - "skillPublisher.test.js"
Cohesion: 0.09
Nodes (30): allowedExtensions, buildPullRequestBody(), checkFile(), collectFiles(), forbiddenNamePatterns, fs, inspectSkillFolder(), isHiddenSegment() (+22 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.19
Nodes (16): clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks(), scoreIssues() (+8 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.12
Nodes (16): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), importantSectionLabels, secretRules, answers, assert (+8 more)

### Community 6 - "MemoryStorage"
Cohesion: 0.13
Nodes (9): MemoryStorage, assert, createModel(), test, assert, fs, os, path (+1 more)

### Community 7 - "platformPaths.js"
Cohesion: 0.06
Nodes (32): createPlatformPaths(), nodePath, os, supportedPlatforms, findProvider(), assert, createFixture(), fs (+24 more)

### Community 10 - "RepositoryImporter"
Cohesion: 0.13
Nodes (10): createImportError(), crypto, fs, getDirectorySize(), path, redactUrls(), RepositoryImporter, retryRename() (+2 more)

### Community 11 - "createIcon"
Cohesion: 0.08
Nodes (36): createAvatar(), getInitials(), getToneIndex(), createBadge(), createButton(), createIcon(), iconPaths, createChoiceCardGroup() (+28 more)

### Community 12 - "Form Controls (Select, Radio)"
Cohesion: 0.10
Nodes (24): variantIcons, showToast(), variantIcons, createSteppedModal(), settingsSectionIds, resultLabels, statusLabels, typeNames (+16 more)

### Community 13 - "importer.test.js"
Cohesion: 0.20
Nodes (15): cleanSegments(), failure(), parseHttps(), parseRepositoryUrl(), parseSsh(), stoppingSegments, validateSegments(), assert (+7 more)

### Community 14 - "importedDetailsService.js"
Cohesion: 0.27
Nodes (5): fs, ImportedDetailsService, path, readmeNames, toMcpCandidate()

### Community 15 - "providerRegistry.js"
Cohesion: 0.05
Nodes (44): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, claudeCodeCli (+36 more)

### Community 16 - "CLI Install Recipes"
Cohesion: 0.09
Nodes (17): brewRequirement, claudeCodeInstall, codexInstall, geminiCliInstall, githubCliInstall, githubCliTool, installRecipes, npmRequirement (+9 more)

### Community 17 - "envFileService.js"
Cohesion: 0.09
Nodes (32): applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace(), listEntries(), listKeysOnly() (+24 more)

### Community 18 - "createButton"
Cohesion: 0.19
Nodes (15): createModal(), typedConfirmDialog(), createGraphifyActions(), createHealthIndicator(), createTooltipButton(), graphTooltipText, openGraphReport(), openGraphViewer() (+7 more)

### Community 19 - "Bootstrap & Brand Icon"
Cohesion: 0.07
Nodes (36): Skima app icon (skima.png), Skima brand identity (S-mark logo), createPageHeader(), confirmDialog(), bootstrapPage(), settingsSections, ProjectsController, ShellController (+28 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.07
Nodes (45): fflate, path, path, fs, fs, scanLimits, crypto, fileLimits (+37 more)

### Community 21 - "appContainer.js"
Cohesion: 0.05
Nodes (22): createAppContainer(), fileNames, fs, path, resolveCatalogDirectory(), CatalogIpcController, DialogIpcController, LibraryIpcController (+14 more)

### Community 22 - "Git Session Service"
Cohesion: 0.14
Nodes (9): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, assert, createService() (+1 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.18
Nodes (11): recoverableCodes, crypto, rendererAllowedFields, recoverableCodes, recoverableCodes, recoverableCodes, crypto, scopes (+3 more)

### Community 24 - "Installed Skills Controller"
Cohesion: 0.15
Nodes (7): createInlineEditableTitle(), missingFolderTabReason, projectTabs, ProjectController, readLastTab(), writeLastTab(), createInlineEditState()

### Community 25 - "createNoticeBanner"
Cohesion: 0.13
Nodes (23): createNoticeBanner(), createLabeledField(), createParagraph(), PublishFlow, createEnvironmentTab(), createModelRestrictionBlock(), loadAgentsWithModels(), createSettingsTab() (+15 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.21
Nodes (3): AgentsMdService, createError(), validateAgentsMd()

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.08
Nodes (32): author, dependencies, ajv@8.20.0, dotenv@16.6.1, fflate@0.7.5, highlight.js@11.12.0, jsonc-parser@3.3.1, marked@18.1.1 (+24 more)

### Community 29 - "graphifyService.js"
Cohesion: 0.13
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
Cohesion: 0.10
Nodes (18): ArchiveLimitError, assertNoEscapingLinks(), defaultLimits, extractSafely(), fs, isUnsafeRelativePath(), matchesPrefixes(), normalizeEntryPath() (+10 more)

### Community 34 - "validate_data.py"
Cohesion: 0.07
Nodes (43): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+35 more)

### Community 35 - "settingsSections.test.js"
Cohesion: 0.22
Nodes (6): assert, fs, listSourceFiles(), path, rootDirectory, test

### Community 36 - "settingsSchema.js"
Cohesion: 0.06
Nodes (41): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue, fs (+33 more)

### Community 37 - "executableLocator.js Group"
Cohesion: 0.11
Nodes (12): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+4 more)

### Community 38 - "projectConfigSchema.js"
Cohesion: 0.20
Nodes (18): createDefaultModelRestriction(), restrictionModes, asIsoDate(), asShortText(), graphifyDecisions, isPlainObject(), migrateProjectConfig(), projectConfigLimits (+10 more)

### Community 39 - "fakeGitEnvironment.js"
Cohesion: 0.12
Nodes (16): escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn }, windowsShimExtensions (+8 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.14
Nodes (24): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+16 more)

### Community 41 - "createContextTab"
Cohesion: 0.16
Nodes (18): createField(), createQuestionStep(), agentsMdQuestions, answerKeys, createContextTab(), createEmptyAnswers(), createParagraph(), languageOptions (+10 more)

### Community 42 - "DetailController"
Cohesion: 0.07
Nodes (17): artifactTypes, findArtifactType(), DetailController, ProjectStore, describeManifestIssues(), presentCatalogDetail(), requirementLabels, presentInstallations() (+9 more)

### Community 43 - "skillInstaller.js"
Cohesion: 0.11
Nodes (14): crypto, validatePathLength(), InstalledDetailsService, crypto, defaultHashLimits, fs, hashSkillFolder(), listFiles() (+6 more)

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
Cohesion: 0.09
Nodes (29): yaml, readDescription(), verifyFileItem(), adaptAgentFile(), buildMarkdown(), formatAdapters, pick(), YAML (+21 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.16
Nodes (10): createAppLogo(), createNavItem(), createControlButton(), createWindowControls(), createNavGroup(), createSidebar(), createTitleBar(), createAppShell() (+2 more)

### Community 50 - "skillWizardView.js Group"
Cohesion: 0.16
Nodes (15): createToggleSwitch(), createPathSettingField(), createToggleRow(), CliInstallFlow, createCodeBlock(), createParagraph(), unwrap(), allowedAgentBadges (+7 more)

### Community 51 - "modelSelector.test.js"
Cohesion: 0.13
Nodes (14): formatPrice(), ModelSelector, classifyModel(), localProviderIds, normalizeCost(), parseJsonBlock(), parseVerboseModels(), perThousandKeys (+6 more)

### Community 52 - "graphifyIntegrationService.js"
Cohesion: 0.16
Nodes (12): createIntegrationError(), crypto, fs, GraphifyIntegrationService, hashText(), ignoredHomePrefixes, integrationVariants, path (+4 more)

### Community 53 - "ref_node_fs"
Cohesion: 0.07
Nodes (32): fs, hardPatterns, path, scanFiles(), scannedExtensions, softPatterns, folderLimits, fs (+24 more)

### Community 54 - "design_system.py"
Cohesion: 0.07
Nodes (13): _detect_page_type(), format_page_override_md(), format_tokens_dtcg(), _generate_intelligent_overrides(), persist_design_system(), safe_slug(), _write_persisted_file(), preview_destination() (+5 more)

### Community 55 - "readTextIfExists"
Cohesion: 0.12
Nodes (19): createTemporarySiblingPath(), crypto, detectLineEnding(), fs, path, readTextIfExists(), appendPattern(), assertRegularFileOrMissing() (+11 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.20
Nodes (5): writeFileAtomic(), createStoreError(), MySkillsStore, saveDirectly(), skillMarkdown()

### Community 57 - "fakeAgentEnvironment.js Group"
Cohesion: 0.06
Nodes (31): providerRegistry, assert, test, withSetup(), assert, test, assert, createAskAi() (+23 more)

### Community 58 - "build Group"
Cohesion: 0.08
Nodes (25): build, appId, asar, directories, extraResources, files, linux, mac (+17 more)

### Community 59 - "mcpDefinitionDetector.js"
Cohesion: 0.27
Nodes (17): dedupeCandidates(), detectMcpDefinitions(), extractCodeBlocks(), fromClaudeAddCommand(), fromConfigObject(), fromPackageJson(), fromPyproject(), fromReadme() (+9 more)

### Community 60 - "preview.py"
Cohesion: 0.06
Nodes (22): _button_outline_text_color(), _contrast_ratio(), format_master_md(), _attr(), _css_color(), _css_font(), format_preview_html(), _format_ratio() (+14 more)

### Community 61 - "test_design_system_mode.py"
Cohesion: 0.07
Nodes (13): _derive_dark_palette(), _filter_anti_patterns_for_mode(), _palette_is_dark(), _query_wants_dark(), _relative_luminance(), _resolve_color_mode(), _select_palette_for_mode(), _style_is_dark_primary() (+5 more)

### Community 62 - "search_stack"
Cohesion: 0.08
Nodes (8): _exact_stack_identifier(), search_stack(), TestDiagnosticsContracts, _rows(), TestNativeDesktopStackFreshness, TestTextLayoutRetrieval, _rows(), TestWebStackFreshness

### Community 64 - "search"
Cohesion: 0.08
Nodes (7): _normalize_rtl_level(), _rtl_row_filter(), search(), _style_search_destination(), TestSearchDomains, RtlFilterTest, TestStyleTaxonomy

### Community 65 - "AskAi Group"
Cohesion: 0.20
Nodes (6): AskAi, createAskError(), fs, referenceTags, neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "repositoryDetailsService.test.js"
Cohesion: 0.18
Nodes (9): findReadme(), findSkillManifests(), isMarkdownFile(), RepositoryDetailsService, assert, files, repository, test (+1 more)

### Community 67 - "skillsSite.test.js"
Cohesion: 0.18
Nodes (12): buildCliArguments(), cliAgentIdOverrides, createCodedError(), scopes, SkillsShInstaller, stripAnsi(), toCliAgentId(), validateTarget() (+4 more)

### Community 68 - "generate_design_system"
Cohesion: 0.08
Nodes (12): build_design_tokens(), _css_font_family(), format_tokens_css(), generate_design_system(), _root_block(), _token_color_entries(), TestPersistence, DarkModeTokenTest (+4 more)

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.18
Nodes (11): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Branch protection rule for master, CODEOWNERS review, Pull request template, Valid skill rules (+3 more)

### Community 70 - "README.md Group"
Cohesion: 0.14
Nodes (14): Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, JetBrains-style project selector, Left sidebar navigation menu, AGENTS.md project context tab, contextBridge preload, Global and Project views, Install skills and MCP servers to enabled agents (+6 more)

### Community 71 - "mainWindow.js"
Cohesion: 0.12
Nodes (19): electron, path, electron, allowedRemotePrefixes, graphViewerRegistry, hardenGraphViewerWebview(), isGraphViewerGuest(), appIconPath (+11 more)

### Community 73 - "markdownRenderer.js"
Cohesion: 0.11
Nodes (22): allowedLinkSchemes, convertGitHubBlobToRaw(), createMarked(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl() (+14 more)

### Community 74 - "InstalledScanner"
Cohesion: 0.14
Nodes (11): AgentSettingsService, createFieldError(), editablePathFields, fs, mcpExtensionsByFormat, assert, createService(), fs (+3 more)

### Community 75 - "InstalledSkillsController Group"
Cohesion: 0.17
Nodes (5): createText(), InstalledAgentFilesController, sectionDefinitions, InstalledSkillsController, createSkillsTab()

### Community 76 - "scripts Group"
Cohesion: 0.13
Nodes (15): scripts, catalog:refresh, catalog:validate, catalog:verify, dist, dist:linux, dist:mac, dist:win (+7 more)

### Community 77 - "SkillInstallFlow"
Cohesion: 0.38
Nodes (3): createCheckboxList(), createParagraph(), SkillInstallFlow

### Community 78 - "cliInstaller.test.js"
Cohesion: 0.13
Nodes (14): findInstallTarget(), allSystems, assert, emptyAllowed, fakeScript, firstPackageManagerMethod(), fs, hostMethods() (+6 more)

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

### Community 90 - "themeService.js"
Cohesion: 0.10
Nodes (19): defaultThemeId, themes, themeStorageKey, alphaScale, buildSkillsSiteThemeCss(), grayScale, mix(), readThemeColors() (+11 more)

### Community 91 - "core.py"
Cohesion: 0.11
Nodes (15): _contains_phrase(), _domain_keywords(), _file_signature(), _load_csv(), _load_csv_snapshot(), _load_product_keywords(), _load_rows_or_empty(), _passes_threshold() (+7 more)

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
Nodes (20): nodePath, resolveBundledResourceDirectory(), documentOpening(), fs, path, SourceOfTruth, SourceOfTruthError, audiences (+12 more)

### Community 98 - "BM25"
Cohesion: 0.14
Nodes (5): BM25, _get_bm25(), _suggest_identities(), TestBm25CoreBehavior, TestTokenizer

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 100 - "agentsMdTemplate.js"
Cohesion: 0.28
Nodes (12): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, listEnglishHeadings(), missingImportantSections(), normalizeText(), renderAgentsMd() (+4 more)

### Community 101 - "skillInstaller.test.js"
Cohesion: 0.17
Nodes (13): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib, assert, createInstallerSetup(), createTemporaryDirectory() (+5 more)

### Community 102 - "promptLaunchSettingsSection.js"
Cohesion: 0.24
Nodes (17): createSelectInput(), createRadioGroup(), createPromptLaunchSettingsSection(), permissionOptions, workingDirectoryOptions, createPromptOverridesSettingsSection(), describeRecommendation(), emptyOverride (+9 more)

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
Cohesion: 0.13
Nodes (17): agentsMdOptimizePrompt, agentsMdOptimizeSchema, stringList, skillCreatePrompt, findPrompt(), promptRegistry, checkPromptRegistry(), findWebInstructions() (+9 more)

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
Cohesion: 0.13
Nodes (21): detectOpenCodeVersion(), tomlConfigWriter, buildEnvironmentObject(), buildServerEntry(), dangerousPatterns, findDangerousPatterns(), maskSecrets(), validateDefinition() (+13 more)

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
Cohesion: 0.13
Nodes (9): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), hex_to_ansi(), _mode_support_labels(), section_header() (+1 more)

### Community 159 - "Navegador lateral"
Cohesion: 0.10
Nodes (19): Accion, Ajustes por prompt, Configuracion, Configuracion de temas, Editor, Global, Marketplace, Memorias (+11 more)

### Community 160 - "portableNames.js"
Cohesion: 0.16
Nodes (13): executeWithCode(), MySkillsIpcController, findCaseInsensitiveCollision(), getReservedBaseName(), hasControlCharacter(), isPortableName(), pathLengthLimits, validatePortableName() (+5 more)

### Community 161 - "graphify.test.js"
Cohesion: 0.14
Nodes (16): buildGraphifyEnvironment(), createInstallerError(), fs, createStatus(), fs, graphifyCommands, graphifyPackage, outputFiles (+8 more)

### Community 162 - "AllSkillsController"
Cohesion: 0.20
Nodes (6): AllSkillsController, collectHashes(), describeScanLocation(), mergeSkillsByLocation(), mergeUnique(), sortByFavorites()

### Community 163 - "graphifyIntegration.test.js"
Cohesion: 0.13
Nodes (16): crypto, fs, hashText(), path, appendGraphifySection(), extractGraphifySection(), assert, createFixture() (+8 more)

### Community 164 - "httpResponseCache.js"
Cohesion: 0.24
Nodes (5): crypto, fs, hashKey(), HttpResponseCache, path

### Community 165 - "skillsSitePreload.js"
Cohesion: 0.33
Nodes (10): applyLayout(), clearPreviousChanges(), createInstallCard(), ensureStyles(), findInstallCommand(), hideRelatedSections(), { ipcRenderer }, placeInstallCard() (+2 more)

### Community 166 - ".showVariants"
Cohesion: 0.38
Nodes (4): createLines(), createParagraph(), GraphifyIntegrationDialog, unwrap()

### Community 167 - "fakeGitTools.js"
Cohesion: 0.16
Nodes (17): args, copyDirectory(), delegateToRealGit(), fs, handleGh(), handleGhExtended(), handleGit(), mapRemote() (+9 more)

### Community 168 - "test_relevance_evaluator.py"
Cohesion: 0.12
Nodes (3): TestFixtureValidation, TestMetricMath, TestThresholdGate

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

### Community 175 - "sourceOfTruthTasks.js"
Cohesion: 0.27
Nodes (12): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+4 more)

### Community 176 - "04_add_vercel_skills.md"
Cohesion: 0.50
Nodes (3): Accion, Instalar, UI

### Community 181 - "modelRestriction.js"
Cohesion: 0.27
Nodes (8): createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), toModelKey(), ProjectModelPolicy, toModelName()

### Community 182 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 183 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 185 - "mcpConfigWriters.js"
Cohesion: 0.22
Nodes (8): configContainsServer(), jsonc, jsonConfigWriter, parseJsonText(), readPath(), serverContainerPaths, TOML, applyLineEnding()

### Community 186 - "_normalize"
Cohesion: 0.22
Nodes (5): _exact_match_diagnostic(), _legacy_successor_guidance(), _normalize(), _stack_query_requests_legacy(), _stack_row_filter()

### Community 187 - "07_new_ui_2.md"
Cohesion: 0.20
Nodes (9): Accion, Aplicar skill de ui-ux-pro-max, Barra de scroll, Botones objetibo, Dropdowns, Estandares, Mensajes de cargando, Pagina de detalle de proyectos (+1 more)

### Community 189 - "test_skill_script_paths.py"
Cohesion: 0.38
Nodes (3): resolve(), shipped_invocations(), SkillScriptPathsTest

### Community 190 - "_row_identities"
Cohesion: 0.33
Nodes (3): _exact_row_identity(), _row_identities(), _style_identity()

## Ambiguous Edges - Review These
- `Codex standalone installer` → `Codex Windows install not confirmed`  [AMBIGUOUS]
  source-of-truth/install-codex-cli.md · relation: conceptually_related_to
- `docs/plan-pendiente.md` → `Gemini CLI agent`  [AMBIGUOUS]
  docs/plan-pendiente.md · relation: references

## Knowledge Gaps
- **87 isolated node(s):** `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit`, `Gemini context fileName setting`, `Nearest file takes precedence` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Configuration sections` connect `README.md Group` to `promptLaunchSettingsSection.js`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Provider registry (adding an agent)` connect `Unverified or low-confidence provider registry rows Group` to `README.md Group`, `providerRegistry.js`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._