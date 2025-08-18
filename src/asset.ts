export type AssetOptions = { [key: string]: string };

interface BuildInput<OutputType> {
  subAssets: OutputType[];
}

export abstract class Asset<OutputType> {
  // unique identifier for the asset type
  static identifier: string;

  // whether this asset type is a group (i.e., can contain sub-assets)
  static isAssetGroup: boolean = false;

  static availableOptions = {
    required: [] as string[],
    optional: [] as string[]
  };

  content: string;
  options: AssetOptions;
  constructor(content: string, options: AssetOptions) {
    this.content = content;
    this.options = options;
  }

  abstract build(input?: BuildInput<OutputType>): OutputType;
  encode(innerContent?: string): string {
    const optionsString = Object.entries(this.options).map(([key, value]) => `${key}="${value}"`).join(',');
    const identifier = (this.constructor as typeof Asset).identifier;
    return `[${identifier + (optionsString ? `(${optionsString})` : '')}]${innerContent ?? this.content}[/${identifier}]`;
  }
}