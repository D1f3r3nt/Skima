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

const requirementLabels = { node: 'Node.js', python: 'Python', uv: 'uv', docker: 'Docker', git: 'Git', network: 'conexión a internet', account: 'una cuenta en el servicio' }

export const presentCatalogDetail = (details, { onInstall, onOpenLink, onBack, onRemoveImported = null, installations = null }) => {
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
      ...(item.origin === 'skima' ? [{ label: 'Verificado por Skima', variant: 'success' }] : []),
      ...(item.origin === 'imported' ? [{ label: 'Importado', variant: 'warning' }] : []),
      ...(item.featured ? [{ label: 'Destacado', variant: 'accent' }] : []),
      ...(metrics.archived ? [{ label: 'Archivado' }] : [])
    ],
    primaryAction: artifactType.isInstallable
      ? { label: 'Instalar', icon: 'download', onClick: onInstall, ...(item.isInstallable === false ? { disabled: true, hint: 'Este elemento no cumple el formato y no se puede instalar.' } : {}) }
      : { label: 'Instalar', icon: 'download', disabled: true, hint: `La instalación de ${artifactType.label.toLowerCase()} todavía no está disponible: de momento Skima instala skills y servidores MCP.` },
    score: details.isBasic || details.isImported || details.isSkima ? null : score,
    fileTree: details.files ? { filePaths: details.files, isTruncated: false } : undefined,
    secondaryActions: item.origin === 'imported' && onRemoveImported ? [{ label: 'Quitar de importados', icon: 'trash', variant: 'danger', onClick: onRemoveImported }] : [],
    notices: [
      ...(item.notice ? [{ variant: 'info', text: item.notice }] : []),
      ...(item.requirements?.length ? [{ variant: 'info', text: `Necesita en tu equipo: ${item.requirements.map((requirement) => requirementLabels[requirement] ?? requirement).join(', ')}.` }] : []),
      ...warnings.map((text) => ({ variant: 'warning', text })),
      ...describeManifestIssues(skillManifest)
    ],
    documents,
    installations,
    skills,
    metadata: {
      title: 'Información',
      entries: [
        ...(['imported', 'skima'].includes(item.origin) ? [] : [
          { icon: 'star', label: 'Estrellas', value: formatNumber(metrics.stars) },
          { icon: 'fork', label: 'Forks', value: formatNumber(metrics.forks) },
          { icon: 'issue', label: 'Issues abiertas', value: formatNumber(metrics.openIssues) }
        ]),
        { icon: 'clock', label: 'Última actualización', value: formatRelativeTime(metrics.pushedAt), title: formatDate(metrics.pushedAt) },
        ...(item.origin === 'skima' ? [] : item.origin === 'imported' ? [{ icon: 'clock', label: 'Importado el', value: formatDate(item.importInfo.importedAt) }] : [{ icon: 'scale', label: 'Licencia', value: metrics.license ?? metrics.licenseName ?? 'Sin licencia' }]),
        { icon: 'user', label: 'Repositorio', value: item.repository },
        { icon: 'folder', label: 'Carpeta', value: item.subPath || null },
        { icon: 'tag', label: ['catalog', 'skima'].includes(details.item.origin) ? 'Commit' : details.item.origin === 'imported' ? 'Commit importado' : 'Rama', value: /^[0-9a-f]{40}$/.test(details.ref) ? details.ref.slice(0, 10) : details.ref }
      ],
      topics: metrics.topics,
      links: [
        { label: item.origin === 'imported' ? 'Abrir el repositorio original' : item.origin === 'skima' ? 'Ver en GitHub' : 'Abrir en GitHub', url: githubUrl, icon: 'externalLink' },
        ...(metrics.homepage ? [{ label: 'Sitio web', url: metrics.homepage, icon: 'globe' }] : [])
      ]
    },
    onOpenLink,
    onBack,
    backLabel: 'Volver al catálogo'
  }
}
