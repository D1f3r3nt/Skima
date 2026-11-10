import { createButton } from '../../../components/atoms/button.js'
import { createBadge } from '../../../components/atoms/badge.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { createModal } from '../../../components/organisms/modal.js'
import { CliInstallFlow } from '../controllers/cliInstallFlow.js'

const tokenHelpUrl = 'https://github.com/settings/personal-access-tokens/new'
const deviceUrl = 'https://github.com/login/device'

const methodLabels = { gh: 'GitHub CLI', 'credential-manager': 'Credencial guardada en el gestor de Git' }

const createParagraph = (text, className = 'settings-group__description') => {
  const paragraphElement = document.createElement('p')
  paragraphElement.className = className
  paragraphElement.textContent = text
  return paragraphElement
}

const createField = ({ id, label, type = 'text', placeholder = '', autocomplete = 'off' }) => {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'profile-field'
  const labelElement = document.createElement('label')
  labelElement.htmlFor = id
  labelElement.textContent = label
  const inputElement = document.createElement('input')
  inputElement.id = id
  inputElement.type = type
  inputElement.className = 'text-input'
  inputElement.placeholder = placeholder
  inputElement.autocomplete = autocomplete
  inputElement.spellcheck = false
  wrapperElement.append(labelElement, inputElement)
  return { element: wrapperElement, input: inputElement }
}

