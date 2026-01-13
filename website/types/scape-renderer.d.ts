declare module "@scapes-studio/scape-renderer/build/src/Merge" {
  type MergeConfig = [[bigint, boolean, boolean][], boolean];

  class Merge {
    mergeConfig: MergeConfig;
    image?: Buffer;

    constructor(mergeConfig: MergeConfig);
    static fromId(stringId: string | bigint): Merge;
    static fromCommand(command: string): Merge;

    get id(): bigint;
    get fade(): boolean;
    get count(): number;
    get width(): number;
    get height(): number;

    render(): Promise<Buffer | undefined>;
    save(distPath?: string): void;
  }

  export default Merge;
}
