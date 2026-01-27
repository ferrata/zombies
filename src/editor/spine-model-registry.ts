export interface SpineModelInfo {
  key: string
  name: string
  jsonFile: string
  atlasFile: string
}

/**
 * Registry of available Spine models for the editor.
 * Add new spines here when they are created.
 */
export class SpineModelRegistry {
  private static spines: SpineModelInfo[] = [
    {
      key: 'player',
      name: 'Player (Upper Body)',
      jsonFile: 'player.json',
      atlasFile: 'player.atlas',
    },
    {
      key: 'player-legs',
      name: 'Player Legs',
      jsonFile: 'player-legs.json',
      atlasFile: 'player-legs.atlas',
    },
  ]

  static getSpines(): SpineModelInfo[] {
    return this.spines
  }

  static getSpine(key: string): SpineModelInfo | undefined {
    return this.spines.find((m) => m.key === key)
  }

  static getSpineKeys(): string[] {
    return this.spines.map((m) => m.key)
  }
}
