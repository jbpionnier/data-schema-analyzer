import { PropertiesValidation, PropertyResult, PropertyValidation } from './index'

export class ObjectValidator {
  constructor(
    private readonly validations: PropertiesValidation,
  ) {}

  validate(input: any): PropertyResult[] {
    return this.validations.flatMap((validation) => validation(input) || [])
  }
}

export class PropertyValidator {
  constructor(
    private readonly validations: PropertyValidation,
  ) {}

  validate(input: any): PropertyResult | undefined {
    if (input == null) {
      return
    }

    for (const validation of this.validations) {
      const result = validation(input)
      if (result) {
        return result
      }
    }
  }
}
