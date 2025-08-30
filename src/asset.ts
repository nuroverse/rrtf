export type AssetOptions = { [key: string]: string };

export abstract class Asset<OutputType> {
  // unique identifier for the asset type
  static identifier: string;

  static availableOptions = {
    required: [] as string[],
    optional: [] as string[]
  };

  content: string;
  subAssets: Asset<OutputType>[];

  options: AssetOptions;

  constructor(content: string, options: AssetOptions, subAssets: Asset<OutputType>[]) {
    this.content = content;
    this.options = options;
    this.subAssets = subAssets;
  }

  abstract build(): OutputType;
  encode(): string {
    const optionsString = Object.entries(this.options).map(([key, value]) => `${key}="${value}"`).join(',');
    const identifier = (this.constructor as typeof Asset).identifier;
    const content = this.subAssets.length > 0 ? this.subAssets.map((asset) => asset.encode()).join('') : this.content;
    return `[${identifier + (optionsString ? `(${optionsString})` : '')}]${content}[/${identifier}]`;
  }
}