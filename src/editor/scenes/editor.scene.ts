import { SpineModelRegistry } from '../spine-model-registry'
import { editorState } from '../editor-state'

export default class EditorScene extends Phaser.Scene {
  private currentSpine: SpineGameObject | null = null
  private spineSelector!: HTMLSelectElement
  private animationList!: HTMLUListElement
  private loopToggle!: HTMLInputElement
  private loopDelayInput!: HTMLInputElement
  private loadingOverlay!: HTMLElement
  private loopDelayTimer: number | null = null
  private currentAnimationName: string | null = null

  constructor() {
    super('EditorScene')
  }

  create() {
    // Get DOM elements
    this.spineSelector = document.getElementById('spine-selector') as HTMLSelectElement
    this.animationList = document.getElementById('animation-list') as HTMLUListElement
    this.loopToggle = document.getElementById('loop-toggle') as HTMLInputElement
    this.loopDelayInput = document.getElementById('loop-delay') as HTMLInputElement
    this.loadingOverlay = document.getElementById('loading-overlay') as HTMLElement

    // Set up the scene background
    this.cameras.main.setBackgroundColor(0x2d2d2d)

    // Initialize UI
    this.setupSpineSelector()
    this.setupLoopToggle()
    this.setupLoopDelay()

    // Load persisted state
    this.restoreState()

    // Hide loading overlay
    this.loadingOverlay.classList.add('hidden')
  }

  private setupSpineSelector() {
    const spines = SpineModelRegistry.getSpines()

    // Clear and populate the selector
    this.spineSelector.innerHTML = ''

    // Add placeholder option
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = 'Select a spine...'
    this.spineSelector.appendChild(placeholder)

    // Add spine options
    for (const spine of spines) {
      const option = document.createElement('option')
      option.value = spine.key
      option.textContent = spine.name
      this.spineSelector.appendChild(option)
    }

    // Handle selection change
    this.spineSelector.addEventListener('change', () => {
      const selectedKey = this.spineSelector.value
      if (selectedKey) {
        this.loadSpine(selectedKey)
        editorState.selectedSpine = selectedKey
        // Clear animation selection when spine changes
        editorState.selectedAnimation = null
      } else {
        this.clearPreview()
      }
    })
  }

  private setupLoopToggle() {
    // Restore loop state
    this.loopToggle.checked = editorState.loop

    this.loopToggle.addEventListener('change', () => {
      editorState.loop = this.loopToggle.checked
      // Replay current animation with new loop setting
      if (this.currentSpine && editorState.selectedAnimation) {
        this.playAnimation(editorState.selectedAnimation)
      }
    })
  }

  private setupLoopDelay() {
    // Restore loop delay state
    this.loopDelayInput.value = String(editorState.loopDelay)

    this.loopDelayInput.addEventListener('change', () => {
      const delay = parseInt(this.loopDelayInput.value, 10) || 0
      editorState.loopDelay = Math.max(0, Math.min(5000, delay))
      this.loopDelayInput.value = String(editorState.loopDelay)
      // Replay current animation with new delay setting
      if (this.currentSpine && editorState.selectedAnimation) {
        this.playAnimation(editorState.selectedAnimation)
      }
    })
  }

  private restoreState() {
    const savedSpine = editorState.selectedSpine
    const savedAnimation = editorState.selectedAnimation

    if (savedSpine) {
      this.spineSelector.value = savedSpine
      this.loadSpine(savedSpine, savedAnimation)
    }
  }

  private loadSpine(key: string, autoPlayAnimation?: string | null) {
    // Clear existing spine object
    this.clearPreview()

    try {
      // Create the spine game object
      const centerX = this.cameras.main.width / 2
      const centerY = this.cameras.main.height / 2

      this.currentSpine = this.add.spine(centerX, centerY, key)

      // Scale to fit nicely in the preview
      this.autoScale()

      // Get available animations
      const animations = this.getAnimations()

      // Populate animation list
      this.populateAnimationList(animations)

      // Auto-play animation if specified or first available
      if (autoPlayAnimation && animations.includes(autoPlayAnimation)) {
        this.playAnimation(autoPlayAnimation)
        this.highlightAnimation(autoPlayAnimation)
      } else if (animations.length > 0) {
        // Play first animation by default
        this.playAnimation(animations[0])
        this.highlightAnimation(animations[0])
        editorState.selectedAnimation = animations[0]
      }
    } catch (error) {
      console.error('Failed to load spine:', error)
      this.animationList.innerHTML = '<li class="animation-item">Error loading spine</li>'
    }
  }

