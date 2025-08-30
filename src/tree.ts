import type { Asset } from "./asset.js";
import type { Portfolio } from "./portfolio.js";

export class RRTFTree<OutputType> {
  private portfolio: Portfolio<OutputType>;
  private rootId: string;

  root: Asset<OutputType> | null = null;

  constructor(portfolio: Portfolio<OutputType>, rootId: string = 'root') {
    this.portfolio = portfolio;
    this.rootId = rootId;
  }

  construct(content: string) {
    this.root = this.portfolio.createAsset({
      content: content,
      id: this.rootId,
      options: {}
    });
  }

  toOutput(): OutputType {
    if (this.root) {
      return this.root.build();
    }
    throw new Error("No content to build. Please run format() first.");
  }

  toRRTF(): string {
    if (this.root) {
      return this.root.encode();
    }
    throw new Error("No content to build. Please run format() first.");
  }
}
