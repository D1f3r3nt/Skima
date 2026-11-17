# Graph Report - Skima  (2026-11-17)

## Corpus Check
- 361 files · ~175,808 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 8, (none) 3, .ico 1)

## Summary
- 2997 nodes · 7039 edges · 163 communities (120 shown, 43 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 301 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7cf5933f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Catalog Service
- mcpInstall.test.js
- Catalog Tasks & Reports
- Skill Folder Validation & Publish
- repositoryScore.js
- agentsMd.test.js
- MemoryStorage
- UI Atoms (Button, Status Bar)
- Project & AI Controllers
- RepositoryImporter
- createIcon
- Form Controls (Select, Radio)
- importer.test.js
- Skill Folder Validator
- providerRegistry.js
- CLI Install Recipes
- Library Filters & Categories
- createNoticeBanner
- Bootstrap & Brand Icon
- mySkills.test.js
- appContainer.js
- Git Session Service
- IPC Controllers (AGENTS, AI, Catalog)
- Installed Skills Controller
- modelRestrictionBlock.js
- agentsMdService.js
- with Group
- package.json Group
- installedScanner.test.js
- skimaRepositorySource.test.js
- gitignoreEditor.js
- agentsMdOptimizer.js
- safeArchiveExtractor.js
- createPlatformPaths
- ref_node_assert Group
- AgentBridge Group
- executableLocator.js Group
- projectDataStore.test.js Group
- ref_node_path
- catalogMaintenance.js Group
- contextTab.js Group
- DetailController
- mySkillsStore.js
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
- settingsSchema.js Group
- writeFileAtomic
- MySkillsStore Group
- fakeAgentEnvironment.js Group
- build Group
- mcpDefinitionDetector.js
- libraryDocument.test.js
- mySkillsIpcController.js
- modelRestriction.test.js
- ProviderPathResolver Group
- McpInstaller
- AskAi Group
- repositoryDetailsService.test.js
- projectConfigSchema.js
- ImportFlow Group
- docs/plan-pendiente.md Group
- README.md Group
- mainWindow.js Group
- ref_node_fs
- markdownRenderer.js
- InstalledScanner
- InstalledSkillsController Group
- scripts Group
- EnvFileService Group
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
- PromptLaunchSettingsService Group
- showToast
- opencodeModelsVerbose.txt fixture (model catalog dump Group
- SkillFormController
- Headless mode Group
- graphify command Group
- sourceOfTruth.test.js
- GitToolchain
- ProjectStore Group
- CLAUDE.md Group
- agentsMdTemplate.js
- skillInstaller.test.js
- importedSkillSource.js
- agentFileIpcController.js Group
- installedIpcController.js Group
- publishIpcController.js Group
- SkillUninstaller Group
- Prompt injection attack forms Group
- AgentsMdIpcController Group
- repositoryImporter.js
- InstalledScanner
- AGENTS.md format Group
- Eight-section AGENTS.md template Group
- Skill security severity rubric Group
- Skill publishing flow with gh and git Group
- SettingsStore
- mcpConfigWriters.js
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
- environmentTab.js
- 03_editor_skills.md
- LibraryModel
- InstallerIpcController Group
- McpIpcController
- ProjectIpcController Group
- repositoryUrl.js
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
- ExternalLinkService
- GraphifyInstaller
- WindowIpcController
- InstalledDetailsService
- portableNames.js
- projectModel.js
- settingsMigrations.js

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 124 edges
2. `createButton()` - 105 edges
3. `createAppContainer()` - 89 edges
4. `createNoticeBanner()` - 64 edges
5. `showToast()` - 50 edges
6. `createIcon()` - 49 edges
7. `createPlatformPaths()` - 45 edges
8. `executeSafely()` - 43 edges
9. `createBadge()` - 40 edges
10. `writeFileAtomic()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `withOptimizer()` --calls--> `AskAi`  [EXTRACTED]
  test/agentsMd/agentsMd.test.js → src/core/main/agentBridge/askAi.js
- `withCreator()` --calls--> `AskAi`  [EXTRACTED]
  test/skills/mySkills.test.js → src/core/main/agentBridge/askAi.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Skill security review pipeline** — source_of_truth_skill_security_review_severity_rubric, source_of_truth_skill_security_review_instruction_risk_signals, source_of_truth_skill_security_review_script_risk_signals, source_of_truth_skill_security_review_supply_chain_risks [EXTRACTED 1.00]
- **catalogSample skill fixtures used for skill discovery tests** — test_fixtures_catalogsample_skills_mismatch_skill, test_fixtures_catalogsample_skills_no_manifest_readme, test_fixtures_catalogsample_skills_pdf_skill [INFERRED 0.75]
- **Catalog verification and library display** — catalog_verification_report, docs_plan_pendiente_catalog_scale, readme_biblioteca, readme_item_detail [INFERRED 0.75]
- **Skill install and management flow** — readme_install_flow, readme_installed_scanner, docs_decisiones_shared_skill_folder, docs_decisiones_trash_uninstall, readme_mis_skills [INFERRED 0.75]
- **Skima pages share one HTML shell (#app root, #toastContainer, module script)** — src_pages_detail, src_pages_editor, src_pages_global, src_pages_library, src_pages_myskills, src_pages_project, src_pages_projects [INFERRED 0.75]
- **Untrusted input defences** — source_of_truth_untrusted_content_and_prompt_injection_delimit_untrusted_data, source_of_truth_untrusted_content_and_prompt_injection_delimiter_neutralisation, source_of_truth_untrusted_content_and_prompt_injection_least_privilege_execution, source_of_truth_untrusted_content_and_prompt_injection_output_validation_rule, source_of_truth_untrusted_content_and_prompt_injection_fail_open_fallback [INFERRED 0.75]
- **AI skill optimization pipeline** — readme_skill_optimization, readme_agent_bridge, prompts_02_fases_9_10_11_skill_optimize_en, prompts_02_fases_9_10_11_skill_optimization_validation, docs_decisiones_optimization_integrity, readme_source_of_truth [INFERRED 0.85]

## Communities (163 total, 43 thin omitted)

### Community 0 - "Catalog Service"
Cohesion: 0.06
Nodes (25): catalogQueries, crawlLimits, CatalogService, createEmptySnapshot(), parseGitHubUrl(), toCatalogRepository(), toRepositoryKey(), catalogTypes (+17 more)

### Community 1 - "mcpInstall.test.js"
Cohesion: 0.14
Nodes (20): jsonConfigWriter, buildEnvironmentObject(), buildServerEntry(), dangerousPatterns, findDangerousPatterns(), maskSecrets(), validateDefinition(), windowsShimCommands (+12 more)

### Community 2 - "Catalog Tasks & Reports"
Cohesion: 0.05
Nodes (39): buildReport(), candidatesPath, catalogDirectory, commands, discardsPath, fs, fsPromises, libraryPath (+31 more)

### Community 3 - "Skill Folder Validation & Publish"
Cohesion: 0.05
Nodes (41): listFolder(), validateSkillFolder(), asDate(), asText(), isRecord(), phases, PublishedSkillsStore, sanitizeEntry() (+33 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.19
Nodes (16): clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks(), scoreIssues() (+8 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.12
Nodes (17): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), listEnglishHeadings(), importantSectionLabels, validateAgentsMd(), secretRules (+9 more)

### Community 6 - "MemoryStorage"
Cohesion: 0.10
Nodes (16): createPlatformPaths(), MemoryStorage, assert, createModel(), test, assert, createService(), fs (+8 more)

### Community 7 - "UI Atoms (Button, Status Bar)"
Cohesion: 0.12
Nodes (23): createAvatar(), getInitials(), getToneIndex(), createButton(), createTextInput(), createFolderInput(), createPathSettingField(), createProjectCard() (+15 more)

### Community 11 - "createIcon"
Cohesion: 0.07
Nodes (37): createIcon(), iconPaths, compactNumberFormatter, createArtifactCard(), createStat(), createCatalogStatusBar(), createInstalledSkillRow(), originVariants (+29 more)

### Community 12 - "Form Controls (Select, Radio)"
Cohesion: 0.09
Nodes (38): createBadge(), createSelectInput(), buildTree(), createFileTree(), renderNode(), sortNodes(), createMetadataList(), variantIcons (+30 more)

### Community 13 - "importer.test.js"
Cohesion: 0.14
Nodes (16): createExecutable(), createFakeGitSetup(), { execFileSync }, fakeScript, findRealGit(), fs, os, path (+8 more)

### Community 14 - "Skill Folder Validator"
Cohesion: 0.10
Nodes (24): folderLimits, fs, path, path, fs, ImportedDetailsService, path, readmeNames (+16 more)

### Community 15 - "providerRegistry.js"
Cohesion: 0.05
Nodes (44): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, claudeCodeCli (+36 more)

### Community 16 - "CLI Install Recipes"
Cohesion: 0.09
Nodes (17): brewRequirement, claudeCodeInstall, codexInstall, geminiCliInstall, githubCliInstall, githubCliTool, installRecipes, npmRequirement (+9 more)

### Community 17 - "Library Filters & Categories"
Cohesion: 0.10
Nodes (16): libraryCategories, libraryOrigins, uncategorizedId, categoryOf(), LibraryStore, readSessionState(), createArtifactIndex(), getBestTokenSimilarity() (+8 more)

### Community 18 - "createNoticeBanner"
Cohesion: 0.13
Nodes (14): createNoticeBanner(), createGraphifyActions(), runtimeHints, createCodeBlock(), createParagraph(), GraphifyInstallFlow, unwrap(), createLines() (+6 more)

### Community 19 - "Bootstrap & Brand Icon"
Cohesion: 0.07
Nodes (28): Skima app icon (skima.png), Skima brand identity (S-mark logo), bootstrapPage(), LibraryController, ProjectsController, ShellController, SkillTextEditorController, activePageByOrigin (+20 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.12
Nodes (25): yaml, errorMessages, SkillCreator, buildFormResponse(), buildFrontmatter(), createFormError(), extractSkillMarkdown(), formResponseFolderOrder (+17 more)

### Community 21 - "appContainer.js"
Cohesion: 0.05
Nodes (21): createAppContainer(), fileNames, fs, path, resolveCatalogDirectory(), CatalogIpcController, DialogIpcController, EnvironmentIpcController (+13 more)

### Community 22 - "Git Session Service"
Cohesion: 0.14
Nodes (9): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, assert, createService() (+1 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.15
Nodes (14): scopes, types, recoverableCodes, crypto, rendererAllowedFields, recoverableCodes, recoverableCodes, recoverableCodes (+6 more)

### Community 24 - "Installed Skills Controller"
Cohesion: 0.14
Nodes (7): createInlineEditableTitle(), missingFolderTabReason, projectTabs, ProjectController, readLastTab(), writeLastTab(), createInlineEditState()

### Community 25 - "modelRestrictionBlock.js"
Cohesion: 0.31
Nodes (11): createModelRestrictionBlock(), loadAgentsWithModels(), createSettingsTab(), projectSettingsBlocks, buildModelGroups(), getActiveListName(), isEntrySelected(), restrictionModeOptions (+3 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.15
Nodes (10): AgentsMdService, createError(), crypto, fs, hashText(), path, appendGraphifySection(), extractGraphifySection() (+2 more)

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.08
Nodes (32): author, dependencies, ajv@8.20.0, dotenv@16.6.1, fflate@0.7.5, highlight.js@11.12.0, jsonc-parser@3.3.1, marked@18.1.1 (+24 more)

### Community 29 - "installedScanner.test.js"
Cohesion: 0.15
Nodes (8): providerRegistry, assert, test, assert, fs, os, path, test

### Community 30 - "skimaRepositorySource.test.js"
Cohesion: 0.13
Nodes (8): getSkimaRepositoryConfig(), productionRepository, SkimaRepositorySource, assert, commitA, commitB, createHarness(), test

### Community 31 - "gitignoreEditor.js"
Cohesion: 0.33
Nodes (9): appendPattern(), assertRegularFileOrMissing(), containsPattern(), ensureGitignoreEntry(), fs, isIgnoredInGitignore(), normalizePattern(), path (+1 more)

### Community 32 - "agentsMdOptimizer.js"
Cohesion: 0.16
Nodes (15): sanitizeAnswers(), AgentsMdOptimizer, boundaryFields, buildPayload(), dataTags, fallbackReasons, isStringArray(), languageInstructions (+7 more)

### Community 33 - "safeArchiveExtractor.js"
Cohesion: 0.22
Nodes (11): ArchiveLimitError, defaultLimits, extractSafely(), fs, isUnsafeRelativePath(), matchesPrefixes(), normalizeEntryPath(), path (+3 more)

### Community 34 - "createPlatformPaths"
Cohesion: 0.11
Nodes (16): nodePath, os, supportedPlatforms, assert, createFixture(), createUvExecutable(), fakeScript, fs (+8 more)

### Community 35 - "ref_node_assert Group"
Cohesion: 0.09
Nodes (13): assert, simulatedSystems, test, assert, test, assert, test, assert (+5 more)

### Community 36 - "AgentBridge Group"
Cohesion: 0.13
Nodes (8): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue, effortLevels

### Community 37 - "executableLocator.js Group"
Cohesion: 0.06
Nodes (29): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+21 more)

### Community 38 - "projectDataStore.test.js Group"
Cohesion: 0.13
Nodes (12): createDefaultProjectConfig(), sanitizeProjectConfig(), fs, ProjectDataStore, createProjectFixture(), createProject(), assert, createStore() (+4 more)

### Community 39 - "ref_node_path"
Cohesion: 0.07
Nodes (25): escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn }, windowsShimExtensions (+17 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.13
Nodes (26): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+18 more)

### Community 41 - "contextTab.js Group"
Cohesion: 0.18
Nodes (17): createField(), createQuestionStep(), agentsMdQuestions, answerKeys, createContextTab(), createEmptyAnswers(), createParagraph(), languageOptions (+9 more)

### Community 42 - "DetailController"
Cohesion: 0.10
Nodes (14): DetailController, describeManifestIssues(), presentCatalogDetail(), requirementLabels, presentInstallations(), presentInstalledDetail(), presentMySkillDetail(), compactNumberFormatter (+6 more)

### Community 43 - "mySkillsStore.js"
Cohesion: 0.11
Nodes (18): fflate, toCaseInsensitiveKey(), validatePathLength(), crypto, fileLimits, fs, { zipSync }, crypto (+10 more)

### Community 44 - "skillFormView.js"
Cohesion: 0.11
Nodes (9): createFormField(), createPageHeader(), PlaceholderView, createCounter(), createField(), createTextArea(), fileSectionTexts, metadataLabels (+1 more)

### Community 46 - "promptRegistry.js Group"
Cohesion: 0.16
Nodes (15): Read-only mode for Claude Code, Third-party skill review procedure, Phase 10: AI skill optimization, Optimization response validation rules, skill-optimize-en prompt, Agent bridge (runAgent and askAi), Cheap model selection, Editor skill creation assistant (+7 more)

### Community 47 - "CliInstaller Group"
Cohesion: 0.18
Nodes (8): CliInstaller, createInstallerError(), crypto, describeStep(), fs, interpreterInvocations, parseMajor(), path

### Community 48 - "agentFileInstaller.js"
Cohesion: 0.18
Nodes (16): adaptAgentFile(), buildMarkdown(), formatAdapters, pick(), YAML, crypto, fs, path (+8 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.16
Nodes (10): createAppLogo(), createNavItem(), createControlButton(), createWindowControls(), createNavGroup(), createSidebar(), createTitleBar(), createAppShell() (+2 more)

### Community 50 - "skillWizardView.js Group"
Cohesion: 0.19
Nodes (13): createToggleSwitch(), CliInstallFlow, createCodeBlock(), createParagraph(), unwrap(), allowedAgentBadges, describeAgentRow(), describeCliMessage() (+5 more)

### Community 51 - "modelSelector.test.js"
Cohesion: 0.13
Nodes (14): formatPrice(), ModelSelector, classifyModel(), localProviderIds, normalizeCost(), parseJsonBlock(), parseVerboseModels(), perThousandKeys (+6 more)

### Community 52 - "graphifyIntegrationService.js"
Cohesion: 0.16
Nodes (12): createIntegrationError(), crypto, fs, GraphifyIntegrationService, hashText(), ignoredHomePrefixes, integrationVariants, path (+4 more)

### Community 53 - "importedRepositoryAnalyzer.js"
Cohesion: 0.16
Nodes (17): fs, hardPatterns, path, scanFiles(), scannedExtensions, softPatterns, analyzeAgentFiles(), analyzeMcp() (+9 more)

### Community 54 - "settingsSchema.js Group"
Cohesion: 0.25
Nodes (21): asBoolean(), asEnum(), asInteger(), asIsoDate(), asText(), asTrimmedString(), createDefaultPromptLaunch(), createDefaultSettings() (+13 more)

### Community 55 - "writeFileAtomic"
Cohesion: 0.09
Nodes (16): crypto, fs, hashKey(), HttpResponseCache, path, fs, path, createTemporarySiblingPath() (+8 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.19
Nodes (3): createStoreError(), MySkillsStore, saveDirectly()

### Community 57 - "fakeAgentEnvironment.js Group"
Cohesion: 0.12
Nodes (18): assert, test, withSetup(), assert, createAskAi(), path, sourceOfTruth, test (+10 more)

### Community 58 - "build Group"
Cohesion: 0.08
Nodes (25): build, appId, asar, directories, extraResources, files, linux, mac (+17 more)

### Community 59 - "mcpDefinitionDetector.js"
Cohesion: 0.27
Nodes (17): dedupeCandidates(), detectMcpDefinitions(), extractCodeBlocks(), fromClaudeAddCommand(), fromConfigObject(), fromPackageJson(), fromPyproject(), fromReadme() (+9 more)

### Community 60 - "libraryDocument.test.js"
Cohesion: 0.15
Nodes (11): artifactTypeDefinitions, findArtifactTypeDefinition(), listAgentsSupportingType(), catalogCategories, assert, fs, path, rootDirectory (+3 more)

### Community 61 - "mySkillsIpcController.js"
Cohesion: 0.15
Nodes (10): executeWithCode(), MySkillsIpcController, path, formLimits, metadataKeys, skillFileFolders, skillLicenses, validateSkillName() (+2 more)

### Community 62 - "modelRestriction.test.js"
Cohesion: 0.25
Nodes (9): createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), restrictionModes, toModelKey(), ProjectModelPolicy (+1 more)

### Community 63 - "ProviderPathResolver Group"
Cohesion: 0.11
Nodes (16): ProviderPathResolver, findProvider(), assert, createFixture(), fs, githubSource, os, path (+8 more)

### Community 64 - "McpInstaller"
Cohesion: 0.21
Nodes (3): detectOpenCodeVersion(), createInstallerError(), McpInstaller

### Community 65 - "AskAi Group"
Cohesion: 0.19
Nodes (7): AskAi, createAskError(), fs, referenceTags, findPrompt(), neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "repositoryDetailsService.test.js"
Cohesion: 0.18
Nodes (9): findReadme(), findSkillManifests(), isMarkdownFile(), RepositoryDetailsService, assert, files, repository, test (+1 more)

### Community 67 - "projectConfigSchema.js"
Cohesion: 0.22
Nodes (17): createDefaultModelRestriction(), asIsoDate(), asShortText(), graphifyDecisions, isPlainObject(), migrateProjectConfig(), projectConfigLimits, projectConfigMigrations (+9 more)

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.18
Nodes (11): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Branch protection rule for master, CODEOWNERS review, Pull request template, Valid skill rules (+3 more)

### Community 70 - "README.md Group"
Cohesion: 0.14
Nodes (14): Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, JetBrains-style project selector, Left sidebar navigation menu, AGENTS.md project context tab, contextBridge preload, Global and Project views, Install skills and MCP servers to enabled agents (+6 more)

### Community 71 - "mainWindow.js Group"
Cohesion: 0.14
Nodes (14): electron, path, electron, appIconPath, { BrowserWindow }, createMainWindow(), isInternalPage(), notifyMaximizedChanges() (+6 more)

### Community 72 - "ref_node_fs"
Cohesion: 0.12
Nodes (18): buildGraphifyEnvironment(), fs, fs, graphifyCommands, graphifyPackage, GraphifyRuntime, outputFiles, resolveExecutableRelativePath() (+10 more)

### Community 73 - "markdownRenderer.js"
Cohesion: 0.11
Nodes (22): allowedLinkSchemes, convertGitHubBlobToRaw(), createMarked(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl() (+14 more)

### Community 74 - "InstalledScanner"
Cohesion: 0.23
Nodes (5): AgentSettingsService, createFieldError(), editablePathFields, fs, mcpExtensionsByFormat

### Community 75 - "InstalledSkillsController Group"
Cohesion: 0.14
Nodes (8): createText(), InstalledAgentFilesController, sectionDefinitions, InstalledSkillsController, createSkillsTab(), filterInstalledSkills(), listAgentFilterOptions(), normalize()

### Community 76 - "scripts Group"
Cohesion: 0.13
Nodes (15): scripts, catalog:refresh, catalog:validate, catalog:verify, dist, dist:linux, dist:mac, dist:win (+7 more)

### Community 77 - "EnvFileService Group"
Cohesion: 0.09
Nodes (32): applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace(), listEntries(), listKeysOnly() (+24 more)

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

### Community 84 - "GraphifyService Group"
Cohesion: 0.26
Nodes (4): createGraphifyError(), diffSnapshots(), GraphifyService, snapshotTopLevel()

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

### Community 91 - "showToast"
Cohesion: 0.10
Nodes (8): showToast(), AgentFileInstallFlow, createParagraph(), createCheckboxList(), createParagraph(), SkillInstallFlow, DetailView, SkillTextEditorView

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

### Community 96 - "sourceOfTruth.test.js"
Cohesion: 0.06
Nodes (49): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+41 more)

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 100 - "agentsMdTemplate.js"
Cohesion: 0.29
Nodes (11): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, missingImportantSections(), normalizeText(), renderAgentsMd(), renderCodeBlock() (+3 more)

### Community 101 - "skillInstaller.test.js"
Cohesion: 0.17
Nodes (13): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib, assert, createInstallerSetup(), createTemporaryDirectory() (+5 more)

### Community 102 - "importedSkillSource.js"
Cohesion: 0.21
Nodes (5): fs, ImportedSkillSource, path, assertNoEscapingLinks(), GitHubSkillSource

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

### Community 109 - "repositoryImporter.js"
Cohesion: 0.22
Nodes (8): crypto, fs, getDirectorySize(), path, redactUrls(), retryRename(), sanitizeForItemId(), today()

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
Cohesion: 0.15
Nodes (10): crypto, isDeepEqual(), SettingsStore, createSelector(), assert, createSequentialIds(), createStore(), fixedNow() (+2 more)

### Community 116 - "mcpConfigWriters.js"
Cohesion: 0.24
Nodes (7): configContainsServer(), jsonc, parseJsonText(), readPath(), serverContainerPaths, TOML, tomlConfigWriter

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

### Community 128 - "environmentTab.js"
Cohesion: 0.53
Nodes (8): createEnvironmentTab(), buildChanges(), createEmptyRow(), createRowId(), createRowsFromEntries(), isRowDirty(), suggestKeys(), validateRows()

### Community 129 - "03_editor_skills.md"
Cohesion: 0.25
Nodes (7): Accion, Boton de generar, Editar, Form Response, Instalar, Si no hay una IA configurada, UI

### Community 134 - "repositoryUrl.js"
Cohesion: 0.57
Nodes (7): cleanSegments(), failure(), parseHttps(), parseRepositoryUrl(), parseSsh(), stoppingSegments, validateSegments()

### Community 136 - "OpenCode version package name split Group"
Cohesion: 0.67
Nodes (3): npm package @opencode/cli, OpenCode v2 install methods, OpenCode version package name split

### Community 137 - "Skill description field Group"
Cohesion: 0.67
Nodes (3): Description checklist, Skill description field, Use when clause

### Community 160 - "portableNames.js"
Cohesion: 0.18
Nodes (13): findCaseInsensitiveCollision(), getReservedBaseName(), hasControlCharacter(), isPortableName(), pathLengthLimits, validatePortableName(), windowsForbiddenCharacters, windowsReservedBaseNames (+5 more)

### Community 166 - "projectModel.js"
Cohesion: 0.25
Nodes (6): crypto, fs, limits, permissionModes, quickModelModes, workingDirectoryModes

### Community 170 - "settingsMigrations.js"
Cohesion: 0.60
Nodes (4): convertLegacyProject(), migrateSettings(), readSchemaVersion(), settingsMigrations

## Ambiguous Edges - Review These
- `Codex standalone installer` → `Codex Windows install not confirmed`  [AMBIGUOUS]
  source-of-truth/install-codex-cli.md · relation: conceptually_related_to
- `docs/plan-pendiente.md` → `Gemini CLI agent`  [AMBIGUOUS]
  docs/plan-pendiente.md · relation: references

## Knowledge Gaps
- **87 isolated node(s):** `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit`, `Gemini context fileName setting`, `Nearest file takes precedence` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 957 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Configuration sections` connect `README.md Group` to `Form Controls (Select, Radio)`?**
  _High betweenness centrality (0.336) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Provider registry (adding an agent)` connect `Unverified or low-confidence provider registry rows Group` to `README.md Group`, `providerRegistry.js`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._