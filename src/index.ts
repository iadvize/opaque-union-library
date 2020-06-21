import { Lens, Iso } from 'monocle-ts';

import { createFoldObject } from '@iadvize-oss/foldable-helpers';

/**
 * All opaque variables you create with the library will have the type of
 * `Opaque<'SomeName'>`.
 *
 * @remarks
 * You can't really do anything with it.  So, don't try to use them directly!
 * Use the library functions instead.
 *
 * @typeParam Key - The name of the opaque
 */
export type Opaque<Key> = {
  /**
   * @internal
   */
  readonly __OPAQUE__: '__OPAQUE__';

  /**
   * Where the type of opaque is stored
   *
   * @internal
   */
  readonly __OPAQUE_KEY__: Key;

  /**
   * Where the private value is stored
   *
   * @internal
   */
  readonly value: unknown;
};

/**
 * To be used only in the context of {@link of | Union.of} to attach private
 * type to the corresponding name in the union.
 *
 * @example
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const UnionAPI = Union.of({
      Text: Union.type<$Text>(),
      Image: Union.type<$Image>(),
  });
```
 *
 * @typeParam T - The private type to assign to the corresponding name
 *
 * @returns Actually it's `null`. Do not rely on it. Used for type only.
 */
export function type<T>(): T {
  return (null as unknown) as T;
}

/**
 * Helper type to extract from T the keys that have non-object values
 *
 * @typeParam T - The type to extract keys that have non-object values from
 *
 * @internal
 */
type SubtractKeysForNonObject<T> = {
  [K in keyof T]: T[K] extends object ? K : never;
}[keyof T & string];

/**
 * Helper type to add a prop `_tag` on T
 *
 * @typeParam T - The type to decorate
 * @typeParam Key - The name to give the type
 */
export type Tagged<T, Key> = T & {
  _tag: Key;
};

/**
 * Mapped type to store `Tagged` types
 *
 * @internal
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
type TaggedTypes<Types, Keys extends keyof Types & string> = {
  [key in Keys]: Tagged<Types[key], key>;
};

/**
 * Mapped type to store `Opaque` types
 *
 * @internal
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
type Opaques<Types, Keys extends keyof Types & string> = {
  [key in Keys]: Opaque<key>;
};

/**
 * Constructors for opaque types
 *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  type $Text = { content: string };

  const UnionAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });

  const text = Union.of.Text({ content: 'hello world' });
```
 *
 * @typeParam Types - Private types
 * @typeParam Keys - Keys of `Types` to map over
 */
export type Of<Types, Keys extends keyof Types & string> = {
  [key in Keys]: (value: Types[key]) => Opaque<key>;
};

/**
 * Type guard for any union member
 *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const UnionAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });

  const text = Union.of.Text({ content: 'hello world' });

  UnionAPI.is('test'); // false
  UnionAPI.is(text); // true, text is Text | Image
```
 *
 * @typeParam Types - Private types
 * @typeParam Keys - Keys of `Types` to map over
 *
 * @param thing - Anything
 *
 * @returns Type guard result
 */
type IsAll<Types, Keys extends keyof Types & string> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thing: any,
) => thing is Opaques<Types, Keys>[Keys];

/**
 * Collection of type guards for specific union members
 *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const UnionAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });

  const text = Union.of.Text({ content: 'hello world' });

  UnionAPI.Text.is(text); // true, text is Text
```
 *
 * @typeParam Types - Private types
 * @typeParam Keys - Keys of `Types` to map over
 */
type Is<Types, Keys extends keyof Types & string> = {
  /**
   * Type guards for one union members
   *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const UnionAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });

  const text = Union.of.Text({ content: 'hello world' });

  UnionAPI.Text.is(text); // true, text is Text
```
   *
   * @param opaque - Any member of the opaque union
   *
   * @returns Type guard result
   */
  [key in Keys]: (opaque: Opaques<Types, Keys>[Keys]) => opaque is Opaque<key>;
};

/**
 * Fold function for the union
 *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const UnionAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });

  const text = Union.of.Text({ content: 'hello world' });

  Union.fold({
    Text: () => 'this is a text',
    Image: () => 'this is an image',
  })(text); // 'this is a text'

```
 *
 * @typeParam Types - Private types
 * @typeParam Keys - Keys of `Types` to map over
 *
 * @typeParam R - Type of the fold result
 *
 * @param funcs - Objects with one function for each member of the union. Each
 *                function accept a refined opaque type as its only parameter.
 *
 * @returns Function to call with any member of the union to get a result of
 *          type `R`
 */
type Fold<Types, Keys extends keyof Types & string> = <R>(
  funcs: {
    [key in Keys]: (s: Opaques<Types, Keys>[key]) => R;
  },
) => (s: Opaques<Types, Keys>[Keys]) => R;

