import { Namespace, PropertyResult } from '../index'
import { TypeInt } from './schema-type'

export abstract class Validator<I = {}> {
  validateInput(namespace: Namespace, input: any, inputType: TypeInt): PropertyResult[] {
    const propertiesResult: PropertyResult[] = []
    this.validate(namespace, input, inputType, propertiesResult)
    return propertiesResult
  }

  abstract validate(namespace: Namespace, input: I | undefined, inputType: TypeInt, propertiesResult: PropertyResult[]): void
}

type ObjectValidation<I = any> =
  | Validator<I>
  | ((namespace: Namespace, input: I, inputType: TypeInt) => PropertyResult[])

export type ObjectValidations<I = any> = Array<ObjectValidation<I>>

export class ObjectValidator extends Validator<any> {
  constructor(
    private readonly validations: ObjectValidations,
  ) {
    super()
  }

  validate(namespace: Namespace, input: any, inputType: TypeInt, propertiesResult: PropertyResult[]): void {
    for (const validation of this.validations) {
      this.#validateProperty({ validation, namespace, input, inputType, propertiesResult })
    }
  }

  #validateProperty({ validation, namespace, input, inputType, propertiesResult }: {
    validation: ObjectValidation
    namespace: Namespace
    input: any
    inputType: TypeInt
    propertiesResult: PropertyResult[]
  }): void {
    if (validation instanceof Validator) {
      validation.validate(namespace, input, inputType, propertiesResult)
      return
    }

    const results = validation(namespace, input, inputType)
    for (const result of results) {
      if (result.type !== 'OK') {
        propertiesResult.push(result)
      }
    }
  }
}

type PropertyValidation<I = any> = (namespace: Namespace, input: I, inputType: TypeInt) => PropertyResult | undefined | void

export type PropertyValidations<I = any> = Array<PropertyValidation<I>>

export class PropertyValidator<I = {}> extends Validator<I> {
  constructor(
    private readonly validations: PropertyValidations,
  ) {
    super()
  }

  add(validation: PropertyValidation<I>): void {
    this.validations.push(validation)
  }

  validate(namespace: Namespace, input: any, inputType: TypeInt, propertiesResult: PropertyResult[]): void {
    for (const validation of this.validations) {
      const propertyResult = validation(namespace, input, inputType)
      if (propertyResult) {
        propertiesResult.push(propertyResult)
        return
      }
    }
  }
}
