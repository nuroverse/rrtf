import type { Asset, AssetOptions } from "./asset.js";
import type { Portfolio } from "./portfolio.js";

class RRTFNode<OutputType> {
  value: Asset<OutputType>;
  children: RRTFNode<OutputType>[];

  constructor(value: Asset<OutputType>) {
    this.value = value;
    this.children = [];
  }

  addChild(asset: Asset<OutputType>): RRTFNode<OutputType> {
    const child = new RRTFNode(asset);
    this.children.push(child);
    return child;
  }

  build(): OutputType {
    if (this.children.length === 0) {
      return this.value.build();
    }
    return this.value.build({
      subAssets: this.children.map((child) => child.build())
    });
  }

  encode(): string {
    if (this.children.length === 0) {
      return this.value.encode();
    }
    return this.value.encode(
      this.children.map((child) => child.encode()).join('')
    );
  }
}

class RRTFTree<OutputType> {
  root: RRTFNode<OutputType>;

  constructor(rootNode: RRTFNode<OutputType>) {
    this.root = rootNode;
  }

  build() {
    return this.root.build();
  }

  encode() {
    return this.root.encode();
  }
}

/**
 * MATCH GROUPS:
 * 0 = always shows full match
 * 1 = if enclosed in ID tag, shows full match (including tag)
 * 2 = if enclosed in ID tag, shows ID tag
 * 3 = if enclosed in ID tag, shows OPTIONS for ID tag
 * 4 = if enclosed in ID tag, shows CONTENT between ID tags
 * 5 = if not enclosed in ID tag, shows full match
 */

const TAG_PATTERN = /(\[([a-zA-Z0-9\-]+)\(?([^\[\]\(\)]+)?\)?\]([\s\S]*?)\[\/\2\])/gm;
const ANY_CHILD_PATTERN = /(\[([a-zA-Z0-9\-]+)\(?([^\[\]\(\)]+)?\)?\]([\s\S]*?)\[\/\2\])|([^\[\]]+)/gm;
const OPTION_PATTERN = /([a-zA-Z0-9\-]+)=\"([^\[\]\(\)]+?)\"/gm;

export class RRTFParser<OutputType> {
  private portfolio: Portfolio<OutputType>;

  private tree: RRTFTree<OutputType> | null = null;

  private parse = (str: string): Asset<OutputType>[] => {
    let results = [];
    let result;
    while (result = ANY_CHILD_PATTERN.exec(str)) {
      if (result[5]) {
        results.push(
          this.portfolio.createAsset({
            content: result[5]
          })
        );
      } else if (result[1]) {
        let options: AssetOptions = {};
        if (result[3]) {
          let option;
          while (option = OPTION_PATTERN.exec(result[3])) {
            if (option.length >= 3) {
              options[option[1]!] = option[2]!;
            }
          }
        }
        results.push(
          this.portfolio.createAsset({
            content: result[4]!,
            id: result[2]!,
            options
          })
        );
      }
    }
    return results;
  }

  constructor(portfolio: Portfolio<OutputType>) {
    this.portfolio = portfolio;
  }

  format(content: string, rootNodeId: string) {
    this.tree = new RRTFTree(
      new RRTFNode(
        this.portfolio.createAsset({
          content: content,
          id: rootNodeId,
          options: {}
        })
      )
    );
    this.buildRRTFTree(content, this.tree.root);
  }

  private buildRRTFTree = (str: string, RRTFNode: RRTFNode<OutputType>) => {
    const results = this.parse(str);

    results.forEach((result) => {
      const child = RRTFNode.addChild(result);
      if (TAG_PATTERN.test(result.content)) {
        this.buildRRTFTree(result.content, child);
      }
    });
  }

  build(): OutputType {
    if (this.tree) {
      return this.tree.build();
    }
    throw new Error("No content to build. Please run format() first.");
  }

  encode(): string {
    if (this.tree) {
      return this.tree.encode();
    }
    throw new Error("No content to build. Please run format() first.");
  }
}
