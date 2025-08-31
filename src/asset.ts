import { AssetOptionSet, type AssetOption } from "./options.js";

export type AssetOptionsObject = { [key: string]: string };

type AssetOptionClass = {
  new(initialValue?: string): AssetOption;
} & typeof AssetOption;

export abstract class Asset<OutputType> {
  // unique identifier for the asset type
  static identifier: string;

  static availableOptions = {
    required: [] as AssetOptionClass[],
    optional: [] as AssetOptionClass[]
  };

  static getOptionClass(id: string): AssetOptionClass | undefined {
    return [
      ...this.availableOptions.required,
      ...this.availableOptions.optional
    ].find((optionClass) => (optionClass as AssetOptionClass).identifier === id)
  }

  content: string;

  parent?: Asset<OutputType>;
  subAssets: Asset<OutputType>[];

  options: AssetOptionSet;

  constructor(content: string, options: AssetOptionsObject, subAssets: Asset<OutputType>[]) {
    this.content = content;
    this.subAssets = subAssets;
    this.subAssets.forEach((asset) => asset.parent = this);
    this.options = new AssetOptionSet();
    this.populateOptions(options);
  }

  populateOptions(options: AssetOptionsObject) {
    Object.keys(options)
      .forEach((optionId) => {
        const OptionClass = (this.constructor as typeof Asset).getOptionClass(optionId);
        if (OptionClass) {
          this.options.list.push(
            new OptionClass(options[optionId])
          );
        }
      });
  }

  abstract build(): OutputType;
  encode(): string {
    const optionsString = this.options.toString();
    const identifier = (this.constructor as typeof Asset).identifier;
    const content = this.subAssets.length > 0 ? this.subAssets.map((asset) => asset.encode()).join('') : this.content;
    return `[${identifier + (optionsString ? `(${optionsString})` : '')}]${content}[/${identifier}]`;
  }
}
