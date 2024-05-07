import menuCss from './menu.scss?inline'
import menuHtml from './menu.html?raw'

chrome.runtime.onMessage.addListener(request => {
  if (request.type === 'toggle-modal') {
    toggleModal()
  }
  return undefined
})

class MenuHandler {
  selectedIndex = 0
  listItems: NodeListOf<HTMLUListElement>
  keyListener: ((e: KeyboardEvent) => Promise<void>) | undefined

  constructor(
    private shadowRoot: ShadowRoot,
    private closeDialog: () => void,
  ) {
    this.listItems = this.shadowRoot.querySelectorAll('ul li')!
  }

  select(index: number): void {
    if (index !== this.selectedIndex) {
      this.listItems[this.selectedIndex].className = ''
    }
    this.listItems[index].className = 'selected'
    this.selectedIndex = index
  }

  async runCommand(): Promise<void> {
    switch (this.selectedIndex) {
      case 0:
        await chrome.runtime.sendMessage('restore-tab-groups')
        break

      case 1:
        await chrome.runtime.sendMessage('bookmark-tab-groups')
        break
    }
  }

  destroy() {
    if (this.keyListener) {
      document.removeEventListener('keydown', this.keyListener)
      this.keyListener = undefined
    }
  }

  async onKey(e: KeyboardEvent): Promise<void> {
    e.preventDefault()

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyK':
      case 'KeyE':
        this.select((this.selectedIndex + 1) % this.listItems.length)
        break

      case 'ArrowDown':
      case 'KeyJ':
      case 'KeyN':
        this.select((this.selectedIndex + this.listItems.length - 1) % this.listItems.length)
        break

      case 'Enter':
        await this.runCommand()
        this.closeDialog()
        break

      case 'Escape':
        this.closeDialog()
        break
    }
  }

  start(): void {
    this.select(this.selectedIndex)
    document.addEventListener('keydown', (this.keyListener = this.onKey.bind(this)))
  }
}

class Menu {
  modal: HTMLDialogElement | undefined
  handler: MenuHandler | undefined
  selectedIndex = 0

  close() {
    this.handler?.destroy()
    this.handler = undefined
    this.modal?.remove()
    this.modal = undefined
  }

  async toggle(): Promise<void> {
    this.selectedIndex = 0

    if (this.modal) {
      this.close()
      return
    }

    this.modal = document.createElement('dialog')
    this.modal.id = 'kinemi-kurut-dialog'
    this.modal.setAttribute(
      'style',
      `
        border: none;
        height: 100%;
        margin: 0 auto;
        padding: 0;
        overflow: hidden;
        background-color: transparent;
        width: 75%;
        outline: none !important;
      `,
    )
    this.modal.innerHTML = `<div id="kinemi-kurut-host"></div>`

    document.body.appendChild(this.modal)
    const dialog = document.querySelector('dialog')
    dialog!.showModal()

    const host = document.querySelector('#kinemi-kurut-host')
    const shadow = host!.attachShadow({ mode: 'open' })
    const shadowStyles = new CSSStyleSheet()
    await shadowStyles.replace(menuCss)
    shadow.adoptedStyleSheets = [shadowStyles]
    shadow.innerHTML = menuHtml

    const handler = (this.handler = new MenuHandler(shadow, this.close.bind(this)))
    handler.start()

    dialog!.onclose = this.close.bind(this)
  }
}

const menu = new Menu()

const toggleModal = async (): Promise<void> => {
  menu.toggle()
}
