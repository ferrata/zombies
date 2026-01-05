export interface SpineModelInfo {
  key: string;
  name: string;
  jsonFile: string;
  atlasFile: string;
}

/**
 * Registry of available Spine models for the editor.
 * Add new models here when they are created.
 */
export class SpineModelRegistry {
  private static models: SpineModelInfo[] = [
    {
      key: "player",
      name: "Player (Upper Body)",
      jsonFile: "player.json",
      atlasFile: "player.atlas",
    },
    {
      key: "player-legs",
      name: "Player Legs",
      jsonFile: "player-legs.json",
      atlasFile: "player-legs.atlas",
    },
    {
      key: "zombie",
      name: "Zombie",
      jsonFile: "zombie.json",
      atlasFile: "zombie.atlas",
    },
  ];

  static getModels(): SpineModelInfo[] {
    return this.models;
  }

  static getModel(key: string): SpineModelInfo | undefined {
    return this.models.find((m) => m.key === key);
  }

  static getModelKeys(): string[] {
    return this.models.map((m) => m.key);
  }
}
