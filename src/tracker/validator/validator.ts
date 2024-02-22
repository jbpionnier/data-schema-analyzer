import { Namespace, PropertyResult } from '../index'

export type PropertyValidation<I = any> =
  | Validator<I>
  | ((namespace: Namespace, input: I) => PropertyResult | PropertyResult[] | undefined | void)
export type PropertiesValidation<I = any> = Array<PropertyValidation<I>>

export class Validator<I = {}> {
  private readonly abortEarly: boolean

  constructor(
    private readonly validations: PropertiesValidation<I>,
    { abortEarly }: { abortEarly?: boolean } = {},
  ) {
    this.abortEarly = !!abortEarly
  }

  add(validation: PropertyValidation<I>): void {
    this.validations.push(validation)
  }

  validate(namespace: Namespace, input: I | undefined): PropertyResult[] {
    if (!this.abortEarly) {
      return this.validations
        .flatMap((validation) => this.validateProperty(validation, namespace, input))
        .filter((result): result is PropertyResult => result && result.type !== 'OK')
    }

    for (const validation of this.validations) {
      const [firstResult] = this.validateProperty(validation, namespace, input)
      if (firstResult) {
        return [firstResult]
      }
    }
    return []
  }

  private validateProperty(validation: PropertyValidation, namespace: Namespace, input: I | undefined): PropertyResult[] {
    if (validation instanceof Validator) {
      return validation.validate(namespace, input)
    }
    const results = validation(namespace, input) || []
    if (Array.isArray(results)) {
      return results
    }
    return results ? [results] : []
  }
}
