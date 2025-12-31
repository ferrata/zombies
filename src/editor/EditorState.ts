const STORAGE_KEY = "spine-editor-state";

export interface EditorStateData {
  selectedModel: string | null;
  selectedAnimation: string | null;
  loop: boolean;
  loopDelay: number;
}

const defaultState: EditorStateData = {
  selectedModel: null,
  selectedAnimation: null,
  loop: true,
  loopDelay: 500,
};

/**
 * Manages editor state persistence using localStorage.
 */
export class EditorState {
  private state: EditorStateData;

  constructor() {
    this.state = this.load();
  }

  private load(): EditorStateData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultState, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Failed to load editor state:", e);
    }
    return { ...defaultState };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Failed to save editor state:", e);
    }
  }

  get selectedModel(): string | null {
    return this.state.selectedModel;
  }

  set selectedModel(value: string | null) {
    this.state.selectedModel = value;
    this.save();
  }

  get selectedAnimation(): string | null {
    return this.state.selectedAnimation;
  }

  set selectedAnimation(value: string | null) {
    this.state.selectedAnimation = value;
    this.save();
  }

  get loop(): boolean {
    return this.state.loop;
  }

  set loop(value: boolean) {
    this.state.loop = value;
    this.save();
  }

  get loopDelay(): number {
    return this.state.loopDelay;
  }

  set loopDelay(value: number) {
    this.state.loopDelay = value;
    this.save();
  }
}

// Export a singleton instance
export const editorState = new EditorState();
