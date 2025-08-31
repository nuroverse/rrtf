import type { Asset, AssetOptionsObject } from "./asset.js";

interface ParsedAssetInput {
  id?: string;
  options?: AssetOptionsObject;
  content: string;
}

type AssetClass<OutputType> = {
  new(content: string, options: AssetOptionsObject, subAssets: Asset<OutputType>[]): Asset<OutputType>;
} & typeof Asset<OutputType>;

export class Portfolio<OutputType> {
  assets: { [key: string]: AssetClass<OutputType> };
  fallback: AssetClass<OutputType> | null;

  constructor(assets: AssetClass<OutputType>[], fallback?: AssetClass<OutputType>) {
    this.assets = Object.fromEntries(
      assets.map((asset) => [asset.identifier, asset])
    );
    this.fallback = fallback || null;
  }

  hasAsset(id: string): boolean {
    return !!this.assets[id];
  }

  createAsset({ id, options, content }: ParsedAssetInput): InstanceType<typeof this.assets[keyof typeof this.assets]> {
    const TAG_PATTERN = /(\[([a-zA-Z0-9\-]+)\(?([^\[\]\(\)]+)?\)?\]([\s\S]*?)\[\/\2\])/gm;
    if (id && this.hasAsset(id)) {
      return new this.assets[id]!(
        content,
        options ?? {},
        TAG_PATTERN.test(content) ? this.parse(content) : []
      );
    }
    if (this.fallback) {
      return new this.fallback(content, options || {}, []);
    }
    throw new Error(`Asset with id "${id}" not found and no fallback asset defined.`);
  }

  parse = (str: string): Asset<OutputType>[] => {
    let results = [];
    let result;

    /**
     * MATCH GROUPS:
     * 0 = always shows full match
     * 1 = if enclosed in ID tag, shows full match (including tag)
     * 2 = if enclosed in ID tag, shows ID tag
     * 3 = if enclosed in ID tag, shows OPTIONS for ID tag
     * 4 = if enclosed in ID tag, shows CONTENT between ID tags
     * 5 = if not enclosed in ID tag, shows full match
     */
    const ANY_CHILD_PATTERN = /(\[([a-zA-Z0-9\-]+)\(?([^\[\]\(\)]+)?\)?\]([\s\S]*?)\[\/\2\])|([^\[\]]+)/gm;
    const OPTION_PATTERN = /([a-zA-Z0-9\-]+)=\"([^\[\]\(\)]+?)\"/gm;

    while (result = ANY_CHILD_PATTERN.exec(str)) {
      if (result[5]) {
        results.push(
          this.createAsset({
            content: result[5]
          })
        );
      } else if (result[1]) {
        let options: AssetOptionsObject = {};
        if (result[3]) {
          let option;
          while (option = OPTION_PATTERN.exec(result[3])) {
            if (option.length >= 3) {
              options[option[1]!] = option[2]!;
            }
          }
        }
        results.push(
          this.createAsset({
            content: result[4]!,
            id: result[2]!,
            options
          })
        );
      }
    }
    return results;
  }
}
