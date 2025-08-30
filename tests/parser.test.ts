import { describe, expect, it } from 'vitest';
import { Asset, Portfolio, RRTFTree } from '../src/index.js';

class RootAsset extends Asset<string> {
  static identifier = 'root';

  build(): string {
    return this.subAssets.length > 0 ? this.subAssets.map((asset) => asset.build()).join('\n') : this.content;
  }

  encode(): string {
    return this.subAssets.length > 0 ? this.subAssets.map((asset) => asset.encode()).join('') : this.content;
  }
}

class AssetA extends Asset<string> {
  static identifier = 'asset-a';

  availableOptions = {
    required: [],
    optional: ['name', 'suffix']
  };

  build(): string {
    return `The value of ${this.options['name'] ?? 'A'} is ${this.content}${this.options['suffix'] ?? ''}`;
  }
}

class AssetB extends Asset<string> {
  static identifier = 'asset-b';

  build(): string {
    let val = 1;
    for (const sub of this.subAssets) {
      const match = sub.content.match(/\d+/);
      val *= (match ? parseInt(match[0], 10) : 1);
    }
    return `The product B is ${val}`;
  }
}

class AssetC extends Asset<string> {
  static identifier = 'asset-c';

  availableOptions = {
    required: [],
    optional: ['name', 'suffix']
  };

  build(): string {
    return `The value of ${this.options['name'] ?? 'A'} is 12321${this.options['suffix'] ?? ''}`;
  }
}

const portfolio = new Portfolio([RootAsset, AssetA, AssetB, AssetC]);

describe('Build + Encode', () => {
  it('Empty', () => {
    const tree = new RRTFTree(portfolio);

    const content = '';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('');
    expect(rrtf).toBe(content);
  });

  it('Single Asset', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-a]42[/asset-a]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The value of A is 42');
    expect(rrtf).toBe(content);
  });

  it('Single Asset With No Value', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-c][/asset-c]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The value of A is 12321');
    expect(rrtf).toBe(content);
  });

  it('Single Asset With One Option', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-a(name="VAR")]42[/asset-a]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The value of VAR is 42');
    expect(rrtf).toBe(content);
  });

  it('Single Asset With Multiple Options', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-a(name="VAR",suffix="!!")]42[/asset-a]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The value of VAR is 42!!');
    expect(rrtf).toBe(content);
  });

  it('Single Asset With No Value, Multiple Options', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-c(name="VAR",suffix="!!")][/asset-c]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The value of VAR is 12321!!');
    expect(rrtf).toBe(content);
  });

  it('Adjacent assets', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The value of A is 42\nThe value of A is 2\nThe value of A is 3');
    expect(rrtf).toBe(content);
  });

  it('Nested assets', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-b][asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a][/asset-b]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The product B is 252');
    expect(rrtf).toBe(content);
  });

  it('Adjacent nested assets', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-b][asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a][/asset-b][asset-b][asset-a]24[/asset-a][asset-a]10[/asset-a][/asset-b]';

    tree.construct(content);
    const output = tree.toOutput();
    const rrtf = tree.toRRTF();

    expect(output).toBe('The product B is 252\nThe product B is 240');
    expect(rrtf).toBe(content);
  });
});

describe('Tree Relationships', () => {
  it('Child\'s Parent', () => {
    const tree = new RRTFTree(portfolio);

    const content = '[asset-b][asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a][/asset-b]';

    tree.construct(content);
    const root = tree.root!;
    const assetB = root.subAssets[0]!;
    const assetA1 = assetB.subAssets[0]!;
    const assetA2 = assetB.subAssets[1]!;
    const assetA3 = assetB.subAssets[2]!;

    expect(root.parent).toBeUndefined();
    expect(assetB.parent).toBe(root);
    expect(assetA1.parent).toBe(assetB);
    expect(assetA2.parent).toBe(assetB);
    expect(assetA3.parent).toBe(assetB);
  });
});
