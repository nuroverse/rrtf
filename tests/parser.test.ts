import { describe, expect, it } from 'vitest';
import { Asset, Portfolio, RRTFParser } from '../src/index.js';

class RootAsset extends Asset<string> {
  static identifier = 'root';

  build(input?: { subAssets: string[] }): string {
    return input?.subAssets.join('\n') ?? this.content;
  }

  encode(innerContent?: string): string {
    return innerContent ?? this.content;
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

  build(input?: { subAssets: string[] }): string {
    let val = 1;
    for (const sub of input?.subAssets ?? []) {
      const match = sub.match(/\d+/);
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
  it('Single Asset', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-a]42[/asset-a]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The value of A is 42');
    expect(encoded).toBe(content);
  });

  it('Single Asset With No Value', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-c][/asset-c]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The value of A is 12321');
    expect(encoded).toBe(content);
  });

  it('Single Asset With One Option', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-a(name="VAR")]42[/asset-a]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The value of VAR is 42');
    expect(encoded).toBe(content);
  });

  it('Single Asset With Multiple Options', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-a(name="VAR",suffix="!!")]42[/asset-a]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The value of VAR is 42!!');
    expect(encoded).toBe(content);
  });

  it('Single Asset With No Value, Multiple Options', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-c(name="VAR",suffix="!!")][/asset-c]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The value of VAR is 12321!!');
    expect(encoded).toBe(content);
  });

  it('Adjacent assets', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The value of A is 42\nThe value of A is 2\nThe value of A is 3');
    expect(encoded).toBe(content);
  });

  it('Nested assets', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-b][asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a][/asset-b]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The product B is 252');
    expect(encoded).toBe(content);
  });

  it('Adjacent nested assets', () => {
    const parser = new RRTFParser(portfolio);

    const content = '[asset-b][asset-a]42[/asset-a][asset-a]2[/asset-a][asset-a]3[/asset-a][/asset-b][asset-b][asset-a]24[/asset-a][asset-a]10[/asset-a][/asset-b]';

    parser.format(content, 'root');
    const output = parser.build();
    const encoded = parser.encode();

    expect(output).toBe('The product B is 252\nThe product B is 240');
    expect(encoded).toBe(content);
  });
});
