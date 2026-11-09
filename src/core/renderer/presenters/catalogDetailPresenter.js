import { findArtifactType } from '../config/artifactTypes.js'
import { formatDate, formatNumber, formatRelativeTime } from '../services/formatters.js'

const describeManifestIssues = (skillManifest) => {
  if (!skillManifest || skillManifest.issues.length === 0) {
    return []
  }
  const errors = skillManifest.issues.filter((issue) => issue.severity === 'error')
  const warnings = skillManifest.issues.filter((issue) => issue.severity === 'warning')
  return [
    ...(errors.length ? [{ variant: 'warning', text: `El SKILL.md no cumple la especificación: ${errors.map((issue) => issue.message).join(' ')}` }] : []),
    ...(warnings.length ? [{ variant: 'info', text: `Avisos del SKILL.md: ${warnings.map((issue) => issue.message).join(' ')}` }] : [])
  ]
}

export const presentCatalogDetail = (details, { onInstall, onOpenLink, onBack, installations = null }) => {
  const { item, metrics, score, documents, skillManifest, skills, warnings } = details
  const artifactType = findArtifactType(item.type) ?? findArtifactType('skill')
  const githubUrl = item.url ?? metrics.url

  return {
    variant: 'catalog',
    typeId: artifactType.id,
    typeIcon: artifactType.icon,
    typeLabel: artifactType.singularLabel,
    title: item.name,
    author: item.owner,
    description: item.description,
    badges: [
      ...(item.featured ? [{ label: 'Destacado', variant: 'accent' }] : []),
      ...(metrics.archived ? [{ label: 'Archivado' }] : [])
    ],
    primaryAction: artifactType.isInstallable
      ? { label: 'Instalar', icon: 'download', onClick: onInstall }
      : { label: 'Instalar', icon: 'download', disabled: true, hint: `La instalación de ${artifactType.label.toLowerCase()} todavía no está disponible: de momento Skima instala skills y servidores MCP.` },
    score,
    notices: [
      ...warnings.map((text) => ({ variant: 'warning', text })),
      ...describeManifestIssues(skillManifest)
    ],
    documents,
    installations,
    skills,
    metadata: {
      title: 'Información',
      entries: [
        { icon: 'star', label: 'Estrellas', value: formatNumber(metrics.stars) },
        { icon: 'fork', label: 'Forks', value: formatNumber(metrics.forks) },
        { icon: 'issue', label: 'Issues abiertas', value: formatNumber(metrics.openIssues) },
        { icon: 'clock', label: 'Última actualización', value: formatRelativeTime(metrics.pushedAt), title: formatDate(metrics.pushedAt) },
        { icon: 'scale', label: 'Licencia', value: metrics.license ?? metrics.licenseName ?? 'Sin licencia' },
        { icon: 'user', label: 'Repositorio', value: item.repository },
        { icon: 'folder', label: 'Carpeta', value: item.subPath || null },
        { icon: 'tag', label: 'Rama', value: details.ref }
      ],
      topics: metrics.topics,
      links: [
        { label: 'Abrir en GitHub', url: githubUrl, icon: 'externalLink' },
        ...(metrics.homepage ? [{ label: 'Sitio web', url: metrics.homepage, icon: 'globe' }] : [])
      ]
    },
    onOpenLink,
    onBack,
    backLabel: 'Volver al catálogo'
  }
}