/**
 * Some [`monocle-ts`](https://github.com/gcanti/monocle-ts) optics for each
 * member of the union
 *
 * For each member you will get an `Iso<Opaque, Type>` and a `lensFromProp`
 * function
 *
 * @example
```typescript
const iso = MessageAPI.Text.iso; // Iso<Opaque<Type>, Type>

// fromOpaque :: (text: Text) => $Text
const fromOpaque = iso.from;

// toOpaque :: ($text: $Text) => Text
const toOpaque = iso.to;
```
 *
 * @example
```typescript
// source :: (image: Image) => string
export const source = MessageAPI.Image.lensFromProp('source').get;
```
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
type Lenses<Types, Keys extends keyof Types & string> = {
  [key in Keys]: {
    iso: Iso<Opaque<key>, Types[key]>;
    lensFromProp: <P extends keyof Types[key]>(
      prop: P,
    ) => Lens<Opaques<Types, key>[key], Types[key][P]>;
  };
};

/**
 * The union api
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
export type UnionAPIDef<Types, Keys extends keyof Types & string> = {
  /**
   * Storing Types object here
   *
   * @privateRemarks
   * Specialy useful for helper functions like merge.
   */
  types: Types;

  /**
   * {@inheritDoc Of}
   */
  of: Of<Types, Keys>;

  /**
   * {@inheritDoc Is}
   */
  is: Is<Types, Keys> & IsAll<Types, Keys>;

  /**
   * {@inheritDoc Fold}
   */
  fold: Fold<Types, Keys>;

  /**
   * Iso between any member of the union and any private types (tagged)
   *
   * {@link Tagged}
   */
  iso: Iso<
    Opaques<Types, SubtractKeysForNonObject<Types>>[SubtractKeysForNonObject<
      Types
    >],
    TaggedTypes<
      Types,
      SubtractKeysForNonObject<Types>
    >[SubtractKeysForNonObject<Types>]
  >;

  /**
   * Create a `Lens` between any opaque of the API and a property shared by all
   * private types of the API (if any)
   */
  lensFromProp: <P extends keyof Types[SubtractKeysForNonObject<Types>]>(
    prop: P,
  ) => Lens<
    Opaques<Types, SubtractKeysForNonObject<Types>>[SubtractKeysForNonObject<
      Types
    >],
    Types[SubtractKeysForNonObject<Types>][P]
  >;
} & Lenses<Types, Keys>;

/**
 * This will extract all opaque types of a union API. This is more robust to
 * change than creating the union of types yourself.
 *
 * @example
```typescript
// instead of:

type Text = ReturnType<typeof MessageAPI.of.Text>;
type Image = ReturnType<typeof MessageAPI.of.Image>;
type Video = ReturnType<typeof MessageAPI.of.Video>;

export type Message = Text | Image | Video;

// do:

import * as Union from '@iadvize-oss/opaque-union';

export type Message = Union.Type<typeof MessageAPI>;
```
 *
 * @typeParam Def - The union api definition
 */
export type Type<Def> = Def extends UnionAPIDef<infer Types, infer Keys>
  ? {
      [key in keyof UnionAPIDef<Types, Keys>['of']]: ReturnType<
        UnionAPIDef<Types, Keys>['of'][key]
      >;
    }[keyof UnionAPIDef<Types, Keys>['of']]
  : never;

