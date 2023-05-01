type AssetType = "2D Art" | "Textures" | "Music" | "Sound Effects" | "Fonts";

export interface Asset {
  type: AssetType;
  name: string;
  url: string;
}

export interface Credit {
  author: string;
  url?: string;
  assets: Asset[];
}

export const credits: Credit[] = [
  {
    author: "Riley Gombart",
    url: "https://opengameart.org/users/rileygombart",
    assets: [
      {
        type: "2D Art",
        name: "Animated Top Down Survivor Player",
        url: "https://opengameart.org/content/animated-top-down-survivor-player",
      },
    ],
  },
  {
    author: "Kay Lousberg",
    url: "https://www.kaylousberg.com/",
    assets: [
      {
        type: "2D Art",
        name: "2D Guns",
        url: "https://opengameart.org/content/2d-guns",
      },
    ],
  },
  {
    author: "Tiziana",
    assets: [
      {
        type: "Textures",
        name: "Even grey stone tile floor 256px",
        url: "https://opengameart.org/content/even-grey-stone-tile-floor-256px",
      },
    ],
  },
];
