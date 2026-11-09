import { formatDate } from '../services/formatters.js'
import { presentInstallations } from './installedDetailPresenter.js'

export const presentMySkillDetail = (skill, { installations, handlers }) => {
  const outdated = installations.items.filter((installation) => installation.contentHash && installation.contentHash !== skill.contentHash)
  const generation = skill.generation ?? {}
  return {
    variant: 'mySkill',
    typeId: 'skill',
    typeIcon: 'skill',
    typeLabel: 'Skill propia',
    title: skill.name,
    author: 'Mis skills',
    description: generation.slots?.description ?? '',
    badges: [generation.optimized ? { label: 'Optimizada con IA', variant: 'success' } : { label: 'Tu texto' }],
    primaryAction: { label: 'Instalar', icon: 'download', onClick: handlers.onInstall },
    secondaryActions: [
      { label: 'Editar', icon: 'editor', onClick: handlers.onEdit },
      { label: 'Duplicar', icon: 'copy', onClick: handlers.onDuplicate },
      { label: 'Exportar .zip', icon: 'download', onClick: () => handlers.onExport('zip') },
      { label: 'Exportar carpeta', icon: 'folderOpen', onClick: () => handlers.onExport('folder') },
      { label: 'Eliminar', icon: 'trash', variant: 'danger', onClick: handlers.onRemove }
    ],
    notices: outdated.length > 0
      ? [{
        variant: 'warning',
        text: `Has cambiado esta skill y ${outdated.length === 1 ? 'una copia instalada no se ha actualizado' : `${outdated.length} copias instaladas no se han actualizado`}: las copias no se actualizan solas.`,
        actionLabel: 'Reinstalar',
        onAction: handlers.onReinstall
      }]
      : [],
    score: null,
    documents: [{ id: 'skill', label: 'SKILL.md', html: skill.html }],
    fileTree: { filePaths: skill.files, isTruncated: false },
    installations: {
      isLoading: installations.isLoading,
      emptyText: 'Todavía no la has instalado en ningún agente.',
      items: presentInstallations(installations.items, { onOpenFolder: handlers.onOpenFolder })
    },
    metadata: {
      title: 'Información',
      entries: [
        { icon: 'clock', label: 'Creada', value: skill.createdAt ? formatDate(skill.createdAt) : null },
        { icon: 'clock', label: 'Actualizada', value: skill.updatedAt ? formatDate(skill.updatedAt) : null },
        { icon: 'info', label: 'Optimizada con', value: generation.optimized ? `${generation.model ?? 'modelo por defecto'} vía ${generation.agentName}` : null }
      ],
      topics: [],
      links: []
    },
    onOpenLink: handlers.onOpenLink,
    onBack: handlers.onBack,
    backLabel: 'Volver a Mis skills'
  }
}