export function createProfileSettingsSection({ apiClient, reportSaving, reportSaved, reportError }) {
  const rootElement = document.createElement('div')
  rootElement.className = 'settings-section'

  const headerElement = document.createElement('div')
  headerElement.className = 'settings-section__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-section__title'
  titleElement.textContent = 'Mi perfil'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-section__description'
  descriptionElement.textContent = 'La sesión de Git/GitHub que ya tienes en este ordenador. Skima la usa para clonar repositorios privados y para publicar tus skills. Skima no guarda ninguna credencial: viven en GitHub CLI o en el gestor de credenciales del sistema.'
  headerElement.append(titleElement, descriptionElement)

  const contentElement = document.createElement('div')
  contentElement.className = 'profile-content'
  rootElement.append(headerElement, contentElement)

  let isDisposed = false
  let loginModal = null
  let unsubscribe = null

  const openLink = (url) => apiClient.openExternalLink(url).catch((error) => reportError(error.message))

  const refresh = async ({ refresh: forceRefresh = true } = {}) => {
    contentElement.replaceChildren(createParagraph('Comprobando la sesión…', 'settings-section__loading'))
    try {
      render(await apiClient.getProfileStatus({ refresh: forceRefresh }))
    } catch (error) {
      reportError(error.message)
      contentElement.replaceChildren(createNoticeBanner({ variant: 'error', text: error.message, actionLabel: 'Reintentar', onAction: () => refresh() }))
    }
  }

  const createSessionCard = (status) => {
    const { session } = status
    const cardElement = document.createElement('article')
    cardElement.className = 'settings-group profile-card'
    const headerRow = document.createElement('div')
    headerRow.className = 'profile-card__header'
    const nameElement = document.createElement('h4')
    nameElement.className = 'agent-row__block-title'
    nameElement.textContent = session.user ? `@${session.user}` : 'Sesión de GitHub'
    headerRow.append(nameElement, createBadge({ label: session.invalid ? 'Sesión caducada' : 'Sesión iniciada', variant: session.invalid ? 'danger' : 'success' }))

    const detailsElement = document.createElement('dl')
    detailsElement.className = 'agent-card__status'
    const addDetail = (term, value) => {
      if (!value) {
        return
      }
      const termElement = document.createElement('dt')
      termElement.textContent = term
      const valueElement = document.createElement('dd')
      valueElement.textContent = value
      detailsElement.append(termElement, valueElement)
    }
    addDetail('Servidor', status.host)
    addDetail('Usuario', session.user)
    addDetail('Nombre', session.name)
    addDetail('Correo', session.email)
    addDetail('Iniciada con', methodLabels[session.method])
    addDetail('Permisos', session.scopes?.length ? session.scopes.join(', ') : (session.method === 'gh' ? 'No se han podido leer' : 'Los define el token'))
    addDetail('Comprobada', session.verifiedOnline ? 'En línea, ahora mismo' : 'Solo en local (sin verificar en línea)')

    const usesElement = document.createElement('ul')
    usesElement.className = 'profile-card__uses'
    const clone = document.createElement('li')
    clone.textContent = session.canClone ? 'Sirve para: clonar repositorios privados.' : 'No sirve ahora para clonar repositorios privados.'
    const publish = document.createElement('li')
    publish.textContent = session.canPublish ? 'Sirve para: publicar skills.' : `No sirve para publicar skills. ${session.publishHint ?? ''}`.trim()
    usesElement.append(clone, publish)

    const actionsElement = document.createElement('div')
    actionsElement.className = 'profile-card__actions'
    actionsElement.append(
      createButton({ label: 'Volver a comprobar', icon: 'refresh', variant: 'secondary', size: 'small', onClick: () => refresh() }),
      createButton({ label: 'Cerrar sesión', variant: 'danger', size: 'small', onClick: () => logout(session) })
    )

    cardElement.append(headerRow, detailsElement, usesElement)
    if (session.invalid) {
      cardElement.append(createNoticeBanner({ variant: 'warning', text: 'La sesión existe pero ya no es válida. Ciérrala e inicia sesión de nuevo.' }))
    }
    if (!session.verifiedOnline && session.method === 'gh') {
      cardElement.append(createNoticeBanner({ variant: 'info', text: 'No se ha podido verificar online. Se muestra lo que hay en este ordenador.' }))
    }
    cardElement.append(actionsElement)
    return cardElement
  }

  const logout = async (session) => {
    const accepted = await confirmDialog({
      title: 'Cerrar la sesión de GitHub',
      message: session.method === 'gh'
        ? 'Se ejecutará «gh auth logout» para github.com. Dejarás de poder clonar repositorios privados y publicar skills hasta que vuelvas a iniciar sesión.'
        : 'Se pedirá a Git que olvide la credencial guardada para github.com (equivale a «git credential reject»).',
      confirmLabel: 'Cerrar sesión',
      isDestructive: true
    })
    if (!accepted) {
      return
    }
    reportSaving()
    try {
      render(await apiClient.logoutProfile())
      reportSaved()
    } catch (error) {
      reportError(error.message)
    }
  }

  const showLoginModal = () => {
    const bodyElement = document.createElement('div')
    bodyElement.className = 'profile-login'
    const statusElement = createParagraph('Esperando el código de GitHub…')
    statusElement.setAttribute('role', 'status')
    const codeElement = document.createElement('p')
    codeElement.className = 'profile-login__code'
    codeElement.hidden = true
    bodyElement.append(statusElement, codeElement)
    const cancelButton = createButton({ label: 'Cancelar', variant: 'secondary' })
    const copyButton = createButton({ label: 'Copiar código', icon: 'copy', variant: 'secondary' })
    const openButton = createButton({ label: 'Abrir GitHub', icon: 'externalLink' })
    copyButton.hidden = true
    openButton.hidden = true
    loginModal = createModal({ title: 'Iniciar sesión con GitHub CLI', content: bodyElement, actions: [cancelButton, copyButton, openButton], onClose: () => { apiClient.cancelGhLogin().catch(() => {}); loginModal = null } })
    cancelButton.addEventListener('click', () => loginModal?.close())
    loginModal.open()
    return { statusElement, codeElement, copyButton, openButton }
  }

  const startGhLogin = async () => {
    const parts = showLoginModal()
    unsubscribe?.()
    unsubscribe = apiClient.onProfileLoginEvent((payload) => {
      if (isDisposed) {
        return
      }
      if (payload.type === 'code') {
        parts.codeElement.textContent = payload.code
        parts.codeElement.hidden = false
        parts.statusElement.textContent = 'Copia este código, abre GitHub e introdúcelo para autorizar a Skima a usar tu sesión de GitHub CLI.'
        parts.copyButton.hidden = false
        parts.openButton.hidden = false
        parts.copyButton.onclick = () => navigator.clipboard.writeText(payload.code).then(() => { parts.copyButton.querySelector('span').textContent = 'Copiado' }).catch(() => reportError('No se ha podido copiar el código.'))
        parts.openButton.onclick = () => openLink(payload.verificationUrl ?? deviceUrl)
        return
      }
      const finalMessages = { cancelled: 'Inicio de sesión cancelado.', timeout: 'Ha pasado el tiempo máximo sin completar el inicio de sesión.', failed: payload.message }
      if (payload.type === 'done') {
        loginModal?.close()
        render(payload.status)
        reportSaved()
        return
      }
      if (finalMessages[payload.type]) {
        parts.statusElement.textContent = finalMessages[payload.type]
        parts.codeElement.hidden = true
      }
    })
    try {
      await apiClient.startGhLogin()
    } catch (error) {
      parts.statusElement.textContent = error.message
    }
  }

  const createLoginOptions = (status) => {
    const sectionElement = document.createElement('div')
    sectionElement.className = 'profile-options'
    sectionElement.append(createParagraph('Para clonar repositorios privados y publicar tus skills, Git necesita una sesión iniciada. Elige cómo hacerlo:', 'settings-group__description'))

    const ghCard = document.createElement('article')
    ghCard.className = 'settings-group'
    const ghTitle = document.createElement('h4')
    ghTitle.className = 'agent-row__block-title'
    ghTitle.textContent = 'Iniciar sesión con GitHub CLI (recomendado)'
    ghCard.append(ghTitle, createParagraph('Permite clonar repositorios privados y también publicar skills. Se abre la página de GitHub en tu navegador y escribes un código de un solo uso.'))
    if (status.gh.installed) {
      ghCard.append(createButton({ label: 'Iniciar sesión con GitHub CLI', onClick: () => startGhLogin() }))
    } else {
      ghCard.append(
        createNoticeBanner({ variant: 'info', text: 'GitHub CLI no está instalado. Instálalo desde su página oficial y vuelve a comprobar.', actionLabel: 'Descargar GitHub CLI', onAction: () => openLink(status.gh.downloadUrl) }),
        createButton({ label: 'Instalar GitHub CLI', icon: 'download', onClick: () => new CliInstallFlow({ apiClient, onFinished: () => refresh() }).start({ toolId: 'github-cli' }) }),
        createButton({ label: 'Volver a comprobar', variant: 'secondary', size: 'small', icon: 'refresh', onClick: () => refresh() })
      )
    }

    const tokenCard = document.createElement('article')
    tokenCard.className = 'settings-group'
    const tokenTitle = document.createElement('h4')
    tokenTitle.className = 'agent-row__block-title'
    tokenTitle.textContent = 'Usar un token de acceso personal'
    const hostField = createField({ id: 'profileHost', label: 'Servidor' })
    hostField.input.value = status.host
    hostField.input.readOnly = true
    const userField = createField({ id: 'profileUser', label: 'Usuario de GitHub', autocomplete: 'username' })
    const tokenField = createField({ id: 'profileToken', label: 'Token', type: 'password', autocomplete: 'off' })
    const errorElement = createParagraph('', 'form-field__error')
    errorElement.hidden = true
    const saveButton = createButton({ label: 'Guardar token', variant: 'secondary', onClick: async () => {
      errorElement.hidden = true
      saveButton.disabled = true
      reportSaving()
      try {
        const nextStatus = await apiClient.saveProfileToken({ host: status.host, username: userField.input.value.trim(), token: tokenField.input.value.trim() })
        tokenField.input.value = ''
        userField.input.value = ''
        render(nextStatus)
        reportSaved()
      } catch (error) {
        errorElement.textContent = error.message
        errorElement.hidden = false
        reportError(error.message)
      } finally {
        tokenField.input.value = ''
        saveButton.disabled = false
      }
    } })
    tokenCard.append(
      tokenTitle,
      createNoticeBanner({ variant: 'warning', text: 'Con un token solo se pueden clonar repositorios. Para publicar skills hace falta GitHub CLI.' }),
      hostField.element,
      userField.element,
      tokenField.element,
      createParagraph('Crea un token de permisos finos con acceso de solo lectura al contenido de los repositorios que necesites. Skima lo entrega al gestor de credenciales de Git y no lo guarda.'),
      createButton({ label: 'Crear un token en GitHub', variant: 'ghost', size: 'small', icon: 'externalLink', onClick: () => openLink(tokenHelpUrl) }),
      errorElement,
      saveButton
    )
    sectionElement.append(ghCard, tokenCard)
    return sectionElement
  }

  const render = (status) => {
    if (isDisposed) {
      return
    }
    if (!status.git.installed) {
      contentElement.replaceChildren(createNoticeBanner({
        variant: 'warning',
        text: 'Hace falta Git para clonar repositorios y publicar skills. Instálalo y vuelve a comprobar.',
        actionLabel: 'Descargar Git',
        onAction: () => openLink(status.git.downloadUrl)
      }), createButton({ label: 'Volver a comprobar', variant: 'secondary', size: 'small', icon: 'refresh', onClick: () => refresh() }))
      return
    }
    contentElement.replaceChildren(status.session ? createSessionCard(status) : createLoginOptions(status))
  }

  refresh({ refresh: false })

  return {
    element: rootElement,
    dispose: () => {
      isDisposed = true
      unsubscribe?.()
      loginModal?.close()
    }
  }
}
