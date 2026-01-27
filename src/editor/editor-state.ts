const STORAGE_KEY = 'spine-editor-state'

export type EditorTab = 'spine' | 'models'

export interface EditorStateData {
  activeTab: EditorTab
  selectedSpine: string | null
  selectedAnimation: string | null
  loop: boolean
  loopDelay: number
  // Models tab state
  modelsSelectedState: string | null
}

const defaultState: EditorStateData = {
  activeTab: 'spine',
  selectedSpine: null,
  selectedAnimation: null,
  loop: true,
  loopDelay: 500,
  modelsSelectedState: null,
}

/**
 * Manages editor state persistence using localStorage.
 */
export class EditorState {
  private state: EditorStateData

  constructor() {
    this.state = this.load()
  }

  private load(): EditorStateData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...defaultState, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('Failed to load editor state:', e)
    }
    return { ...defaultState }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save editor state:', e)
    }
  }

  get selectedSpine(): string | null {
    return this.state.selectedSpine
  }

  set selectedSpine(value: string | null) {
    this.state.selectedSpine = value
    this.save()
  }

  get selectedAnimation(): string | null {
    return this.state.selectedAnimation
  }

  set selectedAnimation(value: string | null) {
    this.state.selectedAnimation = value
    this.save()
  }

  get loop(): boolean {
    return this.state.loop
  }

  set loop(value: boolean) {
    this.state.loop = value
    this.save()
  }

  get loopDelay(): number {
    return this.state.loopDelay
  }

  set loopDelay(value: number) {
    this.state.loopDelay = value
    this.save()
  }

  get activeTab(): EditorTab {
    return this.state.activeTab
  }

  set activeTab(value: EditorTab) {
    this.state.activeTab = value
    this.save()
  }

  get modelsSelectedState(): string | null {
    return this.state.modelsSelectedState
  }

  set modelsSelectedState(value: string | null) {
    this.state.modelsSelectedState = value
    this.save()
  }
}

// Export a singleton instance
export const editorState = new EditorState()