/**
 * Use `of` to create your opaque entities API.
 *
 * @remarks
 * Ideally, don't share the API outsite your module as this will give module
 * users the possibility to "unopaque" your types and bypass your module API.
 *
 * @example
```typescript
import * as Union from '@iadvize-oss/opaque-union';

type $Text = string;

type $Image = {
  source: string;
  description: string;
}

const MessageAPI = Union.of({
  Text: Union.type<$Text>(),
  Image: Union.type<$Image>(),
});
```
 *
 * @typeParam Types - The collection of private types for the union
 *
 * @param  types - The map of names and results of {@link "type" | `type`}
 *                 function
 *
 * @returns A union api
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function of<Types extends { [key in keyof Types]: any }>(
  types: Types,
): UnionAPIDef<Types, keyof Types & string> {
  type Keys = keyof Types & string;

  const keys = Object.keys(types) as (keyof Types & string)[];

  const ofs = keys.reduce(
    (localOfs, key) => ({
      ...localOfs,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key]: (value: any) => ({
        __OPAQUE__: '__OPAQUE__',
        __OPAQUE_KEY__: key,
        value,
      }),
    }),
    {},
  ) as Of<Types, Keys>;

  const iss = keys.reduce(
    (localIss, key) => ({
      ...localIss,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key]: (opaque: Opaque<any>) => {
        return (
          // eslint-disable-next-line no-underscore-dangle
          opaque.__OPAQUE__ === '__OPAQUE__' && opaque.__OPAQUE_KEY__ === key
        );
      },
    }),
    {},
  ) as Is<Types, Keys>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAll = ((thing: any): thing is Opaques<Types, Keys>[Keys] => {
    if (
      typeof thing === 'object' &&
      '__OPAQUE__' in thing &&
      '__OPAQUE_KEY__' in thing &&
      // eslint-disable-next-line no-underscore-dangle
      keys.indexOf(thing.__OPAQUE_KEY__) > -1
    ) {
      return true;
    }

    return false;
  }) as IsAll<Types, Keys> & Is<Types, Keys>;

  keys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    isAll[key] = iss[key];
  });

  const fold = createFoldObject(iss);

  const lenses = keys.reduce((localLenses, key) => {
    const get = (opaque: Opaque<Keys>): Types[Keys] => {
      return opaque.value as Types[Keys];
    };

    const reverseGet = ofs[key];

    const iso = new Iso(get, reverseGet);

    return {
      ...localLenses,
      [key]: {
        iso,
        lensFromProp: <Prop>(prop: Prop) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const lens = Lens.fromProp()(prop);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return iso.composeLens(lens);
        },
      },
    };
  }, {}) as Lenses<Types, Keys>;

  const iso = new Iso<
    Opaques<Types, SubtractKeysForNonObject<Types>>[SubtractKeysForNonObject<
      Types
    >],
    TaggedTypes<
      Types,
      SubtractKeysForNonObject<Types>
    >[SubtractKeysForNonObject<Types>]
  >(
    (
      opaque: Opaques<
        Types,
        SubtractKeysForNonObject<Types>
      >[SubtractKeysForNonObject<Types>],
    ) => ({
      // eslint-disable-next-line no-underscore-dangle
      _tag: opaque.__OPAQUE_KEY__,
      ...(opaque.value as Types[SubtractKeysForNonObject<Types>]),
    }),
    ({
      _tag,
      ...value
    }: TaggedTypes<
      Types,
      SubtractKeysForNonObject<Types>
    >[SubtractKeysForNonObject<Types>]) => ({
      __OPAQUE__: '__OPAQUE__',
      __OPAQUE_KEY__: _tag,
      value,
    }),
  );

  const lensFromProp = (<Prop>(prop: Prop) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const lens = Lens.fromProp()(prop);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return iso.composeLens(lens);
  }) as <P extends keyof Types[SubtractKeysForNonObject<Types>]>(
    prop: P,
  ) => Lens<
    Opaques<Types, SubtractKeysForNonObject<Types>>[SubtractKeysForNonObject<
      Types
    >],
    Types[SubtractKeysForNonObject<Types>][P]
  >;

  return {
    types,
    of: ofs,
    is: isAll,
    fold,
    iso,
    lensFromProp,
    ...lenses,
  };
}

/**
 * Create a new union omiting the given union's variants
 *
 * @example
```typescript
const MediaAPI = Union.omit(MessageAPI, ['Text']);
```
 *
 * @typeParam Types - Union initial private types
 * @typeParam OmittedKeys - Keys of types to omit
 *
 * @returns The new union api definition
 */
export function omit<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [key in keyof Types]: any },
  OmittedKeys extends keyof Types
>(
  union: UnionAPIDef<Types, keyof Types & string>,
  omittedKeys: OmittedKeys[],
): UnionAPIDef<
  Omit<Types, OmittedKeys>,
  keyof Omit<Types, OmittedKeys> & string
> {
  const filteredTypes = Object.keys(union.types).reduce((localTypes, key) => {
    if (omittedKeys.indexOf(key as OmittedKeys) > -1) {
      return localTypes;
    }

    return {
      ...localTypes,
      [key]: union.types[key as keyof Types],
    };
  }, {}) as Omit<Types, OmittedKeys>;

  return of(filteredTypes);
}

/**
 * Create a new union comprising only the picked union's members
 *
 * @example
```typescript
const MediaAPI = Union.pick(MessageAPI, ['Image', 'Video']);
```
 *
 * @typeParam Types - Union initial private types
 * @typeParam OnlyKeys - Keys of types to keep
 *
 * @returns The new union api definition
 */
export function pick<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [key in keyof Types]: any },
  OnlyKeys extends keyof Types
>(
  union: UnionAPIDef<Types, keyof Types & string>,
  onlyKeys: OnlyKeys[],
): UnionAPIDef<Pick<Types, OnlyKeys>, keyof Pick<Types, OnlyKeys> & string> {
  const filteredTypes = Object.keys(union.types).reduce((localTypes, key) => {
    if (onlyKeys.indexOf(key as OnlyKeys) === -1) {
      return localTypes;
    }

    return {
      ...localTypes,
      [key]: union.types[key as OnlyKeys],
    };
  }, {}) as Pick<Types, OnlyKeys>;

  return of(filteredTypes);
}

/**
 * Merge two union APIs.
 *
 * @example
```typescript
const MessageAPI = Union.of({
  ...
});

const CarAPI = Union.of({
  ...
});

const MessageAndCarsAPI = Union.merge(MessageAPI, CarAPI);
```
 *
 * @typeParam Types1 - First union private types
 * @typeParam Types2 - Second union private types
 *
 * @returns The new union api definition
 */
export function merge<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types1 extends { [key in keyof Types1]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types2 extends { [key in keyof Types2]: any }
>(
  union1: UnionAPIDef<Types1, keyof Types1 & string>,
  union2: UnionAPIDef<Types2, keyof Types2 & string>,
): UnionAPIDef<Types1 & Types2, keyof (Types1 & Types2) & string> {
  const types = {
    ...union1.types,
    ...union2.types,
  };

  return of(types);
}
