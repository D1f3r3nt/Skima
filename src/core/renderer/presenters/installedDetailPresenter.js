import { formatDate } from '../services/formatters.js'
import { protectedSkillNotice, skimaArtifactBadge } from '../config/protectedArtifacts.js'

export const presentInstallations = (installations, { onOpenFolder }) => installations.map((installation) => ({
  scope: installation.scope,
  scopeLabel: installation.scopeLabel,
  agentLabels: installation.agentNames,
  displayPath: installation.displayPath + (installation.matchType === 'sameName' ? ' (mismo nombre, instalada a mano)' : ''),
  onOpenFolder: () => onOpenFolder(installation.path)
}))

export const presentInstalledDetail = (details, { isInstalledGlobally, onInstallElsewhere, onUpdate, onUninstall, onOpenFolder, onOpenLink, onBack, backLabel }) => {
  const { row, scope, project, score, documents, fileTree, repositoryMetrics } = details
  const scopeLabel = scope === 'global' ? 'Global' : `Proyecto: ${project?.name ?? ''}`
  const origin = row.origin
  const canUpdate = origin.type === 'github'
  const canUninstall = !row.isSkimaArtifact

  return {
    variant: 'installed',
    typeId: 'skill',
    typeIcon: 'skill',
    typeLabel: 'Skill instalada',
    title: row.name,
    author: origin.type === 'github' ? origin.repository : origin.type === 'manual' ? null : origin.label,
    description: row.description,
    badges: [
      { label: scopeLabel, variant: 'accent' },
      ...(row.isSkimaArtifact ? [skimaArtifactBadge] : []),
      ...(row.differentVersions ? [{ label: 'Versiones distintas', variant: 'warning' }] : []),
      ...(!row.headerValid ? [{ label: 'Cabecera no válida', variant: 'danger' }] : [])
    ],
    compactActions: true,
    primaryAction: isInstalledGlobally ? null : { label: 'Instalar', icon: 'download', onClick: onInstallElsewhere },
    secondaryActions: isInstalledGlobally && canUninstall ? [{ label: 'Desinstalar', icon: 'trash', variant: 'danger', onClick: onUninstall }] : [],
    menuActions: [
      ...(canUpdate ? [{ label: 'Buscar actualización', icon: 'refresh', onClick: onUpdate }] : []),
      ...(isInstalledGlobally || !canUninstall ? [] : [{ label: 'Desinstalar', icon: 'trash', variant: 'danger', onClick: onUninstall }])
    ],
    notices: [
      ...(canUninstall ? [] : [{ variant: 'info', text: protectedSkillNotice }]),
      ...row.issues.map((issue) => ({ variant: issue.severity === 'error' ? 'warning' : 'info', text: issue.message })),
      ...(row.differentVersions ? [{ variant: 'warning', text: 'Esta skill tiene contenido distinto según el agente. Reinstálala para dejar la misma versión en todos.' }] : []),
      ...(row.matchesMySkill && origin.type !== 'mySkill' ? [{ variant: 'info', text: `Tiene el mismo nombre que tu skill «${row.matchesMySkill}» de Mis skills.` }] : [])    ],
    score,
    documents,
    fileTree,
    installations: {
      isLoading: false,
      items: presentInstallations(row.installations.map((installation) => ({ ...installation, scope, scopeLabel })), { onOpenFolder })
    },
    metadata: {
      title: 'Origen',
      entries: [
        { icon: 'info', label: 'Origen', value: origin.type === 'github' ? 'GitHub' : origin.type === 'manual' ? null : origin.label },
        { icon: 'user', label: 'Repositorio', value: origin.repository ?? null },
        { icon: 'folder', label: 'Carpeta', value: origin.subPath || null },
        { icon: 'tag', label: 'Commit', value: origin.commit ? origin.commit.slice(0, 10) : null, title: origin.commit ?? '' },
        { icon: 'clock', label: 'Instalada', value: origin.installedAt ? formatDate(origin.installedAt) : null }
      ],
      topics: repositoryMetrics?.topics ?? [],
      links: origin.type === 'github' ? [{ label: 'Abrir en GitHub', url: `https://github.com/${origin.repository}`, icon: 'externalLink' }] : []
    },
    onOpenLink,
    onBack,
    backLabel
  }
}
