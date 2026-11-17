# Graph Report - Skima  (2026-11-17)

## Corpus Check
- 361 files · ~178,650 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 8, (none) 3, .ico 1)

## Summary
- 3042 nodes · 7085 edges · 172 communities (127 shown, 45 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 319 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5d8faeec`
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
- Project & AI Controllers
- RepositoryImporter
- createIcon
- Form Controls (Select, Radio)
- importer.test.js
- skillManifest.js
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
- gitignoreEditor.js
- agentsMdOptimizer.js
- safeArchiveExtractor.js
- ref_node_assert
- settingsSections.test.js
- AgentBridge Group
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
- importedRepositoryAnalyzer.js
- settingsSchema.js Group
- ref_node_fs
- MySkillsStore Group
- fakeAgentEnvironment.js Group
- build Group
- mcpDefinitionDetector.js
- providerRegistry.js
- mySkillsIpcController.js
- repositoryImporter.js
- ProviderPathResolver Group
- skillFolderValidator.js
- AskAi Group
- repositoryDetailsService.test.js
- mainWindow.js
- MarkdownRenderer
- docs/plan-pendiente.md Group
- README.md Group
- electron
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
- libraryDocument.test.js
- agentFileIpcController.js Group
- installedIpcController.js Group
- publishIpcController.js Group
- SkillUninstaller Group
- Prompt injection attack forms Group
- AgentsMdIpcController Group
- repositoryUrl.js
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
- projectModel.js
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
- LinkIpcController
- GraphifyInstaller
- WindowIpcController
- portableNames.js
- graphifyIntegration.test.js
- httpResponseCache.js
- skillsSitePreload.js
- .showVariants
- commandsAcrossSystems.test.js
- 05_graphify.md
- cliInstaller.js
- 04_add_vercel_skills.md
- GraphifyIpcController
- ImportIpcController
- SkillsSiteIpcController

## God Nodes (most connected - your core abstractions)
1. `SkimaApiClient` - 132 edges
2. `createButton()` - 98 edges
3. `createAppContainer()` - 93 edges
4. `createNoticeBanner()` - 59 edges
5. `showToast()` - 51 edges
6. `executeSafely()` - 45 edges
7. `createPlatformPaths()` - 45 edges
8. `createIcon()` - 44 edges
9. `createBadge()` - 38 edges
10. `writeFileAtomic()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `createAskAi()` --calls--> `AskAi`  [EXTRACTED]
  test/agentBridge/askAi.test.js → src/core/main/agentBridge/askAi.js
- `Retire the GitHub tracking module` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  docs/plan-pendiente.md → README.md
- `Artifact card grid, 10 per type` --conceptually_related_to--> `Biblioteca library`  [INFERRED]
  prompts/01_adaptacion_ui.md → README.md
- `createFakeAgentSetup()` --calls--> `AgentBridge`  [EXTRACTED]
  test/helpers/fakeAgentEnvironment.js → src/core/main/agentBridge/agentBridge.js
- `withOptimizer()` --calls--> `AskAi`  [EXTRACTED]
  test/agentsMd/agentsMd.test.js → src/core/main/agentBridge/askAi.js

## Import Cycles
- 4-file cycle: `src/core/renderer/config/settingsSections.js -> src/core/renderer/settings/graphifySettingsSection.js -> src/core/renderer/controllers/mcpInstallFlow.js -> src/core/renderer/services/settingsModalService.js -> src/core/renderer/config/settingsSections.js`

## Hyperedges (group relationships)
- **Skill security review pipeline** — source_of_truth_skill_security_review_severity_rubric, source_of_truth_skill_security_review_instruction_risk_signals, source_of_truth_skill_security_review_script_risk_signals, source_of_truth_skill_security_review_supply_chain_risks [EXTRACTED 1.00]
- **catalogSample skill fixtures used for skill discovery tests** — test_fixtures_catalogsample_skills_mismatch_skill, test_fixtures_catalogsample_skills_no_manifest_readme, test_fixtures_catalogsample_skills_pdf_skill [INFERRED 0.75]
- **Catalog verification and library display** — catalog_verification_report, docs_plan_pendiente_catalog_scale, readme_biblioteca, readme_item_detail [INFERRED 0.75]
- **Skill install and management flow** — readme_install_flow, readme_installed_scanner, docs_decisiones_shared_skill_folder, docs_decisiones_trash_uninstall, readme_mis_skills [INFERRED 0.75]
- **Skima pages share one HTML shell (#app root, #toastContainer, module script)** — src_pages_detail, src_pages_editor, src_pages_global, src_pages_library, src_pages_myskills, src_pages_project, src_pages_projects [INFERRED 0.75]
- **Untrusted input defences** — source_of_truth_untrusted_content_and_prompt_injection_delimit_untrusted_data, source_of_truth_untrusted_content_and_prompt_injection_delimiter_neutralisation, source_of_truth_untrusted_content_and_prompt_injection_least_privilege_execution, source_of_truth_untrusted_content_and_prompt_injection_output_validation_rule, source_of_truth_untrusted_content_and_prompt_injection_fail_open_fallback [INFERRED 0.75]
- **AI skill optimization pipeline** — readme_skill_optimization, readme_agent_bridge, prompts_02_fases_9_10_11_skill_optimize_en, prompts_02_fases_9_10_11_skill_optimization_validation, docs_decisiones_optimization_integrity, readme_source_of_truth [INFERRED 0.85]

## Communities (172 total, 45 thin omitted)

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
Cohesion: 0.06
Nodes (39): asDate(), asText(), isRecord(), phases, PublishedSkillsStore, sanitizeEntry(), states, allowedExtensions (+31 more)

### Community 4 - "repositoryScore.js"
Cohesion: 0.19
Nodes (16): clamp(), computeRepositoryScore(), logarithmicRatio(), permissiveOrKnownLicenses, roundOne(), scoreActivity(), scoreForks(), scoreIssues() (+8 more)

### Community 5 - "agentsMd.test.js"
Cohesion: 0.11
Nodes (17): agentsMdConstants, answerKeys, createEmptyAnswers(), hasAnyAnswer(), listEnglishHeadings(), importantSectionLabels, secretRules, answers (+9 more)

### Community 6 - "MemoryStorage"
Cohesion: 0.10
Nodes (16): createPlatformPaths(), MemoryStorage, assert, createModel(), test, assert, createService(), fs (+8 more)

### Community 7 - "platformPaths.js"
Cohesion: 0.10
Nodes (16): nodePath, os, supportedPlatforms, assert, createFixture(), createUvExecutable(), fakeScript, fs (+8 more)

### Community 11 - "createIcon"
Cohesion: 0.13
Nodes (27): createAvatar(), getInitials(), getToneIndex(), createBadge(), createIcon(), iconPaths, buildTree(), createFileTree() (+19 more)

### Community 12 - "Form Controls (Select, Radio)"
Cohesion: 0.08
Nodes (41): createSelectInput(), createToggleSwitch(), variantIcons, createRadioGroup(), showToast(), variantIcons, createSteppedModal(), agentsMdQuestions (+33 more)

### Community 13 - "importer.test.js"
Cohesion: 0.14
Nodes (16): createExecutable(), createFakeGitSetup(), { execFileSync }, fakeScript, findRealGit(), fs, os, path (+8 more)

### Community 14 - "skillManifest.js"
Cohesion: 0.10
Nodes (19): fs, ImportedDetailsService, path, readmeNames, toMcpCandidate(), fs, InstalledDetailsService, fs (+11 more)

### Community 15 - "providerRegistry.js"
Cohesion: 0.06
Nodes (37): extractJsonFromText(), firstLine(), matchesAuthError(), parseJsonLines(), parseJsonSafely(), parseVersion(), authErrorPatterns, claudeCodeCli (+29 more)

### Community 16 - "CLI Install Recipes"
Cohesion: 0.14
Nodes (9): brewRequirement, claudeCodeInstall, codexInstall, geminiCliInstall, githubCliInstall, installRecipes, npmRequirement, openCodeInstall (+1 more)

### Community 17 - "envFileService.js"
Cohesion: 0.09
Nodes (32): dotenv@16.6.1, dotenv, applyEnvChanges(), buildEntryLine(), dotenv, findLineEnd(), isBareSafe(), isWhitespace() (+24 more)

### Community 18 - "createButton"
Cohesion: 0.15
Nodes (19): createButton(), createModal(), typedConfirmDialog(), AgentFileInstallFlow, createParagraph(), createGraphifyActions(), createHealthIndicator(), createTooltipButton() (+11 more)

### Community 19 - "Bootstrap & Brand Icon"
Cohesion: 0.06
Nodes (34): Skima app icon (skima.png), Skima brand identity (S-mark logo), confirmDialog(), bootstrapPage(), settingsSections, ProjectsController, ShellController, SkillTextEditorController (+26 more)

### Community 20 - "mySkills.test.js"
Cohesion: 0.11
Nodes (27): toCaseInsensitiveKey(), errorMessages, SkillCreator, buildFormResponse(), buildFrontmatter(), createFormError(), extractSkillMarkdown(), formResponseFolderOrder (+19 more)

### Community 21 - "appContainer.js"
Cohesion: 0.06
Nodes (21): createAppContainer(), fileNames, fs, path, resolveCatalogDirectory(), CatalogIpcController, DialogIpcController, LibraryIpcController (+13 more)

### Community 22 - "Git Session Service"
Cohesion: 0.14
Nodes (9): createSessionError(), GitSessionService, parseCredentialOutput(), parseScopes(), publishScopes, tokenPatterns, assert, createService() (+1 more)

### Community 23 - "IPC Controllers (AGENTS, AI, Catalog)"
Cohesion: 0.18
Nodes (11): recoverableCodes, crypto, rendererAllowedFields, recoverableCodes, recoverableCodes, recoverableCodes, crypto, scopes (+3 more)

### Community 24 - "Installed Skills Controller"
Cohesion: 0.12
Nodes (15): createInlineEditableTitle(), missingFolderTabReason, projectTabs, ProjectController, readLastTab(), writeLastTab(), createEnvironmentTab(), buildChanges() (+7 more)

### Community 25 - "createNoticeBanner"
Cohesion: 0.16
Nodes (17): createNoticeBanner(), createSearchField(), createInstalledSkillList(), createLabeledField(), createParagraph(), PublishFlow, createModelRestrictionBlock(), loadAgentsWithModels() (+9 more)

### Community 26 - "agentsMdService.js"
Cohesion: 0.20
Nodes (4): AgentsMdService, createError(), hashText(), validateAgentsMd()

### Community 27 - "with Group"
Cohesion: 0.07
Nodes (26): name, runs-on, steps, strategy, CSC_IDENTITY_AUTO_DISCOVERY, jobs, build, os (+18 more)

### Community 28 - "package.json Group"
Cohesion: 0.10
Nodes (26): author, dependencies, ajv@8.20.0, fflate@0.7.5, highlight.js@11.12.0, jsonc-parser@3.3.1, marked@18.1.1, marked-highlight@2.2.4 (+18 more)

### Community 29 - "graphifyService.js"
Cohesion: 0.13
Nodes (14): outputFiles, crypto, diffSnapshots(), fs, parseGodNodes(), path, { pathToFileURL }, snapshotTopLevel() (+6 more)

### Community 30 - "skimaRepositorySource.test.js"
Cohesion: 0.11
Nodes (11): catalogCategories, getSkimaRepositoryConfig(), productionRepository, isSafeTreeEntry(), path, SkimaRepositorySource, assert, commitA (+3 more)

### Community 31 - "gitignoreEditor.js"
Cohesion: 0.25
Nodes (14): detectLineEnding(), appendPattern(), assertRegularFileOrMissing(), containsPattern(), ensureGitignoreEntry(), findGitRoot(), fs, isGitRepository() (+6 more)

### Community 32 - "agentsMdOptimizer.js"
Cohesion: 0.16
Nodes (15): sanitizeAnswers(), AgentsMdOptimizer, boundaryFields, buildPayload(), dataTags, fallbackReasons, isStringArray(), languageInstructions (+7 more)

### Community 33 - "safeArchiveExtractor.js"
Cohesion: 0.10
Nodes (18): ArchiveLimitError, assertNoEscapingLinks(), defaultLimits, extractSafely(), fs, isUnsafeRelativePath(), matchesPrefixes(), normalizeEntryPath() (+10 more)

### Community 34 - "ref_node_assert"
Cohesion: 0.10
Nodes (16): providerRegistry, assert, test, assert, definition, fs, jsonc, os (+8 more)

### Community 35 - "settingsSections.test.js"
Cohesion: 0.22
Nodes (6): assert, fs, listSourceFiles(), path, rootDirectory, test

### Community 36 - "AgentBridge Group"
Cohesion: 0.13
Nodes (8): AgentBridge, buildSchemaInstruction(), createBridgeError(), crypto, fs, outputFormats, RunQueue, effortLevels

### Community 37 - "executableLocator.js Group"
Cohesion: 0.06
Nodes (29): defaultFileSystem, defaultWindowsExtensions, ExecutableLocator, expandWindowsVariables(), fs, nodeVersionManagerRoots, queryWindowsRegistryValue(), readWindowsRegistryPathDefault() (+21 more)

### Community 38 - "projectConfigSchema.js"
Cohesion: 0.12
Nodes (26): createDefaultModelRestriction(), createRestrictionError(), describeRestriction(), isListed(), isModelAllowed(), pickAllowedModel(), restrictionModes, toModelKey() (+18 more)

### Community 39 - "fakeGitEnvironment.js"
Cohesion: 0.11
Nodes (17): graphifyCommands, escapeForCmdArgument(), escapeForCmdCommand(), fs, nodePath, ProcessRunner, scriptExtensions, { spawn } (+9 more)

### Community 40 - "catalogMaintenance.js Group"
Cohesion: 0.13
Nodes (26): buildItem(), buildMcpDefinition(), crypto, downloadSnapshot(), fetchRepositoryMetadata(), fs, fsSync, getJson() (+18 more)

### Community 41 - "createContextTab"
Cohesion: 0.29
Nodes (11): createField(), createQuestionStep(), createContextTab(), createEmptyAnswers(), createParagraph(), unwrap(), clampStep(), getProgressLabel() (+3 more)

### Community 42 - "DetailController"
Cohesion: 0.09
Nodes (16): artifactTypes, findArtifactType(), DetailController, describeManifestIssues(), presentCatalogDetail(), requirementLabels, presentInstallations(), presentInstalledDetail() (+8 more)

### Community 43 - "skillInstaller.js"
Cohesion: 0.15
Nodes (9): crypto, defaultHashLimits, fs, path, crypto, fs, renameWithRetry(), SkillInstaller (+1 more)

### Community 44 - "skillFormView.js"
Cohesion: 0.14
Nodes (11): createTextInput(), createFolderInput(), createFormField(), createProjectFormModal(), getFolderName(), createCounter(), createField(), createTextArea() (+3 more)

### Community 46 - "promptRegistry.js Group"
Cohesion: 0.16
Nodes (15): Read-only mode for Claude Code, Third-party skill review procedure, Phase 10: AI skill optimization, Optimization response validation rules, skill-optimize-en prompt, Agent bridge (runAgent and askAi), Cheap model selection, Editor skill creation assistant (+7 more)

### Community 47 - "CliInstaller Group"
Cohesion: 0.27
Nodes (3): CliInstaller, createInstallerError(), describeStep()

### Community 48 - "agentFileInstaller.js"
Cohesion: 0.16
Nodes (18): yaml@2.9.1, yaml, adaptAgentFile(), buildMarkdown(), formatAdapters, pick(), YAML, crypto (+10 more)

### Community 49 - "shellView.js Group"
Cohesion: 0.16
Nodes (10): createAppLogo(), createNavItem(), createControlButton(), createWindowControls(), createNavGroup(), createSidebar(), createTitleBar(), createAppShell() (+2 more)

### Community 50 - "skillWizardView.js Group"
Cohesion: 0.19
Nodes (13): createPathSettingField(), CliInstallFlow, createCodeBlock(), createParagraph(), unwrap(), allowedAgentBadges, describeAgentRow(), describeCliMessage() (+5 more)

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
Cohesion: 0.23
Nodes (24): asBoolean(), asEnum(), asHttpsUrl(), asInteger(), asIsoDate(), asText(), asTrimmedString(), createDefaultGraphify() (+16 more)

### Community 55 - "ref_node_fs"
Cohesion: 0.07
Nodes (24): crypto, fs, path, crypto, fs, path, fs, path (+16 more)

### Community 56 - "MySkillsStore Group"
Cohesion: 0.16
Nodes (9): writeFileAtomic(), createStoreError(), crypto, fileLimits, fs, MySkillsStore, { zipSync }, hashSkillFolder() (+1 more)

### Community 57 - "fakeAgentEnvironment.js Group"
Cohesion: 0.09
Nodes (23): assert, test, withSetup(), assert, createAskAi(), path, sourceOfTruth, test (+15 more)

### Community 58 - "build Group"
Cohesion: 0.08
Nodes (25): build, appId, asar, directories, extraResources, files, linux, mac (+17 more)

### Community 59 - "mcpDefinitionDetector.js"
Cohesion: 0.27
Nodes (17): dedupeCandidates(), detectMcpDefinitions(), extractCodeBlocks(), fromClaudeAddCommand(), fromConfigObject(), fromPackageJson(), fromPyproject(), fromReadme() (+9 more)

### Community 60 - "providerRegistry.js"
Cohesion: 0.22
Nodes (7): cursor, githubCopilot, amp, goose, kiloCode, rooCode, windsurf

### Community 61 - "mySkillsIpcController.js"
Cohesion: 0.22
Nodes (7): executeWithCode(), MySkillsIpcController, path, formLimits, metadataKeys, skillFileFolders, skillLicenses

### Community 62 - "repositoryImporter.js"
Cohesion: 0.22
Nodes (8): crypto, fs, getDirectorySize(), path, redactUrls(), retryRename(), sanitizeForItemId(), today()

### Community 63 - "ProviderPathResolver Group"
Cohesion: 0.11
Nodes (15): ProviderPathResolver, findProvider(), assert, fs, githubSource, os, path, test (+7 more)

### Community 64 - "skillFolderValidator.js"
Cohesion: 0.24
Nodes (7): folderLimits, fs, listFolder(), path, validateSkillFolder(), fs, path

### Community 65 - "AskAi Group"
Cohesion: 0.19
Nodes (7): AskAi, createAskError(), fs, referenceTags, findPrompt(), neutralizeDelimiters(), renderPromptTemplate()

### Community 66 - "repositoryDetailsService.test.js"
Cohesion: 0.18
Nodes (10): findReadme(), findSkillManifests(), isMarkdownFile(), path, RepositoryDetailsService, assert, files, repository (+2 more)

### Community 67 - "mainWindow.js"
Cohesion: 0.05
Nodes (38): electron, path, allowedRemotePrefixes, GraphViewerRegistry, graphViewerRegistry, hardenGraphViewerWebview(), isGraphViewerGuest(), normalizeFileUrl() (+30 more)

### Community 68 - "MarkdownRenderer"
Cohesion: 0.22
Nodes (8): createMarked(), MarkdownRenderer, assert, context, render(), test, createService(), createFixture()

### Community 69 - "docs/plan-pendiente.md Group"
Cohesion: 0.13
Nodes (16): Scale catalog to about 100 per type, gh CLI flags not verified, Phase 7 remaining: type detection and more agents, Tests not yet executed, Reusable wizard engine, Branch protection rule for master, CODEOWNERS review, Pull request template (+8 more)

### Community 70 - "README.md Group"
Cohesion: 0.14
Nodes (14): Skip duplicate copy when agents share a folder, Uninstall moves skills to trash, JetBrains-style project selector, Left sidebar navigation menu, AGENTS.md project context tab, contextBridge preload, Global and Project views, Install skills and MCP servers to enabled agents (+6 more)

### Community 71 - "electron"
Cohesion: 0.29
Nodes (6): devDependencies, electron@^45.0.0, electron-builder@26.18.0, electron, electron-builder, { contextBridge, ipcRenderer }

### Community 72 - "graphifyRuntime.js"
Cohesion: 0.20
Nodes (7): buildGraphifyEnvironment(), fs, createStatus(), fs, graphifyPackage, GraphifyRuntime, resolveExecutableRelativePath()

### Community 73 - "markdownRenderer.js"
Cohesion: 0.18
Nodes (14): allowedLinkSchemes, convertGitHubBlobToRaw(), createSanitizeOptions(), createSlugger(), encodePath(), hljs, isAbsoluteUrl(), { Marked } (+6 more)

### Community 74 - "InstalledScanner"
Cohesion: 0.23
Nodes (5): AgentSettingsService, createFieldError(), editablePathFields, fs, mcpExtensionsByFormat

### Community 75 - "InstalledSkillsController Group"
Cohesion: 0.14
Nodes (8): createText(), InstalledAgentFilesController, sectionDefinitions, InstalledSkillsController, createSkillsTab(), filterInstalledSkills(), listAgentFilterOptions(), normalize()

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
Cohesion: 0.33
Nodes (5): Native folder picker popup with name and path fields, Initial dark first screen with add-project button, proyectos.json project storage file, proyectos.json legacy format, Saved settings and data in userData

### Community 82 - "fetchUv.js"
Cohesion: 0.17
Nodes (14): crypto, download(), extractFromTarball(), extractFromZip(), fs, fsPromises, main(), os (+6 more)

### Community 83 - "AgentFileInstaller Group"
Cohesion: 0.17
Nodes (6): AgentFileInstaller, createInstallError(), artifactTypeDefinitions, findArtifactTypeDefinition(), listAgentsSupportingType(), createFixture()

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
Nodes (7): createPageHeader(), createEmptyState(), createItemDetailSkeleton(), DetailView, PlaceholderView, ProjectsView, SkillTextEditorView

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
Nodes (48): check(), fs, listStale(), path, readDocuments(), sourceOfTruthDirectory, tasks, writeIndex() (+40 more)

### Community 99 - "CLAUDE.md Group"
Cohesion: 0.33
Nodes (4): Run graphify update after code changes, Graphify knowledge graph in graphify-out, Graphify phases 17 to 19, Graphify integration (partial)

### Community 100 - "agentsMdTemplate.js"
Cohesion: 0.32
Nodes (11): boundaryHeadings, closeOpenFences(), escapeLeadingHeadings(), fence, missingImportantSections(), normalizeText(), renderAgentsMd(), renderCodeBlock() (+3 more)

### Community 101 - "skillInstaller.test.js"
Cohesion: 0.17
Nodes (13): buildTarGz(), createHeader(), writeOctal(), writeString(), zlib, assert, createInstallerSetup(), createTemporaryDirectory() (+5 more)

### Community 102 - "libraryDocument.test.js"
Cohesion: 0.22
Nodes (7): assert, fs, path, rootDirectory, sampleDirectory, schemaDirectory, test

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

### Community 109 - "repositoryUrl.js"
Cohesion: 0.57
Nodes (7): cleanSegments(), failure(), parseHttps(), parseRepositoryUrl(), parseSsh(), stoppingSegments, validateSegments()

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
Nodes (22): configContainsServer(), detectOpenCodeVersion(), jsonc, jsonConfigWriter, parseJsonText(), readPath(), serverContainerPaths, TOML (+14 more)

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

### Community 128 - "projectModel.js"
Cohesion: 0.25
Nodes (6): crypto, fs, limits, permissionModes, quickModelModes, workingDirectoryModes

### Community 129 - "03_editor_skills.md"
Cohesion: 0.25
Nodes (7): Accion, Boton de generar, Editar, Form Response, Instalar, Si no hay una IA configurada, UI

### Community 132 - "skillsSiteView.js"
Cohesion: 0.18
Nodes (5): describeBlockedNavigation(), skillsSite, isInstallRequest(), SkillsSiteController, SkillsSiteView

### Community 136 - "OpenCode version package name split Group"
Cohesion: 0.67
Nodes (3): npm package @opencode/cli, OpenCode v2 install methods, OpenCode version package name split

### Community 137 - "Skill description field Group"
Cohesion: 0.67
Nodes (3): Description checklist, Skill description field, Use when clause

### Community 160 - "portableNames.js"
Cohesion: 0.19
Nodes (12): findCaseInsensitiveCollision(), getReservedBaseName(), hasControlCharacter(), isPortableName(), pathLengthLimits, validatePathLength(), validatePortableName(), windowsForbiddenCharacters (+4 more)

### Community 163 - "graphifyIntegration.test.js"
Cohesion: 0.17
Nodes (12): appendGraphifySection(), extractGraphifySection(), assert, createFixture(), fs, os, path, test (+4 more)

### Community 165 - "skillsSitePreload.js"
Cohesion: 0.33
Nodes (10): applyLayout(), clearPreviousChanges(), createInstallCard(), ensureStyles(), findInstallCommand(), hideRelatedSections(), { ipcRenderer }, placeInstallCard() (+2 more)

### Community 166 - ".showVariants"
Cohesion: 0.38
Nodes (4): createLines(), createParagraph(), GraphifyIntegrationDialog, unwrap()

### Community 168 - "commandsAcrossSystems.test.js"
Cohesion: 0.22
Nodes (8): githubCliTool, assert, fs, listJavaScriptFiles(), path, rootDirectory, shellSpawnPatterns, test

### Community 172 - "05_graphify.md"
Cohesion: 0.22
Nodes (8): Accion, Botones "Abrir...", Configuracion, Deteccion de graphify, Generar el grafo, Gitignore, Instalación de graphify, Verificado de funcionamiento

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 978 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Configuration sections` connect `README.md Group` to `Bootstrap & Brand Icon`?**
  _High betweenness centrality (0.309) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createAppContainer()` (e.g. with `appContainer.js` and `.listModels()`) actually correct?**
  _`createAppContainer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Neutralise delimiters`, `Least privilege execution`, `Codex 32 KiB combined limit` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Service` be split into smaller, more focused modules?**
  _Cohesion score 0.05517503805175038 - nodes in this community are weakly interconnected._
- **Why does `Provider registry (adding an agent)` connect `Unverified or low-confidence provider registry rows Group` to `providerRegistry.js`, `README.md Group`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Codex standalone installer` and `Codex Windows install not confirmed`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `docs/plan-pendiente.md` and `Gemini CLI agent`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._