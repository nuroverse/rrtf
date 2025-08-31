
export abstract class AssetOption {
  static identifier: string;
  static fallbackValue: string | undefined = undefined;

  static description: string | undefined;
  value: string | undefined;

  constructor(initialValue?: string) {
    this.setValue(initialValue);
  }

  isValid(value?: string): boolean {
    return true;
  }

  setValue(value?: string) {
    if (this.isValid(value)) {
      this.value = value;
    } else {
      this.value = (this.constructor as typeof AssetOption).fallbackValue;
    }
  }
}

export class AssetOptionSet {
  list: AssetOption[];

  constructor(list: AssetOption[] = []) {
    this.list = list;
  }

  getValue(id: string): string | undefined {
    return this.list
      .find((option) => (option.constructor as typeof AssetOption).identifier === id)
      ?.value;
  }

  toObject(): { [key: string]: string } {
    const obj: { [key: string]: string } = {};

    this.list
      .filter((option) => option.value !== undefined)
      .forEach((option) => { obj[(option.constructor as typeof AssetOption).identifier] = option.value!; });

    return obj;
  }

  toString(): string {
    return Object.entries(this.toObject())
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
  }
}
