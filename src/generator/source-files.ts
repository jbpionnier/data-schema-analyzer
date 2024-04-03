import { SourceFile, TypeAliasDeclaration } from 'ts-morph'

export class SourceFiles {
  constructor(
    private readonly sourceFiles: SourceFile[],
  ) {}

  getTypeAlias(name: string): TypeAliasDeclaration | undefined {
    return this.sourceFiles
      .map((sourceFile) => sourceFile.getTypeAlias(name))
      .find((typeAlias) => !!typeAlias)
  }
}
