import type { Asset, AssetOptions } from "./asset.js";

interface ParsedAssetInput<OutputType> {
  id?: string;
  options?: AssetOptions;
  content: string;
}

type AssetClass<OutputType> = {
  new(content: string, options: AssetOptions): Asset<OutputType>;
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

  createAsset({ id, options, content }: ParsedAssetInput<OutputType>): InstanceType<typeof this.assets[keyof typeof this.assets]> {
    if (id && this.hasAsset(id)) {
      return new this.assets[id]!(content, options ?? {});
    }
    if (this.fallback) {
      return new this.fallback(content, options || {});
    }
    throw new Error(`Asset with id "${id}" not found and no fallback asset defined.`);
  }
}
