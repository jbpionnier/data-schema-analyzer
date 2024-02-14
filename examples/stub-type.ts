export type StubType = {
  /**
   * @id
   * @minLength 1
   * @maxLength 3
   * @pattern ^\w+$
   */
  myString: string
  myNumber?: number
  myBoolean?: boolean
  myObject?: object
  myAny?: object
  // myNull: null
  myEnumString: 'ping' | 'pong'
  myEnumNumber: 1 | 2 | 3
  mySubType: {
    subProp?: string
    /**
     * @minimum 1
     * @maximum 99
     */
    age: number
  }
  myListString: string[]
  /**
   * @minItems 1
   * @maxItems 5
   */
  myListNumber: number[]
  myListObject?: object[]
  myListEnumString: Array<'ping' | 'pong'>
  myListEnumNumber?: Array<1 | 2 | 3>
  myList: Array<{
    /**
     * @minLength 1
     */
    subProp: string
  }>
  mySubTypeByRef?: StubSubType
  mySubTypeByRefList: StubSubType[]
  combineObject: { a?: string; b: number } & { a: string; c: boolean }
}
type StubSubType = {
  /**
   * @minimum 1
   */
  age: number
  shareability: 'NOTSHARED'
}