  private autoScale() {
    if (!this.currentSpine) return

    const bounds = this.currentSpine.getBounds()
    const canvasWidth = this.cameras.main.width
    const canvasHeight = this.cameras.main.height
    const padding = 100

    const maxWidth = canvasWidth - padding
    const maxHeight = canvasHeight - padding

    const scaleX = maxWidth / bounds.size.x
    const scaleY = maxHeight / bounds.size.y
    const scale = Math.min(scaleX, scaleY, 1.5) // Cap at 1.5x

    this.currentSpine.setScale(scale)
  }

  private getAnimations(): string[] {
    if (!this.currentSpine) return []

    try {
      const skeletonData = this.currentSpine.skeleton.data
      const animations: string[] = []

      for (let i = 0; i < skeletonData.animations.length; i++) {
        animations.push(skeletonData.animations[i].name)
      }

      return animations.sort()
    } catch (error) {
      console.error('Failed to get animations:', error)
      return []
    }
  }

  private populateAnimationList(animations: string[]) {
    this.animationList.innerHTML = ''

    if (animations.length === 0) {
      const item = document.createElement('li')
      item.className = 'animation-item'
      item.textContent = 'No animations found'
      this.animationList.appendChild(item)
      return
    }

    for (const anim of animations) {
      const item = document.createElement('li')
      item.className = 'animation-item'
      item.textContent = anim
      item.dataset.animation = anim

      item.addEventListener('click', () => {
        this.playAnimation(anim)
        this.highlightAnimation(anim)
        editorState.selectedAnimation = anim
      })

      this.animationList.appendChild(item)
    }
  }

  private highlightAnimation(animationName: string) {
    // Remove active class from all items
    const items = this.animationList.querySelectorAll('.animation-item')
    items.forEach((item) => item.classList.remove('active'))

    // Add active class to selected item
    const selected = this.animationList.querySelector(`[data-animation="${animationName}"]`)
    if (selected) {
      selected.classList.add('active')
    }
  }

  private playAnimation(animationName: string) {
    if (!this.currentSpine) return

    // Clear any pending loop timer
    this.clearLoopTimer()
    this.currentAnimationName = animationName

    try {
      const loop = this.loopToggle.checked
      // Idle and move animations should loop without delay
      const isLoopingAnimation =
        animationName.startsWith('idle_') || animationName.startsWith('move_')
      const delay = isLoopingAnimation ? 0 : editorState.loopDelay

      // If looping with delay, we handle the loop manually
      if (loop && delay > 0) {
        this.currentSpine.play(animationName, false)
        this.setupDelayedLoop(animationName, delay)
      } else {
        this.currentSpine.play(animationName, loop)
      }
    } catch (error) {
      console.error('Failed to play animation:', error)
    }
  }

  private setupDelayedLoop(animationName: string, delay: number) {
    if (!this.currentSpine) return

    // Listen for animation complete - use full listener interface
    const listener: spine.AnimationStateListener2 = {
      start: () => {},
      interrupt: () => {},
      end: () => {},
      dispose: () => {},
      event: () => {},
      complete: () => {
        // Only restart if this is still the current animation and looping is enabled
        if (
          this.currentAnimationName === animationName &&
          this.loopToggle.checked &&
          this.currentSpine
        ) {
          this.loopDelayTimer = window.setTimeout(() => {
            if (
              this.currentSpine &&
              this.currentAnimationName === animationName &&
              this.loopToggle.checked
            ) {
              this.currentSpine.play(animationName, false)
            }
          }, delay)
        }
      },
    }
    this.currentSpine.state.addListener(listener)
  }

  private clearLoopTimer() {
    if (this.loopDelayTimer !== null) {
      window.clearTimeout(this.loopDelayTimer)
      this.loopDelayTimer = null
    }
    // Clear any existing listeners
    if (this.currentSpine) {
      this.currentSpine.state.clearListeners()
    }
  }

  private clearPreview() {
    this.clearLoopTimer()
    this.currentAnimationName = null
    if (this.currentSpine) {
      this.currentSpine.destroy()
      this.currentSpine = null
    }
  }
}
