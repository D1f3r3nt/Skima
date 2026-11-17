# Graph Report - Skima  (2026-11-17)

## Corpus Check
- 357 files · ~174,856 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 8, (none) 3, .ico 1)

## Summary
- 2991 nodes · 6948 edges · 181 communities (132 shown, 49 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 310 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e45a7e91`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Catalog Service
- mcpInstall.test.js
- catalogTasks.js
- skillPublisher.test.js
- repositoryScore.js
- agentsMd.test.js
- MemoryStorage
- createTextInput
- Project & AI Controllers
- RepositoryImporter
- createIcon
- Form Controls (Select, Radio)
- importer.test.js
- Skill Folder Validator
- providerRegistry.js
- CLI Install Recipes
- envFile.test.js
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
- sourceOfTruth.js
- skimaRepositorySource.test.js
- gitignoreEditor.js
- agentsMdOptimizer.js
- safeArchiveExtractor.js
- createPlatformPaths
- settingsSections.test.js
- AgentBridge Group
- executableLocator.js Group
- projectConfigSchema.js
- fakeGitEnvironment.js
- catalogMaintenance.js Group
- contextTab.js Group
- DetailController
- SkillInstaller
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
- readTextIfExists
- MySkillsStore Group
- fakeAgentEnvironment.js Group
- build Group
- mcpDefinitionDetector.js
- skimaRepositorySource.js
- mySkillsIpcController.js
- SkillPublisher
- ProviderPathResolver Group
- McpInstaller
- AskAi Group
- repositoryDetailsService.test.js
- skillsSite.test.js
- fakeGitTools.js
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
- skillsSiteGuard.js
- agentFileIpcController.js Group
- installedIpcController.js Group
- publishIpcController.js Group
- SkillUninstaller Group
- Prompt injection attack forms Group
- AgentsMdIpcController Group
- localCatalogService.js
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
- skillsSiteView.js
- ProjectIpcController Group
- publishedSkillsStore.js
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
- libraryDocumentValidator.js
- GraphifyInstaller
- WindowIpcController
- InstalledDetailsService
- portableNames.js
- ImportedLibraryStore
- sourceOfTruthDocument.js
- graphifyIntegration.test.js
- httpResponseCache.js
- skillsSitePreload.js
- .showVariants
- LocalCatalogService
- commandsAcrossSystems.test.js
- skimaRepositorySource.test.js
- agentsMdService.js
- promptRegistry.js
- 05_graphify.md
- cliInstaller.js
- ImportedDetailsService
- InstallationLocator
- 04_add_vercel_skills.md
- GraphifyIpcController
- ImportIpcController
- SkillsSiteIpcController

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 130 edges
2. `createButton()` - 99 edges
3. `createAppContainer()` - 91 edges
4. `createNoticeBanner()` - 61 edges
5. `showToast()` - 49 edges
6. `executeSafely()` - 45 edges
7. `createPlatformPaths()` - 45 edges
8. `createIcon()` - 42 edges
9. `createBadge()` - 36 edges
10. `writeFileAtomic()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `createHarness()` --calls--> `SkimaRepositorySource`  [EXTRACTED]
  test/skima/skimaRepositorySource.test.js → src/core/main/skima/skimaRepositorySource.js
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `createInstaller()` --calls--> `SkillsShInstaller`  [EXTRACTED]
  test/skillsSite/skillsSite.test.js → src/core/main/skillsSite/skillsShInstaller.js

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

## Communities (181 total, 49 thin omitted)

### Community 0 - "Catalog Service"
Cohesion: 0.06
Nodes (25): catalogQueries, crawlLimits, CatalogService, createEmptySnapshot(), parseGitHubUrl(), toCatalogRepository(), toRepositoryKey(), catalogTypes (+17 more)

### Community 1 - "mcpInstall.test.js"
Cohesion: 0.15
Nodes (17): buildEnvironmentObject(), buildServerEntry(), dangerousPatterns, findDangerousPatterns(), maskSecrets(), validateDefinition(), windowsShimCommands, withOptional() (+9 more)

### Community 2 - "catalogTasks.js"
Cohesion: 0.17
Nodes (20): buildReport(), candidatesPath, catalogDirectory, commands, discardsPath, fs, fsPromises, libraryPath (+12 more)

### Community 3 - "skillPublisher.test.js"
Cohesion: 0.09
Nodes (31): allowedExtensions, buildPullRequestBody(), checkFile(), collectFiles(), forbiddenNamePatterns, fs, inspectSkillFolder(), isHiddenSegment() (+23 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.19
Nodes (16): clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks(), scoreIssues() (+8 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.12
Nodes (16): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), listEnglishHeadings(), importantSectionLabels, secretRules, answers (+8 more)

### Community 6 - "MemoryStorage"
Cohesion: 0.11
Nodes (11): MemoryStorage, assert, fs, os, path, test, assert, createSequentialIds() (+3 more)

### Community 7 - "createTextInput"
Cohesion: 0.27
Nodes (9): createTextInput(), createFolderInput(), createFormField(), createModal(), createProjectFormModal(), getFolderName(), typedConfirmDialog(), matchesConfirmationWord() (+1 more)

### Community 10 - "RepositoryImporter"
Cohesion: 0.13
Nodes (10): createImportError(), crypto, fs, getDirectorySize(), path, redactUrls(), RepositoryImporter, retryRename() (+2 more)

### Community 11 - "createIcon"
Cohesion: 0.13
Nodes (27): createAvatar(), getInitials(), getToneIndex(), createBadge(), createIcon(), iconPaths, buildTree(), createFileTree() (+19 more)

### Community 12 - "Form Controls (Select, Radio)"
Cohesion: 0.10
Nodes (29): createSelectInput(), variantIcons, createRadioGroup(), createSteppedModal(), settingsSectionIds, resultLabels, statusLabels, typeNames (+21 more)

### Community 13 - "importer.test.js"
Cohesion: 0.20
Nodes (15): cleanSegments(), failure(), parseHttps(), parseRepositoryUrl(), parseSsh(), stoppingSegments, validateSegments(), assert (+7 more)

### Community 14 - "Skill Folder Validator"
Cohesion: 0.08
Nodes (27): folderLimits, fs, path, path, fs, path, readmeNames, fs (+19 more)

### Community 15 - "providerRegistry.js"
Cohesion: 0.05
Nodes (44): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, claudeCodeCli (+36 more)

### Community 16 - "CLI Install Recipes"
Cohesion: 0.14
Nodes (9): brewRequirement, claudeCodeInstall, codexInstall, geminiCliInstall, githubCliInstall, installRecipes, npmRequirement, openCodeInstall (+1 more)

### Community 17 - "envFile.test.js"
Cohesion: 0.13
Nodes (20): detectLineEnding(), applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace(), parseEnvDocument() (+12 more)

### Community 18 - "createNoticeBanner"
Cohesion: 0.12
Nodes (17): createButton(), createNoticeBanner(), AgentFileInstallFlow, createParagraph(), createGraphifyActions(), runtimeHints, createCodeBlock(), createParagraph() (+9 more)

### Community 19 - "Bootstrap & Brand Icon"
Cohesion: 0.08
Nodes (27): Skima app icon (skima.png), Skima brand identity (S-mark logo), bootstrapPage(), ProjectsController, ShellController, SkillTextEditorController, activePageByOrigin, params (+19 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.09
Nodes (34): errorMessages, SkillCreator, buildFormResponse(), buildFrontmatter(), createFormError(), extractSkillMarkdown(), formLimits, formResponseFolderOrder (+26 more)

### Community 21 - "appContainer.js"
Cohesion: 0.05
Nodes (22): createAppContainer(), fileNames, fs, path, resolveCatalogDirectory(), CatalogIpcController, DialogIpcController, EnvironmentIpcController (+14 more)

### Community 22 - "Git Session Service"
Cohesion: 0.14
Nodes (9): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, assert, createService() (+1 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.17
Nodes (11): recoverableCodes, recoverableCodes, recoverableCodes, recoverableCodes, crypto, scopes, executeSafely(), McpIpcController (+3 more)

### Community 24 - "Installed Skills Controller"
Cohesion: 0.15
Nodes (7): createInlineEditableTitle(), missingFolderTabReason, projectTabs, ProjectController, readLastTab(), writeLastTab(), createInlineEditState()

### Community 25 - "modelRestrictionBlock.js"
Cohesion: 0.31
Nodes (11): createModelRestrictionBlock(), loadAgentsWithModels(), createSettingsTab(), projectSettingsBlocks, buildModelGroups(), getActiveListName(), isEntrySelected(), restrictionModeOptions (+3 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.21
Nodes (3): AgentsMdService, createError(), validateAgentsMd()

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.08
Nodes (31): author, dependencies, ajv@8.20.0, dotenv@16.6.1, fflate@0.7.5, highlight.js@11.12.0, jsonc-parser@3.3.1, marked@18.1.1 (+23 more)

### Community 29 - "sourceOfTruth.js"
Cohesion: 0.16
Nodes (9): nodePath, resolveBundledResourceDirectory(), documentOpening(), fs, path, SourceOfTruth, SourceOfTruthError, estimateDocumentTokens() (+1 more)

### Community 31 - "gitignoreEditor.js"
Cohesion: 0.33
Nodes (9): appendPattern(), assertRegularFileOrMissing(), containsPattern(), ensureGitignoreEntry(), fs, isIgnoredInGitignore(), normalizePattern(), path (+1 more)

### Community 32 - "agentsMdOptimizer.js"
Cohesion: 0.16
Nodes (14): AgentsMdOptimizer, boundaryFields, buildPayload(), dataTags, fallbackReasons, isStringArray(), languageInstructions, listFields (+6 more)

### Community 33 - "safeArchiveExtractor.js"
Cohesion: 0.11
Nodes (17): listFolder(), validateSkillFolder(), fs, path, ArchiveLimitError, assertNoEscapingLinks(), defaultLimits, extractSafely() (+9 more)

### Community 34 - "createPlatformPaths"
Cohesion: 0.06
Nodes (35): createPlatformPaths(), nodePath, os, supportedPlatforms, providerRegistry, assert, test, assert (+27 more)

### Community 35 - "settingsSections.test.js"
Cohesion: 0.22
Nodes (6): assert, fs, listSourceFiles(), path, rootDirectory, test

### Community 36 - "AgentBridge Group"
Cohesion: 0.14
Nodes (7): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue

### Community 37 - "executableLocator.js Group"
Cohesion: 0.11
Nodes (12): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+4 more)

### Community 38 - "projectConfigSchema.js"
Cohesion: 0.07
Nodes (39): sanitizeAnswers(), createDefaultModelRestriction(), createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), restrictionModes (+31 more)

### Community 39 - "fakeGitEnvironment.js"
Cohesion: 0.12
Nodes (16): escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn }, windowsShimExtensions (+8 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.10
Nodes (32): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+24 more)

### Community 41 - "contextTab.js Group"
Cohesion: 0.16
Nodes (19): confirmDialog(), createField(), createQuestionStep(), agentsMdQuestions, answerKeys, createContextTab(), createEmptyAnswers(), createParagraph() (+11 more)

### Community 42 - "DetailController"
Cohesion: 0.09
Nodes (16): artifactTypes, findArtifactType(), DetailController, describeManifestIssues(), presentCatalogDetail(), requirementLabels, presentInstallations(), presentInstalledDetail() (+8 more)

### Community 44 - "skillFormView.js"
Cohesion: 0.19
Nodes (4): createCounter(), createField(), createTextArea(), SkillFormView

### Community 46 - "promptRegistry.js Group"
Cohesion: 0.16
Nodes (15): Read-only mode for Claude Code, Third-party skill review procedure, Phase 10: AI skill optimization, Optimization response validation rules, skill-optimize-en prompt, Agent bridge (runAgent and askAi), Cheap model selection, Editor skill creation assistant (+7 more)

### Community 47 - "CliInstaller Group"
Cohesion: 0.27
Nodes (3): CliInstaller, createInstallerError(), describeStep()

### Community 48 - "agentFileInstaller.js"
Cohesion: 0.10
Nodes (27): yaml@2.9.1, yaml, adaptAgentFile(), buildMarkdown(), formatAdapters, pick(), YAML, crypto (+19 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.16
Nodes (10): createAppLogo(), createNavItem(), createControlButton(), createWindowControls(), createNavGroup(), createSidebar(), createTitleBar(), createAppShell() (+2 more)

### Community 50 - "skillWizardView.js Group"
Cohesion: 0.12
Nodes (21): createToggleSwitch(), createPathSettingField(), attachLinkHandling(), createMarkdownBody(), settingsSections, CliInstallFlow, createCodeBlock(), createParagraph() (+13 more)

### Community 51 - "modelSelector.test.js"
Cohesion: 0.13
Nodes (14): formatPrice(), ModelSelector, classifyModel(), localProviderIds, normalizeCost(), parseJsonBlock(), parseVerboseModels(), perThousandKeys (+6 more)

### Community 52 - "graphifyIntegrationService.js"
Cohesion: 0.16
Nodes (12): createIntegrationError(), crypto, fs, GraphifyIntegrationService, hashText(), ignoredHomePrefixes, integrationVariants, path (+4 more)

### Community 53 - "importedRepositoryAnalyzer.js"
Cohesion: 0.24
Nodes (11): analyzeAgentFiles(), analyzeMcp(), analyzeRepository(), analyzeSkills(), fs, ignoredDirectoryNames, limits, listRepositoryFiles() (+3 more)

### Community 54 - "settingsSchema.js Group"
Cohesion: 0.13
Nodes (33): crypto, fs, convertLegacyProject(), migrateSettings(), readSchemaVersion(), settingsMigrations, asBoolean(), asEnum() (+25 more)

### Community 55 - "readTextIfExists"
Cohesion: 0.11
Nodes (12): createTemporarySiblingPath(), crypto, fs, path, readTextIfExists(), crypto, fileLimits, fs (+4 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.20
Nodes (5): writeFileAtomic(), createStoreError(), MySkillsStore, hashSkillFolder(), listFiles()

### Community 57 - "fakeAgentEnvironment.js Group"
Cohesion: 0.12
Nodes (18): assert, test, withSetup(), assert, createAskAi(), path, sourceOfTruth, test (+10 more)

### Community 58 - "build Group"
Cohesion: 0.08
Nodes (25): build, appId, asar, directories, extraResources, files, linux, mac (+17 more)

### Community 59 - "mcpDefinitionDetector.js"
Cohesion: 0.27
Nodes (17): dedupeCandidates(), detectMcpDefinitions(), extractCodeBlocks(), fromClaudeAddCommand(), fromConfigObject(), fromPackageJson(), fromPyproject(), fromReadme() (+9 more)

### Community 60 - "skimaRepositorySource.js"
Cohesion: 0.38
Nodes (3): catalogCategories, getSkimaRepositoryConfig(), path

### Community 61 - "mySkillsIpcController.js"
Cohesion: 0.38
Nodes (3): executeWithCode(), MySkillsIpcController, path

### Community 63 - "ProviderPathResolver Group"
Cohesion: 0.11
Nodes (15): ProviderPathResolver, findProvider(), assert, createService(), fs, os, path, test (+7 more)

### Community 65 - "AskAi Group"
Cohesion: 0.19
Nodes (7): AskAi, createAskError(), fs, referenceTags, findPrompt(), neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "repositoryDetailsService.test.js"
Cohesion: 0.18
Nodes (9): findReadme(), findSkillManifests(), isMarkdownFile(), RepositoryDetailsService, assert, files, repository, test (+1 more)

### Community 67 - "skillsSite.test.js"
Cohesion: 0.19
Nodes (11): buildCliArguments(), cliAgentIdOverrides, createCodedError(), scopes, SkillsShInstaller, stripAnsi(), toCliAgentId(), validateTarget() (+3 more)

### Community 68 - "fakeGitTools.js"
Cohesion: 0.16
Nodes (17): args, copyDirectory(), delegateToRealGit(), fs, handleGh(), handleGhExtended(), handleGit(), mapRemote() (+9 more)

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.13
Nodes (16): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Reusable wizard engine, Branch protection rule for master, CODEOWNERS review, Pull request template (+8 more)

### Community 70 - "README.md Group"
Cohesion: 0.14
Nodes (14): Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, JetBrains-style project selector, Left sidebar navigation menu, AGENTS.md project context tab, contextBridge preload, Global and Project views, Install skills and MCP servers to enabled agents (+6 more)

### Community 71 - "mainWindow.js Group"
Cohesion: 0.13
Nodes (16): electron, path, electron@^45.0.0, electron, appIconPath, { BrowserWindow }, createMainWindow(), isInternalPage() (+8 more)

### Community 72 - "ref_node_fs"
Cohesion: 0.12
Nodes (18): buildGraphifyEnvironment(), fs, fs, graphifyCommands, graphifyPackage, GraphifyRuntime, outputFiles, resolveExecutableRelativePath() (+10 more)

### Community 73 - "markdownRenderer.js"
Cohesion: 0.11
Nodes (22): allowedLinkSchemes, convertGitHubBlobToRaw(), createMarked(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl() (+14 more)

### Community 75 - "InstalledSkillsController Group"
Cohesion: 0.14
Nodes (8): createText(), InstalledAgentFilesController, sectionDefinitions, InstalledSkillsController, createSkillsTab(), filterInstalledSkills(), listAgentFilterOptions(), normalize()

### Community 76 - "scripts Group"
Cohesion: 0.13
Nodes (15): scripts, catalog:refresh, catalog:validate, catalog:verify, dist, dist:linux, dist:mac, dist:win (+7 more)

### Community 77 - "EnvFileService Group"
Cohesion: 0.17
Nodes (13): listEntries(), listKeysOnly(), serializeEnvDocument(), validateEnvKey(), createEnvError(), crypto, EnvFileService, fallbackIgnorePatterns (+5 more)

### Community 78 - "cliInstaller.test.js"
Cohesion: 0.13
Nodes (14): findInstallTarget(), allSystems, assert, emptyAllowed, fakeScript, firstPackageManagerMethod(), fs, hostMethods() (+6 more)

### Community 79 - "prompts/02_fases_9_10_11.md Group"
Cohesion: 0.17
Nodes (5): electron-builder 26.18.0 choice, WSL not supported, Phase 11: packaging, CI and documentation, GitHub API without token, Skima desktop app

### Community 80 - "Phase 9: skill wizard and Mis skills Group"
Cohesion: 0.33
Nodes (5): Native folder picker popup with name and path fields, Initial dark first screen with add-project button, proyectos.json project storage file, proyectos.json legacy format, Saved settings and data in userData

### Community 82 - "fetchUv.js"
Cohesion: 0.17
Nodes (14): crypto, download(), extractFromTarball(), extractFromZip(), fs, fsPromises, main(), os (+6 more)

### Community 83 - "AgentFileInstaller Group"
Cohesion: 0.27
Nodes (3): AgentFileInstaller, createInstallError(), toCaseInsensitiveKey()

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
Cohesion: 0.09
Nodes (12): createPageHeader(), showToast(), variantIcons, createEmptyState(), createItemDetailSkeleton(), publishStateLabels, DetailView, PlaceholderView (+4 more)

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
Cohesion: 0.13
Nodes (23): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+15 more)

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 100 - "agentsMdTemplate.js"
Cohesion: 0.32
Nodes (11): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, missingImportantSections(), normalizeText(), renderAgentsMd(), renderCodeBlock() (+3 more)

### Community 101 - "skillInstaller.test.js"
Cohesion: 0.17
Nodes (13): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib, assert, createInstallerSetup(), createTemporaryDirectory() (+5 more)

### Community 102 - "skillsSiteGuard.js"
Cohesion: 0.20
Nodes (8): devToolsShortcutKeys, hardenSkillsSiteWebview(), isForbiddenShortcut(), newContextShortcutKeys, SkillsSiteGuard, blockReasons, evaluateSkillsSiteUrl(), isDocsPath()

### Community 103 - "agentFileIpcController.js Group"
Cohesion: 0.33
Nodes (4): AgentFileIpcController, scopes, types, validateSource()

### Community 104 - "installedIpcController.js Group"
Cohesion: 0.38
Nodes (3): InstalledIpcController, readScope(), scopes

### Community 105 - "publishIpcController.js Group"
Cohesion: 0.47
Nodes (3): describeError(), PublishIpcController, text()

### Community 107 - "Prompt injection attack forms Group"
Cohesion: 0.33
Nodes (5): Prompt injection attack forms, Delimit untrusted data, Neutralise delimiters, Least privilege execution, Validate output against schema

### Community 108 - "AgentsMdIpcController Group"
Cohesion: 0.40
Nodes (3): AgentsMdIpcController, describeError(), optimizationFrom()

### Community 109 - "localCatalogService.js"
Cohesion: 0.16
Nodes (8): countByType(), LibraryService, toImportedListItem(), toRepositoryUrl(), buildGithubUrl(), fs, path, toListItem()

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
Cohesion: 0.14
Nodes (9): isDeepEqual(), SettingsStore, createSelector(), assert, createScannerSetup(), fs, os, path (+1 more)

### Community 116 - "mcpConfigWriters.js"
Cohesion: 0.17
Nodes (12): configContainsServer(), detectOpenCodeVersion(), jsonc, jsonConfigWriter, parseJsonText(), readPath(), serverContainerPaths, TOML (+4 more)

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

### Community 126 - "AiIpcController Group"
Cohesion: 0.33
Nodes (3): AiIpcController, crypto, rendererAllowedFields

### Community 128 - "environmentTab.js"
Cohesion: 0.53
Nodes (8): createEnvironmentTab(), buildChanges(), createEmptyRow(), createRowId(), createRowsFromEntries(), isRowDirty(), suggestKeys(), validateRows()

### Community 129 - "03_editor_skills.md"
Cohesion: 0.25
Nodes (7): Accion, Boton de generar, Editar, Form Response, Instalar, Si no hay una IA configurada, UI

### Community 132 - "skillsSiteView.js"
Cohesion: 0.18
Nodes (5): describeBlockedNavigation(), skillsSite, isInstallRequest(), SkillsSiteController, SkillsSiteView

### Community 134 - "publishedSkillsStore.js"
Cohesion: 0.24
Nodes (7): asDate(), asText(), isRecord(), phases, PublishedSkillsStore, sanitizeEntry(), states

### Community 136 - "OpenCode version package name split Group"
Cohesion: 0.67
Nodes (3): npm package @opencode/cli, OpenCode v2 install methods, OpenCode version package name split

### Community 137 - "Skill description field Group"
Cohesion: 0.67
Nodes (3): Description checklist, Skill description field, Use when clause

### Community 156 - "libraryDocumentValidator.js"
Cohesion: 0.24
Nodes (12): artifactTypeDefinitions, Ajv, describeSchemaError(), findSemanticErrors(), fs, getValidator(), listItems(), loadSchema() (+4 more)

### Community 160 - "portableNames.js"
Cohesion: 0.10
Nodes (23): findCaseInsensitiveCollision(), getReservedBaseName(), hasControlCharacter(), isPortableName(), pathLengthLimits, validatePathLength(), validatePortableName(), windowsForbiddenCharacters (+15 more)

### Community 162 - "sourceOfTruthDocument.js"
Cohesion: 0.26
Nodes (11): audiences, confidences, countSentences(), documentLimits, parseSourceOfTruthDocument(), splitSections(), toDateString(), validateBody() (+3 more)

### Community 163 - "graphifyIntegration.test.js"
Cohesion: 0.20
Nodes (10): assert, createFixture(), fs, os, path, test, createFakeGraphifyExecutable(), fakeScript (+2 more)

### Community 164 - "httpResponseCache.js"
Cohesion: 0.24
Nodes (5): crypto, fs, hashKey(), HttpResponseCache, path

### Community 165 - "skillsSitePreload.js"
Cohesion: 0.33
Nodes (10): applyLayout(), clearPreviousChanges(), createInstallCard(), ensureStyles(), findInstallCommand(), hideRelatedSections(), { ipcRenderer }, placeInstallCard() (+2 more)

### Community 166 - ".showVariants"
Cohesion: 0.38
Nodes (4): createLines(), createParagraph(), GraphifyIntegrationDialog, unwrap()

### Community 168 - "commandsAcrossSystems.test.js"
Cohesion: 0.22
Nodes (8): githubCliTool, assert, fs, listJavaScriptFiles(), path, rootDirectory, shellSpawnPatterns, test

### Community 169 - "skimaRepositorySource.test.js"
Cohesion: 0.22
Nodes (6): productionRepository, assert, commitA, commitB, createHarness(), test

### Community 170 - "agentsMdService.js"
Cohesion: 0.32
Nodes (6): crypto, fs, hashText(), path, appendGraphifySection(), extractGraphifySection()

### Community 171 - "promptRegistry.js"
Cohesion: 0.32
Nodes (5): agentsMdOptimizePrompt, agentsMdOptimizeSchema, stringList, skillCreatePrompt, promptRegistry

### Community 172 - "05_graphify.md"
Cohesion: 0.29
Nodes (6): Accion, Botones "Abrir...", Configuracion, Deteccion de graphify, Gitignore, Instalación de graphify

### Community 173 - "cliInstaller.js"
Cohesion: 0.33
Nodes (5): crypto, fs, interpreterInvocations, parseMajor(), path

### Community 176 - "04_add_vercel_skills.md"
Cohesion: 0.50
Nodes (3): Accion, Instalar, UI

## Ambiguous Edges - Review These
- `Codex standalone installer` → `Codex Windows install not confirmed`  [AMBIGUOUS]
  source-of-truth/install-codex-cli.md · relation: conceptually_related_to
- `docs/plan-pendiente.md` → `Gemini CLI agent`  [AMBIGUOUS]
  docs/plan-pendiente.md · relation: references

## Knowledge Gaps
- **87 isolated node(s):** `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit`, `Gemini context fileName setting`, `Nearest file takes precedence` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 969 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Configuration sections` connect `README.md Group` to `skillWizardView.js Group`?**
  _High betweenness centrality (0.315) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Provider registry (adding an agent)` connect `Unverified or low-confidence provider registry rows Group` to `README.md Group`, `providerRegistry.js`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._